"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  MinusCircle,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import { renderMathInContent } from "@/lib/math";
import type { PracticeQuestion } from "@/lib/questions/practice-types";
import { cn } from "@/lib/utils";

type PracticeSessionProps = {
  questions: PracticeQuestion[];
  minutes: number;
  negative: number;
  subjectLabel: string;
  onRestart: () => Promise<boolean>;
  onExit: () => void;
};

type Phase = "active" | "result";
type ConfirmKind = "submit" | "exit" | null;

function RichText({
  html,
  text,
  className,
}: {
  html: string | null | undefined;
  text: string | null | undefined;
  className?: string;
}) {
  let content = "";
  const textTrimmed = (text || "").trim();

  if (html && textTrimmed) {
    const htmlClean = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    if (htmlClean === textTrimmed) {
      content = html;
    } else {
      const imgMatches = html.match(/<img[^>]+>/gi);
      content =
        imgMatches && imgMatches.length > 0
          ? `${imgMatches.join("\n")}\n${textTrimmed}`
          : textTrimmed;
    }
  } else {
    content = textTrimmed || html || "";
  }

  return (
    <div
      className={cn("rich-text", !html && "whitespace-pre-line", className)}
      dangerouslySetInnerHTML={{ __html: renderMathInContent(content) }}
    />
  );
}

function correctIndexFor(question: PracticeQuestion) {
  return typeof question.correct_option === "number" && question.correct_option > 0
    ? question.correct_option - 1
    : -1;
}

export function PracticeSession({
  questions,
  minutes,
  negative,
  subjectLabel,
  onRestart,
  onExit,
}: PracticeSessionProps) {
  const { tr, num, lang } = useI18n();
  const total = questions.length;
  const totalSeconds = minutes * 60;

  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    Array.from({ length: total }, () => null),
  );
  const [remaining, setRemaining] = useState(totalSeconds);
  const [phase, setPhase] = useState<Phase>("active");
  const [timedOut, setTimedOut] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState(false);
  const deadlineRef = useRef(0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    deadlineRef.current = Date.now() + totalSeconds * 1000;

    return () => {
      document.body.style.overflow = previous;
    };
  }, [totalSeconds]);

  useEffect(() => {
    if (phase !== "active") return;

    if (deadlineRef.current === 0) {
      deadlineRef.current = Date.now() + totalSeconds * 1000;
    }

    const interval = window.setInterval(() => {
      const secondsLeft = Math.max(
        0,
        Math.round((deadlineRef.current - Date.now()) / 1000),
      );

      if (secondsLeft <= 0) {
        window.clearInterval(interval);
        setRemaining(0);
        setTimedOut(true);
        setPhase("result");
        setConfirmKind(null);
        return;
      }

      setRemaining(secondsLeft);
    }, 250);

    return () => window.clearInterval(interval);
  }, [phase, totalSeconds]);

  const answeredCount = answers.filter((value) => value !== null).length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const digitize = (value: string) =>
    lang === "bn" ? value.replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)] ?? digit) : value;

  const formatClock = (seconds: number) =>
    `${digitize(String(Math.floor(seconds / 60)).padStart(2, "0"))}:${digitize(
      String(seconds % 60).padStart(2, "0"),
    )}`;

  const toggleOption = (questionIndex: number, optionIndex: number) => {
    setAnswers((previous) => {
      const next = [...previous];
      next[questionIndex] = next[questionIndex] === optionIndex ? null : optionIndex;
      return next;
    });
  };

  const result = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((item, index) => {
      const selected = answers[index] ?? null;

      if (selected === null) {
        skipped += 1;
        return;
      }

      if (selected === correctIndexFor(item)) correct += 1;
      else wrong += 1;
    });

    const rawScore = correct - wrong * negative;
    const score = Math.round(rawScore * 100) / 100;
    const percentage = total > 0 ? Math.max(0, Math.min(100, Math.round((score / total) * 100))) : 0;

    return { correct, wrong, skipped, score, percentage };
  }, [answers, negative, questions, total]);

  const elapsedSeconds = Math.max(0, totalSeconds - remaining);

  const submit = () => {
    setTimedOut(false);
    setConfirmKind(null);
    setPhase("result");
  };

  const restart = async () => {
    if (restarting) return;

    setRestartError(false);
    setRestarting(true);

    try {
      const ok = await onRestart();
      if (!ok) setRestartError(true);
    } catch {
      setRestartError(true);
    } finally {
      setRestarting(false);
    }
  };

  const handleExit = () => {
    if (phase === "active") {
      setConfirmKind("exit");
      return;
    }
    onExit();
  };

  if (phase === "result") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tr("Practice result", "অনুশীলনের ফলাফল")}
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{subjectLabel}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onExit} className="shrink-0 gap-1.5">
              <X className="size-3.5" aria-hidden="true" />
              {tr("Close", "বন্ধ করুন")}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 py-6 text-center sm:px-8">
                  {timedOut && (
                    <Badge variant="outline" className="mb-3 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Clock className="mr-1 size-3" aria-hidden="true" />
                      {tr("Time is up", "সময় শেষ")}
                    </Badge>
                  )}

                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {tr("Your score", "আপনার স্কোর")}
                  </p>
                  <p className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {num(result.score)}
                    <span className="ml-1 text-lg font-medium text-muted-foreground">
                      / {num(total)}
                    </span>
                  </p>

                  <div className="mx-auto mt-4 max-w-md">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{tr("Progress", "অগ্রগতি")}</span>
                      <span className="font-semibold text-foreground">{num(result.percentage)}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${result.percentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {tr(
                      `Time used: ${formatClock(elapsedSeconds)} of ${formatClock(totalSeconds)} · ${num(answeredCount)} of ${num(total)} answered`,
                      `সময় লেগেছে ${formatClock(elapsedSeconds)} / ${formatClock(totalSeconds)} · ${num(answeredCount)}টি উত্তর দেওয়া হয়েছে`,
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                  <div className="px-3 py-4 text-center">
                    <CheckCircle2 className="mx-auto size-5 text-emerald-600" aria-hidden="true" />
                    <p className="mt-1 font-display text-xl font-bold text-foreground">{num(result.correct)}</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Correct", "সঠিক")}</p>
                  </div>
                  <div className="px-3 py-4 text-center">
                    <XCircle className="mx-auto size-5 text-destructive" aria-hidden="true" />
                    <p className="mt-1 font-display text-xl font-bold text-foreground">{num(result.wrong)}</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Wrong", "ভুল")}</p>
                  </div>
                  <div className="px-3 py-4 text-center">
                    <MinusCircle className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
                    <p className="mt-1 font-display text-xl font-bold text-foreground">{num(result.skipped)}</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Skipped", "বাদ")}</p>
                  </div>
                </div>

                {negative > 0 && result.wrong > 0 && (
                  <p className="border-t border-border bg-amber-500/5 px-4 py-2.5 text-center text-xs text-amber-700 dark:text-amber-400">
                    {tr(
                      `${num(result.wrong)} wrong × ${num(negative)} negative marks were deducted.`,
                      `${num(result.wrong)}টি ভুলের জন্য প্রতিটি ${num(negative)} নেগেটিভ মার্ক কাটা হয়েছে।`,
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={restart} disabled={restarting} className="gap-2">
                {restarting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="size-4" aria-hidden="true" />
                )}
                {restarting
                  ? tr("Preparing...", "প্রস্তুত হচ্ছে...")
                  : tr("Practise again", "আবার অনুশীলন করুন")}
              </Button>
              <Button variant="outline" onClick={onExit}>
                {tr("Back to questions", "প্রশ্নে ফিরে যান")}
              </Button>
              {restartError && (
                <p className="w-full text-center text-xs text-destructive">
                  {tr(
                    "Could not prepare new questions. Please try again.",
                    "নতুন প্রশ্ন আনা যায়নি। আবার চেষ্টা করুন।",
                  )}
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                {tr("Answer review", "উত্তর পর্যালোচনা")}
              </h2>

              <div className="space-y-2">
                {questions.map((item, index) => {
                  const selected = answers[index] ?? null;
                  const correctIndex = correctIndexFor(item);
                  const state =
                    selected === null ? "skipped" : selected === correctIndex ? "correct" : "wrong";
                  const options = Array.isArray(item.options) ? item.options : [];

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        "overflow-hidden border-l-4",
                        state === "correct" && "border-l-emerald-500",
                        state === "wrong" && "border-l-destructive",
                        state === "skipped" && "border-l-muted-foreground/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-4 py-2">
                        <span className="text-sm font-semibold text-foreground">
                          {tr("Question", "প্রশ্ন")} {num(index + 1)}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            / {num(total)}
                          </span>
                        </span>
                        <Badge
                          variant={
                            state === "correct"
                              ? "default"
                              : state === "wrong"
                                ? "destructive"
                                : "secondary"
                          }
                          className="shrink-0"
                        >
                          {state === "correct"
                            ? tr("Correct", "সঠিক")
                            : state === "wrong"
                              ? tr("Wrong", "ভুল")
                              : tr("Skipped", "বাদ")}
                        </Badge>
                      </div>

                      <div className="space-y-3 px-4 py-3">
                        <RichText
                          html={item.question_html}
                          text={item.question_text}
                          className="text-sm font-medium leading-relaxed text-foreground"
                        />

                        <div className="grid gap-1.5">
                          {options.map((option, optionIndex) => {
                            const isCorrect = optionIndex === correctIndex;
                            const isSelected = optionIndex === selected;

                            return (
                              <div
                                key={`${item.id}-${optionIndex}`}
                                className={cn(
                                  "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
                                  isCorrect && "border-emerald-500/60 bg-emerald-500/10",
                                  !isCorrect && isSelected && "border-destructive/60 bg-destructive/10",
                                  !isCorrect && !isSelected && "border-border bg-background",
                                )}
                              >
                                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-current font-mono text-[10px] font-semibold">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <span
                                  className="leading-relaxed text-foreground"
                                  dangerouslySetInnerHTML={{
                                    __html: renderMathInContent(option.t || option.h || "—"),
                                  }}
                                />
                                {isCorrect && (
                                  <CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-600" />
                                )}
                                {!isCorrect && isSelected && (
                                  <XCircle className="ml-auto size-4 shrink-0 text-destructive" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {correctIndex >= 0 && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {tr("Correct answer:", "সঠিক উত্তর:")}
                            </span>{" "}
                            {String.fromCharCode(65 + correctIndex)}
                          </p>
                        )}

                        {selected !== null && selected !== correctIndex && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {tr("Your answer:", "আপনার উত্তর:")}
                            </span>{" "}
                            {String.fromCharCode(65 + selected)}
                          </p>
                        )}

                        {(item.explanation || item.explanation_html) && (
                          <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {tr("Explanation", "ব্যাখ্যা")}
                            </p>
                            <RichText
                              html={item.explanation_html}
                              text={item.explanation}
                              className="mt-1 text-xs leading-relaxed text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{subjectLabel}</p>
            <p className="text-[11px] text-muted-foreground">
              {tr("MCQ practice", "MCQ অনুশীলন")} · {num(total)} {tr("questions", "টি প্রশ্ন")} ·{" "}
              {tr(`${num(answeredCount)} answered`, `${num(answeredCount)}টি উত্তর দেওয়া হয়েছে`)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-sm font-semibold tabular-nums",
                remaining <= 60
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border bg-secondary/50 text-foreground",
              )}
              aria-live="polite"
            >
              <Clock className="size-3.5" aria-hidden="true" />
              {formatClock(remaining)}
            </span>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setConfirmKind("submit")}
              aria-label={tr("Submit practice", "অনুশীলন সাবমিট করুন")}
            >
              <Flag className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{tr("Submit", "সাবমিট")}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              aria-label={tr("Exit practice", "অনুশীলন বন্ধ করুন")}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-3 px-3 py-3 sm:px-6 sm:py-5">
          <p className="text-[11px] text-muted-foreground">
            {tr(
              "Answer all questions on this page. Tap a selected option again to clear it.",
              "এক পেজে সব প্রশ্নের উত্তর দিন। নির্বাচিত অপশনে আবার চাপ দিলে উত্তর মুছে যাবে।",
            )}
          </p>

          {questions.map((item, index) => {
            const selected = answers[index] ?? null;
            const itemOptions = Array.isArray(item.options) ? item.options : [];

            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-3 py-1.5 text-[11px] text-muted-foreground sm:px-4">
                  <span className="font-semibold text-foreground">
                    {tr("Question", "প্রশ্ন")} {num(index + 1)}
                    <span className="font-normal text-muted-foreground"> / {num(total)}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {selected !== null && (
                      <span className="font-medium text-primary">
                        {tr("Answered", "উত্তর দেওয়া")}
                      </span>
                    )}
                    {item.source_db && <Badge variant="secondary">{item.source_db}</Badge>}
                  </div>
                </div>

                <CardContent className="space-y-3 p-3 sm:p-4">
                  <RichText
                    html={item.question_html}
                    text={item.question_text}
                    className="text-sm font-medium leading-relaxed text-foreground"
                  />

                  <div className="grid gap-1.5">
                    {itemOptions.map((option, optionIndex) => {
                      const isSelected = selected === optionIndex;

                      return (
                        <button
                          key={`${item.id}-${optionIndex}`}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleOption(index, optionIndex)}
                          className={cn(
                            "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left text-sm transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-primary/40 hover:bg-secondary/50",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-current",
                            )}
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span
                            className="leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: renderMathInContent(option.t || option.h || "—"),
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            type="button"
            className="w-full gap-1.5"
            onClick={() => setConfirmKind("submit")}
          >
            <Flag className="size-3.5" aria-hidden="true" />
            {tr("Submit", "সাবমিট করুন")}
          </Button>
        </div>
      </main>

      {confirmKind !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="space-y-4 p-6 text-center">
              <span
                className={cn(
                  "mx-auto flex size-12 items-center justify-center rounded-xl",
                  confirmKind === "submit"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {confirmKind === "submit" ? (
                  <Flag className="size-6" aria-hidden="true" />
                ) : (
                  <X className="size-6" aria-hidden="true" />
                )}
              </span>
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {confirmKind === "submit"
                    ? tr("Submit this session?", "সেশন সাবমিট করবেন?")
                    : tr("Exit practice?", "অনুশীলন বন্ধ করবেন?")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {confirmKind === "submit"
                    ? total - answeredCount > 0
                      ? tr(
                          `${num(total - answeredCount)} questions are still unanswered. You can review the result after submitting.`,
                          `এখনো ${num(total - answeredCount)}টি প্রশ্নের উত্তর দেওয়া হয়নি। সাবমিট করলে ফলাফল দেখতে পারবেন।`,
                        )
                      : tr(
                          "You answered every question. Submit to see your result.",
                          "সব প্রশ্নের উত্তর দেওয়া হয়েছে। ফলাফল দেখতে সাবমিট করুন।",
                        )
                    : tr(
                        "Your answers for this session will be lost.",
                        "এই সেশনের উত্তরগুলো হারিয়ে যাবে।",
                      )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmKind(null)}
                >
                  {tr("Cancel", "বাতিল")}
                </Button>
                <Button
                  variant={confirmKind === "submit" ? "default" : "destructive"}
                  className="flex-1"
                  onClick={confirmKind === "submit" ? submit : onExit}
                >
                  {confirmKind === "submit"
                    ? tr("Submit", "সাবমিট")
                    : tr("Exit", "বন্ধ করুন")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
