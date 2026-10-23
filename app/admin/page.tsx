import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — QuestionBank",
  description: "QuestionBank administration.",
};

/**
 * `/admin` is a forwarding route only: the dashboard lives at
 * `/admin/dashboard` behind the role guard, and everyone else is sent to the
 * admin sign-in screen. Keeping the data fetching out of this file means there
 * is no unprotected path into the admin aggregates.
 */
export default async function AdminIndexPage() {
  const role = await getCurrentRole();

  redirect(role ? "/admin/dashboard" : "/admin/login");
}
