import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { getCurrentRole } from "@/lib/auth/roles";
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

export default async function AdminDashboardPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const { data, error } = await getAdminDashboardData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm font-medium text-foreground">Admin dashboard</p>
          <AdminSignOutButton role={role} />
        </div>
      </header>
      <main className="flex-1">
        <AdminDashboard data={data} error={error} />
      </main>
    </div>
  );
}
