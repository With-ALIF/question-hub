"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/roles";
import { invalidateManifestCache, invalidateShardCache, type StorageQuestion } from "@/lib/questions/storage";
import { invalidateSearchCache, updateSearchCache } from "@/lib/admin/question-search";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuestionOption } from "@/lib/supabase/types";

const BUCKET = process.env["SUPABASE_QUESTIONS_BUCKET"] ?? "qb-raw";
const PREFIX = process.env["SUPABASE_QUESTIONS_PREFIX"] ?? "questions-v2";

export type UpdateQuestionInput = {
  id: string;
  subject: string;
  shardNumber?: number | undefined;
  question_text: string;
  question_image_url?: string | null | undefined;
  options: QuestionOption[];
  correct_option: number | null;
  answer: string | null;
  explanation: string | null;
  explanation_image_url?: string | null | undefined;
  is_mcq: boolean;
  institution?: string | null | undefined;
  year?: string | null | undefined;
  topic_code?: string | null | undefined;
  keyword?: string | null | undefined;
};

export type UpdateQuestionResult = {
  success: boolean;
  error?: string;
  question?: StorageQuestion;
};

async function downloadShardJson(client: ReturnType<typeof createSupabaseAdminClient>, path: string): Promise<StorageQuestion[] | null> {
  try {
    const { data, error } = await client.storage.from(BUCKET).download(path);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text) as StorageQuestion[];
  } catch {
    return null;
  }
}

async function uploadShardJson(
  client: ReturnType<typeof createSupabaseAdminClient>,
  path: string,
  shard: StorageQuestion[]
): Promise<boolean> {
  try {
    const content = JSON.stringify(shard);
    const { error } = await client.storage.from(BUCKET).upload(path, content, {
      contentType: "application/json",
      upsert: true,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function updateQuestionInBucket(
  input: UpdateQuestionInput
): Promise<UpdateQuestionResult> {
  const role = await getCurrentRole();
  if (!role) {
    return { success: false, error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন প্রশ্ন এডিট করতে পারেন।" };
  }

  if (!input.id || !input.subject) {
    return { success: false, error: "প্রশ্নের আইডি ও বিষয় আবশ্যক।" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    let targetShardNumber = input.shardNumber;
    let mainShardPath = "";
    let shard: StorageQuestion[] | null = null;

    // 1. If shardNumber is known, check that shard first
    if (targetShardNumber && targetShardNumber > 0) {
      mainShardPath = `${PREFIX}/${input.subject}/shard-${String(targetShardNumber).padStart(4, "0")}.json`;
      shard = await downloadShardJson(supabase, mainShardPath);
      // Verify question is inside this shard
      if (shard && !shard.some((q) => q.id === input.id)) {
        shard = null; // not in this shard, will search
      }
    }

    // 2. If not found yet, scan the subject directory
    if (!shard) {
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(`${PREFIX}/${input.subject}`, { limit: 100 });

      const shardFiles = (files ?? [])
        .map((f) => f.name)
        .filter((name) => name.startsWith("shard-") && name.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const BATCH = 15;
      for (let i = 0; i < shardFiles.length; i += BATCH) {
        const batch = shardFiles.slice(i, i + BATCH);
        let found = false;
        await Promise.all(
          batch.map(async (fileName) => {
            if (found) return;
            const filePath = `${PREFIX}/${input.subject}/${fileName}`;
            const candidate = await downloadShardJson(supabase, filePath);
            if (candidate && candidate.some((q) => q.id === input.id)) {
              shard = candidate;
              mainShardPath = filePath;
              const match = fileName.match(/shard-(\d+)\.json/);
              if (match && match[1]) targetShardNumber = parseInt(match[1], 10);
              found = true;
            }
          })
        );
        if (found) break;
      }
    }

    if (!shard || !mainShardPath) {
      return {
        success: false,
        error: `প্রশ্নটি স্টোরেজ বাকেটে খুঁজে পাওয়া যায়নি (${input.subject}/${input.id})।`,
      };
    }

    // 3. Update the question in the shard
    const questionIndex = shard.findIndex((q) => q.id === input.id);
    if (questionIndex === -1) {
      return { success: false, error: "শার্ডে প্রশ্নটি পাওয়া যায়নি।" };
    }

    const existing = shard[questionIndex];
    if (!existing) {
      return { success: false, error: "প্রশ্নটি পাওয়া যায়নি।" };
    }

    const qImgs = (existing.question_html || "").match(/<img[^>]+>/gi);
    const expImgs = (existing.explanation_html || "").match(/<img[^>]+>/gi);

    let finalQuestionHtml: string | null = null;
    if (input.question_image_url !== undefined) {
      finalQuestionHtml = input.question_image_url
        ? `<p><img src="${input.question_image_url.trim()}" alt="Question Image" loading="lazy" /></p>`
        : null;
    } else {
      finalQuestionHtml = qImgs && qImgs.length > 0 ? qImgs.join("\n") : null;
    }

    let finalExplanationHtml: string | null = null;
    if (input.explanation_image_url !== undefined) {
      finalExplanationHtml = input.explanation_image_url
        ? `<p><img src="${input.explanation_image_url.trim()}" alt="Explanation Image" loading="lazy" /></p>`
        : null;
    } else {
      finalExplanationHtml = expImgs && expImgs.length > 0 ? expImgs.join("\n") : null;
    }

    const sanitizedOptions = input.options.map(({ h, ...opt }) => ({
      ...opt,
      t: (opt.t ?? "").trim(),
    }));

    const updatedQuestion: StorageQuestion = {
      ...existing,
      question_text: input.question_text.trim(),
      question_html: finalQuestionHtml,
      options: sanitizedOptions,
      correct_option: input.correct_option,
      answer: input.answer ? input.answer.trim() : null,
      explanation: input.explanation ? input.explanation.trim() : null,
      explanation_html: finalExplanationHtml,
      is_mcq: input.is_mcq,
      ...(input.institution !== undefined && { institution: input.institution }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.topic_code !== undefined && { topic_code: input.topic_code }),
      ...(input.keyword !== undefined && { keyword: input.keyword }),
      _shard: targetShardNumber ?? undefined,
    };

    shard[questionIndex] = updatedQuestion;

    // 4. Upload updated shard to main bucket path
    const uploadOk = await uploadShardJson(supabase, mainShardPath, shard);
    if (!uploadOk) {
      return { success: false, error: "সুপাবেস বাকেটে শার্ড ফাইল সংরক্ষণ করতে ব্যর্থ হয়েছে।" };
    }

    // 5. Also check and update the subfolder shard (mcq or written) if it exists
    const typeFolder = input.is_mcq ? "mcq" : "written";
    const { data: typeFiles } = await supabase.storage
      .from(BUCKET)
      .list(`${PREFIX}/${input.subject}/${typeFolder}`, { limit: 100 });

    if (typeFiles && typeFiles.length > 0) {
      const validFiles = typeFiles
        .map((f) => f.name)
        .filter((name) => name.startsWith("shard-") && name.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const BATCH = 15;
      for (let i = 0; i < validFiles.length; i += BATCH) {
        const batch = validFiles.slice(i, i + BATCH);
        let foundAndSaved = false;
        await Promise.all(
          batch.map(async (fileName) => {
            if (foundAndSaved) return;
            const typePath = `${PREFIX}/${input.subject}/${typeFolder}/${fileName}`;
            const typeShard = await downloadShardJson(supabase, typePath);
            if (typeShard) {
              const typeIdx = typeShard.findIndex((q) => q.id === input.id);
              if (typeIdx !== -1) {
                typeShard[typeIdx] = updatedQuestion;
                await uploadShardJson(supabase, typePath, typeShard);
                foundAndSaved = true;
              }
            }
          })
        );
        if (foundAndSaved) break;
      }
    }

    // 6. Invalidate in-memory and Next.js caches
    invalidateShardCache(input.subject);
    updateSearchCache(updatedQuestion, input.subject, targetShardNumber ?? 1);
    revalidatePath("/admin/questions");
    revalidatePath("/admin/reports");
    revalidatePath("/questions", "page");
    revalidatePath("/questions", "layout");
    revalidatePath("/questions");

    return {
      success: true,
      question: updatedQuestion,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "অপ্রত্যাশিত ত্রুটি ঘটেছে।";
    return { success: false, error: message };
  }
}

export type DeleteQuestionResult = {
  success: boolean;
  error?: string;
  deletedQuestionId?: string;
};

export async function deleteQuestionAction(
  questionId: string,
  subject: string,
  shardNumber?: number
): Promise<DeleteQuestionResult> {
  const role = await getCurrentRole();
  if (!role) {
    return { success: false, error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন প্রশ্ন ডিলিট করতে পারেন।" };
  }

  if (!questionId || !subject) {
    return { success: false, error: "প্রশ্নের আইডি ও বিষয় আবশ্যক।" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    let targetShardNumber = shardNumber;
    let mainShardPath = "";
    let shard: StorageQuestion[] | null = null;
    let deletedQuestion: StorageQuestion | null = null;

    // 1. If shardNumber is known, download that shard directly
    if (targetShardNumber && targetShardNumber > 0) {
      mainShardPath = `${PREFIX}/${subject}/shard-${String(targetShardNumber).padStart(4, "0")}.json`;
      shard = await downloadShardJson(supabase, mainShardPath);
      const foundIdx = shard?.findIndex((q) => q.id === questionId) ?? -1;
      if (shard && foundIdx !== -1) {
        deletedQuestion = shard[foundIdx] ?? null;
      } else {
        shard = null; // not found in this shard, fallback to scan
      }
    }

    // 2. Fallback scan if not found directly
    if (!shard) {
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(`${PREFIX}/${subject}`, { limit: 100 });

      const shardFiles = (files ?? [])
        .map((f) => f.name)
        .filter((name) => name.startsWith("shard-") && name.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const BATCH = 15;
      for (let i = 0; i < shardFiles.length; i += BATCH) {
        const batch = shardFiles.slice(i, i + BATCH);
        let found = false;
        await Promise.all(
          batch.map(async (fileName) => {
            if (found) return;
            const filePath = `${PREFIX}/${subject}/${fileName}`;
            const candidate = await downloadShardJson(supabase, filePath);
            if (candidate) {
              const idx = candidate.findIndex((q) => q.id === questionId);
              if (idx !== -1) {
                deletedQuestion = candidate[idx] ?? null;
                shard = candidate;
                mainShardPath = filePath;
                const match = fileName.match(/shard-(\d+)\.json/);
                if (match && match[1]) targetShardNumber = parseInt(match[1], 10);
                found = true;
              }
            }
          })
        );
        if (found) break;
      }
    }

    if (!shard || !mainShardPath || !deletedQuestion) {
      return {
        success: false,
        error: `প্রশ্নটি স্টোরেজ বাকেটে খুঁজে পাওয়া যায়নি (${subject}/${questionId})।`,
      };
    }

    // 3. Prepare updated main shard
    const updatedShard = shard.filter((q) => q.id !== questionId);
    const isMcq = Boolean(
      deletedQuestion.is_mcq ||
      (deletedQuestion.options && deletedQuestion.options.length > 0)
    );
    const typeFolder = isMcq ? "mcq" : "written";

    // 4. Run main shard update, type folder update, db deletion, and manifest update concurrently in parallel
    const uploadMainShardPromise = uploadShardJson(supabase, mainShardPath, updatedShard);

    const updateTypeShardPromise = (async () => {
      try {
        if (targetShardNumber && targetShardNumber > 0) {
          const directTypePath = `${PREFIX}/${subject}/${typeFolder}/shard-${String(targetShardNumber).padStart(4, "0")}.json`;
          const directTypeShard = await downloadShardJson(supabase, directTypePath);
          if (directTypeShard && directTypeShard.some((q) => q.id === questionId)) {
            const updatedTypeShard = directTypeShard.filter((q) => q.id !== questionId);
            await uploadShardJson(supabase, directTypePath, updatedTypeShard);
            return;
          }
        }

        const { data: typeFiles } = await supabase.storage
          .from(BUCKET)
          .list(`${PREFIX}/${subject}/${typeFolder}`, { limit: 50 });

        if (typeFiles && typeFiles.length > 0) {
          const validFiles = typeFiles
            .map((f) => f.name)
            .filter((name) => name.startsWith("shard-") && name.endsWith(".json"));

          await Promise.all(
            validFiles.map(async (fileName) => {
              const typePath = `${PREFIX}/${subject}/${typeFolder}/${fileName}`;
              const typeShard = await downloadShardJson(supabase, typePath);
              if (typeShard && typeShard.some((q) => q.id === questionId)) {
                const updatedTypeShard = typeShard.filter((q) => q.id !== questionId);
                await uploadShardJson(supabase, typePath, updatedTypeShard);
              }
            })
          );
        }
      } catch (err) {
        console.error("Error updating type shard:", err);
      }
    })();

    const deleteDbPromise = (async () => {
      try {
        const extId = deletedQuestion.external_id;
        if (extId) {
          await supabase
            .from("qb_questions")
            .delete()
            .or(`id.eq.${questionId},external_id.eq.${extId}`);
        } else {
          await supabase.from("qb_questions").delete().eq("id", questionId);
        }
      } catch {
        // Ignore database table errors if table is not used
      }
    })();

    const updateManifestPromise = (async () => {
      try {
        const manifestPath = `${PREFIX}/manifest.json`;
        const { data: mData } = await supabase.storage.from(BUCKET).download(manifestPath);
        if (mData) {
          const mText = await mData.text();
          const manifest = JSON.parse(mText);

          if (typeof manifest.totalQuestions === "number") {
            manifest.totalQuestions = Math.max(0, manifest.totalQuestions - 1);
          }

          if (isMcq) {
            if (typeof manifest.mcqTotal === "number") {
              manifest.mcqTotal = Math.max(0, manifest.mcqTotal - 1);
            }
          } else {
            if (typeof manifest.writtenTotal === "number") {
              manifest.writtenTotal = Math.max(0, manifest.writtenTotal - 1);
            }
          }

          if (Array.isArray(manifest.subjects)) {
            const subObj = manifest.subjects.find(
              (s: { slug: string; total?: number; mcq?: number; written?: number }) => s.slug === subject
            );
            if (subObj) {
              subObj.total = Math.max(0, (subObj.total || 0) - 1);
              if (isMcq) {
                subObj.mcq = Math.max(0, (subObj.mcq || 0) - 1);
              } else {
                subObj.written = Math.max(0, (subObj.written || 0) - 1);
              }
            }
          }

          manifest.generatedAt = new Date().toISOString();
          await supabase.storage.from(BUCKET).upload(manifestPath, JSON.stringify(manifest), {
            contentType: "application/json",
            upsert: true,
          });
        }
      } catch (mErr) {
        console.error("Failed to update manifest after question deletion:", mErr);
      }
    })();

    const [uploadOk] = await Promise.all([
      uploadMainShardPromise,
      updateTypeShardPromise,
      deleteDbPromise,
      updateManifestPromise,
    ]);

    if (!uploadOk) {
      return { success: false, error: "সুপাবেস বাকেটে শার্ড ফাইল আপডেট করতে ব্যর্থ হয়েছে।" };
    }

    // 7. Invalidate caches
    invalidateManifestCache();
    invalidateShardCache(subject);
    invalidateSearchCache(questionId);
    revalidatePath("/admin/questions");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");
    revalidatePath("/questions");
    revalidatePath("/questions", "layout");
    revalidatePath("/");

    return {
      success: true,
      deletedQuestionId: questionId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "অপ্রত্যাশিত ত্রুটি ঘটেছে।";
    return { success: false, error: message };
  }
}
