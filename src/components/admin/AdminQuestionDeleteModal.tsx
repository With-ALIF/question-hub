"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteQuestionAction } from "@/lib/admin/question-actions";
import type { StorageQuestion } from "@/lib/questions/storage";

export function AdminQuestionDeleteModal({
  question,
  isOpen,
  onClose,
  onDeleted,
}: {
  question: StorageQuestion;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (questionId: string, subject: string, isMcq: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMcq = Boolean(
    question.is_mcq || (question.options && question.options.length > 0)
  );

  const handleDelete = () => {
    setErrorMessage(null);
    // Optimistically update UI in 0ms (card removal + stats decrement)
    onDeleted(question.id, question.subject, isMcq);
    onClose();

    startTransition(async () => {
      const res = await deleteQuestionAction(
        question.id,
        question.subject,
        question._shard
      );

      if (!res.success) {
        console.error("Deletion failed on server:", res.error);
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Trash2 className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">
                প্রশ্ন ডিলিট নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                এই প্রশ্নটি স্থায়ীভাবে মুছে ফেলা হবে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Warning alert message */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 leading-relaxed">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">সতর্কবার্তা:</p>
            <p className="mt-0.5 text-destructive/90">
              প্রশ্নটি ডাটাবেজ এবং স্টোরেজ শার্ড থেকে স্থায়ীভাবে মুছে ফেলা হবে। সংশ্লিষ্ট বিষয়ের মোট প্রশ্নের পরিসংখ্যান (Total Questions) স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে।
            </p>
          </div>
        </div>

        {/* Question Details Preview */}
        <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <Badge variant="outline" className="font-mono bg-background">
              ID: {question.id}
            </Badge>
            <Badge variant="outline" className="capitalize bg-secondary/80">
              {question.subject}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {question.is_mcq ? "MCQ" : "লিখিত"}
            </Badge>
          </div>
          <p className="text-foreground line-clamp-3 font-medium leading-relaxed">
            {question.question_text}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium text-center">
            {errorMessage}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer text-xs"
          >
            বাতিল করুন
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-1.5 cursor-pointer text-xs font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>মুছে ফেলা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                <span>হ্যাঁ, মুছে ফেলুন</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
