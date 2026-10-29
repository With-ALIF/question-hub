"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Search,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cancelSubscriptionAction } from "@/lib/payments/admin-actions";
import type { AdminOrderErrorCode, AdminSubscription } from "@/lib/payments/types";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusMeta(status: AdminSubscription["effectiveStatus"]) {
  switch (status) {
    case "active":
      return {
        label: "সক্রিয়",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };
    case "expired":
      return {
        label: "মেয়াদ শেষ",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
    default:
      return {
        label: "বাতিল",
        className: "border-border bg-muted text-muted-foreground",
      };
  }
}

function adminErrorText(code: AdminOrderErrorCode) {
  switch (code) {
    case "forbidden":
      return "আপনার এই কাজ করার অনুমতি নেই।";
    case "not_found":
      return "সাবস্ক্রিপশনটি পাওয়া যায়নি।";
    default:
      return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  }
}

type SubscriptionFilter = "active" | "expired" | "cancelled" | "all";

export function AdminSubscriptionsView({
  initialSubscriptions,
  pendingOrderCount = 0,
}: {
  initialSubscriptions: AdminSubscription[];
  pendingOrderCount?: number;
}) {
  const [subscriptions, setSubscriptions] =
    useState<AdminSubscription[]>(initialSubscriptions);
  const [filter, setFilter] = useState<SubscriptionFilter>("active");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancellingSub, setCancellingSub] = useState<AdminSubscription | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const counts = useMemo(() => {
    return subscriptions.reduce(
      (acc, sub) => {
        acc[sub.effectiveStatus] += 1;
        acc.all += 1;
        return acc;
      },
      { active: 0, expired: 0, cancelled: 0, all: 0 } as Record<
        SubscriptionFilter,
        number
      >,
    );
  }, [subscriptions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchesFilter = (sub: AdminSubscription) =>
      filter === "all" || sub.effectiveStatus === filter;

    if (!q) return subscriptions.filter(matchesFilter);

    return subscriptions.filter(
      (sub) =>
        matchesFilter(sub) &&
        (sub.customerEmail?.toLowerCase().includes(q) ||
          sub.customerName?.toLowerCase().includes(q) ||
          sub.plan_name.toLowerCase().includes(q) ||
          sub.user_id.toLowerCase().includes(q)),
    );
  }, [filter, search, subscriptions]);

  const handleConfirmCancel = async () => {
    if (!cancellingSub) return;
    const sub = cancellingSub;

    setError(null);
    setSuccessMessage(null);
    setBusyId(sub.id);

    const result = await cancelSubscriptionAction(sub.id, cancelReason);
    setBusyId(null);

    if (!result.ok) {
      setError(adminErrorText(result.error));
      return;
    }

    setSubscriptions((prev) =>
      prev.map((item) =>
        item.id === sub.id
          ? {
              ...item,
              status: "cancelled" as const,
              effectiveStatus: "cancelled" as const,
              remainingDays: 0,
            }
          : item,
      ),
    );
    setSuccessMessage(
      `"${sub.plan_name}" প্ল্যানটি সফলভাবে বাতিল করা হয়েছে এবং ${
        sub.customerEmail ?? "স্টুডেন্ট"
      }-কে ইমেইল পাঠানো হয়েছে।`,
    );
    setCancellingSub(null);
    setCancelReason("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            সাবস্ক্রিপশন ব্যবস্থাপনা
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active, expired ও cancelled প্ল্যান দেখুন, মেয়াদ ও উৎস যাচাই করুন এবং প্রয়োজনে বাতিল করুন।
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingOrderCount > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400"
            >
              {pendingOrderCount} pending payment
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {counts.active} টি সক্রিয়
          </Badge>
        </div>
      </div>

      {pendingOrderCount > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {pendingOrderCount} payment awaiting admin approval. Paid access is not granted until approval.
          </span>
          <a href="/admin/orders" className="font-semibold underline underline-offset-4">
            Review payments
          </a>
        </div>
      )}

      {/* Alert Messages */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1">
        {(
          [
            ["active", "সক্রিয়"],
            ["expired", "মেয়াদ শেষ"],
            ["cancelled", "বাতিল"],
            ["all", "সব"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === value
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label} ({counts[value]})
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="নাম, ইমেইল বা প্ল্যান দিয়ে খুঁজুন…"
          className="pl-9 text-xs"
        />
      </div>

      {/* Subscriptions List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {search
              ? "কোনো সাবস্ক্রিপশন খুঁজে পাওয়া যায়নি"
              : filter === "active"
                ? "বর্তমানে কোনো সক্রিয় সাবস্ক্রিপশন নেই"
                : "এই তালিকায় কোনো সাবস্ক্রিপশন নেই"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? "অন্য কোনো নাম বা ইমেইল দিয়ে চেষ্টা করে দেখুন।"
              : "নতুন কোনো অর্ডার অনুমোদিত হলে তা এখানে দেখতে পাবেন।"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {filtered.map((sub) => {
            const isBusy = busyId === sub.id;

            return (
              <div
                key={sub.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80 lg:flex-row lg:items-center"
              >
                {/* Left: Student & Plan Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-foreground">
                      {sub.plan_name}
                    </span>
                    {sub.amountBdt != null && (
                      <Badge variant="secondary" className="text-xs font-semibold">
                        ৳{sub.amountBdt}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${statusMeta(sub.effectiveStatus).className}`}
                    >
                      {statusMeta(sub.effectiveStatus).label}
                    </Badge>
                    {sub.source === "custom" && (
                      <Badge variant="outline" className="text-[10px]">
                        Custom access
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {sub.customerName && (
                      <span className="inline-flex items-center gap-1">
                        <User className="size-3.5" aria-hidden="true" />
                        <span className="font-medium text-foreground">
                          {sub.customerName}
                        </span>
                      </span>
                    )}
                    {sub.customerEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3.5" aria-hidden="true" />
                        <span>{sub.customerEmail}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" aria-hidden="true" />
                      শুরু: {formatDate(sub.starts_at)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Clock3 className="size-3" aria-hidden="true" />
                      মেয়াদ শেষ: {formatDate(sub.expires_at)}
                    </span>
                    {sub.effectiveStatus === "active" && sub.remainingDays !== null && (
                      <span className="inline-flex items-center gap-1">
                        বাকি: {sub.remainingDays} দিন
                      </span>
                    )}
                  </div>

                  {sub.notes && (
                    <p className="rounded-md bg-secondary/50 px-2 py-1 text-[11px] text-muted-foreground">
                      নোট: {sub.notes}
                    </p>
                  )}
                </div>

                {/* Right: Action */}
                <div className="flex items-center gap-2 pt-2 lg:pt-0">
                  {sub.effectiveStatus === "active" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={isBusy}
                      onClick={() => {
                        setError(null);
                        setSuccessMessage(null);
                        setCancelReason("");
                        setCancellingSub(sub);
                      }}
                      className="h-8 gap-1.5 text-xs font-medium"
                    >
                      {isBusy ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <XCircle className="size-3.5" aria-hidden="true" />
                      )}
                      প্ল্যান বাতিল করুন
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      No action needed
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog
        open={Boolean(cancellingSub)}
        onOpenChange={(open) => {
          if (!open) {
            setCancellingSub(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-2">
              <ShieldAlert className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle className="font-display text-lg font-bold text-foreground">
              প্ল্যান বাতিল নিশ্চিতকরণ
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              আপনি কি নিশ্চিত যে আপনি এই স্টুডেন্টের সক্রিয় প্ল্যানটি বাতিল ও রিমুভ করতে চান? বাতিলের সাথে সাথে স্টুডেন্টের কাছে একটি নোটিফিকেশন ইমেইল যাবে।
            </DialogDescription>
          </DialogHeader>

          {cancellingSub && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">প্ল্যান:</span>
                <span className="font-bold text-foreground">
                  {cancellingSub.plan_name}
                </span>
              </div>
              {cancellingSub.customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">স্টুডেন্ট:</span>
                  <span className="font-medium text-foreground">
                    {cancellingSub.customerName}
                  </span>
                </div>
              )}
              {cancellingSub.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ইমেইল:</span>
                  <span className="text-foreground">
                    {cancellingSub.customerEmail}
                  </span>
                </div>
              )}
              {cancellingSub.amountBdt != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">পরিমাণ:</span>
                  <span className="font-semibold text-foreground">
                    ৳{cancellingSub.amountBdt}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              বাতিলের কারণ (ঐচ্ছিক, স্টুডেন্টের কাছে ইমেইলে যাবে):
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value.slice(0, 300))}
              placeholder="যেমন: পেমেন্ট ডিসপিউট, ইউজার অনুরোধ ইত্যাদি…"
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(busyId)}
              onClick={() => {
                setCancellingSub(null);
                setCancelReason("");
              }}
              className="text-xs"
            >
              ফিরে যান
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={Boolean(busyId)}
              onClick={() => void handleConfirmCancel()}
              className="gap-1.5 text-xs font-semibold"
            >
              {busyId ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <XCircle className="size-3.5" aria-hidden="true" />
              )}
              হ্যাঁ, বাতিল ও ইমেইল পাঠান
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
