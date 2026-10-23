import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { isCurrentUserAdmin } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Admin sign in — QuestionBank",
  description: "Sign in to the QuestionBank admin dashboard.",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isCurrentUserAdmin()) {
    redirect("/admin/dashboard");
  }

  return <AdminLoginForm />;
}
