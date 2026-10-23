import "server-only";

import {
  SUBJECT_PRESENTATION,
  normalizeAccent,
  normalizeIcon,
  type Subject,
} from "@/data/subjects";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getQuestionManifest } from "./storage";

function presentationFor(slug: string) {
  return SUBJECT_PRESENTATION[slug] ?? { icon: "book" as const, accent: "chart-1" as const };
}

/**
 * Builds the subject list the public pages render.
 *
 * Metadata (name, tagline, icon, accent, chapters) is read from
 * `qb_subjects`/`qb_chapters`; question counts are read from the Storage
 * manifest, which is the source of truth for question volume. Subjects that
 * exist only in the manifest — currently `other` — are appended with their real
 * counts and no invented tagline or chapters.
 *
 * Every source is allowed to fail independently: a missing manifest leaves
 * zero counts, a missing database leaves manifest-only subjects, and total
 * failure returns an empty list rather than fabricated rows.
 */
export async function getSubjects(): Promise<Subject[]> {
  let rows: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    icon: string | null;
    accent: string | null;
  }[] = [];

  let chapterRows: { subject_id: string; name: string; sort_order: number }[] = [];

  try {
    const supabase = createSupabaseAdminClient();
    const [subjectsResult, chaptersResult] = await Promise.all([
      supabase
        .from("qb_subjects")
        .select("id, slug, name, tagline, icon, accent, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("qb_chapters")
        .select("subject_id, name, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (subjectsResult.error) throw subjectsResult.error;
    if (chaptersResult.error) throw chaptersResult.error;

    rows = subjectsResult.data ?? [];
    chapterRows = chaptersResult.data ?? [];
  } catch {
    // Database unavailable — fall back to whatever the manifest knows.
    rows = [];
    chapterRows = [];
  }

  const manifest = await getQuestionManifest().catch(() => null);
  const counts = new Map(
    (manifest?.subjects ?? []).map((subject) => [subject.slug, subject.total]),
  );

  const chaptersBySubject = new Map<string, string[]>();
  for (const chapter of chapterRows) {
    const list = chaptersBySubject.get(chapter.subject_id) ?? [];
    list.push(chapter.name);
    chaptersBySubject.set(chapter.subject_id, list);
  }

  const subjects: Subject[] = rows.map((row) => {
    const fallback = presentationFor(row.slug);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline ?? "",
      icon: normalizeIcon(row.icon, fallback.icon),
      accent: normalizeAccent(row.accent, fallback.accent),
      chapters: chaptersBySubject.get(row.id) ?? [],
      questionCount: counts.get(row.slug) ?? 0,
    };
  });

  const known = new Set(subjects.map((subject) => subject.slug));
  for (const subject of manifest?.subjects ?? []) {
    if (known.has(subject.slug)) continue;

    const fallback = presentationFor(subject.slug);
    subjects.push({
      id: subject.slug,
      slug: subject.slug,
      name: subject.name,
      tagline: "",
      icon: fallback.icon,
      accent: fallback.accent,
      chapters: [],
      questionCount: subject.total,
    });
  }

  return subjects;
}
