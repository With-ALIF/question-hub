import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getCurrentRole } from "@/lib/auth/roles";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard — QuestionBank",
  description: "Admin overview of questions, users, subjects and subscriptions.",
};

export default async function AdminDashboardPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const { data, error } = await getAdminDashboardData();

  return <AdminDashboard data={data} error={error} role={role} />;
}
