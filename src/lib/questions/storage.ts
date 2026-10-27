import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuestionOption } from "@/lib/supabase/types";

import { compareChapterCodes } from "@/data/chapters";

import {
  buildFilterOptions,
  filterIndexMatches,
  getQuestionFilterIndex,
  sanitizeFilters,
  selectFilterRows,
  INDEX_FILTER_KEYS,
  QUESTION_FILTER_KEYS,
  type QuestionFilterKey,
  type QuestionFilterOption,
  type QuestionFilterOptions,
  type QuestionFilters,
  type QuestionFiltersInput,
} from "./filters";

export const QUESTION_PAGE_SIZE = 10;

const BUCKET = process.env["SUPABASE_QUESTIONS_BUCKET"] ?? "qb-raw";
const PREFIX = process.env["SUPABASE_QUESTIONS_PREFIX"] ?? "questions-v2";
const MANIFEST_TTL_MS = 60 * 1000;
const SHARD_TTL_MS = 10 * 60 * 1000;
const MAX_CACHED_SHARDS = 500;

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
  _shard?: number | undefined;
};

export function hasExplanation(q: {
  explanation?: string | null;
  explanation_html?: string | null;
}): boolean {
  return Boolean(
    (q.explanation && q.explanation.trim().length > 0) ||
      (q.explanation_html && q.explanation_html.trim().length > 0),
  );
}

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

export function invalidateShardCache(subject?: string, shardNumber?: number) {
  if (!subject) {
    shardCache.clear();
    return;
  }
  if (typeof shardNumber === "number") {
    shardCache.delete(`${subject}:all:${shardNumber}`);
    shardCache.delete(`${subject}:mcq:${shardNumber}`);
    shardCache.delete(`${subject}:written:${shardNumber}`);
  } else {
    for (const key of shardCache.keys()) {
      if (key.startsWith(`${subject}:`)) {
        shardCache.delete(key);
      }
    }
  }
}

export function invalidateManifestCache() {
  manifestCache = null;
}

async function loadQuestionsAt(
  subject: string,
  positions: PagePosition[],
): Promise<StorageQuestion[]> {
  if (positions.length === 0) return [];

  const shardNumbers = [...new Set(positions.map((position) => position.shard))];
  const BATCH_SIZE = 30;
  const shards: StorageQuestion[][] = [];

  for (let i = 0; i < shardNumbers.length; i += BATCH_SIZE) {
    const batch = shardNumbers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((shard) => getQuestionShard(subject, shard, "all")),
    );
    shards.push(...batchResults);
  }

  const byShard = new Map(shardNumbers.map((shard, index) => [shard, shards[index] ?? []]));

  const questions: StorageQuestion[] = [];

  for (const position of positions) {
    const question = byShard.get(position.shard)?.[position.offset];
    if (question) questions.push({ ...question, _shard: position.shard });
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
  const filterNoExplanation = activeFilters.no_explanation === "true";
  const filterHasExplanation = activeFilters.has_explanation === "true";
  const legacyQuery = activeFilters.chapter ?? activeFilters.topic ?? "";

  try {
    const manifest = await getQuestionManifest();
    const subjects = manifest.subjects;

    if (subject === "all") {
      const pageSize = manifest.pageSize > 0 ? manifest.pageSize : QUESTION_PAGE_SIZE;
      const shardSize = manifest.shardSize > 0 ? manifest.shardSize : 100;
      const total =
        selectedType === "mcq"
          ? manifest.mcqTotal
          : selectedType === "written"
            ? manifest.writtenTotal
            : manifest.totalQuestions;

      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(Math.max(1, Math.floor(page || 1)), totalPages);
      const globalStart = (safePage - 1) * pageSize;
      const globalEnd = Math.min(globalStart + pageSize, total);

      let currentOffset = 0;
      const questions: StorageQuestion[] = [];

      for (const sub of subjects) {
        const subTotal =
          selectedType === "mcq" ? sub.mcq : selectedType === "written" ? sub.written : sub.total;
        const subStart = currentOffset;
        const subEnd = currentOffset + subTotal;
        currentOffset = subEnd;

        const overlapStart = Math.max(globalStart, subStart);
        const overlapEnd = Math.min(globalEnd, subEnd);

        if (overlapStart < overlapEnd) {
          const localStart = overlapStart - subStart;
          const localCount = overlapEnd - overlapStart;

          const startShard = Math.floor(localStart / shardSize) + 1;
          const endShard = Math.floor((localStart + localCount - 1) / shardSize) + 1;

          for (let sNum = startShard; sNum <= endShard; sNum++) {
            try {
              const shard = await getQuestionShard(sub.slug, sNum, selectedType);
              const shardLocalStart = Math.max(0, localStart - (sNum - 1) * shardSize);
              const shardLocalEnd = Math.min(shard.length, localStart + localCount - (sNum - 1) * shardSize);
              const sliced = shard.slice(shardLocalStart, shardLocalEnd).map((q) => ({
                ...q,
                subject: sub.slug,
                _shard: sNum,
              }));
              questions.push(...sliced);
            } catch {
            }
          }
        }
      }

      const allSubjectObj: QuestionSubject = {
        slug: "all",
        name: "সকল বিষয়",
        total: manifest.totalQuestions,
        mcq: manifest.mcqTotal,
        written: manifest.writtenTotal,
        shards: {
          all: Math.ceil(manifest.totalQuestions / shardSize),
          mcq: Math.ceil(manifest.mcqTotal / shardSize),
          written: Math.ceil(manifest.writtenTotal / shardSize),
        },
      };

      if (filterHasExplanation || filterNoExplanation) {
        const filtered = questions.filter((q) =>
          filterHasExplanation ? hasExplanation(q) : !hasExplanation(q),
        );
        return {
          manifest,
          subjects,
          subject: allSubjectObj,
          type: selectedType,
          questions: filtered,
          page: safePage,
          pageSize,
          totalPages,
          total: filtered.length,
          error: null,
          filters: null,
          activeFilters,
        };
      }

      return {
        manifest,
        subjects,
        subject: allSubjectObj,
        type: selectedType,
        questions,
        page: safePage,
        pageSize,
        totalPages,
        total,
        error: null,
        filters: null,
        activeFilters,
      };
    }

    const requestedSlugs = subject
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (requestedSlugs.length > 1) {
      const selectedSubjects = subjects.filter((item) =>
        requestedSlugs.includes(item.slug),
      );

      if (selectedSubjects.length > 0) {
        const pageSize = manifest.pageSize > 0 ? manifest.pageSize : QUESTION_PAGE_SIZE;
        const shardSize = manifest.shardSize > 0 ? manifest.shardSize : 100;

        const subResults = await Promise.all(
          selectedSubjects.map(async (sub) => {
            const index = await getQuestionFilterIndex(sub.slug);
            const indexUsable = index !== null && filterIndexMatches(index, sub, shardSize);

            if (index && indexUsable) {
              const subFilters: QuestionFilters = { ...activeFilters };
              delete subFilters.no_explanation;
              delete subFilters.has_explanation;

              for (const key of INDEX_FILTER_KEYS) {
                const val = subFilters[key];
                if (val) {
                  const parts = val.split(",").map((v) => v.trim()).filter(Boolean);
                  const validParts = parts.filter((v) => index.dict[key].includes(v));
                  if (validParts.length > 0) {
                    subFilters[key] = validParts.join(",");
                  } else {
                    delete subFilters[key];
                  }
                }
              }

              const matched = selectFilterRows(index, subFilters, selectedType);
              const filterOptions = buildFilterOptions(index, subFilters, selectedType);
              return { sub, matched, filterOptions, index };
            }

            return { sub, matched: [], filterOptions: null, index: null };
          }),
        );

        const combinedOptions: QuestionFilterOptions = {};
        for (const key of INDEX_FILTER_KEYS) {
          let allCount = 0;
          const optionsMap = new Map<string, QuestionFilterOption>();
          for (const res of subResults) {
            const facet = res.filterOptions?.[key];
            if (facet) {
              allCount += facet.all;
              for (const opt of facet.options) {
                const existing = optionsMap.get(opt.value);
                if (existing) {
                  existing.count += opt.count;
                } else {
                  optionsMap.set(opt.value, { ...opt });
                }
              }
            }
          }
          const opts = Array.from(optionsMap.values());
          if (key === "year") {
            opts.sort((a, b) => {
              const left = Number(a.value);
              const right = Number(b.value);
              if (Number.isFinite(left) && Number.isFinite(right)) return right - left;
              if (Number.isFinite(left)) return -1;
              if (Number.isFinite(right)) return 1;
              return a.value.localeCompare(b.value);
            });
          } else if (key === "chapter") {
            opts.sort((a, b) => compareChapterCodes(a.value, b.value));
          } else if (key === "paper") {
            opts.sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
          } else {
            opts.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
          }
          combinedOptions[key] = { all: allCount, options: opts };
        }

        type TaggedPosition = {
          subject: string;
          shard: number;
          offset: number;
        };

        const allPositions: TaggedPosition[] = [];
        for (const res of subResults) {
          for (const row of res.matched) {
            allPositions.push({
              subject: res.sub.slug,
              shard: Math.floor(row / shardSize) + 1,
              offset: row % shardSize,
            });
          }
        }

        const combinedSubject: QuestionSubject = {
          slug: selectedSubjects.map((s) => s.slug).join(","),
          name: selectedSubjects.map((s) => s.name).join(" + "),
          total: selectedSubjects.reduce((acc, s) => acc + s.total, 0),
          mcq: selectedSubjects.reduce((acc, s) => acc + s.mcq, 0),
          written: selectedSubjects.reduce((acc, s) => acc + s.written, 0),
          shards: { all: 0, mcq: 0, written: 0 },
        };

        if (filterHasExplanation || filterNoExplanation) {
          const bySub = new Map<string, PagePosition[]>();
          for (const pos of allPositions) {
            let list = bySub.get(pos.subject);
            if (!list) {
              list = [];
              bySub.set(pos.subject, list);
            }
            list.push({ shard: pos.shard, offset: pos.offset });
          }
          const loadedBySub = new Map<string, StorageQuestion[]>();
          await Promise.all(
            Array.from(bySub.entries()).map(async ([subSlug, posList]) => {
              const qs = await loadQuestionsAt(subSlug, posList);
              loadedBySub.set(subSlug, qs);
            }),
          );
          const subIndices = new Map<string, number>();
          const allQuestions: StorageQuestion[] = [];
          for (const pos of allPositions) {
            const qs = loadedBySub.get(pos.subject);
            const idx = subIndices.get(pos.subject) ?? 0;
            if (qs && qs[idx]) {
              allQuestions.push({ ...qs[idx], subject: pos.subject });
              subIndices.set(pos.subject, idx + 1);
            }
          }
          const postFiltered = allQuestions.filter((q) =>
            filterHasExplanation ? hasExplanation(q) : !hasExplanation(q),
          );
          const postTotal = postFiltered.length;
          const postPages = Math.max(1, Math.ceil(postTotal / pageSize));
          const safePage = Math.min(Math.max(1, Math.floor(page || 1)), postPages);
          const start = (safePage - 1) * pageSize;

          return {
            manifest,
            subjects,
            subject: combinedSubject,
            type: selectedType,
            questions: postFiltered.slice(start, start + pageSize),
            page: safePage,
            pageSize,
            totalPages: postPages,
            total: postTotal,
            error: null,
            filters: combinedOptions,
            activeFilters,
          };
        }

        const totalMatched = allPositions.length;
        const totalPages = Math.max(1, Math.ceil(totalMatched / pageSize));
        const safePage = Math.min(Math.max(1, Math.floor(page || 1)), totalPages);
        const start = (safePage - 1) * pageSize;
        const pageSlice = allPositions.slice(start, start + pageSize);

        const bySub = new Map<string, PagePosition[]>();
        for (const pos of pageSlice) {
          let list = bySub.get(pos.subject);
          if (!list) {
            list = [];
            bySub.set(pos.subject, list);
          }
          list.push({ shard: pos.shard, offset: pos.offset });
        }
        const loadedBySub = new Map<string, StorageQuestion[]>();
        await Promise.all(
          Array.from(bySub.entries()).map(async ([subSlug, posList]) => {
            const qs = await loadQuestionsAt(subSlug, posList);
            loadedBySub.set(subSlug, qs);
          }),
        );
        const subIndices = new Map<string, number>();
        const pageQuestions: StorageQuestion[] = [];
        for (const pos of pageSlice) {
          const qs = loadedBySub.get(pos.subject);
          const idx = subIndices.get(pos.subject) ?? 0;
          if (qs && qs[idx]) {
            pageQuestions.push({ ...qs[idx], subject: pos.subject });
            subIndices.set(pos.subject, idx + 1);
          }
        }

        return {
          manifest,
          subjects,
          subject: combinedSubject,
          type: selectedType,
          questions: pageQuestions,
          page: safePage,
          pageSize,
          totalPages,
          total: totalMatched,
          error: null,
          filters: combinedOptions,
          activeFilters,
        };
      }
    }

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
      // Explanation filters are handled post-load, not in the index
      delete validFilters.no_explanation;
      delete validFilters.has_explanation;

      for (const key of INDEX_FILTER_KEYS) {
        const val = validFilters[key];
        if (val) {
          const parts = val.split(",").map((v) => v.trim()).filter(Boolean);
          const validParts = parts.filter((v) => index.dict[key].includes(v));
          if (validParts.length > 0) {
            validFilters[key] = validParts.join(",");
          } else {
            delete validFilters[key];
          }
        }
      }

      const matched = selectFilterRows(index, validFilters, selectedType);
      const filterOptions = buildFilterOptions(index, validFilters, selectedType);

      if (filterHasExplanation || filterNoExplanation) {
        if (filterHasExplanation) validFilters.has_explanation = "true";
        if (filterNoExplanation) validFilters.no_explanation = "true";
        // Load all matched questions, post-filter by explanation presence, then paginate
        const allPositions: PagePosition[] = matched.map((row) => ({
          shard: Math.floor(row / shardSize) + 1,
          offset: row % shardSize,
        }));
        const allQuestions = await loadQuestionsAt(selectedSubject.slug, allPositions);
        const postFiltered = allQuestions.filter((q) =>
          filterHasExplanation ? hasExplanation(q) : !hasExplanation(q),
        );
        const postTotal = postFiltered.length;
        const postPages = Math.max(1, Math.ceil(postTotal / pageSize));
        const safePage = Math.min(Math.max(1, Math.floor(page || 1)), postPages);
        const start = (safePage - 1) * pageSize;

        return {
          manifest,
          subjects,
          subject: selectedSubject,
          type: selectedType,
          questions: postFiltered.slice(start, start + pageSize),
          page: safePage,
          pageSize,
          totalPages: postPages,
          total: postTotal,
          error: null,
          filters: filterOptions,
          activeFilters: validFilters,
        };
      }

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
      let filtered = allQuestions.filter((q) => matchesChapterQuery(q, query));
      if (filterHasExplanation) {
        filtered = filtered.filter(hasExplanation);
      } else if (filterNoExplanation) {
        filtered = filtered.filter((q) => !hasExplanation(q));
      }

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

    if (filterHasExplanation || filterNoExplanation) {
      const shardsToLoad = Math.min(maxShards, 40);
      const shardPromises: Promise<StorageQuestion[]>[] = [];
      for (let s = 1; s <= shardsToLoad; s++) {
        shardPromises.push(getQuestionShard(selectedSubject.slug, s, selectedType));
      }
      const loadedShards = await Promise.all(shardPromises);
      const allQuestions = loadedShards.flat();
      const filtered = allQuestions.filter((q) =>
        filterHasExplanation ? hasExplanation(q) : !hasExplanation(q),
      );

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
      questions: shard
        .slice(offset, offset + pageSize)
        .map((q) => ({ ...q, _shard: shardNumber })),
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
