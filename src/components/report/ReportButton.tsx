"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportModal } from "./ReportModal";
import { cn } from "@/lib/utils";

type ReportButtonProps = {
  questionId: string;
  className?: string;
  compact?: boolean;
};

export function ReportButton({
  questionId,
  className,
  compact = false,
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer",
          compact ? "px-2" : "px-2.5",
          className
        )}
        title="প্রশ্নে ভুল থাকলে রিপোর্ট করুন"
        aria-label="Report mistake in question"
      >
        <Flag className="size-3.5 text-destructive/80" aria-hidden="true" />
        {!compact && <span>রিপোর্ট</span>}
      </Button>

      {isOpen && (
        <ReportModal
          questionId={questionId}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
