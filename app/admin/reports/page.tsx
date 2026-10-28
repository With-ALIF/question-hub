import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminReportsView } from "@/components/admin/report/AdminReportsView";
import { getCurrentRole } from "@/lib/auth/roles";
import { getPendingReports } from "@/lib/reports/admin-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports Management — Admin QuestionBank",
  description: "View and resolve question error reports from students.",
};

export default async function AdminReportsPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const reports = await getPendingReports();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/reports" role={role} />
      <main className="flex-1 w-full min-w-0 p-4 pb-32 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">
        <div className="mx-auto max-w-5xl">
          <AdminReportsView initialReports={reports} role={role} />
        </div>
      </main>
    </div>
  );
}
