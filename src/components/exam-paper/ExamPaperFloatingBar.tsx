"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, X, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExamPaperPdfModal } from "./ExamPaperPdfModal";
import {
  getExamQuestions,
  clearAllExamQuestions,
  EXAM_PAPER_EVENT,
} from "@/lib/exam-paper/store";
import { useI18n } from "@/lib/i18n/client";
import type { QuestionListItem } from "@/components/questions/QuestionCard";

export function ExamPaperFloatingBar() {
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { tr, num } = useI18n();

  const sync = () => {
    setQuestions(getExamQuestions());
  };

  useEffect(() => {
    setMounted(true);
    sync();
    const handleUpdate = () => sync();
    window.addEventListener(EXAM_PAPER_EVENT, handleUpdate);
    return () => window.removeEventListener(EXAM_PAPER_EVENT, handleUpdate);
  }, []);

  if (!mounted || questions.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-primary/30 bg-card/95 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
            {num(questions.length)}
          </span>
          <span className="text-xs font-semibold text-foreground hidden sm:inline">
            {tr(
              `${num(questions.length)} questions selected`,
              `${num(questions.length)}টি প্রশ্ন নির্বাচিত হয়েছে`,
            )}
          </span>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="h-8 gap-1.5 text-xs font-bold rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>{tr("Exam paper PDF", "পরীক্ষাপত্র PDF")}</span>
          </Button>

          <Link href="/exam-paper">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs rounded-full cursor-pointer hover:bg-muted"
            >
              <span>{tr("Builder", "বিল্ডার")}</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowClearConfirm(true)}
            className="size-8 p-0 rounded-full text-muted-foreground hover:text-destructive cursor-pointer"
            title={tr("Clear all", "সবগুলো মুছুন")}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <ExamPaperPdfModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        questions={questions}
      />

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto sm:mx-0">
              <Trash2 className="size-5" />
            </div>
            <AlertDialogTitle className="text-base sm:text-lg font-bold text-foreground">
              {tr(
                "Clear all selected questions from the list?",
                "সকল নির্বাচিত প্রশ্ন তালিকা থেকে খালি করতে চান?",
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {tr(
                `This will remove all ${num(questions.length)} questions from the exam paper list.`,
                `এটি পরীক্ষাপত্রের তালিকা থেকে সকল (${num(questions.length)}টি) প্রশ্ন মুছে ফেলবে।`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="cursor-pointer rounded-xl font-semibold">
              {tr("Cancel", "বাতিল")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAllExamQuestions();
                setShowClearConfirm(false);
              }}
              className="cursor-pointer rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {tr("Yes, clear the list", "হ্যাঁ, তালিকা খালি করুন")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
