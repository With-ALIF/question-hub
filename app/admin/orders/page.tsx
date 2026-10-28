import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminOrdersView } from "@/components/admin/AdminOrdersView";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentRole } from "@/lib/auth/roles";
import { getAdminOrders } from "@/lib/payments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payments — Admin QuestionBank",
  description: "Review bKash and Nagad manual payments and activate subscriptions.",
};

export default async function AdminOrdersPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const orders = await getAdminOrders();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/orders" role={role} />
      <main className="w-full min-w-0 flex-1 p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
        <div className="mx-auto max-w-5xl">
          <AdminOrdersView initialOrders={orders} />
        </div>
      </main>
    </div>
  );
}
