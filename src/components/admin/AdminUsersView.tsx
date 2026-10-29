"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Clock3,
  Copy,
  GraduationCap,
  Layers,
  LogIn,
  Mail,
  Search,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AdminSubscriberUser } from "@/lib/payments/types";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
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

function formatDateShort(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function userPlanMeta(status: AdminSubscriberUser["effectiveStatus"]) {
  switch (status) {
    case "active":
      return {
        label: "সক্রিয় পেইড",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };
    case "free":
      return {
        label: "ফ্রি প্ল্যান",
        className:
          "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
      };
    case "expired":
      return {
        label: "মেয়াদ শেষ",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
    case "cancelled":
      return {
        label: "বাতিল",
        className:
          "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
      };
    default:
      return {
        label: "অজানা",
        className: "border-border bg-muted text-muted-foreground",
      };
  }
}

type UserFilter = "all" | "free" | "active" | "other";

export function AdminUsersView({
  initialUsers,
}: {
  initialUsers: AdminSubscriberUser[];
}) {
  const [users] = useState<AdminSubscriberUser[]>(initialUsers);
  const [filter, setFilter] = useState<UserFilter>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc.all += 1;
        if (user.effectiveStatus === "active") acc.active += 1;
        else if (user.effectiveStatus === "free") acc.free += 1;
        else acc.other += 1;
        return acc;
      },
      { all: 0, active: 0, free: 0, other: 0 },
    );
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchesFilter = (user: AdminSubscriberUser) => {
      if (filter === "all") return true;
      if (filter === "active") return user.effectiveStatus === "active";
      if (filter === "free") return user.effectiveStatus === "free";
      if (filter === "other")
        return (
          user.effectiveStatus === "expired" ||
          user.effectiveStatus === "cancelled"
        );
      return true;
    };

    if (!q) return users.filter(matchesFilter);

    return users.filter(
      (user) =>
        matchesFilter(user) &&
        (user.email?.toLowerCase().includes(q) ||
          user.fullName?.toLowerCase().includes(q) ||
          user.currentPlanName.toLowerCase().includes(q) ||
          user.lastPlanName?.toLowerCase().includes(q) ||
          user.id.toLowerCase().includes(q)),
    );
  }, [filter, search, users]);

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            ব্যবহারকারী তালিকা (All Users)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            একবার হলেও সাইন-ইন করা সকল ইউজার এবং তারা বর্তমানে কোন প্ল্যান ব্যবহার করছেন তার তালিকা।
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          >
            সর্বমোট {counts.all} জন ইউজার
          </Badge>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">মোট ইউজার</span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{counts.all}</p>
          <span className="text-[11px] text-muted-foreground">সাইন-ইন কৃত একাউন্ট</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">সক্রিয় পেইড</span>
            <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {counts.active}
          </p>
          <span className="text-[11px] text-muted-foreground">পেইড প্ল্যান ব্যবহারকারী</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">ফ্রি প্ল্যান</span>
            <GraduationCap className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {counts.free}
          </p>
          <span className="text-[11px] text-muted-foreground">স্টার্টার ফ্রি ইউজার</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">মেয়াদ শেষ / বাতিল</span>
            <Clock3 className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{counts.other}</p>
          <span className="text-[11px] text-muted-foreground">পূর্বে পেইড নিয়েছিলেন</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1">
          {(
            [
              ["all", `সব ইউজার (${counts.all})`],
              ["active", `সক্রিয় পেইড (${counts.active})`],
              ["free", `ফ্রি প্ল্যান (${counts.free})`],
              ["other", `মেয়াদ শেষ/বাতিল (${counts.other})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                filter === value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, ইমেইল, আইডি বা প্ল্যান দিয়ে খুঁজুন…"
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Users List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {search
              ? "কোনো ব্যবহারকারী খুঁজে পাওয়া যায়নি"
              : "এই ক্যাটাগরিতে কোনো ব্যবহারকারী নেই"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? "অন্য কোনো নাম, ইমেইল বা আইডি দিয়ে চেষ্টা করুন।"
              : "নতুন ব্যবহারকারী সাইন-ইন করলে এখানে দেখতে পাবেন।"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            const meta = userPlanMeta(user.effectiveStatus);
            const initials = (user.fullName || user.email || "U")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={user.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 lg:flex-row lg:items-center"
              >
                {/* Left: User Identity */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase shadow-2xs">
                    {initials}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold text-sm text-foreground truncate">
                        {user.fullName || "নাম দেওয়া নেই"}
                      </span>

                      {user.role === "admin" && (
                        <Badge variant="default" className="text-[10px] h-5 bg-rose-600">
                          <Shield className="mr-0.5 size-2.5" />
                          Admin
                        </Badge>
                      )}
                      {user.role === "moderator" && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          Moderator
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {user.email && (
                        <span className="inline-flex items-center gap-1 font-mono text-foreground/80">
                          <Mail className="size-3" aria-hidden="true" />
                          <span>{user.email}</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopy(user.id, `user-${user.id}`)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                        title="ইউজার আইডি কপি করুন"
                      >
                        {copiedId === `user-${user.id}` ? (
                          <Check className="size-2.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-2.5" />
                        )}
                        <span>{user.id.slice(0, 8)}…</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" aria-hidden="true" />
                        জয়েন: {formatDateShort(user.createdAt)}
                      </span>

                      {user.lastSignInAt && (
                        <span className="inline-flex items-center gap-1">
                          <LogIn className="size-3" aria-hidden="true" />
                          শেষ সাইন-ইন: {formatDate(user.lastSignInAt)}
                        </span>
                      )}

                      {user.selectedSubjects && user.selectedSubjects.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Layers className="size-3" aria-hidden="true" />
                          বিষয়: {user.selectedSubjects.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Current Plan Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-3 border-t border-border/50 pt-3 lg:border-t-0 lg:pt-0">
                  <div className="text-left sm:text-right space-y-0.5">
                    <div className="flex items-center sm:justify-end gap-1.5">
                      <span className="text-xs text-muted-foreground">বর্তমান প্ল্যান:</span>
                      <span className="font-display font-bold text-sm text-foreground">
                        {user.currentPlanName}
                      </span>
                      {user.amountBdt != null && user.effectiveStatus === "active" && (
                        <Badge variant="secondary" className="text-[11px] font-semibold">
                          ৳{user.amountBdt}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {user.effectiveStatus === "active" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {user.remainingDays !== null ? `${user.remainingDays} দিন বাকি` : "সক্রিয়"} · মেয়াদ: {formatDateShort(user.expiresAt)}
                        </span>
                      ) : user.effectiveStatus === "cancelled" ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          পূর্বের প্ল্যান ({user.lastPlanName || "পেইড"}) বাতিল
                        </span>
                      ) : user.effectiveStatus === "expired" ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          পূর্বের প্ল্যান ({user.lastPlanName || "পেইড"}) মেয়াদ শেষ
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          চিরকাল ফ্রি অ্যাক্সেস
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

