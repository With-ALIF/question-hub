"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Save,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { replyTicketAction, updateTicketStatusAction } from "@/lib/tickets/admin-actions";
import {
  isLockedTicketStatus,
  TICKET_CATEGORIES,
  TICKET_MESSAGE_MAX,
  TICKET_STATUS_LABELS,
  type AdminTicket,
  type TicketStatus,
} from "@/lib/tickets/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<TicketStatus, string> = {
  open: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  in_review: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-border bg-muted text-muted-foreground",
};

const STATUS_ORDER: TicketStatus[] = ["open", "in_review", "resolved"];

type PendingAction =
  | { kind: "status"; status: TicketStatus }
  | { kind: "reply"; status: TicketStatus };

function formatDateTime(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function confirmCopy(current: TicketStatus, next: TicketStatus, sendsReply: boolean) {
  const currentLabel = TICKET_STATUS_LABELS[current].bn;
  const nextLabel = TICKET_STATUS_LABELS[next].bn;

  if (isLockedTicketStatus(next)) {
    return {
      title: `টিকিটটি "${nextLabel}" করে লক করবেন?`,
      body: sendsReply
        ? `উত্তরটি সংরক্ষিত হবে এবং শিক্ষার্থীর ইমেইলে চলে যাবে। ${nextLabel} টিকিট আর সম্পাদনা, পুনরায় খোলা বা মোছা যাবে না।`
        : `${nextLabel} টিকিট আর সম্পাদনা, পুনরায় খোলা বা মোছা যাবে না।`,
      action: sendsReply ? "লক করে পাঠান" : "লক করুন",
      danger: false,
    };
  }

  return {
    title: `"${currentLabel}" থেকে "${nextLabel}" করবেন?`,
    body: "স্ট্যাটাস ফিরিয়ে নিলে টিকিটটি আবার সম্পাদনাযোগ্য তালিকায় দেখা যাবে।",
    action: "স্ট্যাটাস বদলান",
    danger: true,
  };
}

type Props = {
  ticket: AdminTicket;
  onUpdated: (ticketId: string, patch: Partial<AdminTicket>) => void;
};

export function AdminTicketCard({ ticket, onUpdated }: Props) {
  const [reply, setReply] = useState(ticket.admin_reply ?? "");
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const category = TICKET_CATEGORIES[ticket.category];
  const requester = ticket.userName || ticket.userEmail || "অ্যাকাউন্ট মুছে ফেলা হয়েছে";
  const locked = isLockedTicketStatus(ticket.status);

  const failureText = (code: string) => {
    if (code === "forbidden") return "এই অ্যাকাউন্ট দিয়ে উত্তর দেওয়া যায় না।";
    if (code === "not_found") return "টিকিটটি আর পাওয়া যায়নি।";
    if (code === "locked") return "টিকিটটি লক করা হয়েছে — সম্পাদনা করা যাবে না।";
    return "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।";
  };

  const runSave = async (nextStatus: TicketStatus) => {
    setSaving(true);
    setError(null);

    const result = await replyTicketAction({ ticketId: ticket.id, reply, status: nextStatus });
    setSaving(false);

    if (!result.ok) {
      setError(failureText(result.error));
      return false;
    }

    onUpdated(ticket.id, {
      admin_reply: reply.trim(),
      status: nextStatus,
      replied_at: new Date().toISOString(),
    });
    return true;
  };

  const runQuickStatus = async (nextStatus: TicketStatus) => {
    setSaving(true);
    setError(null);

    const result = await updateTicketStatusAction(ticket.id, nextStatus);
    setSaving(false);

    if (!result.ok) {
      setError(result.error === "locked" ? failureText("locked") : "স্ট্যাটাস পরিবর্তন করা যায়নি।");
      return false;
    }

    setStatus(nextStatus);
    onUpdated(ticket.id, { status: nextStatus });
    return true;
  };

  const handleSave = () => {
    if (reply.trim().length === 0) {
      return;
    }

    if (status !== ticket.status) {
      setPending({ kind: "reply", status });
      return;
    }

    void runSave(status);
  };

  const handleQuickStatus = (nextStatus: TicketStatus) => {
    if (nextStatus === ticket.status) {
      return;
    }

    setPending({ kind: "status", status: nextStatus });
  };

  const confirm = pending ? confirmCopy(ticket.status, pending.status, pending.kind === "reply") : null;

  return (
    <Card className={cn("border-border/80 bg-card shadow-sm", locked && "border-emerald-500/30")}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("text-[11px]", STATUS_META[ticket.status])}>
            {TICKET_STATUS_LABELS[ticket.status].bn}
          </Badge>
          {locked ? (
            <Badge variant="outline" className="gap-1 border-emerald-500/40 text-[11px] text-emerald-700 dark:text-emerald-300">
              <Lock className="size-3" aria-hidden="true" />
              লক
            </Badge>
          ) : null}
          <span className="font-mono text-[11px] font-semibold text-primary">{ticket.ticket_code}</span>
          <span className="text-xs font-semibold text-foreground">{category.bn}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {formatDateTime(ticket.created_at)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden="true" />
            {requester}
          </span>
          {ticket.userEmail ? (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" aria-hidden="true" />
              {ticket.userEmail}
            </span>
          ) : null}
        </div>

        <p className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-foreground">
          {ticket.message}
        </p>

        {ticket.replied_at ? (
          <p className="text-[11px] text-muted-foreground">
            সর্বশেষ উত্তর: {formatDateTime(ticket.replied_at)}
          </p>
        ) : null}

        {locked ? (
          <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <Lock className="size-3.5" aria-hidden="true" />
              টিকিট লক করা — আর সম্পাদনা যাবে না
            </div>
            {ticket.admin_reply ? (
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                {ticket.admin_reply}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">এই টিকিটে লেখা উত্তর দেওয়া হয়নি।</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_ORDER.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleQuickStatus(item)}
                  disabled={saving || item === ticket.status}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    item === status
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    saving || item === ticket.status ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  )}
                >
                  {TICKET_STATUS_LABELS[item].bn}
                  {isLockedTicketStatus(item) ? " (লক)" : ""}
                </button>
              ))}
            </div>

            <Textarea
              rows={4}
              maxLength={TICKET_MESSAGE_MAX}
              placeholder="শিক্ষার্থীকে উত্তর লিখুন…"
              value={reply}
              onChange={(event) => {
                setReply(event.target.value);
                setError(null);
              }}
              className="resize-none text-xs"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                উত্তর পাঠালে স্ট্যাটাস
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as TicketStatus);
                    setError(null);
                  }}
                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none"
                >
                  {STATUS_ORDER.map((item) => (
                    <option key={item} value={item}>
                      {TICKET_STATUS_LABELS[item].bn}
                      {isLockedTicketStatus(item) ? " (লক হবে)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving || reply.trim().length === 0}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-3.5" aria-hidden="true" />
                )}
                {saving
                  ? "সংরক্ষণ হচ্ছে…"
                  : isLockedTicketStatus(status)
                    ? "উত্তর দিয়ে লক করুন"
                    : "উত্তর সংরক্ষণ করুন"}
              </Button>
            </div>

            {error ? (
              <p role="alert" className="text-[11px] font-medium text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        )}

        {!locked && ticket.admin_reply && ticket.admin_reply !== reply ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              সংরক্ষিত উত্তর
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
              {ticket.admin_reply}
            </p>
          </div>
        ) : null}
      </CardContent>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirm?.danger ? (
                <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />
              ) : (
                <Lock className="size-4 text-emerald-600" aria-hidden="true" />
              )}
              {confirm?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirm?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pending) {
                  return;
                }

                if (pending.kind === "reply") {
                  await runSave(pending.status);
                } else {
                  await runQuickStatus(pending.status);
                }

                setPending(null);
              }}
            >
              {confirm?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
