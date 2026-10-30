import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminUsersView } from "@/components/admin/AdminUsersView";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentRole } from "@/lib/auth/roles";
import { getAdminSubscriberUsers } from "@/lib/payments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Users — Admin QuestionBank",
  description: "View all users who have signed in, their profiles and current plans.",
};

export default async function AdminUsersPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const users = await getAdminSubscriberUsers();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/users" role={role} />
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <AdminUsersView initialUsers={users} />
        </div>
      </main>
    </div>
  );
}

