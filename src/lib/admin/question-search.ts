import "server-only";

import { getQuestionManifest, getQuestionShard, type StorageQuestion } from "@/lib/questions/storage";

const PREFIX_SUBJECT_MAP: Record<string, string> = {
  p: "physics",
  c: "chemistry",
  b: "biology",
  m: "mathematics",
  i: "ict",
  o: "other",
};

type SearchResult = { question: StorageQuestion; subject: string; shardNumber: number };
const qCache = new Map<string, SearchResult>();

export async function findQuestionById(
  rawQuery: string,
  preferredSubject = "physics"
): Promise<SearchResult | null> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;

  // Check in-memory cache first (O(1))
  const direct = qCache.get(query);
  if (direct) return direct;

  const prefixMatch = query.match(/^([a-z])-(\d+)$/);
  let targetSubject: string | null = null;
  let targetId = query;
  let numericId: number | null = null;

  if (prefixMatch && prefixMatch[1] && prefixMatch[2]) {
    const p = prefixMatch[1];
    targetSubject = PREFIX_SUBJECT_MAP[p] || null;
    targetId = `${p}-${prefixMatch[2]}`;
    numericId = parseInt(prefixMatch[2], 10);
  } else if (/^\d+$/.test(query)) {
    numericId = parseInt(query, 10);
  }

  if (numericId && qCache.has(String(numericId))) {
    return qCache.get(String(numericId))!;
  }

  const manifest = await getQuestionManifest().catch(() => null);
  // If prefix is known (e.g. p-), ONLY search that subject
  const subjectsToSearch = targetSubject
    ? [targetSubject]
    : [preferredSubject, ...(manifest?.subjects.map((s) => s.slug).filter((s) => s !== preferredSubject) || [])];

  const BATCH_SIZE = 20;

  for (const subject of subjectsToSearch) {
    const subjectInfo = manifest?.subjects.find((s) => s.slug === subject);
    const maxShards = subjectInfo?.shards?.all ?? 30;

    for (let start = 1; start <= maxShards; start += BATCH_SIZE) {
      const batchNums = Array.from(
        { length: Math.min(BATCH_SIZE, maxShards - start + 1) },
        (_, i) => start + i
      );

      await Promise.all(
        batchNums.map(async (sNum) => {
          try {
            const shard = await getQuestionShard(subject, sNum, "all");
            for (const q of shard) {
              const item = { question: { ...q, _shard: sNum }, subject, shardNumber: sNum };
              qCache.set(q.id.toLowerCase(), item);
              if (q.external_id) qCache.set(String(q.external_id), item);
            }
          } catch {
            // Shard load failed or skipped
          }
        })
      );

      const found = qCache.get(targetId) || (numericId ? qCache.get(String(numericId)) : null);
      if (found) return found;
    }
  }

  return null;
}
