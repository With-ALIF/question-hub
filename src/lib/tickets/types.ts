import type { Database, TicketCategory, TicketStatus } from "@/lib/supabase/types";

export type { TicketCategory, TicketStatus };

export type TicketRow = Database["public"]["Tables"]["qb_tickets"]["Row"];

/** Ticket plus the requester's contact details, for the admin queue. */
export type AdminTicket = TicketRow & {
  userEmail: string | null;
  userName: string | null;
};

export const TICKET_MESSAGE_MIN = 10;
export const TICKET_MESSAGE_MAX = 4000;

/** Order follows the category list the user sees in the dropdown. */
export const TICKET_CATEGORIES: Record<TicketCategory, { en: string; bn: string }> = {
  payment_issue: { en: "Payment Issue", bn: "পেমেন্ট সমস্যা" },
  subscription_plan: { en: "Subscription & Plan", bn: "সাবস্ক্রিপশন ও প্ল্যান" },
  account_login: { en: "Account & Login", bn: "অ্যাকাউন্ট ও লগইন" },
  qa_error: { en: "Question & Answer Error", bn: "প্রশ্ন ও উত্তরের ত্রুটি" },
  model_test_issue: { en: "Model Test Issue", bn: "মডেল টেস্ট সমস্যা" },
  subject_chapter_issue: { en: "Subject & Chapter Issue", bn: "বিষয় ও অধ্যায় সমস্যা" },
  technical_problem: { en: "Technical Problem", bn: "টেকনিক্যাল সমস্যা" },
  question_making_issue: {
    en: "Question Making Issue",
    bn: "প্রশ্ন তৈরির সমস্যা",
  },
  feature_request: { en: "Feature Request", bn: "ফিচার রিকোয়েস্ট" },
  refund_request: { en: "Refund Request", bn: "রিফান্ড রিকোয়েস্ট" },
  general_inquiry: { en: "General Inquiry", bn: "সাধারণ জিজ্ঞাসা" },
  other: { en: "Other", bn: "অন্যান্য" },
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, { en: string; bn: string }> = {
  open: { en: "Open", bn: "নতুন" },
  in_review: { en: "In review", bn: "পর্যালোচনায়" },
  resolved: { en: "Resolved", bn: "সমাধান হয়েছে" },
  closed: { en: "Closed", bn: "বন্ধ" },
};

const CATEGORY_VALUES = Object.keys(TICKET_CATEGORIES) as TicketCategory[];
const STATUS_VALUES = Object.keys(TICKET_STATUS_LABELS) as TicketStatus[];

export function isTicketCategory(value: unknown): value is TicketCategory {
  return typeof value === "string" && CATEGORY_VALUES.includes(value as TicketCategory);
}

export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === "string" && STATUS_VALUES.includes(value as TicketStatus);
}

/** Marking a ticket solved is final — only that status seals it. */
export const LOCKED_TICKET_STATUSES: readonly TicketStatus[] = ["resolved"];

export function isLockedTicketStatus(value: TicketStatus): boolean {
  return LOCKED_TICKET_STATUSES.includes(value);
}

export type TicketErrorCode =
  | "auth"
  | "invalid_category"
  | "message_too_short"
  | "message_too_long"
  | "rate_limited"
  | "failed";

export type CreateTicketResult =
  | { ok: true; ticketCode: string }
  | { ok: false; error: TicketErrorCode };

export type AdminTicketErrorCode =
  | "forbidden"
  | "invalid_input"
  | "not_found"
  | "locked"
  | "failed";

export type ReplyTicketResult =
  | { ok: true }
  | { ok: false; error: AdminTicketErrorCode };
