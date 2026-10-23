"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QuestionOption } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type QuestionListItem = {
  id: string;
  external_id: number | null;
  question_text: string;
  question_html?: string | null;
  options: QuestionOption[];
  correct_option: number | null;
  answer: string | null;
  explanation: string | null;
  explanation_html?: string | null;
  source_db: string | null;
  institution: string | null;
  year: string | null;
  topic_code: string | null;
  keyword: string | null;
  is_mcq: boolean;
};

type QuestionCardProps = {
  question: QuestionListItem;
  index: number;
};

function plainText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Source dumps keep diagrams/figures as <img> tags, which plain text
// extraction drops. `html` is the sanitized variant built by the shard script,
// so it only ever contains whitelisted tags and remote images.
function RichText({
  html,
  text,
  className,
}: {
  html: string | null | undefined;
  text: string | null | undefined;
  className?: string;
}) {
  const markup = typeof html === "string" ? html.trim() : "";

  if (!markup) {
    return <p className={cn("whitespace-pre-wrap", className)}>{plainText(text)}</p>;
  }

  return (
    <div
      className={cn("rich-text", className)}
      dangerouslySetInnerHTML={{ __html: markup }}
      onClick={(event) => {
        // Tap an image to open the full-size figure in a new tab.
        const target = event.target;
        if (target instanceof HTMLImageElement && target.src) {
          window.open(target.src, "_blank", "noopener,noreferrer");
        }
      }}
    />
  );
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const options = Array.isArray(question.options) ? question.options : [];
  const hasOptions = question.is_mcq && options.length > 0;
  const correctIndex =
    question.correct_option !== null && question.correct_option > 0
      ? question.correct_option - 1
      : -1;
  const isCorrect = selected !== null && selected === correctIndex;

  const reset = () => {
    setSelected(null);
    setRevealed(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/30 px-5 py-3 text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">#{index}</span>
          {question.external_id !== null && (
            <span className="font-mono">ID {question.external_id}</span>
          )}
          {question.source_db && <Badge variant="secondary">{question.source_db}</Badge>}
          {question.institution && <Badge variant="outline">{question.institution}</Badge>}
          {question.year && <Badge variant="outline">{question.year}</Badge>}
          {question.topic_code && <Badge variant="outline">{question.topic_code}</Badge>}
          {!question.is_mcq && <Badge variant="secondary">Written</Badge>}
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <RichText
            html={question.question_html}
            text={question.question_text}
            className="text-base font-medium leading-relaxed text-foreground"
          />

          {hasOptions ? (
            <div className="grid gap-2">
              {options.map((option, optionIndex) => {
                const optionText = plainText(option.t) || plainText(option.h);
                const state = !revealed
                  ? selected === optionIndex
                    ? "selected"
                    : "idle"
                  : optionIndex === correctIndex
                    ? "correct"
                    : optionIndex === selected
                      ? "incorrect"
                      : "idle";

                return (
                  <button
                    key={`${question.id}-${optionIndex}`}
                    type="button"
                    aria-pressed={selected === optionIndex}
                    onClick={() => {
                      if (!revealed) setSelected(optionIndex);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                      state === "idle" &&
                        "border-border bg-background hover:border-primary/40 hover:bg-secondary/50",
                      state === "selected" && "border-primary bg-primary/5",
                      state === "correct" &&
                        "border-emerald-500 bg-emerald-50 text-emerald-950",
                      state === "incorrect" &&
                        "border-destructive bg-destructive/5 text-destructive",
                    )}
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs font-semibold">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="leading-relaxed">{optionText || "—"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
              This is a written question. Use “Show answer” to reveal the answer and explanation.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={revealed ? "outline" : "default"}
              size="sm"
              onClick={() => setRevealed((value) => !value)}
            >
              {revealed ? "Hide answer" : selected !== null ? "Check answer" : "Show answer"}
            </Button>

            {revealed && selected !== null && (
              <Badge variant={isCorrect ? "default" : "destructive"}>
                {isCorrect ? "Correct" : "Not quite"}
              </Badge>
            )}

            {revealed && (
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                Try again
              </Button>
            )}
          </div>

          {revealed && (
            <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4 text-sm">
              {question.answer && (
                <p>
                  <span className="font-semibold text-foreground">Answer: </span>
                  <span className="text-muted-foreground">{plainText(question.answer)}</span>
                </p>
              )}
              {(question.explanation || question.explanation_html) && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-foreground">Explanation:</p>
                  <RichText
                    html={question.explanation_html}
                    text={question.explanation}
                    className="text-muted-foreground"
                  />
                </div>
              )}
              {!question.answer && !question.explanation && !question.explanation_html && (
                <p className="text-muted-foreground">No answer or explanation is available.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
