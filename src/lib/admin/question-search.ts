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

export async function findQuestionById(
  rawQuery: string,
  preferredSubject = "physics"
): Promise<{ question: StorageQuestion; subject: string; shardNumber: number } | null> {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;

  // Check if query is formatted like "p-399548"
  const prefixMatch = query.match(/^([a-z])-(\d+)$/);
  let targetSubject = preferredSubject;
  let targetId = query;
  let numericId: number | null = null;

  if (prefixMatch && prefixMatch[1] && prefixMatch[2]) {
    const prefix = prefixMatch[1];
    targetSubject = PREFIX_SUBJECT_MAP[prefix] || preferredSubject;
    targetId = `${prefix}-${prefixMatch[2]}`;
    numericId = parseInt(prefixMatch[2], 10);
  } else if (/^\d+$/.test(query)) {
    numericId = parseInt(query, 10);
  }

  const manifest = await getQuestionManifest().catch(() => null);
  const subjectsToSearch = targetSubject
    ? [targetSubject, ...(manifest?.subjects.map((s) => s.slug).filter((s) => s !== targetSubject) || [])]
    : manifest?.subjects.map((s) => s.slug) || ["physics"];

  for (const subject of subjectsToSearch) {
    const subjectInfo = manifest?.subjects.find((s) => s.slug === subject);
    const maxShards = subjectInfo?.shards?.all ?? 30;

    // Check up to 50 shards or all available shards
    const limit = Math.min(maxShards, 100);
    for (let shardNum = 1; shardNum <= limit; shardNum++) {
      try {
        const shard = await getQuestionShard(subject, shardNum, "all");
        const found = shard.find((q) => {
          if (q.id.toLowerCase() === targetId) return true;
          if (numericId !== null && (q.external_id === numericId || q.id.toLowerCase().endsWith(`-${numericId}`))) return true;
          return false;
        });

        if (found) {
          return {
            question: { ...found, _shard: shardNum },
            subject,
            shardNumber: shardNum,
          };
        }
      } catch {
        // Continue to next shard
        continue;
      }
    }
  }

  return null;
}
