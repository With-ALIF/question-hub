"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  ShieldPlus,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  grantCustomAccessAction,
  runExpirySweepAction,
  updatePlanConfigAction,
  type AdminPlanErrorCode,
} from "@/lib/access/admin-actions";
import type { AdminPlanConfig, GrantableUser } from "@/lib/payments/types";

type Draft = {
  name: string;
  dailyModelTestLimit: string;
  totalModelTestLimit: string;
  subjectSelectionLimit: string;
  databaseSelectionLimit: string;
  durationDays: string;
  allowAnswer: boolean;
  allowExplanation: boolean;
  isActive: boolean;
};

function toDraft(plan: AdminPlanConfig): Draft {
  return {
    name: plan.name,
    dailyModelTestLimit:
      plan.daily_model_test_limit === null ? "" : String(plan.daily_model_test_limit),
    totalModelTestLimit:
      plan.total_model_test_limit === null ? "" : String(plan.total_model_test_limit),
    subjectSelectionLimit: String(plan.subject_selection_limit ?? 0),
    databaseSelectionLimit: String(plan.database_selection_limit ?? 0),
    durationDays: plan.duration_days === null ? "" : String(plan.duration_days),
    allowAnswer: plan.allow_answer,
    allowExplanation: plan.allow_explanation,
    isActive: plan.is_active,
  };
}

function parseLimit(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

function errorText(code: AdminPlanErrorCode): string {
  switch (code) {
    case "forbidden":
      return "আপনার এই কাজ করার অনুমতি নেই।";
    case "student_not_found":
      return "এই ইমেইলে কোনো স্টুডেন্ট পাওয়া যায়নি।";
    case "not_found":
      return "প্ল্যানটি পাওয়া যায়নি। মাইগ্রেশন চালানো হয়েছে কি না দেখুন।";
    case "invalid_input":
      return "ইনপুট সঠিক নয়। সীমা ও ইমেইল যাচাই করুন।";
    default:
      return "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  }
}

export function AdminPlansView({
  initialPlans,
  grantableUsers,
}: {
  initialPlans: AdminPlanConfig[];
  grantableUsers: GrantableUser[];
}) {
  const [plans] = useState<AdminPlanConfig[]>(initialPlans);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(initialPlans.map((plan) => [plan.plan_id, toDraft(plan)])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [grantPlanId, setGrantPlanId] = useState(initialPlans[0]?.plan_id ?? "");
  const [grantDays, setGrantDays] = useState("30");
  const [grantNote, setGrantNote] = useState("");

  const planOptions = useMemo(
    () => plans.map((plan) => ({ id: plan.plan_id, name: plan.name })),
    [plans],
  );

  const updateDraft = (planId: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [planId]: { ...current[planId]!, ...patch },
    }));
  };

  const handleSave = async (plan: AdminPlanConfig) => {
    const draft = drafts[plan.plan_id];
    if (!draft) return;

    setError(null);
    setMessage(null);
    setSavingId(plan.plan_id);

    const result = await updatePlanConfigAction({
      planId: plan.plan_id,
      name: draft.name,
      dailyModelTestLimit: parseLimit(draft.dailyModelTestLimit),
      totalModelTestLimit: parseLimit(draft.totalModelTestLimit),
      allowAnswer: draft.allowAnswer,
      allowExplanation: draft.allowExplanation,
      subjectSelectionLimit: parseLimit(draft.subjectSelectionLimit) ?? 0,
      databaseSelectionLimit: parseLimit(draft.databaseSelectionLimit) ?? 0,
      durationDays: parseLimit(draft.durationDays),
      isActive: draft.isActive,
    });

    setSavingId(null);

    if (!result.ok) {
      setError(errorText(result.error));
      return;
    }

    setMessage(result.message ?? "Plan limits saved.");
  };

  const handleGrant = async () => {
    setError(null);
    setMessage(null);
    setGranting(true);

    const result = await grantCustomAccessAction({
      email,
      planId: grantPlanId,
      days: Number(grantDays),
      note: grantNote,
    });

    setGranting(false);

    if (!result.ok) {
      setError(errorText(result.error));
      return;
    }

    setMessage(result.message ?? "Custom access granted.");
    setEmail("");
    setGrantNote("");
  };

  const handleSweep = async () => {
    setError(null);
    setMessage(null);
    setSweeping(true);
    const result = await runExpirySweepAction();
    setSweeping(false);

    if (!result.ok) {
      setError(errorText(result.error));
      return;
    }

    setMessage(`Expiry sweep completed. ${result.expired} subscription(s) marked expired.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Plans, features & usage limits
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            প্রতিটি প্ল্যানের মডেল টেস্ট সীমা, বিষয়/ডাটাবেজ নির্বাচন এবং প্রিমিয়াম ফিচার নির্ধারণ করুন।
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sweeping}
          onClick={() => void handleSweep()}
          className="gap-1.5 text-xs"
        >
          {sweeping ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-3.5" aria-hidden="true" />
          )}
          Expire overdue subscriptions
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <SlidersHorizontal className="mx-auto size-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-semibold text-foreground">No plan configuration found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run the subscription entitlement migration to create and seed <code>qb_plans</code> first.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {plans.map((plan) => {
            const draft = drafts[plan.plan_id];
            if (!draft) return null;
            const busy = savingId === plan.plan_id;

            return (
              <Card key={plan.plan_id} className="border-border/80">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-foreground">
                          {plan.name}
                        </h2>
                        <Badge variant="outline" className="text-[10px]">
                          {plan.audience}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            draft.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400"
                              : "border-border bg-muted text-[10px] text-muted-foreground"
                          }
                        >
                          {draft.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {plan.plan_id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${plan.plan_id}`} className="text-xs">
                        Enabled
                      </Label>
                      <Switch
                        id={`active-${plan.plan_id}`}
                        checked={draft.isActive}
                        onCheckedChange={(checked) =>
                          updateDraft(plan.plan_id, { isActive: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Display name</Label>
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          updateDraft(plan.plan_id, { name: event.target.value })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Duration (days)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={draft.durationDays}
                        onChange={(event) =>
                          updateDraft(plan.plan_id, { durationDays: event.target.value })
                        }
                        placeholder="blank = no expiry"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Daily model tests</Label>
                      <Input
                        type="number"
                        min={0}
                        value={draft.dailyModelTestLimit}
                        onChange={(event) =>
                          updateDraft(plan.plan_id, { dailyModelTestLimit: event.target.value })
                        }
                        placeholder="blank = unlimited"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Total model tests</Label>
                      <Input
                        type="number"
                        min={0}
                        value={draft.totalModelTestLimit}
                        onChange={(event) =>
                          updateDraft(plan.plan_id, { totalModelTestLimit: event.target.value })
                        }
                        placeholder="blank = unlimited"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Student subject choices</Label>
                      <Input
                        type="number"
                        min={0}
                        value={draft.subjectSelectionLimit}
                        onChange={(event) =>
                          updateDraft(plan.plan_id, {
                            subjectSelectionLimit: event.target.value,
                          })
                        }
                        placeholder="0 = fixed list"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Student database choices</Label>
                      <Input
                        type="number"
                        min={0}
                        value={draft.databaseSelectionLimit}
                        onChange={(event) =>
                          updateDraft(plan.plan_id, {
                            databaseSelectionLimit: event.target.value,
                          })
                        }
                        placeholder="0 = all databases"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 rounded-lg border border-border/70 bg-secondary/30 p-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Switch
                        checked={draft.allowAnswer}
                        onCheckedChange={(checked) =>
                          updateDraft(plan.plan_id, { allowAnswer: checked })
                        }
                      />
                      Show answers
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Switch
                        checked={draft.allowExplanation}
                        onCheckedChange={(checked) =>
                          updateDraft(plan.plan_id, { allowExplanation: checked })
                        }
                      />
                      Show explanations
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void handleSave(plan)}
                      className="gap-1.5 text-xs"
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="size-3.5" aria-hidden="true" />
                      )}
                      Save plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-border/80">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldPlus className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Grant custom access
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                পেমেন্ট ছাড়া নির্দিষ্ট স্টুডেন্টকে সীমিত সময়ের জন্য প্ল্যান অ্যাক্সেস দিন। মেয়াদ শেষ হলে অ্যাক্সেস স্বয়ংক্রিয়ভাবে বন্ধ হবে।
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Student</Label>
              <select
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">
                  {grantableUsers.length > 0
                    ? "শিক্ষার্থী বেছে নিন"
                    : "এখনো কোনো ইউজার লগ-ইন করেনি"}
                </option>
                {grantableUsers.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.fullName ? `${user.fullName} — ${user.email}` : user.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {grantableUsers.length > 0
                  ? `তালিকায় ${grantableUsers.length} জন লগ-ইন করা ইউজার`
                  : "ইউজার লগ-ইন করলে এখানে দেখা যাবে।"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plan</Label>
              <select
                value={grantPlanId}
                onChange={(event) => setGrantPlanId(event.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                {planOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Days</Label>
              <Input
                type="number"
                min={1}
                max={3650}
                value={grantDays}
                onChange={(event) => setGrantDays(event.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Admin note (optional)</Label>
            <Textarea
              value={grantNote}
              onChange={(event) => setGrantNote(event.target.value.slice(0, 300))}
              placeholder="যেমন: scholarship access / support compensation"
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={granting || !email || !grantPlanId}
              onClick={() => void handleGrant()}
              className="gap-1.5 text-xs"
            >
              {granting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldPlus className="size-3.5" aria-hidden="true" />
              )}
              Grant access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
