import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register — QuestionBank",
  description: "Create a free QuestionBank account and start practising today.",
  openGraph: {
    title: "Register — QuestionBank",
    description: "Create a free QuestionBank account and start practising today.",
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
