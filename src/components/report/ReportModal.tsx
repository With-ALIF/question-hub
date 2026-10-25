"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { checkReportStatus, submitQuestionReport } from "@/lib/reports/actions";
import {
  REPORT_TYPE_LABELS,
  REPORT_TYPE_LABELS_EN,
  type ReportType,
} from "@/lib/reports/types";
import { useI18n } from "@/lib/i18n/client";

type Props = { questionId: string; isOpen: boolean; onClose: () => void };

export function ReportModal({ questionId, isOpen, onClose }: Props) {
  const { tr, lang } = useI18n();
  const labels = lang === "bn" ? REPORT_TYPE_LABELS : REPORT_TYPE_LABELS_EN;
  const [type, setType] = useState<ReportType>("wrong_answer");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [reported, setReported] = useState(false);
  const [res, setRes] = useState<{ ok?: boolean; text?: string }>({});

  useEffect(() => {
    if (!isOpen) return;
    setChecking(true);
    checkReportStatus(questionId).then((isRep) => {
      setChecking(false);
      if (isRep) {
        setReported(true);
        setRes({
          ok: false,
          text: tr(
            "This question has already been reported. Please wait for admin verification.",
            "এই প্রশ্নে ইতিমধ্যে রিপোর্ট করা হয়েছে, এডমিন ভেরিফিকেশন পর্যন্ত অপেক্ষা করুন।",
          ),
        });
      }
    });
  }, [isOpen, questionId, tr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) {
      setRes({ ok: false, text: tr("Please add some details.", "বিস্তারিত লিখুন।") });
      return;
    }
    setLoading(true);
    setRes({});
    const out = await submitQuestionReport({ questionId, reportType: type, message: msg });
    setLoading(false);
    if (out.success) {
      setRes({
        ok: true,
        text: tr("Report submitted. Thank you!", "রিপোর্ট জমা নেওয়া হয়েছে! ধন্যবাদ।"),
      });
      setTimeout(() => {
        setMsg("");
        setRes({});
        onClose();
      }, 1400);
    } else {
      if (out.alreadyReported) setReported(true);
      setRes({
        ok: false,
        text: out.error || tr("Something went wrong.", "সমস্যা হয়েছে।"),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {tr("Found a mistake in this question?", "প্রশ্নে কোনো ভুল পেয়েছেন?")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {tr("ID:", "আইডি:")}{" "}
            <span className="font-mono text-primary font-semibold">{questionId}</span>
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>{tr("Checking...", "যাচাই করা হচ্ছে...")}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            {reported ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-200">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs leading-relaxed font-medium">{res.text}</p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {tr("Type of issue", "সমস্যার ধরন")}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ReportType)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
                  >
                    {(Object.keys(labels) as ReportType[]).map((k) => (
                      <option key={k} value={k}>
                        {labels[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {tr("Details", "বিস্তারিত বিবরণ")}
                  </label>
                  <Textarea
                    rows={3}
                    placeholder={tr("Describe what is wrong...", "কী ভুল আছে লিখুন...")}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    className="text-xs resize-none"
                  />
                </div>
                {res.text && (
                  <p className={`text-xs ${res.ok ? "text-emerald-600 font-medium" : "text-destructive"}`}>
                    {res.text}
                  </p>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                {tr("Cancel", "বাতিল")}
              </Button>
              {!reported && (
                <Button type="submit" size="sm" disabled={loading || res.ok}>
                  {loading ? tr("Submitting...", "জমা হচ্ছে...") : tr("Send report", "রিপোর্ট পাঠান")}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
