import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Sparkles, Timer, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "মডেল টেস্ট — QuestionBank",
  description: "সময় ধরে মডেল টেস্ট দিয়ে নিজের প্রস্তুতি যাচাই করার প্ল্যাটফর্ম। খুব শীঘ্রই আসছে।",
};

export default async function ModelTestPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <Card className="relative overflow-hidden border-border/80 bg-card/80 p-8 sm:p-12 shadow-lg backdrop-blur">
            <div className="absolute -top-12 -right-12 size-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 size-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

            <CardContent className="p-0 flex flex-col items-center">
              <div className="relative mb-6">
                <span className="flex size-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-inner">
                  <Timer className="size-10" aria-hidden="true" />
                </span>
                <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                </span>
              </div>

              <Badge variant="outline" className="mb-3 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-semibold">
                শীঘ্রই আসছে (Coming Soon)
              </Badge>

              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                মডেল টেস্ট
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                এই ফিচারটি খুব শীঘ্রই আসবে! এখানে আপনি নির্দিষ্ট সময়সীমা, নেগেটিভ মার্কিং এবং লাইভ রেজাল্ট অ্যানালাইসিস সহ রিয়েল পরীক্ষার মতো মডেল টেস্ট দিতে পারবেন।
              </p>

              <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3 text-left">
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Clock className="size-3.5 text-amber-500" aria-hidden="true" />
                    <span>টাইমার টেস্ট</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">সময় মেপে পরীক্ষা দেওয়ার সুবিধা</p>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Trophy className="size-3.5 text-emerald-500" aria-hidden="true" />
                    <span>নেগেটিভ মার্কিং</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">ভুল উত্তরের জন্য সঠিক মূল্যায়ন</p>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <BookOpen className="size-3.5 text-blue-500" aria-hidden="true" />
                    <span>বিষয়ভিত্তিক</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">অধ্যায় বা পুরো বিষয়ের টেস্ট</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full">
                <Button asChild className="gap-2">
                  <Link href="/dashboard">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    ড্যাশবোর্ডে ফিরে যান
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer initialUser={user} />
    </div>
  );
}
