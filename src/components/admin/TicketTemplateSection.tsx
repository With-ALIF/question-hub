"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MousePointerClick, StickyNote } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GENERAL_TEMPLATE_GROUP,
  REPLY_TEMPLATES,
  TEMPLATE_ORDER,
  type TemplateGroupId,
} from "@/lib/tickets/templates";
import { TICKET_CATEGORIES, type AdminTicket, type TicketCategory } from "@/lib/tickets/types";
import { cn } from "@/lib/utils";

const GROUP_LABELS: Record<TemplateGroupId, string> = {
  ...Object.fromEntries(
    (Object.keys(TICKET_CATEGORIES) as TicketCategory[]).map((key) => [
      key,
      TICKET_CATEGORIES[key].bn,
    ]),
  ),
  [GENERAL_TEMPLATE_GROUP]: "সাধারণ",
} as Record<TemplateGroupId, string>;

type Props = {
  /** Tickets the admin may still write to, in list order. */
  editableTickets: AdminTicket[];
  targetTicketId: string | null;
  onTargetChange: (ticketId: string) => void;
  onPick: (body: string) => void;
};

export function TicketTemplateSection({
  editableTickets,
  targetTicketId,
  onTargetChange,
  onPick,
}: Props) {
  const [group, setGroup] = useState<TemplateGroupId | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const target = editableTickets.find((ticket) => ticket.id === targetTicketId) ?? null;
  const activeGroup: TemplateGroupId =
    group ?? target?.category ?? (GENERAL_TEMPLATE_GROUP as TemplateGroupId);
  const hasTarget = target !== null;

  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <StickyNote className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-foreground">রেডি উত্তর টেমপ্লেট</h2>
              <p className="text-[11px] text-muted-foreground">
                বিভাগ বেছে টেমপ্লেট চাপলে নির্বাচিত টিকিটের উত্তরে যোগ হবে।
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <MousePointerClick className="size-3.5" aria-hidden="true" />
              টিকিট
              <select
                value={targetTicketId ?? ""}
                onChange={(event) => onTargetChange(event.target.value)}
                aria-label="টেমপ্লেট কোন টিকিটে বসানো হবে"
                className="max-w-[15rem] rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none"
              >
                {editableTickets.length === 0 ? <option value="">কোনো টিকিট নেই</option> : null}
                {editableTickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.ticket_code} · {TICKET_CATEGORIES[ticket.category].bn} ·{" "}
                    {ticket.userName || ticket.userEmail || "মুছে ফেলা অ্যাকাউন্ট"}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {collapsed ? (
                <ChevronDown className="size-3.5" aria-hidden="true" />
              ) : (
                <ChevronUp className="size-3.5" aria-hidden="true" />
              )}
              {collapsed ? "খুলুন" : "ছোট করুন"}
            </button>
          </div>
        </div>

        {!collapsed ? (
          <Tabs
            value={activeGroup}
            onValueChange={(value) => setGroup(value as TemplateGroupId)}
            className="mt-4"
          >
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {TEMPLATE_ORDER.map((value) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "h-7 rounded-full border px-2.5 text-[11px] font-semibold shadow-none transition-colors",
                    value === target?.category ? "border-primary/50" : "border-border",
                  )}
                >
                  {GROUP_LABELS[value]}
                </TabsTrigger>
              ))}
            </TabsList>

            {TEMPLATE_ORDER.map((value) => (
              <TabsContent key={value} value={value} className="mt-3">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {REPLY_TEMPLATES[value].map((template) => (
                    <button
                      key={template.title}
                      type="button"
                      disabled={!hasTarget}
                      onClick={() => onPick(template.body)}
                      title={hasTarget ? template.body : "আগে একটি টিকিট বেছে নিন"}
                      className={cn(
                        "rounded-lg border border-border/70 bg-background px-3 py-2.5 text-left transition-colors",
                        hasTarget
                          ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                          : "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span className="block text-[11px] font-bold text-foreground">
                        {template.title}
                      </span>
                      <span className="mt-1 block line-clamp-3 whitespace-pre-line text-[10px] leading-relaxed text-muted-foreground">
                        {template.body}
                      </span>
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}

            <p className="mt-3 text-[10px] text-muted-foreground">
              [ ] দিয়ে চিহ্নিত অংশগুলো টিকিট অনুযায়ী বদলে নিন — তারপর উত্তর সংরক্ষণ করুন।
            </p>
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  );
}
