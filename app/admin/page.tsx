import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — QuestionBank",
  description: "QuestionBank administration.",
};

export default async function AdminIndexPage() {
  const role = await getCurrentRole();

  redirect(role ? "/admin/dashboard" : "/admin/login");
}
