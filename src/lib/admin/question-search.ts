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

export async function findQuestionById(
  rawQuery: string,
  preferredSubject?: string,
  skipCache = false
): Promise<SearchResult | null> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;

  const numMatch = query.match(/(\d+)/);
  const numericId = numMatch ? numMatch[1] : null;

  if (!skipCache) {
    const cached = qCache.get(query);
    if (cached) return cached;
    if (numericId && qCache.has(numericId)) return qCache.get(numericId)!;
  }

  const manifest = await getQuestionManifest().catch(() => null);
  const subjects = preferredSubject && ALL_SUBJECTS.includes(preferredSubject)
    ? [preferredSubject, ...ALL_SUBJECTS.filter((s) => s !== preferredSubject)]
    : ALL_SUBJECTS;

  const BATCH_RANGES = [
    { start: 1, count: 10 },
    { start: 11, count: 15 },
    { start: 26, count: 25 },
    { start: 51, count: 50 },
    { start: 101, count: 100 },
    { start: 201, count: 150 },
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
          } catch {
          }
        });
      })
    );

    const found = qCache.get(query) || (numericId ? qCache.get(numericId) : null);
    if (found) return found;
  }

  return null;
}
