import "server-only";

import { getQuestionManifest, getQuestionShard, type StorageQuestion } from "@/lib/questions/storage";

type SearchResult = { question: StorageQuestion; subject: string; shardNumber: number };
const qCache = new Map<string, SearchResult>();

export function updateSearchCache(question: StorageQuestion, subject: string, shardNumber: number) {
  const item = { question, subject, shardNumber };
  qCache.set(question.id.toLowerCase(), item);
  if (question.external_id) qCache.set(String(question.external_id), item);
  const numMatch = question.id.match(/(\d+)/);
  if (numMatch && numMatch[1]) qCache.set(numMatch[1], item);
}

export function invalidateSearchCache(questionId?: string) {
  if (questionId) {
    qCache.delete(questionId.toLowerCase());
    const num = questionId.match(/(\d+)/);
    if (num && num[1]) qCache.delete(num[1]);
  } else {
    qCache.clear();
  }
}

const ALL_SUBJECTS = ["physics", "chemistry", "mathematics", "biology", "ict", "other"];

function normalizeMathText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\\theta/g, "θ")
    .replace(/\\sqrt\{(\d+)\}/g, "√$1")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2")
    .replace(/\\cdot/g, "*")
    .replace(/\s+/g, " ")
    .trim();
}

function inferSubjectOrder(rawQuery: string, preferredSubject?: string): string[] {
  if (preferredSubject && ALL_SUBJECTS.includes(preferredSubject)) {
    return [preferredSubject, ...ALL_SUBJECTS.filter((s) => s !== preferredSubject)];
  }

  const q = rawQuery.toLowerCase();
  const isMath = /sin|cos|tan|cot|sec|cosec|θ|theta|√|sqrt|lim|dx|matrix|ম্যাট্রিক্স|ফাংশন|ত্রিকোণমিতি|সমীকরণ|লগ|অন্তরীকরণ|যোগজীকরণ|সরলরেখা|বৃত্ত|কনিক|জ্যামিতি|সমাকলন/.test(q);
  const isPhysics = /তড়িৎ|গতিবিদ্যা|মহাকর্ষ|তরঙ্গ|আলো|ভেক্টর|বলবিদ্যা|পর্যায়বৃত্ত|তড়িৎচুম্বক|আধুনিক পদার্থ|ইলেকট্রনিক্স|তাপগতিবিদ্যা|কাজ.*শক্তি/.test(q);
  const isChem = /বিক্রিয়া|পরমাণু|মোল|ক্ষার|এসিড|জৈব|অক্সিজেন|হাইড্রোজেন|রাসায়নিক|বন্ধন|জারণ|বিজারণ|পর্যায় সারণি|দ্রবণ|ইলেকট্রন বিন্যাস/.test(q);
  const isBio = /কোষ|ডিএনএ|জিন|উদ্ভিদ|প্রাণী|রক্ত|হৃদপিণ্ড|হরমোন|অণুজীব|টিস্যু|শ্বসন|প্রস্বেদন|মাইটোটিক|মায়োসিস/.test(q);

  let ordered = [...ALL_SUBJECTS];
  if (isMath) {
    ordered = ["mathematics", "physics", "chemistry", "biology", "ict", "other"];
  } else if (isPhysics) {
    ordered = ["physics", "mathematics", "chemistry", "biology", "ict", "other"];
  } else if (isChem) {
    ordered = ["chemistry", "biology", "physics", "mathematics", "ict", "other"];
  } else if (isBio) {
    ordered = ["biology", "chemistry", "physics", "mathematics", "ict", "other"];
  }
  return ordered;
}

export function isLikelyId(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(q)) return true;
  if (/^(?:p-)?\d{3,8}$/.test(q)) return true;
  return false;
}

export async function findQuestionById(
  rawQuery: string,
  preferredSubject?: string,
  skipCache = false
): Promise<SearchResult | null> {
  const query = rawQuery.trim().toLowerCase();
  if (!query || !isLikelyId(query)) return null;

  const numMatch = query.match(/(\d+)/);
  const numericId = numMatch ? numMatch[1] : null;

  if (!skipCache) {
    const cached = qCache.get(query);
    if (cached) return cached;
    if (numericId && qCache.has(numericId)) return qCache.get(numericId)!;
  }

  const manifest = await getQuestionManifest().catch(() => null);
  const subjects = inferSubjectOrder(rawQuery, preferredSubject);

  const BATCH_RANGES = [
    { start: 1, count: 10 },
    { start: 11, count: 20 },
    { start: 31, count: 30 },
  ];

  for (const range of BATCH_RANGES) {
    await Promise.all(
      subjects.flatMap((sub) => {
        const subInfo = manifest?.subjects.find((s) => s.slug === sub);
        const maxShards = subInfo?.shards?.all ?? 30;
        if (range.start > maxShards) return [];

        const limit = Math.min(range.count, maxShards - range.start + 1);
        return Array.from({ length: limit }, (_, i) => range.start + i).map(async (sNum) => {
          try {
            const shard = await getQuestionShard(sub, sNum, "all");
            for (const q of shard) {
              const item = { question: { ...q, _shard: sNum }, subject: sub, shardNumber: sNum };
              qCache.set(q.id.toLowerCase(), item);
              if (q.external_id) qCache.set(String(q.external_id), item);
            }
          } catch {}
        });
      })
    );

    const found = qCache.get(query) || (numericId ? qCache.get(numericId) : null);
    if (found) return found;
  }

  return null;
}

export async function searchQuestions(
  rawQuery: string,
  preferredSubject?: string,
  limit: number = 50
): Promise<{ questions: StorageQuestion[]; totalFound: number }> {
  const query = rawQuery.trim();
  if (!query) return { questions: [], totalFound: 0 };

  const foundMap = new Map<string, StorageQuestion>();

  // 1. Direct ID match first (ONLY if query is formatted like an ID)
  if (isLikelyId(query)) {
    const idResult = await findQuestionById(query, preferredSubject);
    if (idResult) {
      return {
        questions: [idResult.question],
        totalFound: 1,
      };
    }
  }

  const manifest = await getQuestionManifest().catch(() => null);
  const subjects = inferSubjectOrder(rawQuery, preferredSubject);

  const cleanQuery = normalizeMathText(query);
  const queryWords = cleanQuery
    .replace(/[#?.,!]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const checkQuestionMatch = (q: StorageQuestion, sub: string, sNum: number) => {
    if (foundMap.has(q.id)) return;

    const qText = normalizeMathText(q.question_text || "");
    const qHtml = normalizeMathText(q.question_html || "");
    const qKeyword = normalizeMathText(q.keyword || "");
    const qTopic = normalizeMathText(q.topic_code || "");
    const qInst = normalizeMathText(q.institution || "");
    const qId = q.id.toLowerCase();
    const extId = q.external_id ? String(q.external_id) : "";

    const matchesFull =
      qText.includes(cleanQuery) ||
      qHtml.includes(cleanQuery) ||
      qKeyword.includes(cleanQuery) ||
      qTopic.includes(cleanQuery) ||
      qInst.includes(cleanQuery) ||
      qId.includes(cleanQuery) ||
      extId.includes(cleanQuery);

    const matchesAllWords =
      queryWords.length > 1 &&
      queryWords.every(
        (word) =>
          qText.includes(word) ||
          qHtml.includes(word) ||
          qKeyword.includes(word)
      );

    if (matchesFull || matchesAllWords) {
      foundMap.set(q.id, {
        ...q,
        subject: sub,
        _shard: sNum,
      });
    }
  };

  // Stage 1: Fast scan of primary subject's top shards (shards 1-10) in parallel
  const primarySubject = subjects[0] ?? "physics";
  const primaryInfo = manifest?.subjects.find((s) => s.slug === primarySubject);
  const primaryMaxShards = primaryInfo?.shards?.all ?? 30;

  const stage1Shards = Array.from(
    { length: Math.min(10, primaryMaxShards) },
    (_, i) => i + 1
  );

  await Promise.all(
    stage1Shards.map(async (sNum) => {
      try {
        const shard = await getQuestionShard(primarySubject, sNum, "all");
        for (const q of shard) {
          checkQuestionMatch(q, primarySubject, sNum);
        }
      } catch {}
    })
  );

  // If Stage 1 found results, return immediately (sub-second response!)
  if (foundMap.size > 0) {
    const results = Array.from(foundMap.values());
    return { questions: results, totalFound: results.length };
  }

  // Stage 2: Scan shards 11-30 of primary subject AND shards 1-5 of other subjects in parallel
  const stage2Tasks: Promise<void>[] = [];

  if (primaryMaxShards > 10) {
    const count = Math.min(20, primaryMaxShards - 10);
    const primaryStage2Shards = Array.from({ length: count }, (_, i) => 11 + i);
    for (const sNum of primaryStage2Shards) {
      stage2Tasks.push(
        getQuestionShard(primarySubject, sNum, "all")
          .then((shard) => {
            for (const q of shard) checkQuestionMatch(q, primarySubject, sNum);
          })
          .catch(() => {})
      );
    }
  }

  for (const otherSub of subjects.slice(1)) {
    const otherInfo = manifest?.subjects.find((s) => s.slug === otherSub);
    const otherMax = Math.min(5, otherInfo?.shards?.all ?? 5);
    for (let sNum = 1; sNum <= otherMax; sNum++) {
      stage2Tasks.push(
        getQuestionShard(otherSub, sNum, "all")
          .then((shard) => {
            for (const q of shard) checkQuestionMatch(q, otherSub, sNum);
          })
          .catch(() => {})
      );
    }
  }

  await Promise.all(stage2Tasks);

  if (foundMap.size > 0) {
    const results = Array.from(foundMap.values());
    return { questions: results, totalFound: results.length };
  }

  // Stage 3: Scan shards 31 to 60 of primary subject
  if (primaryMaxShards > 30) {
    const count = Math.min(30, primaryMaxShards - 30);
    const stage3Shards = Array.from({ length: count }, (_, i) => 31 + i);
    await Promise.all(
      stage3Shards.map(async (sNum) => {
        try {
          const shard = await getQuestionShard(primarySubject, sNum, "all");
          for (const q of shard) checkQuestionMatch(q, primarySubject, sNum);
        } catch {}
      })
    );
  }

  const results = Array.from(foundMap.values());
  return {
    questions: results,
    totalFound: results.length,
  };
}
