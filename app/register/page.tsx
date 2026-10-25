import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  const title = tr("Register — QuestionBank", "রেজিস্ট্রেশন — QuestionBank");
  const description = tr(
    "Create a free QuestionBank account and start practising today.",
    "ফ্রি QuestionBank অ্যাকাউন্ট তৈরি করুন এবং আজই অনুশীলন শুরু করুন।",
  );
  return { title, description, openGraph: { title, description } };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
