import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSubscriptionsView } from "@/components/admin/AdminSubscriptionsView";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentRole } from "@/lib/auth/roles";
import { getAdminOrders, getAdminSubscriptions } from "@/lib/payments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paid Subscriptions — Admin QuestionBank",
  description: "View and manage all paid subscriber plans, running status and cancellations.",
};

export default async function AdminSubscriptionsPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const [subscriptions, orders] = await Promise.all([
    getAdminSubscriptions(),
    getAdminOrders(),
  ]);
  const pendingOrderCount = orders.filter((order) => order.status === "pending").length;

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/subscriptions" role={role} />
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <AdminSubscriptionsView
            initialSubscriptions={subscriptions}
            pendingOrderCount={pendingOrderCount}
          />
        </div>
      </main>
    </div>
  );
}

