import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminPlansView } from "@/components/admin/AdminPlansView";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentRole } from "@/lib/auth/roles";
import { getAdminPlanConfigs, getGrantableUsers } from "@/lib/payments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plans & Limits — Admin QuestionBank",
  description: "Configure plan features, model-test limits and custom access.",
};

export default async function AdminPlansPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const [plans, grantableUsers] = await Promise.all([
    getAdminPlanConfigs(),
    getGrantableUsers(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/plans" role={role} />
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <AdminPlansView initialPlans={plans} grantableUsers={grantableUsers} />
        </div>
      </main>
    </div>
  );
}
