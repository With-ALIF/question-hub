"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { renderMathInContent } from "@/lib/math";
import type { StorageQuestion } from "@/lib/questions/storage";
import { cn } from "@/lib/utils";
import { AdminQuestionEditModal } from "./AdminQuestionEditModal";

const BANGLA_OPTIONS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];

function RichAdminContent({
  html,
  text,
  className,
}: {
  html: string | null | undefined;
  text: string | null | undefined;
  className?: string;
}) {
  let content = "";
  if (html && text) {
    const textTrimmed = text.trim();
    const htmlClean = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (htmlClean.includes(textTrimmed)) {
      content = html;
    } else {
      content = `${html}<p class="mt-2">${textTrimmed}</p>`;
    }
  } else {
    content = html || text || "";
  }

  const rendered = renderMathInContent(content);

  return (
    <div
      className={cn("rich-text text-foreground leading-relaxed", !html && "whitespace-pre-line", className)}
      dangerouslySetInnerHTML={{ __html: rendered }}
      onClick={(e) => {
        const target = e.target;
        if (target instanceof HTMLImageElement && target.src) {
          window.open(target.src, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}

export function AdminQuestionCard({
  question,
  index,
}: {
  question: StorageQuestion;
  index: number;
}) {
  const [currentQuestion, setCurrentQuestion] = useState<StorageQuestion>(question);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentQuestion.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const hasExplanation = Boolean(
    currentQuestion.explanation || currentQuestion.explanation_html
  );
  const isMcq =
    currentQuestion.is_mcq ||
    (currentQuestion.options && currentQuestion.options.length > 0);

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm transition-all hover:border-border hover:shadow-md">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Index badge */}
            <span className="font-display font-semibold text-muted-foreground">
              #{index}
            </span>

            {/* Subject badge */}
            <Badge variant="outline" className="capitalize bg-secondary/60 font-medium">
              {currentQuestion.subject}
            </Badge>

            {/* Type badge */}
            <Badge
              variant={isMcq ? "secondary" : "default"}
              className={cn(
                "text-[11px] font-semibold",
                isMcq
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              )}
            >
              {isMcq ? "MCQ" : "লিখিত / Written"}
            </Badge>

            {/* Institution / Board */}
            {currentQuestion.institution && (
              <Badge variant="outline" className="border-border/80 text-foreground">
                {currentQuestion.institution}
              </Badge>
            )}

            {/* Year */}
            {currentQuestion.year && (
              <span className="text-muted-foreground font-mono">
                {currentQuestion.year}
              </span>
            )}

            {/* Topic code / Keyword */}
            {currentQuestion.topic_code && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {currentQuestion.topic_code}
              </span>
            )}

            {currentQuestion.keyword && (
              <span className="text-muted-foreground italic">
                “{currentQuestion.keyword}”
              </span>
            )}
          </div>

          {/* Action buttons on top right */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Edit Button (Pencil Icon) */}
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground cursor-pointer shadow-2xs"
              title="প্রশ্ন সম্পাদনা করুন (Edit Question)"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              <span>Edit</span>
            </button>

            {/* Copy ID Button */}
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
              title="প্রশ্ন আইডি কপি করুন"
            >
              {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{currentQuestion.id}</span>
            </button>

            {/* Raw JSON inspection button */}
            <button
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="inline-flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              title="কাঁচা JSON দেখুন"
            >
              <Code2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Question Statement */}
        <div className="pt-1">
          <RichAdminContent
            html={currentQuestion.question_html}
            text={currentQuestion.question_text}
            className="text-base sm:text-lg font-medium text-foreground leading-relaxed"
          />
        </div>

        {/* MCQ Options Display with Highlighted Correct Answer */}
        {isMcq && currentQuestion.options && currentQuestion.options.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              অপশনসমূহ (সঠিক উত্তর সবুজ চিহ্নিত)
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {currentQuestion.options.map((opt, optIdx) => {
                const isCorrect = opt.n === currentQuestion.correct_option;
                const banglaLabel = BANGLA_OPTIONS[optIdx] ?? String(opt.n);

                return (
                  <div
                    key={opt.n}
                    className={cn(
                      "relative flex items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                      isCorrect
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/20"
                        : "border-border/80 bg-background/60 text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                        isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {banglaLabel}
                    </span>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div
                        className="rich-text font-medium"
                        dangerouslySetInnerHTML={{ __html: renderMathInContent(opt.t) }}
                      />
                    </div>

                    {isCorrect && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        <span>সঠিক উত্তর</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Written Question Answer */}
        {!isMcq && currentQuestion.answer && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>উত্তর (Answer):</span>
            </p>
            <div
              className="rich-text text-sm font-medium text-emerald-950 dark:text-emerald-100"
              dangerouslySetInnerHTML={{ __html: renderMathInContent(currentQuestion.answer) }}
            />
          </div>
        )}

        {/* Explanation Section */}
        {hasExplanation && (
          <div className="pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowExplanation((v) => !v)}
              className="gap-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
            >
              {showExplanation ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span>{showExplanation ? "ব্যাখ্যা লুকান" : "ব্যাখ্যা ও সমাধান দেখুন"}</span>
            </Button>

            {showExplanation && (
              <div className="mt-3 rounded-xl border border-border/80 bg-secondary/30 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>ব্যাখ্যা ও বিশ্লেষণ</span>
                </p>
                <RichAdminContent
                  html={currentQuestion.explanation_html}
                  text={currentQuestion.explanation}
                  className="text-sm leading-relaxed"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Edit Modal Component */}
      {showEditModal && (
        <AdminQuestionEditModal
          question={currentQuestion}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setCurrentQuestion(updated);
          }}
        />
      )}

      {/* Raw JSON inspection modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Code2 className="size-5 text-primary" />
                <h3 className="font-display font-bold text-foreground">
                  Question JSON Data: {currentQuestion.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="rounded-xl bg-background p-4 font-mono text-xs text-foreground overflow-x-auto border border-border">
                {JSON.stringify(currentQuestion, null, 2)}
              </pre>
            </div>
            <div className="border-t border-border px-5 py-3 flex justify-end gap-2 bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(currentQuestion, null, 2));
                  setShowJsonModal(false);
                }}
              >
                Copy JSON
              </Button>
              <Button size="sm" onClick={() => setShowJsonModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
