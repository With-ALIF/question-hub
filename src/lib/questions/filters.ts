import "server-only";

import { compareChapterCodes, formatChapterLabel } from "@/data/chapters";
import { formatPaperLabel } from "@/data/papers";

export * from "./constants";
import {
  QUESTION_FILTER_KEYS,
  type QuestionFilterKey,
  type QuestionFilters,
  type QuestionFiltersInput,
  type QuestionFilterOption,
  type QuestionFilterOptions,
} from "./constants";

export type QuestionFilterIndex = {
  version: number;
  subject: string;
  shardSize: number;
  total: number;
  mcq: number;
  written: number;
  dict: Record<QuestionFilterKey, string[]>;
  rows: number[][];
};

const COLUMN: Record<QuestionFilterKey, number> = {
  db: 0,
  un: 1,
  year: 2,
  paper: 3,
  chapter: 4,
  topic: 5,
};

const IS_MCQ_COLUMN = 6;

const INDEX_LOADERS: Record<string, () => Promise<unknown>> = {
  physics: () => import("@/data/filters/physics.json"),
  chemistry: () => import("@/data/filters/chemistry.json"),
  biology: () => import("@/data/filters/biology.json"),
  mathematics: () => import("@/data/filters/mathematics.json"),
  ict: () => import("@/data/filters/ict.json"),
  other: () => import("@/data/filters/other.json"),
};

const indexCache = new Map<string, Promise<QuestionFilterIndex | null>>();

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isQuestionFilterIndex(value: unknown): value is QuestionFilterIndex {
  if (!value || typeof value !== "object") return false;

  const index = value as Partial<QuestionFilterIndex>;
  if (typeof index.subject !== "string" || typeof index.shardSize !== "number") return false;
  if (typeof index.total !== "number" || typeof index.mcq !== "number") return false;
  if (typeof index.written !== "number" || !Array.isArray(index.rows)) return false;
  if (!index.dict || typeof index.dict !== "object") return false;

  return QUESTION_FILTER_KEYS.every((key) => isStringArray(index.dict?.[key]));
}

export function getQuestionFilterIndex(subject: string): Promise<QuestionFilterIndex | null> {
  const cached = indexCache.get(subject);
  if (cached) return cached;

  const loader = INDEX_LOADERS[subject];

  const pending = (async () => {
    if (!loader) return null;

    try {
      const module = (await loader()) as { default?: unknown } | undefined;
      const payload = module?.default ?? module;
      return isQuestionFilterIndex(payload) ? payload : null;
    } catch {
      return null;
    }
  })();

  indexCache.set(subject, pending);
  return pending;
}

export function filterIndexMatches(
  index: QuestionFilterIndex,
  subject: { slug: string; total: number; mcq: number; written: number },
  shardSize: number,
): boolean {
  return (
    index.version === 1 &&
    index.subject === subject.slug &&
    index.shardSize === shardSize &&
    index.total === subject.total &&
    index.mcq === subject.mcq &&
    index.written === subject.written &&
    Number.isInteger(index.shardSize) &&
    index.shardSize > 0
  );
}

export function sanitizeFilters(input: QuestionFiltersInput | undefined): QuestionFilters {
  const filters: QuestionFilters = {};

  for (const key of QUESTION_FILTER_KEYS) {
    const raw = input?.[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const clean = typeof value === "string" ? value.trim() : "";

    if (clean) filters[key] = clean;
  }

  return filters;
}

export function hasActiveFilters(filters: QuestionFilters): boolean {
  return QUESTION_FILTER_KEYS.some((key) => Boolean(filters[key]));
}

type FilterWanted = Partial<Record<QuestionFilterKey, Set<number>>>;

function wantedIndices(index: QuestionFilterIndex, filters: QuestionFilters): FilterWanted {
  const wanted: FilterWanted = {};

  for (const key of QUESTION_FILTER_KEYS) {
    const value = filters[key];
    if (!value) continue;

    const dictionary = index.dict[key];
    const cell = dictionary.indexOf(value);
    wanted[key] = cell >= 0 ? new Set([cell]) : new Set<number>();
  }

  return wanted;
}

function rowMatches(
  row: number[],
  wanted: FilterWanted,
  type: "all" | "mcq" | "written",
): boolean {
  const isMcq = row[IS_MCQ_COLUMN] === 1;

  if (type === "mcq" && !isMcq) return false;
  if (type === "written" && isMcq) return false;

  for (const key of QUESTION_FILTER_KEYS) {
    const cells = wanted[key];
    if (cells && !cells.has(row[COLUMN[key]] ?? -1)) return false;
  }

  return true;
}

export function selectFilterRows(
  index: QuestionFilterIndex,
  filters: QuestionFilters,
  type: "all" | "mcq" | "written",
): number[] {
  const wanted = wantedIndices(index, filters);
  const matched: number[] = [];

  for (let position = 0; position < index.rows.length; position += 1) {
    const row = index.rows[position];
    if (row && rowMatches(row, wanted, type)) matched.push(position);
  }

  return matched;
}

function compareByCount(a: QuestionFilterOption, b: QuestionFilterOption) {
  return b.count - a.count || a.label.localeCompare(b.label);
}

function buildOptions(
  key: QuestionFilterKey,
  counts: number[],
  dictionary: string[],
  selected: string,
): QuestionFilterOption[] {
  const options: QuestionFilterOption[] = [];

  for (let cell = 0; cell < counts.length; cell += 1) {
    const count = counts[cell] ?? 0;
    const value = dictionary[cell] ?? "";

    if (count === 0 && value !== selected) continue;

    const label =
      key === "chapter"
        ? formatChapterLabel(value)
        : key === "paper"
          ? formatPaperLabel(value)
          : value || "Unspecified";

    options.push({ value, label, count });
  }

  if (key === "year") {
    options.sort((a, b) => {
      const left = Number(a.value);
      const right = Number(b.value);

      if (Number.isFinite(left) && Number.isFinite(right)) return right - left;
      if (Number.isFinite(left)) return -1;
      if (Number.isFinite(right)) return 1;
      return a.value.localeCompare(b.value);
    });
  } else if (key === "chapter") {
    options.sort((a, b) => compareChapterCodes(a.value, b.value));
  } else if (key === "paper") {
    options.sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
  } else {
    options.sort(compareByCount);
  }

  return options;
}

export function buildFilterOptions(
  index: QuestionFilterIndex,
  filters: QuestionFilters,
  type: "all" | "mcq" | "written",
): QuestionFilterOptions {
  const wanted = wantedIndices(index, filters);
  const options = {} as QuestionFilterOptions;

  for (const key of QUESTION_FILTER_KEYS) {
    const dictionary = index.dict[key];
    const counts = new Array<number>(dictionary.length).fill(0);
    let all = 0;

    for (const row of index.rows) {
      if (!row) continue;

      const isMcq = row[IS_MCQ_COLUMN] === 1;
      if (type === "mcq" && !isMcq) continue;
      if (type === "written" && isMcq) continue;

      let matches = true;
      for (const other of QUESTION_FILTER_KEYS) {
        if (other === key) continue;
        const cells = wanted[other];
        if (cells && !cells.has(row[COLUMN[other]] ?? -1)) {
          matches = false;
          break;
        }
      }

      if (!matches) continue;

      all += 1;
      const cell = row[COLUMN[key]] ?? -1;
      if (cell >= 0) counts[cell] = (counts[cell] ?? 0) + 1;
    }

    options[key] = {
      all,
      options: buildOptions(key, counts, dictionary, filters[key] ?? ""),
    };
  }

  return options;
}
