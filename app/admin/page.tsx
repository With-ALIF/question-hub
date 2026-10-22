import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard — QuestionBank",
  description: "Admin overview of questions, users, subjects and subscriptions.",
  openGraph: {
    title: "Admin Dashboard — QuestionBank",
    description: "Admin overview of questions, users, subjects and subscriptions.",
  },
};

export default async function AdminPage() {
  const { data, error } = await getAdminDashboardData();

  return <AdminDashboard data={data} error={error} />;
}
