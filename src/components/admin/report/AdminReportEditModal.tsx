"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AdminQuestionEditModal } from "@/components/admin/AdminQuestionEditModal";
import { getReportedQuestion } from "@/lib/reports/admin-actions";
import type { StorageQuestion } from "@/lib/questions/storage";

type Props = {
  questionId: string | null;
  onClose: () => void;
  onUpdated?: (updated: StorageQuestion) => void;
};

export function AdminReportEditModal({ questionId, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<StorageQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) {
      setQuestion(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getReportedQuestion(questionId)
      .then((q) => {
        setLoading(false);
        if (q) setQuestion(q);
        else setError("স্টোরেজে এই আইডির প্রশ্নটি খুঁজে পাওয়া যায়নি।");
      })
      .catch(() => {
        setLoading(false);
        setError("প্রশ্নটি লোড করার সময় সমস্যা হয়েছে।");
      });
  }, [questionId]);

  if (!questionId) return null;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md text-center py-10">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs text-muted-foreground">প্রশ্ন লোড হচ্ছে ({questionId})...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !question) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive">ত্রুটি</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">{error}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button size="sm" variant="outline" onClick={onClose}>বন্ধ করুন</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AdminQuestionEditModal
      question={question}
      isOpen={true}
      onClose={onClose}
      onUpdated={(updated) => {
        setQuestion(updated);
        onUpdated?.(updated);
      }}
    />
  );
}
