import { findQuestionById } from "@/lib/admin/question-search";
import { REPORT_TYPE_LABELS, type ReportType } from "./types";

export type SendReportTelegramInput = {
  questionId: string;
  reportType: ReportType;
  message: string;
  userEmail?: string | null | undefined;
};

const SUBJECT_MAP: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  mathematics: "উচ্চতর গণিত",
  biology: "জীববিজ্ঞান",
  ict: "আইসিটি",
  other: "অন্যান্য",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendReportNotificationTelegram(
  input: SendReportTelegramInput
): Promise<boolean> {
  const token =
    process.env["TELEGRAM_BOT_TOKEN"] ??
    "8829533636:AAEUOBgy7AnpwhV8ES1675UZKk7olXvsXSY";
  const chatId =
    process.env["TELEGRAM_CHAT_ID"] ?? "-1004445399445";

  if (!token || !chatId) {
    return false;
  }

  try {
    const qData = await findQuestionById(input.questionId).catch(() => null);
    const subName = qData?.subject ? SUBJECT_MAP[qData.subject] || qData.subject : "অনির্দিষ্ট বিষয়";
    const rawQText = qData?.question?.question_text || "";
    const qText = rawQText || "প্রশ্নের বিস্তারিত পাওয়া যায়নি।";
    const label = REPORT_TYPE_LABELS[input.reportType] || input.reportType;
    const reporter = input.userEmail ? escapeHtml(input.userEmail) : "অতিথি শিক্ষার্থী (লগইন ছাড়া)";

    const MAX_TEXT_LENGTH = 600;

    const truncate = (text: string, max = MAX_TEXT_LENGTH): string =>
      text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

    const text = [
      `🚨 <b>নতুন প্রশ্ন রিপোর্ট</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `<b>সমস্যার ধরন:</b> ${escapeHtml(label)}`,
      `<b>বিষয়:</b> ${escapeHtml(subName)}`,
      `<b>প্রশ্ন আইডি:</b> <code>#${escapeHtml(input.questionId)}</code>`,
      `<b>রিপোর্টার:</b> ${reporter}`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `<b>শিক্ষার্থীর মন্তব্য</b>`,
      `<blockquote>${escapeHtml(truncate(input.message))}</blockquote>`,
      ``,
      `<b>মূল প্রশ্ন</b>`,
      `<pre>${escapeHtml(truncate(qText))}</pre>`,
    ].join("\n");

    const payload = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🛠 এডমিন প্যানেলে দেখুন",
              url: "https://question-hub-bd.vercel.app/admin/reports",
            },
          ],
        ],
      },
    };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Telegram Report Dispatcher Error]", res.status, errBody);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Telegram Report Dispatcher Exception]", err);
    return false;
  }
}
