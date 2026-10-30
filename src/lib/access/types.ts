export type EntitlementStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "none"
  | "unavailable";

export type UsageFeature = "mcq" | "model_test";

export type EntitlementLimits = {
  /** null means unlimited. */
  dailyModelTest: number | null;
  totalModelTest: number | null;
};

export type EntitlementUsage = {
  modelTest: number;
  modelTestTotal: number;
};

export type EntitlementRemaining = {
  modelTest: number | null;
  totalModelTest: number | null;
};

export type Entitlement = {
  status: EntitlementStatus;
  /** True only when an unexpired subscription exists and its plan is active. */
  paidAccess: boolean;
  /** Plan audience: "student" for learner plans, "teacher" for educator plans. */
  audience: "student" | "teacher";
  /** Database server time (ISO string). Never trust the browser clock for expiry. */
  serverTime: string;
  usageDate: string;
  planId: string | null;
  planName: string | null;
  lastPlanId: string | null;
  lastPlanName: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  remainingDays: number | null;
  limits: EntitlementLimits;
  features: {
    allowAnswer: boolean;
    allowExplanation: boolean;
  };
  access: {
    /** null means all subjects are accessible. */
    subjects: string[] | null;
    /** Selected database slugs; null when the plan includes every database. */
    databases: string[] | null;
    /** Database slugs the plan permits choosing; null means all databases. */
    allowedDatabases: string[] | null;
    /** Question source_db codes allowed by the selected database(s); null = all. */
    databaseCodes: string[] | null;
  };
  usage: EntitlementUsage;
  remaining: EntitlementRemaining;
  /** 0 = fixed allowedSubjects list; N > 0 = student may choose N subjects. */
  subjectSelectionLimit: number;
  /** 0 = all databases; N > 0 = student must choose N databases. */
  databaseSelectionLimit: number;
  source: string | null;
  isCustom: boolean;
  error?: string;
};

export type ConsumeUsageResult = {
  ok: boolean;
  allowed: string[];
  used: number;
  /** null means unlimited. */
  limit: number | null;
  remaining: number | null;
  totalLimit?: number | null;
  totalUsed?: number;
  totalRemaining?: number | null;
  blocked: number;
  usageDate: string | null;
  error?: string;
};

export type SelectionChoiceState = {
  ok: boolean;
  value?: string;
  error?: "auth" | "forbidden" | "invalid_selection" | "locked" | "failed";
};

export type SubjectChoiceState = SelectionChoiceState;
export type DatabaseChoiceState = SelectionChoiceState;

export type AudienceChoice = "student" | "teacher";

export type AudienceChoiceState = {
  ok: boolean;
  value?: AudienceChoice;
  error?: "auth" | "invalid_selection" | "locked" | "failed";
};
