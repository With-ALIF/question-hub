"use client";

import { Inbox, MessageSquareReply } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { localeForLanguage } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import {
  TICKET_CATEGORIES,
  TICKET_STATUS_LABELS,
  type TicketRow,
  type TicketStatus,
} from "@/lib/tickets/types";

const STATUS_META: Record<TicketStatus, { className: string }> = {
  open: { className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  in_review: { className: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  resolved: {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  closed: { className: "border-border bg-secondary text-muted-foreground" },
};

export function SupportTicketList({ tickets }: { tickets: TicketRow[] }) {
  const { tr, lang, num } = useI18n();
  const locale = localeForLanguage(lang);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">
          {tr("No tickets yet", "এখনো কোনো টিকিট নেই")}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {tr(
            "Tickets you send will appear here with the admin's reply.",
            "আপনি পাঠানো টিকিটগুলো এডমিনের উত্তরসহ এখানে দেখাবে।",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const category = TICKET_CATEGORIES[ticket.category];
        const status = TICKET_STATUS_LABELS[ticket.status];

        return (
          <Card key={ticket.id} className="border-border/80 bg-card shadow-sm">
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`text-[11px] ${STATUS_META[ticket.status].className}`}>
                  {lang === "bn" ? status.bn : status.en}
                </Badge>
                <span className="font-mono text-[11px] font-semibold text-primary">
                  {ticket.ticket_code}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {lang === "bn" ? category.bn : category.en}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {num(new Date(ticket.created_at).toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }))}
                </span>
              </div>

              <p className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-foreground">
                {ticket.message}
              </p>

              {ticket.admin_reply ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <MessageSquareReply className="size-3.5" aria-hidden="true" />
                    {tr("Admin reply", "এডমিনের উত্তর")}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                    {ticket.admin_reply}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {tr(
                    "Waiting for the admin's reply.",
                    "এডমিনের উত্তরের অপেক্ষায়।",
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
