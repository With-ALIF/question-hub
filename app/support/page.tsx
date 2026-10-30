import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { getEntitlement } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyTickets } from "@/lib/tickets/queries";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return {
    title: tr("Support — QuestionBank", "সাপোর্ট — QuestionBank"),
    description: tr(
      "Report a payment, account, question or technical problem and get a reply from the admin.",
      "পেমেন্ট, অ্যাকাউন্ট, প্রশ্ন বা টেকনিক্যাল সমস্যা জানান — এডমিন থেকে উত্তর পাবেন।",
    ),
  };
}

export default async function SupportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ tr }, entitlement, tickets] = await Promise.all([
    getI18n(),
    getEntitlement(user.id),
    getMyTickets(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} audience={entitlement.audience} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="border-b border-border/60 pb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {tr("Help & support", "সাহায্য ও সাপোর্ট")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr(
                "Tell us what went wrong — payment, plan, account, question or anything else. Every ticket reaches the admin instantly.",
                "পেমেন্ট, প্ল্যান, অ্যাকাউন্ট, প্রশ্ন বা যেকোনো সমস্যা জানান। প্রতিটি টিকিট সাথে সাথে এডমিনের কাছে পৌঁছায়।",
              )}
            </p>
          </div>

          <div className="mt-6">
            <SupportTicketForm />
          </div>

          <section className="mt-10">
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              {tr("Your tickets", "আপনার টিকিটসমূহ")}
            </h2>
            <div className="mt-4">
              <SupportTicketList tickets={tickets} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
