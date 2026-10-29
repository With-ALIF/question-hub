import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminPlansView } from "@/components/admin/AdminPlansView";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentRole } from "@/lib/auth/roles";
import { getAdminPlanConfigs } from "@/lib/payments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plans & Limits — Admin QuestionBank",
  description: "Configure plan features, subject access, daily limits and custom access.",
};

export default async function AdminPlansPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const plans = await getAdminPlanConfigs();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/plans" role={role} />
      <main className="w-full min-w-0 flex-1 p-4 pb-32 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">
        <div className="mx-auto max-w-6xl">
          <AdminPlansView initialPlans={plans} />
        </div>
      </main>
    </div>
  );
}
