"use client";

import { useState } from "react";
import { CheckCircle2, Edit3, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveReport } from "@/lib/reports/admin-actions";
import { REPORT_TYPE_LABELS, type QuestionReport } from "@/lib/reports/types";
import { AdminReportResolveModal } from "./AdminReportResolveModal";

type AdminReportCardProps = {
  report: QuestionReport;
  onResolved: (id: string) => void;
  onEdit: (questionId: string) => void;
};

export function AdminReportCard({ report, onResolved, onEdit }: AdminReportCardProps) {
  const [showResolveModal, setShowResolveModal] = useState(false);

  const label = REPORT_TYPE_LABELS[report.report_type] || report.report_type;
  const formattedDate = new Date(report.created_at).toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      <Card className="border-border/80 shadow-sm transition hover:shadow-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Flag className="size-3.5" />
              </span>
              <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 text-xs">
                {label}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3 text-xs text-foreground leading-relaxed">
            <p className="font-medium text-muted-foreground text-[11px] mb-1">শিক্ষার্থীর মন্তব্য:</p>
            <p className="whitespace-pre-wrap">{report.message}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>প্রশ্ন আইডি:</span>
              <span className="font-mono font-bold text-foreground">{report.question_id}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(report.question_id)}
                className="h-7 text-xs text-primary gap-1 cursor-pointer font-medium hover:bg-primary/10"
              >
                <Edit3 className="size-3" />
                <span>প্রশ্ন এডিট করুন</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowResolveModal(true)}
                className="h-7 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
              >
                <CheckCircle2 className="size-3 mr-1" />
                <span>সমাধান সম্পন্ন</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminReportResolveModal
        open={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        onConfirm={async () => {
          const res = await resolveReport(report.id);
          if (res.success) onResolved(report.id);
          return res;
        }}
      />
    </>
  );
}
