import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuestionOption } from "@/lib/supabase/types";

import {
  buildFilterOptions,
  filterIndexMatches,
  getQuestionFilterIndex,
  sanitizeFilters,
  selectFilterRows,
  QUESTION_FILTER_KEYS,
  type QuestionFilterKey,
  type QuestionFilterOptions,
  type QuestionFilters,
  type QuestionFiltersInput,
} from "./filters";

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
  question_html: string | null;
  options: QuestionOption[];
  correct_option: number | null;
  answer: string | null;
  explanation: string | null;
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
  filters: QuestionFilterOptions | null;
  activeFilters: QuestionFilters;
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

function matchesChapterQuery(q: StorageQuestion, query: string): boolean {
  const qText = (q.question_text ?? "").toLowerCase();
  const topic = (q.topic_code ?? "").toLowerCase();
  const keyword = (q.keyword ?? "").toLowerCase();

  if (topic.includes(query) || keyword.includes(query) || qText.includes(query)) {
    return true;
  }

  const words = query
    .split(/[\s,&+/\-]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3 && !["and", "the", "for", "with"].includes(w));

  if (words.length > 1) {
    return words.some(
      (word) => topic.includes(word) || keyword.includes(word) || qText.includes(word),
    );
  }

  return false;
}

type PagePosition = {
  shard: number;
  offset: number;
};

async function loadQuestionsAt(
  subject: string,
  positions: PagePosition[],
): Promise<StorageQuestion[]> {
  if (positions.length === 0) return [];

  const shardNumbers = [...new Set(positions.map((position) => position.shard))];
  const shards = await Promise.all(
    shardNumbers.map((shard) => getQuestionShard(subject, shard, "all")),
  );
  const byShard = new Map(shardNumbers.map((shard, index) => [shard, shards[index] ?? []]));

  const questions: StorageQuestion[] = [];

  for (const position of positions) {
    const question = byShard.get(position.shard)?.[position.offset];
    if (question) questions.push(question);
  }

  return questions;
}

export async function getQuestionPage({
  subject,
  page,
  type = "all",
  filters,
}: {
  subject: string;
  page: number;
  type?: QuestionType;
  filters?: QuestionFiltersInput;
}): Promise<QuestionPageResult> {
  const selectedType: QuestionType = isQuestionType(type) ? type : "all";
  const activeFilters = sanitizeFilters(filters);
  const legacyQuery = activeFilters.chapter ?? activeFilters.topic ?? "";

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
        filters: null,
        activeFilters,
      };
    }

    const pageSize = manifest.pageSize > 0 ? manifest.pageSize : QUESTION_PAGE_SIZE;
    const shardSize = manifest.shardSize > 0 ? manifest.shardSize : 100;
    const total =
      selectedType === "mcq"
        ? selectedSubject.mcq
        : selectedType === "written"
          ? selectedSubject.written
          : selectedSubject.total;
    const maxShards = selectedSubject.shards[selectedType] ?? 0;

    const index = await getQuestionFilterIndex(selectedSubject.slug);
    const indexUsable = index !== null && filterIndexMatches(index, selectedSubject, shardSize);

    if (index && !indexUsable) {
      console.warn(
        `[questions] filter index for "${selectedSubject.slug}" does not match Storage ` +
          `(index ${index.total}/${index.mcq}/${index.written}, ` +
          `manifest ${selectedSubject.total}/${selectedSubject.mcq}/${selectedSubject.written}). ` +
          "Run scripts/build-filter-index.mjs after rebuilding the shards.",
      );
    }

    if (index && indexUsable) {
      const validFilters: QuestionFilters = { ...activeFilters };
      for (const key of QUESTION_FILTER_KEYS) {
        const val = validFilters[key];
        if (val && !index.dict[key].includes(val)) {
          delete validFilters[key];
        }
      }

      const matched = selectFilterRows(index, validFilters, selectedType);
      const filterOptions = buildFilterOptions(index, validFilters, selectedType);
      const matchedTotal = matched.length;
      const matchedPages = Math.max(1, Math.ceil(matchedTotal / pageSize));
      const safePage = Math.min(Math.max(1, Math.floor(page || 1)), matchedPages);
      const start = (safePage - 1) * pageSize;

      const positions: PagePosition[] = matched.slice(start, start + pageSize).map((row) => ({
        shard: Math.floor(row / shardSize) + 1,
        offset: row % shardSize,
      }));

      return {
        manifest,
        subjects,
        subject: selectedSubject,
        type: selectedType,
        questions: await loadQuestionsAt(selectedSubject.slug, positions),
        page: safePage,
        pageSize,
        totalPages: matchedPages,
        total: matchedTotal,
        error: null,
        filters: filterOptions,
        activeFilters: validFilters,
      };
    }

    if (legacyQuery) {
      const query = legacyQuery.toLowerCase();

      if (total === 0 || maxShards === 0) {
        return {
          manifest,
          subjects,
          subject: selectedSubject,
          type: selectedType,
          questions: [],
          page: 1,
          pageSize,
          totalPages: 1,
          total: 0,
          error: null,
          filters: null,
          activeFilters,
        };
      }

      const shardsToLoad = Math.min(maxShards, 30);
      const shardPromises: Promise<StorageQuestion[]>[] = [];
      for (let s = 1; s <= shardsToLoad; s++) {
        shardPromises.push(getQuestionShard(selectedSubject.slug, s, selectedType));
      }
      const loadedShards = await Promise.all(shardPromises);
      const allQuestions = loadedShards.flat();
      const filtered = allQuestions.filter((q) => matchesChapterQuery(q, query));

      const filteredTotal = filtered.length;
      const filteredTotalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
      const safePage = Math.min(Math.max(1, Math.floor(page || 1)), filteredTotalPages);
      const offset = (safePage - 1) * pageSize;

      return {
        manifest,
        subjects,
        subject: selectedSubject,
        type: selectedType,
        questions: filtered.slice(offset, offset + pageSize),
        page: safePage,
        pageSize,
        totalPages: filteredTotalPages,
        total: filteredTotal,
        error: null,
        filters: null,
        activeFilters,
      };
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, Math.floor(page || 1)), totalPages);
    const from = (safePage - 1) * pageSize;
    const shardNumber = Math.floor(from / shardSize) + 1;
    const offset = from % shardSize;

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
        filters: null,
        activeFilters,
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
      filters: null,
      activeFilters,
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
      filters: null,
      activeFilters,
    };
  }
}
