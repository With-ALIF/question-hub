"use client";

import * as React from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { QuestionFilterOption } from "@/lib/questions/constants";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export interface FilterMultiSelectProps {
  name: string;
  title: string;
  searchPlaceholder: string;
  allLabel?: string | undefined;
  unitLabel: string;
  options: QuestionFilterOption[];
  selectedValues: string[];
  totalCount: number;
  onChange: (values: string[]) => void;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export function FilterMultiSelect({
  name,
  title,
  searchPlaceholder,
  allLabel,
  unitLabel,
  options,
  selectedValues,
  totalCount,
  onChange,
  disabled = false,
  className,
}: FilterMultiSelectProps) {
  const { tr, num } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(selectedValues);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setDraft(selectedValues);
  }, [selectedValues]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(selectedValues);
      setSearch("");
    }
    setOpen(nextOpen);
  };

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const handleToggle = (value: string) => {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleValues = filteredOptions.map((o) => o.value);
    setDraft((prev) => Array.from(new Set([...prev, ...visibleValues])));
  };

  const handleClearDraft = () => {
    setDraft([]);
  };

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleClearDirectly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft([]);
    onChange([]);
  };

  // Calculate selected count and combined question count
  const selectedOptions = options.filter((o) => selectedValues.includes(o.value));
  const combinedQuestionCount = selectedOptions.reduce((acc, cur) => acc + cur.count, 0);

  const triggerLabel = React.useMemo(() => {
    if (selectedValues.length === 0) {
      return allLabel || `${tr("All", "সব")} (${num(totalCount)})`;
    }
    if (selectedValues.length === 1) {
      const match = options.find((o) => o.value === selectedValues[0]);
      return match ? `${match.label} (${num(match.count)})` : selectedValues[0];
    }
    return `${num(selectedValues.length)} ${unitLabel} (${num(combinedQuestionCount)})`;
  }, [selectedValues, options, totalCount, combinedQuestionCount, allLabel, unitLabel, tr, num]);

  return (
    <div className={cn("relative", className)}>
      <input type="hidden" name={name} value={selectedValues.join(",")} />

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors",
              "hover:bg-accent/40 focus-visible:ring-1 focus-visible:ring-ring text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              selectedValues.length > 0 && "font-medium text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5 truncate pr-2">
              {selectedValues.length > 1 && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[11px] font-bold rounded bg-primary/10 text-primary border-primary/20 shrink-0"
                >
                  {num(selectedValues.length)}
                </Badge>
              )}
              <span className="truncate">{triggerLabel}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {selectedValues.length > 0 && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClearDirectly}
                  title={tr("Clear selection", "মুছুন")}
                  className="rounded-full p-0.5 hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </span>
              )}
              <ChevronDown className="size-4 opacity-50" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={5}
          className="w-[calc(100vw-2rem)] sm:w-96 p-0 rounded-xl shadow-xl border-border bg-card"
        >
          <div className="p-3 border-b border-border/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                {title}
              </span>
              <span className="text-xs text-muted-foreground">
                {draft.length > 0
                  ? `${num(draft.length)} ${tr("selected", "টি নির্বাচিত")}`
                  : (allLabel || tr("All", "সব"))}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-8 text-xs rounded-md bg-muted/40"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-primary hover:underline font-medium text-[11px] cursor-pointer"
              >
                {tr("Select all visible", "দৃশ্যমান সব সিলেক্ট")}
              </button>
              {draft.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-destructive hover:underline font-medium text-[11px] cursor-pointer"
                >
                  {tr("Clear selection", "সব মুছুন")}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {tr("No options match your search.", "কোনো ফলাফল পাওয়া যায়নি।")}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = draft.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggle(opt.value)}
                    className={cn(
                      "flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors select-none",
                      isChecked
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggle(opt.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="size-4"
                      />
                      <span className="truncate">{opt.label}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 font-normal">
                      ({num(opt.count)})
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 bg-muted/20 border-t border-border/70">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs cursor-pointer"
            >
              {tr("Cancel", "বাতিল")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="h-8 gap-1 text-xs font-semibold cursor-pointer px-4"
            >
              <Check className="size-3.5" />
              <span>
                {draft.length > 0
                  ? `${tr("Apply", "প্রয়োগ করুন")} (${num(draft.length)})`
                  : tr("Apply All", "সব প্রয়োগ করুন")}
              </span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
