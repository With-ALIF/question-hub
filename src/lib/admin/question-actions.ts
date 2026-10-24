"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/roles";
import { invalidateShardCache, type StorageQuestion } from "@/lib/questions/storage";
import { updateSearchCache } from "@/lib/admin/question-search";
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

    const updatedQuestion: StorageQuestion = {
      ...existing,
      question_text: input.question_text.trim(),
      question_html: finalQuestionHtml,
      options: input.options,
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
    invalidateShardCache(input.subject, targetShardNumber);
    updateSearchCache(updatedQuestion, input.subject, targetShardNumber ?? 1);
    revalidatePath("/admin/questions");
    revalidatePath("/admin/reports");
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
