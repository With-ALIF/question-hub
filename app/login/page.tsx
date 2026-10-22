import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — QuestionBank",
  description: "Log in to your QuestionBank account to continue practising.",
  openGraph: {
    title: "Log in — QuestionBank",
    description: "Log in to your QuestionBank account to continue practising.",
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
