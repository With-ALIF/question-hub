"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckSquare,
  Square,
  Trash2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { QuestionCard, type QuestionListItem } from "@/components/questions/QuestionCard";
import { ExamPaperPdfModal } from "./ExamPaperPdfModal";
import {
  getExamQuestions,
  addExamQuestion,
  addManyExamQuestions,
  removeExamQuestion,
  clearAllExamQuestions,
  EXAM_PAPER_EVENT,
} from "@/lib/exam-paper/store";
import { getSavedQuestions } from "@/lib/saved-questions";
import { formatChapterLabel } from "@/data/chapters";
import { formatPaperLabel } from "@/data/papers";
import type { QuestionSubject, QuestionType, StorageQuestion } from "@/lib/questions/storage";
import type { QuestionFilterOptions, QuestionFilters } from "@/lib/questions/filters";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Props = {
  questions: StorageQuestion[];
  subjects: QuestionSubject[];
  currentSubject: QuestionSubject | null;
  currentType: QuestionType;
  page: number;
  pageSize?: number | undefined;
  totalPages: number;
  total: number;
  filters: QuestionFilterOptions | null;
  activeFilters: QuestionFilters;
};

export function ExamPaperBuilderView({
  questions,
  subjects,
  currentSubject,
  currentType,
  page,
  pageSize = 10,
  totalPages,
  total,
  filters,
  activeFilters,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { tr, num, subjectName } = useI18n();

  const [selectedQuestions, setSelectedQuestions] = useState<QuestionListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "selected">("browse");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [savedQuestionsCount, setSavedQuestionsCount] = useState(0);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [questionToRemove, setQuestionToRemove] = useState<QuestionListItem | null>(null);

  const syncStore = () => {
    const list = getExamQuestions();
    setSelectedQuestions(list);
    setSelectedIds(new Set(list.map((item) => item.id)));
    setSavedQuestionsCount(getSavedQuestions().length);
  };

  useEffect(() => {
    setIsMounted(true);
    syncStore();
    const handleUpdate = () => syncStore();
    window.addEventListener(EXAM_PAPER_EVENT, handleUpdate);
    return () => window.removeEventListener(EXAM_PAPER_EVENT, handleUpdate);
  }, []);

  const handleToggleQuestion = (q: StorageQuestion) => {
    if (selectedIds.has(q.id)) {
      removeExamQuestion(q.id);
    } else {
      addExamQuestion(q as unknown as QuestionListItem);
    }
    syncStore();
  };

  const handleSelectAllOnPage = () => {
    addManyExamQuestions(questions as unknown as QuestionListItem[]);
    syncStore();
  };

  const handleDeselectAllOnPage = () => {
    for (const q of questions) {
      removeExamQuestion(q.id);
    }
    syncStore();
  };

  const handleImportSaved = () => {
    const saved = getSavedQuestions();
    addManyExamQuestions(saved);
    syncStore();
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") {
      params.set("page", "1");
    }
    startTransition(() => {
      router.push(`/exam-paper?${params.toString()}`);
      if (key === "page" && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const isAllOnPageSelected =
    isMounted &&
    questions.length > 0 &&
    questions.every((q) => selectedIds.has(q.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
              {tr("Exam Paper Builder", "পরীক্ষাপত্র তৈরি (Exam Paper Builder)")}
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {tr(
              "Select questions by subject and chapter, then download professional 4-set papers with solutions as PDF.",
              "বিষয় ও অধ্যায় ভিত্তিক প্রশ্ন সিলেক্ট করুন এবং প্রফেশনাল ৪-সেট ও সমাধানসহ PDF ডাউনলোড করুন।",
            )}
          </p>
        </div>

        <Button
          onClick={() => setShowPdfModal(true)}
          disabled={selectedQuestions.length === 0}
          className="h-10 gap-2 px-4 text-xs font-bold shadow-md cursor-pointer"
        >
          <Download className="size-4" />
          <span>
            {tr(
              `Download exam paper PDF (${num(selectedQuestions.length)})`,
              `পরীক্ষাপত্র PDF নামান (${num(selectedQuestions.length)})`,
            )}
          </span>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeTab === "browse" ? "default" : "outline"}
            onClick={() => setActiveTab("browse")}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <BookOpen className="size-3.5" />
            <span>{tr("Browse questions", "প্রশ্ন বাছাই করুন")}</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === "selected" ? "default" : "outline"}
            onClick={() => setActiveTab("selected")}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <CheckSquare className="size-3.5" />
            <span>
              {tr(
                `Selected list (${num(selectedQuestions.length)})`,
                `নির্বাচিত তালিকা (${num(selectedQuestions.length)})`,
              )}
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {savedQuestionsCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportSaved}
              className="h-8 gap-1.5 text-xs text-primary border-primary/20 hover:bg-primary/10 cursor-pointer"
            >
              <Bookmark className="size-3.5" />
              <span>
                {tr(
                  `Add saved (${num(savedQuestionsCount)})`,
                  `সেভ করা (${num(savedQuestionsCount)}) যোগ করুন`,
                )}
              </span>
            </Button>
          )}

          {activeTab === "browse" && (
            <Button
              size="sm"
              variant="outline"
              onClick={isAllOnPageSelected ? handleDeselectAllOnPage : handleSelectAllOnPage}
              className="h-8 gap-1.5 text-xs cursor-pointer"
            >
              {isAllOnPageSelected ? (
                <>
                  <Square className="size-3.5 text-muted-foreground" />
                  <span>{tr("Deselect all", "সব আনসিলেক্ট")}</span>
                </>
              ) : (
                <>
                  <CheckSquare className="size-3.5 text-primary" />
                  <span>
                    {tr(
                      `Select all on this page (${num(questions.length)})`,
                      `এই পাতার সব সিলেক্ট (${num(questions.length)})`,
                    )}
                  </span>
                </>
              )}
            </Button>
          )}

          {activeTab === "selected" && selectedQuestions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsClearAllDialogOpen(true)}
              className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>{tr("Clear list", "তালিকা খালি করুন")}</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === "browse" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-muted-foreground">{tr("Type:", "ধরন:")}</span>
            <Button
              size="sm"
              variant={currentType === "all" ? "default" : "outline"}
              onClick={() => handleFilterChange("type", "all")}
              className="h-7 text-xs rounded-full px-3 font-semibold cursor-pointer"
            >
              {tr("All questions", "সকল প্রশ্ন")}
            </Button>
            <Button
              size="sm"
              variant={currentType === "mcq" ? "default" : "outline"}
              onClick={() => handleFilterChange("type", "mcq")}
              className="h-7 text-xs rounded-full px-3 font-semibold cursor-pointer"
            >
              {tr("MCQ (Multiple choice)", "MCQ (বহুনির্বাচনী)")}
            </Button>
            <Button
              size="sm"
              variant={currentType === "written" ? "default" : "outline"}
              onClick={() => handleFilterChange("type", "written")}
              className="h-7 text-xs rounded-full px-3 font-semibold cursor-pointer"
            >
              {tr("Written", "Written (লিখিত)")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                {tr("Subject", "বিষয়")}
              </label>
              <select
                value={currentSubject?.slug ?? "all"}
                onChange={(e) => handleFilterChange("subject", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">{tr("All subjects", "সকল বিষয়")}</option>
                {subjects.map((sub) => (
                  <option key={sub.slug} value={sub.slug}>
                    {subjectName(sub.slug, sub.name)} ({num(sub.total)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                {tr("Question type", "প্রশ্নের ধরন")}
              </label>
              <select
                value={currentType ?? "all"}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
              >
                <option value="all">{tr("All questions (MCQ + written)", "সকল প্রশ্ন (MCQ + লিখিত)")}</option>
                <option value="mcq">{tr("MCQ only", "শুধুমাত্র MCQ")}</option>
                <option value="written">{tr("Written only", "শুধুমাত্র Written (লিখিত)")}</option>
              </select>
            </div>

            {filters?.paper ? (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  {tr("Paper", "পত্র")}
                </label>
                <select
                  value={activeFilters.paper ?? ""}
                  onChange={(e) => handleFilterChange("paper", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">
                    {tr(`All papers (${num(filters.paper.all)})`, `সকল পত্র (${num(filters.paper.all)})`)}
                  </option>
                  {filters.paper.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {formatPaperLabel(opt.value)} ({num(opt.count)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1 opacity-50">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  {tr("Paper", "পত্র")}
                </label>
                <select disabled className="flex h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs">
                  <option>{tr("All papers", "সকল পত্র")}</option>
                </select>
              </div>
            )}

            {filters?.chapter ? (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  {tr("Chapter", "অধ্যায়")}
                </label>
                <select
                  value={activeFilters.chapter ?? ""}
                  onChange={(e) => handleFilterChange("chapter", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">
                    {tr(`All chapters (${num(filters.chapter.all)})`, `সকল অধ্যায় (${num(filters.chapter.all)})`)}
                  </option>
                  {filters.chapter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {formatChapterLabel(opt.value)} ({num(opt.count)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1 opacity-50">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  {tr("Chapter", "অধ্যায়")}
                </label>
                <select disabled className="flex h-9 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs shadow-xs">
                  <option>{tr("All chapters", "সকল অধ্যায়")}</option>
                </select>
              </div>
            )}
          </div>

          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-card text-center">
              <p className="text-sm font-semibold text-foreground">
                {tr("No questions found.", "কোনো প্রশ্ন পাওয়া যায়নি।")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {tr("Select another subject or chapter.", "অন্য কোনো বিষয় বা অধ্যায় নির্বাচন করুন।")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const selected = isMounted && selectedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "relative rounded-2xl border transition-all",
                      selected
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-muted/20 rounded-t-2xl">
                      <button
                        type="button"
                        onClick={() => handleToggleQuestion(q)}
                        className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground hover:text-primary transition-colors"
                      >
                        {selected ? (
                          <CheckCircle2 className="size-4 text-primary fill-primary/20" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                        <span>
                          {selected
                            ? tr("Added to exam paper", "পরীক্ষাপত্রে যুক্ত আছে")
                            : tr("Add to exam paper", "পরীক্ষাপত্রে যোগ করুন")}
                        </span>
                      </button>

                      <Badge variant="outline" className="font-mono text-[11px]">
                        #{q.id}
                      </Badge>
                    </div>

                    <div className="p-1">
                      <QuestionCard
                        question={q as unknown as QuestionListItem}
                        index={(page - 1) * pageSize + idx + 1}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => handleFilterChange("page", String(page - 1))}
                className="h-8 gap-1 text-xs cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>{tr("Previous page", "আগের পাতা")}</span>
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {tr(
                  `Page ${num(page)} / ${num(totalPages)}`,
                  `পাতা ${num(page)} / ${num(totalPages)}`,
                )}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => handleFilterChange("page", String(page + 1))}
                className="h-8 gap-1 text-xs cursor-pointer"
              >
                <span>{tr("Next page", "পরের পাতা")}</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "selected" && (
        <div className="space-y-4">
          {selectedQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-card text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <FileText className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {tr("No questions selected yet!", "এখনো কোনো প্রশ্ন নির্বাচন করা হয়নি!")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                {tr(
                  "Go to the “Browse questions” tab to add questions, or import them from your saved questions.",
                  "“প্রশ্ন বাছাই করুন” ট্যাবে গিয়ে আপনার পছন্দমতো প্রশ্ন যুক্ত করুন অথবা সেভ করা প্রশ্ন থেকে ইমপোর্ট করুন।",
                )}
              </p>
              <Button
                size="sm"
                onClick={() => setActiveTab("browse")}
                className="mt-4 text-xs font-semibold cursor-pointer"
              >
                {tr("Start selecting questions", "প্রশ্ন বাছাই শুরু করুন")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <p className="text-xs font-semibold text-muted-foreground">
                  {tr("Total selected questions:", "মোট নির্বাচিত প্রশ্ন:")}{" "}
                  <strong className="text-foreground">
                    {tr(`${num(selectedQuestions.length)}`, `${num(selectedQuestions.length)}টি`)}
                  </strong>
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowPdfModal(true)}
                  className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>{tr("Download PDF", "PDF নামান")}</span>
                </Button>
              </div>

              {selectedQuestions.map((q, idx) => (
                <div key={q.id} className="relative rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 bg-muted/20">
                    <span className="text-xs font-bold text-foreground">
                      {tr(`Question ${num(idx + 1)}`, `প্রশ্ন নং ${num(idx + 1)}`)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setQuestionToRemove(q)}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      <span>{tr("Remove", "বাদ দিন")}</span>
                    </Button>
                  </div>
                  <div className="p-1">
                    <QuestionCard question={q} index={idx + 1} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ExamPaperPdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        questions={selectedQuestions}
      />

      <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
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
                `This will remove all ${num(selectedQuestions.length)} questions from the exam paper builder list. Are you sure?`,
                `এটি পরীক্ষাপত্র বিল্ডারের তালিকা থেকে সকল (${num(selectedQuestions.length)}টি) প্রশ্ন মুছে ফেলবে। আপনি কি নিশ্চিত?`,
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
                syncStore();
                setIsClearAllDialogOpen(false);
              }}
              className="cursor-pointer rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {tr("Yes, clear the list", "হ্যাঁ, তালিকা খালি করুন")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(questionToRemove)}
        onOpenChange={(open) => !open && setQuestionToRemove(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto sm:mx-0">
              <Trash2 className="size-5" />
            </div>
            <AlertDialogTitle className="text-base sm:text-lg font-bold text-foreground">
              {tr(
                "Remove this question from the list?",
                "প্রশ্নটি তালিকা থেকে বাদ দিতে চান?",
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {tr(
                "Are you sure you want to remove this question from your exam paper list?",
                "আপনি কি নিশ্চিত যে এই প্রশ্নটি আপনার পরীক্ষাপত্রের তালিকা থেকে বাদ দিতে চান?",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="cursor-pointer rounded-xl font-semibold">
              {tr("Cancel", "বাতিল")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (questionToRemove) {
                  removeExamQuestion(questionToRemove.id);
                  syncStore();
                  setQuestionToRemove(null);
                }
              }}
              className="cursor-pointer rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {tr("Yes, remove", "হ্যাঁ, বাদ দিন")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
