"use client";

import * as React from "react";
import { FilterMultiSelect } from "./FilterMultiSelect";
import type { QuestionFilterOption } from "@/lib/questions/constants";
import { useI18n } from "@/lib/i18n/client";

export interface ChapterMultiSelectProps {
  options: QuestionFilterOption[];
  selectedValues: string[];
  totalCount: number;
  onChange: (values: string[]) => void;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export function ChapterMultiSelect({
  options,
  selectedValues,
  totalCount,
  onChange,
  disabled = false,
  className,
}: ChapterMultiSelectProps) {
  const { tr } = useI18n();

  return (
    <FilterMultiSelect
      name="chapter"
      title={tr("Select Chapters", "অধ্যায় নির্বাচন করুন")}
      searchPlaceholder={tr("Search chapter...", "অধ্যায় খুঁজুন...")}
      allLabel={tr("All chapters", "সকল অধ্যায়")}
      unitLabel={tr("chapters selected", "টি অধ্যায়")}
      options={options}
      selectedValues={selectedValues}
      totalCount={totalCount}
      onChange={onChange}
      disabled={disabled}
      className={className}
    />
  );
}
