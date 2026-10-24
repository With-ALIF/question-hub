"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { renderMathInContent } from "@/lib/math";
import { updateQuestionInBucket } from "@/lib/admin/question-actions";
import type { StorageQuestion } from "@/lib/questions/storage";
import type { QuestionOption } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const BANGLA_LABELS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];

export function AdminQuestionEditModal({
  question,
  isOpen,
  onClose,
  onUpdated,
}: {
  question: StorageQuestion;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedQuestion: StorageQuestion) => void;
}) {
  const [isPending, startTransition] = useTransition();

  // Form State
  const [questionText, setQuestionText] = useState(question.question_text || "");
  const [isMcq, setIsMcq] = useState(
    question.is_mcq || (question.options && question.options.length > 0)
  );
  const [options, setOptions] = useState<QuestionOption[]>(
    question.options && question.options.length > 0
      ? question.options
      : [
          { n: 1, t: "" },
          { n: 2, t: "" },
          { n: 3, t: "" },
          { n: 4, t: "" },
        ]
  );
  const [correctOption, setCorrectOption] = useState<number | null>(
    question.correct_option ?? 1
  );
  const [answer, setAnswer] = useState(question.answer || "");
  const [explanation, setExplanation] = useState(question.explanation || "");

  // Metadata
  const [institution, setInstitution] = useState(question.institution || "");
  const [year, setYear] = useState(question.year || "");
  const [topicCode, setTopicCode] = useState(question.topic_code || "");
  const [keyword, setKeyword] = useState(question.keyword || "");

  // Preview Toggles
  const [previewQuestion, setPreviewQuestion] = useState(false);
  const [previewExplanation, setPreviewExplanation] = useState(false);

  // Status Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, text: string) => {
    const next = [...options];
    if (next[index]) {
      next[index] = { ...next[index], t: text };
      setOptions(next);
    }
  };

  const handleAddOption = () => {
    const nextN = options.length > 0 ? Math.max(...options.map((o) => o.n)) + 1 : 1;
    setOptions([...options, { n: nextN, t: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert("কমপক্ষে ২টি অপশন থাকতে হবে।");
      return;
    }
    const removedN = options[index]?.n;
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
    if (correctOption === removedN) {
      setCorrectOption(next[0]?.n ?? null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!questionText.trim()) {
      setErrorMessage("প্রশ্নের বিষয়বস্তু খালি রাখা যাবে না।");
      return;
    }

    if (isMcq) {
      if (options.some((opt) => !(opt.t ?? "").trim())) {
        setErrorMessage("সকল MCQ অপশন পূরণ করতে হবে।");
        return;
      }
      if (correctOption === null) {
        setErrorMessage("দয়া করে সঠিক উত্তরটি নির্বাচন করুন।");
        return;
      }
    }

    startTransition(async () => {
      const result = await updateQuestionInBucket({
        id: question.id,
        subject: question.subject,
        shardNumber: question._shard,
        question_text: questionText,
        options: isMcq ? options : [],
        correct_option: isMcq ? correctOption : null,
        answer: !isMcq ? answer : null,
        explanation,
        is_mcq: isMcq,
        institution: institution || null,
        year: year || null,
        topic_code: topicCode || null,
        keyword: keyword || null,
      });

      if (result.success && result.question) {
        setSuccessMessage("সুপাবেস বাকেটে প্রশ্নটি সফলভাবে সংরক্ষিত হয়েছে!");
        onUpdated(result.question);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(result.error || "সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold text-foreground">
              প্রশ্ন সম্পাদনা
            </h2>
            <Badge variant="outline" className="font-mono text-xs">
              {question.id}
            </Badge>
            <Badge variant="secondary" className="capitalize text-xs">
              {question.subject}
            </Badge>
            {question._shard && (
              <span className="text-[11px] font-mono text-muted-foreground">
                (Shard {question._shard})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Notification Alerts */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="question_text" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                প্রশ্নের বিবরণ (Question Text & Math)
              </label>
              <button
                type="button"
                onClick={() => setPreviewQuestion((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
              >
                {previewQuestion ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                <span>{previewQuestion ? "এডিটর দেখুন" : "লাইভ প্রিভিউ দেখুন"}</span>
              </button>
            </div>

            {previewQuestion ? (
              <div
                className="min-h-[90px] rounded-xl border border-border bg-secondary/30 p-3 text-sm rich-text"
                dangerouslySetInnerHTML={{ __html: renderMathInContent(questionText) }}
              />
            ) : (
              <textarea
                id="question_text"
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="প্রশ্নের টেক্সট ও KaTeX ফর্মুলা (যেমন: $A^3 - 7I_3 = ?$)..."
                className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              />
            )}
          </div>

          {/* Question Type Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              প্রশ্নের ধরণ (Question Type)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium cursor-pointer hover:bg-secondary">
                <input
                  type="radio"
                  name="question_type"
                  checked={isMcq}
                  onChange={() => setIsMcq(true)}
                  className="size-4 text-primary"
                />
                <span>MCQ (নৈর্ব্যক্তিক)</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium cursor-pointer hover:bg-secondary">
                <input
                  type="radio"
                  name="question_type"
                  checked={!isMcq}
                  onChange={() => setIsMcq(false)}
                  className="size-4 text-primary"
                />
                <span>লিখিত (Written)</span>
              </label>
            </div>
          </div>

          {/* MCQ Options with Radio Select for Correct Answer */}
          {isMcq ? (
            <div className="space-y-3 rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    MCQ অপশনসমূহ ও সঠিক উত্তর নির্বাচন
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    যে অপশনটি সঠিক, সেটির রেডিও বাটনে টিক দিন (সবুজ হাইলাইট হবে)।
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="gap-1 h-7 text-xs"
                >
                  <Plus className="size-3" />
                  <span>অপশন যোগ করুন</span>
                </Button>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const isCorrect = opt.n === correctOption;
                  const label = BANGLA_LABELS[idx] ?? `(${idx + 1})`;

                  return (
                    <div
                      key={opt.n}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-2.5 transition-colors",
                        isCorrect
                          ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                          : "border-border bg-card"
                      )}
                    >
                      {/* Radio for correct answer */}
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0" title="সঠিক উত্তর হিসেবে নির্বাচন করুন">
                        <input
                          type="radio"
                          name="correct_answer_radio"
                          checked={isCorrect}
                          onChange={() => setCorrectOption(opt.n)}
                          className="size-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-lg text-xs font-bold",
                            isCorrect ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {label}
                        </span>
                      </label>

                      {/* Option Text Input */}
                      <input
                        type="text"
                        value={opt.t ?? ""}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`অপশন ${label} এর টেক্সট...`}
                        className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />

                      {/* Correct Badge */}
                      {isCorrect && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Check className="size-3" />
                          <span>সঠিক উত্তর</span>
                        </span>
                      )}

                      {/* Remove Option Button */}
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          title="এই অপশনটি মুছুন"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Written Answer Field */
            <div className="space-y-2">
              <label htmlFor="written_answer" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                লিখিত প্রশ্নের উত্তর (Answer)
              </label>
              <textarea
                id="written_answer"
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="প্রশ্নের সঠিক লিখিত সমাধান বা মান..."
                className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Explanation Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="explanation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ব্যাখ্যা ও সমাধান (Explanation)
              </label>
              <button
                type="button"
                onClick={() => setPreviewExplanation((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
              >
                {previewExplanation ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                <span>{previewExplanation ? "এডিটর দেখুন" : "লাইভ প্রিভিউ দেখুন"}</span>
              </button>
            </div>

            {previewExplanation ? (
              <div
                className="min-h-[80px] rounded-xl border border-border bg-secondary/30 p-3 text-sm rich-text"
                dangerouslySetInnerHTML={{ __html: renderMathInContent(explanation) }}
              />
            ) : (
              <textarea
                id="explanation"
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="প্রশ্নের বিস্তারিত সমাধান, সূত্রের প্রয়োগ বা ব্যাখ্যা লিখুন..."
                className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </div>

          {/* Metadata Collapsible / Grid */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              অতিরিক্ত তথ্য (Metadata)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">প্রতিষ্ঠান / বোর্ড</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="উদা: MCC, BUET"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">শিক্ষাবর্ষ (Year)</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="উদা: 2024"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">টপিক কোড</label>
                <input
                  type="text"
                  value={topicCode}
                  onChange={(e) => setTopicCode(e.target.value)}
                  placeholder="উদা: P-1.2"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">কীওয়ার্ড</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="উদা: লন রোলার"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-card py-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onClose}
            >
              বাতিল করুন
            </Button>

            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 min-w-[130px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>বাকেটে সেভ করুন</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
