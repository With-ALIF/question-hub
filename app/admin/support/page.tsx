import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSupportView } from "@/components/admin/AdminSupportView";
import { getCurrentRole } from "@/lib/auth/roles";
import { getAdminTickets } from "@/lib/tickets/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Tickets — Admin QuestionBank",
  description: "Read user support tickets, reply to them and track their status.",
};

export default async function AdminSupportPage() {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const tickets = await getAdminTickets();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/support" role={role} />
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <AdminSupportView initialTickets={tickets} />
        </div>
      </main>
    </div>
  );
}
