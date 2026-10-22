import type { Metadata } from "next";

import { HomePage } from "@/components/site/HomePage";

export const metadata: Metadata = {
  title: "QuestionBank — Practice Questions for Every Subject",
  description:
    "Search chapter-wise questions across Physics, Chemistry, Biology, Mathematics and ICT. Browse subjects and pick a plan.",
  openGraph: {
    title: "QuestionBank — Practice Questions for Every Subject",
    description:
      "Search chapter-wise questions across Physics, Chemistry, Biology, Mathematics and ICT.",
  },
};

export default function Page() {
  return <HomePage />;
}
