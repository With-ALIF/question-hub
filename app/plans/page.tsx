import type { Metadata } from "next";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PricingTabs } from "@/components/site/PricingTabs";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyPendingOrder } from "@/lib/payments/queries";
import { getPaymentNumbers } from "@/lib/payments/server";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  const title = tr(
    "Student & Teacher Plans — QuestionBank",
    "শিক্ষার্থী ও শিক্ষক প্ল্যান — QuestionBank",
  );
  const description = tr(
    "Compare free, monthly and yearly plans for students and teachers. Prices, duration and features at a glance.",
    "শিক্ষার্থী ও শিক্ষকদের জন্য ফ্রি, মাসিক ও বার্ষিক প্ল্যান তুলনা করুন। দাম, মেয়াদ ও ফিচার এক নজরে।",
  );
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function PlansPage() {
  const [{ tr }, user, pendingOrder] = await Promise.all([
    getI18n(),
    getCurrentUser(),
    getMyPendingOrder(),
  ]);
  const paymentNumbers = getPaymentNumbers();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {tr("Pick your plan", "আপনার প্ল্যান বেছে নিন")}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
              {tr(
                "Choose the Student or Teacher tab. Every plan unlocks the full question bank structure — upgrade or cancel anytime.",
                "Student বা Teacher ট্যাব বেছে নিন। প্রতিটি প্ল্যানে পুরো প্রশ্ন ব্যাংক স্ট্রাকচার unlocked — যেকোনো সময় আপগ্রেড বা বাতিল করুন।",
              )}
            </p>
          </div>

          <PricingTabs
            defaultAudience="student"
            signedIn={Boolean(user)}
            paymentNumbers={paymentNumbers}
            pendingOrder={pendingOrder}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
