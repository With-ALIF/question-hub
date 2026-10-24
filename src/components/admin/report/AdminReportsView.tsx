"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Flag, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminReportCard } from "./AdminReportCard";
import { AdminReportEditModal } from "./AdminReportEditModal";
import type { QuestionReport } from "@/lib/reports/types";

type AdminReportsViewProps = { initialReports: QuestionReport[]; role: string };

export function AdminReportsView({ initialReports }: AdminReportsViewProps) {
  const router = useRouter();
  const [reports, setReports] = useState<QuestionReport[]>(initialReports);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleResolved = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Flag className="size-4" />
            </span>
            <h1 className="text-xl font-bold font-display text-foreground">প্রশ্ন ভুল রিপোর্ট ব্যবস্থাপনা</h1>
            <Badge variant="secondary" className="font-mono text-xs">{reports.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            শিক্ষার্থীদের পাঠানো ভুলের রিপোর্ট দেখুন, সরাসরি এডিট করুন এবং সমাধান হলে রিমুভ করুন।
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8 gap-1.5 text-xs self-start sm:self-auto cursor-pointer">
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>রিফ্রেশ</span>
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">কোনো পেন্ডিং রিপোর্ট নেই!</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">সব রিপোর্ট সফলভাবে সমাধান করা হয়েছে।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <AdminReportCard
              key={report.id}
              report={report}
              onResolved={handleResolved}
              onEdit={(qId) => setEditingId(qId)}
            />
          ))}
        </div>
      )}

      {editingId && (
        <AdminReportEditModal
          questionId={editingId}
          onClose={() => setEditingId(null)}
          onUpdated={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
