import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { TICKET_CATEGORIES, type TicketCategory } from "./types";

export type SendTicketTelegramInput = {
  ticketCode: string;
  category: TicketCategory;
  message: string;
  userName?: string | null;
  userEmail?: string | null;
};

const FALLBACK_SITE_URL = "https://question-hub-bd.vercel.app";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(text: string, max = 1200): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function formatDhakaTime(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

/** Alerts the admin chat when a user opens a support ticket. */
export async function sendTicketNotificationTelegram(
  input: SendTicketTelegramInput,
): Promise<boolean> {
  try {
    const base = process.env["NEXT_PUBLIC_SITE_URL"] ?? FALLBACK_SITE_URL;
    const label = TICKET_CATEGORIES[input.category];
    const requester = [input.userName?.trim(), input.userEmail?.trim()]
      .filter(Boolean)
      .join(" · ");

    return await sendTelegramMessage({
      text: [
        `🎫 <b>নতুন সাপোর্ট টিকিট</b>`,
        `━━━━━━━━━━━━━━━━━━`,
        ``,
        `<b>টিকিট নম্বর:</b> <code>${escapeHtml(input.ticketCode)}</code>`,
        `<b>বিভাগ:</b> ${escapeHtml(label ? `${label.bn} (${label.en})` : input.category)}`,
        `<b>যোগাযোগ:</b> ${requester ? escapeHtml(requester) : "অনির্দিষ্ট"}`,
        `<b>সময়:</b> ${formatDhakaTime()}`,
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        `<b>ব্যবহারকারীর বার্তা</b>`,
        `<blockquote>${escapeHtml(truncate(input.message))}</blockquote>`,
      ].join("\n"),
      button: {
        text: "🛠 টিকিট উত্তর দিন",
        url: `${base.replace(/\/$/, "")}/admin/support`,
      },
    });
  } catch (err) {
    console.error("[Telegram Ticket Dispatcher Exception]", err);
    return false;
  }
}
