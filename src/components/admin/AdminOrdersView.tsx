"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  approveOrderAction,
  rejectOrderAction,
} from "@/lib/payments/admin-actions";
import type { AdminOrder, AdminOrderErrorCode } from "@/lib/payments/types";
import type { OrderStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "পেন্ডিং" },
  { value: "approved", label: "অ্যাপ্রুভড" },
  { value: "rejected", label: "রিজেক্টেড" },
  { value: "all", label: "সব" },
];

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "পেন্ডিং",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  approved: {
    label: "অ্যাপ্রুভড",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  rejected: {
    label: "রিজেক্টেড",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  cancelled: {
    label: "বাতিল",
    className: "border-border bg-muted text-muted-foreground",
  },
};

function formatDate(iso: string) {
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
  }).format(date);
}

function adminErrorText(code: AdminOrderErrorCode) {
  switch (code) {
    case "forbidden":
      return "আপনার এই কাজ করার অনুমতি নেই।";
    case "not_pending":
      return "এই অর্ডারটি ইতিমধ্যে প্রসেস করা হয়েছে।";
    case "not_found":
      return "অর্ডারটি পাওয়া যায়নি।";
    default:
      return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  }
}

export function AdminOrdersView({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc[order.status] += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, cancelled: 0 } as Record<OrderStatus, number>,
    );
  }, [orders]);

  const approvedRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.status === "approved")
        .reduce((sum, order) => sum + order.amount_bdt, 0),
    [orders],
  );

  const visibleOrders = useMemo(
    () => (filter === "all" ? orders : orders.filter((order) => order.status === filter)),
    [filter, orders],
  );

  const handleApprove = async (order: AdminOrder) => {
    const confirmed = window.confirm(
      `অর্ডার ${order.order_code} (৳${order.amount_bdt}) অ্যাপ্রুভ করবেন?\n\n` +
        `${order.customerEmail ?? order.user_id}\n${order.plan_name} · TrxID: ${order.trx_id}`,
    );

    if (!confirmed) return;

    setError(null);
    setBusyId(order.id);
    const result = await approveOrderAction(order.id);
    setBusyId(null);

    if (!result.ok) {
      setError(adminErrorText(result.error));
      return;
    }

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? { ...item, status: "approved" as const, reviewed_at: new Date().toISOString() }
          : item,
      ),
    );
  };

  const handleReject = async (order: AdminOrder) => {
    setError(null);
    setBusyId(order.id);
    const result = await rejectOrderAction(order.id, rejectNote);
    setBusyId(null);

    if (!result.ok) {
      setError(adminErrorText(result.error));
      return;
    }

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? {
              ...item,
              status: "rejected" as const,
              admin_note: rejectNote.trim() || null,
              reviewed_at: new Date().toISOString(),
            }
          : item,
      ),
    );
    setRejectingId(null);
    setRejectNote("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-4" aria-hidden="true" />
            </span>
            <h1 className="font-display text-xl font-bold text-foreground">
              পেমেন্ট ও অর্ডার
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {counts.pending}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            bKash/Nagad সেন্ড মানির TrxID যাচাই করে অর্ডার অ্যাপ্রুভ করুন। অ্যাপ্রুভ করলেই
            ইউজারের সাবস্ক্রিপশন চালু হবে।
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="h-8 gap-1.5 self-start text-xs sm:self-auto"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          রিফ্রেশ
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">পেন্ডিং অর্ডার</span>
            <Clock3 className="size-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            {counts.pending}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">অ্যাপ্রুভড আয়</span>
            <BadgeCheck className="size-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">
            ৳{approvedRevenue.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">মোট অর্ডার</span>
            <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{orders.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((item) => {
          const count =
            item.value === "all" ? orders.length : counts[item.value];

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === item.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  filter === item.value
                    ? "bg-primary-foreground/20"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
        >
          {error}
        </p>
      )}

      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">এই তালিকায় কোনো অর্ডার নেই</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            নতুন পেমেন্ট এলে এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleOrders.map((order) => {
            const status = STATUS_META[order.status];
            const isBusy = busyId === order.id;

            return (
              <article
                key={order.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground">{order.plan_name}</h2>
                      <Badge variant="outline" className={cn("text-[10px]", status.className)}>
                        {status.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          order.payment_method === "bkash"
                            ? "border-[#E2136E]/30 bg-[#E2136E]/5 text-[#C1105D] dark:text-[#FF6FAE]"
                            : "border-[#F6921E]/40 bg-[#F6921E]/10 text-[#B85600] dark:text-[#FFB25B]",
                        )}
                      >
                        {order.payment_method === "bkash" ? "bKash" : "Nagad"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {order.customerName ? `${order.customerName} · ` : ""}
                      {order.customerEmail ?? order.user_id}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-foreground">
                      ৳{order.amount_bdt.toLocaleString("en-US")}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {order.order_code}
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-secondary/40 px-3 py-2.5 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      TrxID
                    </dt>
                    <dd className="font-mono font-semibold text-foreground">{order.trx_id}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      সেন্ডার
                    </dt>
                    <dd className="font-mono text-foreground">{order.sender_number ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      মেয়াদ
                    </dt>
                    <dd className="text-foreground">{order.duration_days} দিন</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      সময়
                    </dt>
                    <dd className="text-foreground">{formatDate(order.created_at)}</dd>
                  </div>
                </dl>

                {order.admin_note && (
                  <p className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    নোট: {order.admin_note}
                  </p>
                )}

                {order.status === "pending" && (
                  <div className="mt-3">
                    {rejectingId === order.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={rejectNote}
                          onChange={(event) => setRejectNote(event.target.value.slice(0, 300))}
                          placeholder="রিজেক্টের কারণ লিখুন (ইউজার ড্যাশবোর্ডে দেখতে পাবে)…"
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                            onClick={() => void handleReject(order)}
                            className="h-8 gap-1.5 text-xs"
                          >
                            {isBusy ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <XCircle className="size-3.5" aria-hidden="true" />
                            )}
                            রিজেক্ট নিশ্চিত করুন
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectNote("");
                            }}
                            className="h-8 text-xs"
                          >
                            বাতিল
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => void handleApprove(order)}
                          className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                        >
                          {isBusy ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <BadgeCheck className="size-3.5" aria-hidden="true" />
                          )}
                          অ্যাপ্রুভ করুন
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectingId(order.id);
                            setRejectNote("");
                            setError(null);
                          }}
                          className="h-8 gap-1.5 text-xs text-destructive hover:border-destructive/40 hover:text-destructive"
                        >
                          <XCircle className="size-3.5" aria-hidden="true" />
                          রিজেক্ট
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
