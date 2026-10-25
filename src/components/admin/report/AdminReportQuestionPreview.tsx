"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminQuestionCard } from "@/components/admin/AdminQuestionCard";
import { getReportedQuestion } from "@/lib/reports/admin-actions";
import type { StorageQuestion } from "@/lib/questions/storage";

type Props = {
  questionId: string;
  initialQuestion?: StorageQuestion | null | undefined;
};

export function AdminReportQuestionPreview({ questionId, initialQuestion }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState<StorageQuestion | null>(initialQuestion ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && !question && !loading) {
      setLoading(true);
      setError(null);
      getReportedQuestion(questionId, true)
        .then((q) => {
          setLoading(false);
          if (q) setQuestion(q);
          else setError("প্রশ্নটি স্টোরেজে খুঁজে পাওয়া যায়নি।");
        })
        .catch(() => {
          setLoading(false);
          setError("প্রশ্ন লোড করতে সমস্যা হয়েছে।");
        });
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleToggle}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
      >
        {isOpen ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        <span>{isOpen ? "প্রশ্ন কার্ড লুকান" : "প্রশ্ন কার্ড দেখুন"}</span>
        {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </Button>

      {isOpen && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-2 sm:p-3">
          {loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>প্রশ্ন কার্ড লোড হচ্ছে...</span>
            </div>
          )}

          {error && !loading && (
            <p className="text-xs text-destructive p-2">{error}</p>
          )}

          {question && !loading && (
            <AdminQuestionCard question={question} index={1} />
          )}
        </div>
      )}
    </div>
  );
}
