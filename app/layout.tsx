import type { Metadata, Viewport } from "next";

import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "QuestionBank — Practice Questions for Every Subject",
  description:
    "Chapter-wise question bank for Physics, Chemistry, Biology, Mathematics and ICT.",
  authors: [{ name: "QuestionBank" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "QuestionBank — Practice Questions for Every Subject",
    description:
      "Chapter-wise question bank for Physics, Chemistry, Biology, Mathematics and ICT.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/solaiman-lipi-regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
