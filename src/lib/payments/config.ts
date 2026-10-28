import { plansByAudience, type Plan, type PlanAudience } from "@/data/plans";
import type { PaymentMethod } from "@/lib/supabase/types";

export type PaymentMethodConfig = {
  name: string;
  /** Public logo URL (2:1 wordmark). */
  logo: string;
  ussd: string;
  /** Brand color used for the selected state. */
  accent: string;
  /** Background used by the instructions panel. */
  panel: string;
};

export type PaymentNumbers = Record<PaymentMethod, string>;

/**
 * Manual "Send Money" payment channels. Amounts and plan ids are NEVER taken
 * from here by the server; they only drive copy/labels in the UI.
 */
export const PAYMENT_METHODS: Record<PaymentMethod, PaymentMethodConfig> = {
  bkash: {
    name: "bKash",
    logo: "https://pay.mrttopup.com/mobilebanklogo/bkash.png",
    ussd: "*247#",
    accent: "#E2136E",
    panel: "linear-gradient(135deg, #E2136E 0%, #AD0B52 100%)",
  },
  nagad: {
    name: "Nagad",
    logo: "https://pay.mrttopup.com/mobilebanklogo/nagad.png",
    ussd: "*167#",
    accent: "#E86F00",
    panel: "linear-gradient(135deg, #F6921E 0%, #ED1C24 100%)",
  },
};

export const PAYMENT_METHOD_IDS: PaymentMethod[] = ["bkash", "nagad"];

export const TRX_PATTERN = /^[A-Z0-9]{6,20}$/;
export const BD_PHONE_PATTERN = /^01[3-9]\d{8}$/;

export type PlanMatch = {
  plan: Plan;
  audience: PlanAudience;
};

/** Resolve a plan id to its authoritative price/duration for server-side use. */
export function findPlan(planId: string): PlanMatch | null {
  for (const audience of ["student", "teacher"] as const) {
    const plan = plansByAudience[audience].find((item) => item.id === planId);
    if (plan) {
      return { plan, audience };
    }
  }

  return null;
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "bkash" || value === "nagad";
}
