import type { Metadata, Viewport } from "next";

import "./globals.css";
import "katex/dist/katex.min.css";

import { LanguageProvider } from "@/lib/i18n/client";
import { getI18n, getLanguage } from "@/lib/i18n/server";
import { localeForLanguage } from "@/lib/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  const title = tr(
    "QuestionBank — Practice Questions for Every Subject",
    "QuestionBank — সব বিষয়ের প্রশ্ন অনুশীলন",
  );
  const description = tr(
    "Chapter-wise question bank for Physics, Chemistry, Biology, Mathematics and ICT.",
    "পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত ও আইসিটির অধ্যায়ভিত্তিক প্রশ্ন ব্যাংক।",
  );

  return {
    title,
    description,
    authors: [{ name: "QuestionBank" }],
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: "/favicon.ico",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: localeForLanguage(await getLanguage()),
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLanguage();

  return (
    <html lang={lang}>
      <head>
        <link
          rel="preload"
          href="/fonts/solaiman-lipi-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LanguageProvider initialLanguage={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
