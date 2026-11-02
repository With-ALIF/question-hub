import "server-only";

import {
  INDEX_FILTER_KEYS,
  filterIndexMatches,
  getQuestionFilterIndex,
  selectFilterRows,
  type QuestionFilterIndex,
  type QuestionFilters,
} from "./filters";
import {
  MAX_PRACTICE_QUESTIONS,
  type PracticeQuestion,
} from "./practice-types";
import {
  getQuestionManifest,
  getQuestionShard,
  hasExplanation,
  type StorageQuestion,
} from "./storage";

const MAX_SHARDS = 12;
const FALLBACK_SHARDS_PER_SUBJECT = 4;

export type PracticeScope = {
  /** A subject slug, a comma separated list, or "all". */
  subject: string;
  filters?: QuestionFilters;
  /** null means every subject is allowed. */
  allowedSubjectSlugs?: string[] | null;
  /** null means every database is allowed. */
  allowedDatabaseCodes?: string[] | null;
};

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }

  return copy;
}

function allowedDbCells(
  index: QuestionFilterIndex,
  codes: readonly string[] | null,
): Set<number> | undefined {
  if (codes === null) return undefined;

  const cells = new Set<number>();
  for (const code of codes) {
    const cell = index.dict.db.indexOf(code);
    if (cell >= 0) cells.add(cell);
  }

  return cells;
}

/**
 * Keeps only filter values that this subject actually uses. Returns null when a
 * filter can never match the subject (for example a physics chapter requested
 * for chemistry), so the subject is skipped instead of silently ignored.
 */
function filtersForIndex(
  index: QuestionFilterIndex,
  filters: QuestionFilters,
): QuestionFilters | null {
  const valid: QuestionFilters = {};

  for (const key of INDEX_FILTER_KEYS) {
    const value = filters[key];
    if (!value) continue;

    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const matched = parts.filter((part) => index.dict[key].includes(part));

    if (matched.length === 0) return null;
    valid[key] = matched.join(",");
  }

  return valid;
}

function matchesExplanationFilter(question: StorageQuestion, filters: QuestionFilters) {
  if (filters.has_explanation === "true") return hasExplanation(question);
  if (filters.no_explanation === "true") return !hasExplanation(question);
  return true;
}

function isUsablePracticeQuestion(question: StorageQuestion): boolean {
  return (
    question.is_mcq &&
    typeof question.correct_option === "number" &&
    question.correct_option > 0 &&
    Array.isArray(question.options) &&
    question.options.length > 0
  );
}

function toPracticeQuestion(question: StorageQuestion, subject: string): PracticeQuestion {
  return {
    id: question.id,
    question_text: question.question_text,
    question_html: question.question_html,
    options: question.options,
    correct_option: question.correct_option,
    answer: question.answer,
    explanation: question.explanation,
    explanation_html: question.explanation_html,
    topic_code: question.topic_code,
    source_db: question.source_db,
    subject,
  };
}

async function resolveSubjects(scope: PracticeScope) {
  const manifest = await getQuestionManifest();
  const available = manifest.subjects.map((subject) => subject.slug);
  const requested =
    !scope.subject.trim() || scope.subject.trim() === "all"
      ? available
      : scope.subject
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean);

  const allowedSet =
    scope.allowedSubjectSlugs === null || scope.allowedSubjectSlugs === undefined
      ? null
      : new Set(scope.allowedSubjectSlugs);

  const slugs = Array.from(
    new Set(
      requested.filter(
        (slug) => available.includes(slug) && (allowedSet === null || allowedSet.has(slug)),
      ),
    ),
  );

  return { manifest, slugs };
}

export async function countPracticeQuestions(scope: PracticeScope): Promise<number> {
  try {
    const { manifest, slugs } = await resolveSubjects(scope);
    const filters = scope.filters ?? {};
    const shardSize = manifest.shardSize > 0 ? manifest.shardSize : 100;
    let total = 0;

    for (const slug of slugs) {
      const subject = manifest.subjects.find((item) => item.slug === slug);
      if (!subject) continue;

      const index = await getQuestionFilterIndex(slug);
      if (!index || !filterIndexMatches(index, subject, shardSize)) continue;

      const validFilters = filtersForIndex(index, filters);
      if (!validFilters) continue;

      const cells = allowedDbCells(index, scope.allowedDatabaseCodes ?? null);
      total += selectFilterRows(index, validFilters, "mcq", cells).length;
    }

    return total;
  } catch {
    return 0;
  }
}

async function loadFallbackQuestions(
  scope: PracticeScope,
  limit: number,
  filters: QuestionFilters,
): Promise<PracticeQuestion[]> {
  if (Object.keys(filters).length > 0) return [];

  const { manifest, slugs } = await resolveSubjects(scope);
  const collected: PracticeQuestion[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    const subject = manifest.subjects.find((item) => item.slug === slug);
    if (!subject) continue;

    const maxShards = Math.min(subject.shards?.all ?? 0, FALLBACK_SHARDS_PER_SUBJECT);

    for (let shardNumber = 1; shardNumber <= maxShards && collected.length < limit; shardNumber += 1) {
      try {
        const shard = await getQuestionShard(slug, shardNumber, "mcq");

        for (const question of shard) {
          if (collected.length >= limit) break;
          if (!isUsablePracticeQuestion(question)) continue;
          if (seen.has(question.id)) continue;

          if (scope.allowedDatabaseCodes !== null && scope.allowedDatabaseCodes !== undefined) {
            if (!question.source_db || !scope.allowedDatabaseCodes.includes(question.source_db)) {
              continue;
            }
          }

          seen.add(question.id);
          collected.push(toPracticeQuestion(question, slug));
        }
      } catch {
        // A missing shard should not block the remaining ones.
      }
    }
  }

  return shuffle(collected);
}

export type PracticeSample = {
  questions: PracticeQuestion[];
  /** Number of MCQ questions matching the selected filters. */
  available: number;
};

export async function samplePracticeQuestions(
  scope: PracticeScope & { count: number },
): Promise<PracticeSample> {
  const { manifest, slugs } = await resolveSubjects(scope);
  const filters = scope.filters ?? {};
  const limit = Math.max(1, Math.min(MAX_PRACTICE_QUESTIONS, Math.floor(scope.count)));
  const shardSize = manifest.shardSize > 0 ? manifest.shardSize : 100;
  const shardLimitPerSubject = Math.max(
    2,
    Math.floor(MAX_SHARDS / Math.max(1, slugs.length)),
  );
  const candidateTargetPerSubject =
    Math.ceil((limit * 2) / Math.max(1, slugs.length)) + 4;

  type Position = { subject: string; shard: number; offset: number };

  const positions: Position[] = [];
  let available = 0;
  let indexedSubjects = 0;

  for (const slug of slugs) {
    const subject = manifest.subjects.find((item) => item.slug === slug);
    if (!subject) continue;

    const index = await getQuestionFilterIndex(slug);
    if (!index || !filterIndexMatches(index, subject, shardSize)) continue;

    const validFilters = filtersForIndex(index, filters);
    if (!validFilters) continue;

    indexedSubjects += 1;
    const cells = allowedDbCells(index, scope.allowedDatabaseCodes ?? null);
    const matched = selectFilterRows(index, validFilters, "mcq", cells);
    available += matched.length;
    if (matched.length === 0) continue;

    const rowsByShard = new Map<number, number[]>();
    for (const row of matched) {
      const shard = Math.floor(row / shardSize) + 1;
      const list = rowsByShard.get(shard);
      if (list) list.push(row % shardSize);
      else rowsByShard.set(shard, [row % shardSize]);
    }

    const pickedShards = shuffle(Array.from(rowsByShard.keys())).slice(
      0,
      shardLimitPerSubject,
    );
    let picked = 0;

    for (const shard of pickedShards) {
      for (const offset of shuffle(rowsByShard.get(shard) ?? [])) {
        positions.push({ subject: slug, shard, offset });
        picked += 1;
        if (picked >= candidateTargetPerSubject) break;
      }
      if (picked >= candidateTargetPerSubject) break;
    }
  }

  if (positions.length === 0) {
    const fallback = await loadFallbackQuestions(scope, limit, filters);
    return { questions: fallback, available: fallback.length };
  }

  const shardKeys = Array.from(
    new Set(positions.map((position) => `${position.subject}:${position.shard}`)),
  );
  const shards = new Map<string, StorageQuestion[]>();
  const BATCH_SIZE = 10;

  for (let i = 0; i < shardKeys.length; i += BATCH_SIZE) {
    const batch = shardKeys.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (key) => {
        const [subject, shardText] = key.split(":");
        const shardNumber = Number(shardText);
        if (!subject || !Number.isFinite(shardNumber)) return;

        try {
          shards.set(key, await getQuestionShard(subject, shardNumber, "all"));
        } catch {
          // Skip shards that fail to download.
        }
      }),
    );
  }

  const questions: PracticeQuestion[] = [];
  const seen = new Set<string>();

  for (const position of shuffle(positions)) {
    if (questions.length >= limit) break;

    const shard = shards.get(`${position.subject}:${position.shard}`);
    const question = shard?.[position.offset];

    if (!question || seen.has(question.id)) continue;
    if (!isUsablePracticeQuestion(question)) continue;
    if (!matchesExplanationFilter(question, filters)) continue;

    seen.add(question.id);
    questions.push(toPracticeQuestion(question, position.subject));
  }

  if (questions.length === 0 && indexedSubjects === 0) {
    const fallback = await loadFallbackQuestions(scope, limit, filters);
    return { questions: fallback, available: fallback.length };
  }

  return { questions: shuffle(questions), available };
}
