import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuestionOption } from "@/lib/supabase/types";

export const QUESTION_PAGE_SIZE = 10;

const BUCKET = process.env["SUPABASE_QUESTIONS_BUCKET"] ?? "qb-raw";
const PREFIX = process.env["SUPABASE_QUESTIONS_PREFIX"] ?? "questions-v2";
const MANIFEST_TTL_MS = 60 * 1000;
const SHARD_TTL_MS = 10 * 60 * 1000;
const MAX_CACHED_SHARDS = 80;

export type StorageQuestion = {
  id: string;
  external_id: number;
  question_text: string;
  /** Sanitized HTML from the source dump; present only when it carried an image. */
  question_html: string | null;
  options: QuestionOption[];
  correct_option: number | null;
  answer: string | null;
  explanation: string | null;
  /** Sanitized HTML from the source dump; present only when it carried an image. */
  explanation_html: string | null;
  source_db: string | null;
  institution: string | null;
  year: string | null;
  topic_code: string | null;
  keyword: string | null;
  is_mcq: boolean;
  subject: string;
};

export type QuestionSubject = {
  slug: string;
  name: string;
  total: number;
  mcq: number;
  written: number;
  shards: {
    all: number;
    mcq: number;
    written: number;
  };
};

export type RecentStorageQuestion = {
  id: string;
  question: string;
  source: string | null;
  topic: string | null;
  year: string | null;
};

export type QuestionManifest = {
  version: number;
  generatedAt: string;
  pageSize: number;
  shardSize: number;
  totalQuestions: number;
  mcqTotal: number;
  writtenTotal: number;
  subjects: QuestionSubject[];
  recentQuestions: RecentStorageQuestion[];
};

export type QuestionType = "all" | "mcq" | "written";

export const QUESTION_TYPES: QuestionType[] = ["all", "mcq", "written"];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  all: "All",
  mcq: "MCQ",
  written: "Written",
};

export type QuestionPageResult = {
  manifest: QuestionManifest | null;
  subjects: QuestionSubject[];
  subject: QuestionSubject | null;
  type: QuestionType;
  questions: StorageQuestion[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  error: string | null;
};

export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && (QUESTION_TYPES as string[]).includes(value);
}

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

let manifestCache: CacheEntry<QuestionManifest> | null = null;
const shardCache = new Map<string, CacheEntry<StorageQuestion[]>>();

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "Could not read question data from Storage.";
}

async function downloadJson<T>(storagePath: string): Promise<T> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);

  if (error) {
    throw new Error(`Storage download failed for ${storagePath}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Storage file ${storagePath} is empty.`);
  }

  const text = await data.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Storage file ${storagePath} is not valid JSON.`);
  }
}

function isQuestionManifest(value: unknown): value is QuestionManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<QuestionManifest>;
  return (
    typeof manifest.totalQuestions === "number" &&
    typeof manifest.pageSize === "number" &&
    typeof manifest.shardSize === "number" &&
    Array.isArray(manifest.subjects)
  );
}

// Upgrade a v1 manifest (where each subject had a single `shards` number) to
// the v2 shape so an older Storage payload still renders instead of crashing.
function normalizeManifest(manifest: QuestionManifest): QuestionManifest {
  const shardSize = manifest.shardSize > 0 ? manifest.shardSize : 100;

  return {
    ...manifest,
    subjects: manifest.subjects.map((subject) => {
      const rawShards: unknown = subject.shards;

      if (rawShards && typeof rawShards === "object") {
        return subject;
      }

      const legacyShardCount =
        typeof rawShards === "number" && Number.isFinite(rawShards)
          ? rawShards
          : Math.ceil(subject.total / shardSize);

      return {
        ...subject,
        shards: {
          all: legacyShardCount,
          mcq: Math.ceil(subject.mcq / shardSize),
          written: Math.ceil(subject.written / shardSize),
        },
      };
    }),
  };
}

export async function getQuestionManifest(): Promise<QuestionManifest> {
  if (manifestCache && manifestCache.expiresAt > Date.now()) {
    return manifestCache.value;
  }

  try {
    const downloaded = await downloadJson<unknown>(`${PREFIX}/manifest.json`);

    if (!isQuestionManifest(downloaded)) {
      throw new Error("Question manifest has an unexpected shape.");
    }

    const manifest = normalizeManifest(downloaded);

    if (manifestCache && manifestCache.value.generatedAt !== manifest.generatedAt) {
      shardCache.clear();
    }

    manifestCache = {
      value: manifest,
      expiresAt: Date.now() + MANIFEST_TTL_MS,
    };

    return manifest;
  } catch (error) {
    if (manifestCache) return manifestCache.value;
    throw error;
  }
}

function shardPathFor(subject: string, type: QuestionType, shardNumber: number) {
  const fileName = `shard-${String(shardNumber).padStart(4, "0")}.json`;
  // "all" shards live at the subject root; mcq/written shards live in sub-folders.
  return type === "all"
    ? `${PREFIX}/${subject}/${fileName}`
    : `${PREFIX}/${subject}/${type}/${fileName}`;
}

export async function getQuestionShard(
  subject: string,
  shardNumber: number,
  type: QuestionType = "all",
): Promise<StorageQuestion[]> {
  const key = `${subject}:${type}:${shardNumber}`;
  const cached = shardCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const shard = await downloadJson<unknown>(shardPathFor(subject, type, shardNumber));

    if (!Array.isArray(shard)) {
      throw new Error(`Question shard ${key} is not an array.`);
    }

    if (shardCache.size >= MAX_CACHED_SHARDS) {
      const oldestKey = shardCache.keys().next().value;
      if (oldestKey) shardCache.delete(oldestKey);
    }

    shardCache.set(key, {
      value: shard as StorageQuestion[],
      expiresAt: Date.now() + SHARD_TTL_MS,
    });

    return shard as StorageQuestion[];
  } catch (error) {
    if (cached) return cached.value;
    throw error;
  }
}

export async function getQuestionPage({
  subject,
  page,
  type = "all",
}: {
  subject: string;
  page: number;
  type?: QuestionType;
}): Promise<QuestionPageResult> {
  const selectedType: QuestionType = isQuestionType(type) ? type : "all";

  try {
    const manifest = await getQuestionManifest();
    const subjects = manifest.subjects;
    const selectedSubject =
      subjects.find((item) => item.slug === subject) ?? subjects[0] ?? null;

    if (!selectedSubject) {
      return {
        manifest,
        subjects,
        subject: null,
        type: selectedType,
        questions: [],
        page: 1,
        pageSize: manifest.pageSize,
        totalPages: 1,
        total: 0,
        error: "No question subjects are available in Storage.",
      };
    }

    const pageSize = manifest.pageSize > 0 ? manifest.pageSize : QUESTION_PAGE_SIZE;
    const total =
      selectedType === "mcq"
        ? selectedSubject.mcq
        : selectedType === "written"
          ? selectedSubject.written
          : selectedSubject.total;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, Math.floor(page || 1)), totalPages);
    const from = (safePage - 1) * pageSize;
    const shardSize = manifest.shardSize > 0 ? manifest.shardSize : 100;
    const shardNumber = Math.floor(from / shardSize) + 1;
    const offset = from % shardSize;
    const maxShards = selectedSubject.shards[selectedType] ?? 0;

    // A filtered type can legitimately have zero shards (e.g. no written
    // questions for a subject) — render an empty result instead of a 404.
    if (total === 0 || shardNumber > maxShards) {
      return {
        manifest,
        subjects,
        subject: selectedSubject,
        type: selectedType,
        questions: [],
        page: safePage,
        pageSize,
        totalPages,
        total,
        error: null,
      };
    }

    const shard = await getQuestionShard(selectedSubject.slug, shardNumber, selectedType);

    return {
      manifest,
      subjects,
      subject: selectedSubject,
      type: selectedType,
      questions: shard.slice(offset, offset + pageSize),
      page: safePage,
      pageSize,
      totalPages,
      total,
      error: null,
    };
  } catch (error) {
    return {
      manifest: null,
      subjects: [],
      subject: null,
      type: selectedType,
      questions: [],
      page: 1,
      pageSize: QUESTION_PAGE_SIZE,
      totalPages: 1,
      total: 0,
      error: getErrorMessage(error),
    };
  }
}
