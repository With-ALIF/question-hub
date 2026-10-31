"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Inbox, LifeBuoy, RefreshCw, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminTicketCard } from "@/components/admin/AdminTicketCard";
import { TicketTemplateSection } from "@/components/admin/TicketTemplateSection";
import {
  isLockedTicketStatus,
  TICKET_CATEGORIES,
  TICKET_STATUS_LABELS,
  type AdminTicket,
  type TicketCategory,
  type TicketStatus,
} from "@/lib/tickets/types";
import { cn } from "@/lib/utils";

type StatusFilter = TicketStatus | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: TICKET_STATUS_LABELS.open.bn },
  { value: "in_review", label: TICKET_STATUS_LABELS.in_review.bn },
  { value: "resolved", label: TICKET_STATUS_LABELS.resolved.bn },
  { value: "all", label: "সব" },
];

const CATEGORY_FILTERS = Object.keys(TICKET_CATEGORIES) as (TicketCategory | "all")[];

export function AdminSupportView({ initialTickets }: { initialTickets: AdminTicket[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<AdminTicket[]>(initialTickets);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pickedTicketId, setPickedTicketId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      open: 0,
      in_review: 0,
      resolved: 0,
      closed: 0,
      all: tickets.length,
    };

    for (const ticket of tickets) {
      base[ticket.status] += 1;
    }

    return base;
  }, [tickets]);

  const visible = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          (statusFilter === "all" || ticket.status === statusFilter) &&
          (categoryFilter === "all" || ticket.category === categoryFilter),
      ),
    [tickets, statusFilter, categoryFilter],
  );

  const handleUpdated = (ticketId: string, patch: Partial<AdminTicket>) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, ...patch } : ticket)));
  };

  /** Tickets still open for a written answer, in list order. */
  const editableTickets = useMemo(
    () => visible.filter((ticket) => !isLockedTicketStatus(ticket.status)),
    [visible],
  );

  const targetTicketId =
    pickedTicketId && editableTickets.some((ticket) => ticket.id === pickedTicketId)
      ? pickedTicketId
      : editableTickets[0]?.id ?? null;

  const writeDraft = (ticketId: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [ticketId]: value }));
  };

  const appendDraft = (ticketId: string, body: string) => {
    setDrafts((prev) => {
      const current =
        prev[ticketId] ?? tickets.find((ticket) => ticket.id === ticketId)?.admin_reply ?? "";
      const trimmed = current.trimEnd();

      return { ...prev, [ticketId]: trimmed ? `${trimmed}\n\n${body}` : body };
    });
  };

  const draftFor = (ticket: AdminTicket) => drafts[ticket.id] ?? ticket.admin_reply ?? "";

  const handleRefresh = () => {
    setRefreshing(true);
    setTickets(initialTickets);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LifeBuoy className="size-4" aria-hidden="true" />
            </span>
            <h1 className="font-display text-xl font-bold text-foreground">সাপোর্ট টিকিট</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {tickets.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            শিক্ষার্থী ও শিক্ষকদের টিকিট পড়ুন, উত্তর লিখে স্ট্যাটাস পরিবর্তন করুন।
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 cursor-pointer gap-1.5 self-start text-xs sm:self-auto"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
          রিফ্রেশ
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">নতুন টিকিট</span>
            <Inbox className="size-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{counts.open}</p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">পর্যালোচনায়</span>
            <RefreshCw className="size-4 text-blue-600" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{counts.in_review}</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">সমাধান হয়েছে</span>
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{counts.resolved}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatusFilter(item.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === item.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  statusFilter === item.value
                    ? "bg-primary-foreground/20"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {counts[item.value]}
              </span>
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as TicketCategory | "all")}
          aria-label="বিভাগ অনুযায়ী ফিল্টার"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none sm:w-72"
        >
          <option value="all">সব বিভাগ</option>
          {CATEGORY_FILTERS.map((value) =>
            value === "all" ? null : (
              <option key={value} value={value}>
                {TICKET_CATEGORIES[value].bn}
              </option>
            ),
          )}
        </select>
      </div>

      {tickets.length > 0 ? (
        <TicketTemplateSection
          editableTickets={editableTickets}
          targetTicketId={targetTicketId}
          onTargetChange={setPickedTicketId}
          onPick={(body) => {
            if (targetTicketId) {
              appendDraft(targetTicketId, body);
            }
          }}
        />
      ) : null}

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">কোনো টিকিট নেই</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            ব্যবহারকারীরা /support পেজ থেকে টিকিট পাঠালে এখানে দেখা যাবে।
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <SearchX className="mb-2 size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">এই ফিল্টারে কোনো টিকিট মেলেনি।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visible.map((ticket) => (
            <AdminTicketCard
              key={ticket.id}
              ticket={ticket}
              reply={draftFor(ticket)}
              onReplyChange={(value) => writeDraft(ticket.id, value)}
              onReplyFocus={() => setPickedTicketId(ticket.id)}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
