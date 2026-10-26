import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  const title = tr("Log in — QuestionBank", "লগইন — QuestionBank");
  const description = tr(
    "Log in to your QuestionBank account to continue practising.",
    "অনুশীলন চালিয়ে যেতে আপনার QuestionBank অ্যাকাউন্টে লগইন করুন।",
  );
  return { title, description, openGraph: { title, description } };
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
