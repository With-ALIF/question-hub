import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { tr } = await getI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {tr("Page not found", "পেজটি পাওয়া যায়নি")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr(
            "The page you're looking for doesn't exist or has been moved.",
            "আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে।",
          )}
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("Go home", "হোমে ফিরে যান")}
          </Link>
        </div>
      </div>
    </div>
  );
}
