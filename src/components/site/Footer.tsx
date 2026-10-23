import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

const footerSubjects = [
  { slug: "physics", name: "Physics" },
  { slug: "chemistry", name: "Chemistry" },
  { slug: "biology", name: "Biology" },
  { slug: "mathematics", name: "Mathematics" },
  { slug: "ict", name: "ICT" },
  { slug: "other", name: "Other" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2" aria-label="Question Bank home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Question<span className="text-primary">Bank</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A curated question bank for students — practice subject-wise questions across Physics,
            Chemistry, Biology, Mathematics, ICT and more.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Pages</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/" className="text-muted-foreground transition-colors hover:text-primary">Home</Link></li>
            <li><Link href="/subjects" className="text-muted-foreground transition-colors hover:text-primary">Subjects</Link></li>
            <li><Link href="/plans" className="text-muted-foreground transition-colors hover:text-primary">Plans</Link></li>
            <li><Link href="/login" className="text-muted-foreground transition-colors hover:text-primary">Log in</Link></li>
            <li><Link href="/register" className="text-muted-foreground transition-colors hover:text-primary">Register</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Subjects</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {footerSubjects.map((subject) => (
              <li key={subject.slug}>
                <Link
                  href={`/questions?subject=${subject.slug}`}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {subject.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} QuestionBank — question data served from Supabase Storage.
        </p>
      </div>
    </footer>
  );
}
