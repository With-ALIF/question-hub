import "server-only";

import { compareChapterCodes, getChapterName } from "@/data/chapters";
import { getPaperName, SUBJECT_PAPERS } from "@/data/papers";

import { getQuestionFilterIndex, type QuestionFilterIndex } from "./filters";

const CHAPTER_COLUMN = 4;
const TOPIC_COLUMN = 5;
const IS_MCQ_COLUMN = 6;
const MAX_TOPICS_PER_CHAPTER = 12;

// Author names and source tags that leak into the topic column of the index.
const TOPIC_NOISE = new Set([
  "pramanik",
  "ishaque",
  "tapan",
  "kabir",
  "guho",
  "hazari",
  "majeda",
  "azibur",
  "hasan",
  "alim",
  "parven",
  "azmol",
  "ashim",
  "ketab",
  "su",
]);

export type OutlineTopic = {
  name: string;
  count: number;
};

export type OutlineChapter = {
  code: string;
  name: string;
  total: number;
  mcq: number;
  written: number;
  topics: OutlineTopic[];
};

export type OutlinePaper = {
  code: string;
  name: string;
  chapters: OutlineChapter[];
};

export type SubjectOutline = {
  slug: string;
  papers: OutlinePaper[];
  chapters: OutlineChapter[];
  total: number;
  mcq: number;
  written: number;
};

type ChapterBucket = {
  code: string;
  name: string;
  total: number;
  mcq: number;
  written: number;
  topics: Map<string, number>;
};

function cleanTopic(value: string | undefined): string | null {
  if (!value) return null;

  const text = value.trim().replace(/^"+|"+$/g, "").trim();
  if (text.length < 2) return null;
  if (/^[\d\s.,+/\-–—]+$/.test(text)) return null;
  if (TOPIC_NOISE.has(text.toLowerCase())) return null;

  if (!/[\u0980-\u09FF]/.test(text)) {
    const words = text.split(/\s+/).filter(Boolean);
    // Single Latin tokens are author names or codes, not topics.
    if (words.length < 2) return null;
    if (words.every((word) => /^[A-Za-z0-9\-.]+$/.test(word)) && /\d/.test(text)) {
      return null;
    }
  }

  return text;
}

function chapterNameFor(code: string, slug: string): string | null {
  const known = getChapterName(code);
  if (known) return known;
  if (slug !== "other") return null;

  const text = code.trim().replace(/^"+|"+$/g, "");
  if (text.length < 2) return null;
  if (/^[\d\s.,+/\-–—]+$/.test(text)) return null;
  if (/^[A-Za-z]+[-._]?\d+$/i.test(text)) return null;

  return text;
}

function paperCodeFor(code: string): string {
  const numbered = code.match(/^([A-Za-z]+)-(\d+)\.\d/);
  if (numbered) return `${numbered[1]!.toUpperCase()}-${numbered[2]!}`;

  if (/^ICT-\d+$/i.test(code)) return "ICT";

  const single = code.match(/^([A-Za-z]+)-\d+$/);
  if (single) return single[1]!.toUpperCase();

  return "OTHER";
}

function allowedDbCells(
  index: QuestionFilterIndex,
  codes: readonly string[] | null | undefined,
): ReadonlySet<number> | undefined {
  if (codes === null || codes === undefined) return undefined;

  const cells = new Set<number>();
  for (const code of codes) {
    const cell = index.dict.db.indexOf(code);
    if (cell >= 0) cells.add(cell);
  }

  return cells;
}

function sortChapters(chapters: OutlineChapter[]): OutlineChapter[] {
  return [...chapters].sort((a, b) => compareChapterCodes(a.code, b.code));
}

function buildPapers(
  slug: string,
  chapters: OutlineChapter[],
): OutlinePaper[] {
  if (slug === "other") {
    return chapters.length > 0
      ? [{ code: "all", name: "সব অধ্যায়", chapters }]
      : [];
  }

  const grouped = new Map<string, OutlineChapter[]>();
  for (const chapter of chapters) {
    const paperCode = paperCodeFor(chapter.code);
    const list = grouped.get(paperCode) ?? [];
    list.push(chapter);
    grouped.set(paperCode, list);
  }

  const order = SUBJECT_PAPERS[slug] ?? [];
  const paperCodes = [
    ...order.filter((code) => grouped.has(code)),
    ...Array.from(grouped.keys()).filter((code) => !order.includes(code)),
  ];

  return paperCodes.map((code) => ({
    code,
    name: code === "OTHER" ? "অন্যান্য" : (getPaperName(code) ?? code),
    chapters: sortChapters(grouped.get(code) ?? []),
  }));
}

function buildOutline(
  index: QuestionFilterIndex,
  slug: string,
  allowedDbCodes: readonly string[] | null | undefined,
): SubjectOutline {
  const dbCells = allowedDbCells(index, allowedDbCodes);
  const buckets = new Map<string, ChapterBucket>();

  for (const row of index.rows) {
    if (!row) continue;
    if (dbCells && !dbCells.has(row[0] ?? -1)) continue;

    const code = index.dict.chapter[row[CHAPTER_COLUMN] ?? -1] ?? "";
    const name = chapterNameFor(code, slug);
    if (!name) continue;

    let bucket = buckets.get(code);
    if (!bucket) {
      bucket = { code, name, total: 0, mcq: 0, written: 0, topics: new Map() };
      buckets.set(code, bucket);
    }

    const isMcq = row[IS_MCQ_COLUMN] === 1;
    bucket.total += 1;
    if (isMcq) bucket.mcq += 1;
    else bucket.written += 1;

    const topic = cleanTopic(index.dict.topic[row[TOPIC_COLUMN] ?? -1]);
    if (topic) bucket.topics.set(topic, (bucket.topics.get(topic) ?? 0) + 1);
  }

  if (buckets.size === 0) {
    // No rows for the allowed database — still list the syllabus.
    for (const code of index.dict.chapter) {
      const name = chapterNameFor(code, slug);
      if (!name) continue;
      buckets.set(code, { code, name, total: 0, mcq: 0, written: 0, topics: new Map() });
    }
  }

  const chapters = sortChapters(
    Array.from(buckets.values()).map((bucket) => ({
      code: bucket.code,
      name: bucket.name,
      total: bucket.total,
      mcq: bucket.mcq,
      written: bucket.written,
      topics: Array.from(bucket.topics.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, MAX_TOPICS_PER_CHAPTER),
    })),
  );

  return {
    slug,
    papers: buildPapers(slug, chapters),
    chapters,
    total: chapters.reduce((sum, chapter) => sum + chapter.total, 0),
    mcq: chapters.reduce((sum, chapter) => sum + chapter.mcq, 0),
    written: chapters.reduce((sum, chapter) => sum + chapter.written, 0),
  };
}

const outlineCache = new Map<string, Promise<SubjectOutline | null>>();

export function getSubjectOutline(
  slug: string,
  allowedDbCodes?: readonly string[] | null,
): Promise<SubjectOutline | null> {
  const key = `${slug}:${
    allowedDbCodes === null || allowedDbCodes === undefined
      ? "*"
      : [...allowedDbCodes].sort().join(",")
  }`;

  const cached = outlineCache.get(key);
  if (cached) return cached;

  const pending = (async () => {
    const index = await getQuestionFilterIndex(slug);
    if (!index) return null;
    return buildOutline(index, slug, allowedDbCodes);
  })();

  outlineCache.set(key, pending);
  return pending;
}
