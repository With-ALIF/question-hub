import { findQuestionById } from "@/lib/admin/question-search";
import { REPORT_TYPE_LABELS, type ReportType } from "./types";

type SendReportEmailInput = {
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
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendReportNotificationEmail(input: SendReportEmailInput): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const toEmail = process.env["ADMIN_NOTIFICATION_EMAIL"] ?? "qbank273@gmail.com";
  if (!apiKey) return false;

  const qData = await findQuestionById(input.questionId).catch(() => null);
  const subName = qData?.subject ? SUBJECT_MAP[qData.subject] || qData.subject : "অনির্দিষ্ট বিষয়";
  const qText = qData?.question?.question_text || "প্রশ্নের বিস্তারিত পাওয়া যায়নি।";
  const label = REPORT_TYPE_LABELS[input.reportType] || input.reportType;

  const ADMIN_REPORTS_URL = "https://question-hub-bd.vercel.app/admin/reports";
  const MAX_TEXT_LENGTH = 800;

  const truncate = (text: string, max = MAX_TEXT_LENGTH): string =>
    text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

  const safeLabel = escapeHtml(label);
  const safeSubject = escapeHtml(subName);
  const safeQuestionId = escapeHtml(input.questionId);
  const safeMessage = escapeHtml(truncate(input.message));
  const safeQuestionText = escapeHtml(truncate(qText));
  const safeEmail = input.userEmail ? escapeHtml(input.userEmail) : "";

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>নতুন প্রশ্ন রিপোর্ট</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${safeLabel} · প্রশ্ন #${safeQuestionId} · ${safeSubject}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', Arial, sans-serif;">

          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: #3f1d2e; border: 1px solid #e11d48; color: #fda4af; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; border-radius: 9999px;">নতুন রিপোর্ট</span>
              <h1 style="margin: 10px 0 0; font-size: 18px; line-height: 1.4; font-weight: 700; color: #f8fafc;">${safeLabel}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 24px;">

              <!-- Meta -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 110px;">বিষয়</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${safeSubject}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">প্রশ্ন আইডি</td>
                  <td style="padding: 6px 0; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; color: #2563eb;">#${safeQuestionId}</td>
                </tr>
                ${
                  safeEmail
                    ? `<tr>
                  <td style="padding: 6px 0; color: #64748b;">রিপোর্টার</td>
                  <td style="padding: 6px 0; color: #334155;">${safeEmail}</td>
                </tr>`
                    : ""
                }
              </table>

              <!-- Student message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;">
                    <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.5px; font-weight: 700; color: #b91c1c;">শিক্ষার্থীর মন্তব্য</p>
                    <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
                  </td>
                </tr>
              </table>

              <!-- Original question -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.5px; font-weight: 700; color: #64748b;">মূল প্রশ্ন</p>
                    <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${safeQuestionText}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #0f172a; border-radius: 8px;">
                    <a href="${ADMIN_REPORTS_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 24px; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600;">এডমিন প্যানেলে দেখুন</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
              QuestionBank Automated Report Dispatcher
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const payload = {
      from: "QuestionBank Reports <onboarding@resend.dev>",
      to: [toEmail],
      subject: `[প্রশ্ন রিপোর্ট: ${subName}] ${label} - #${input.questionId}`,
      html,
    };
    let res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok && res.status === 403 && toEmail !== "alifbrur16@gmail.com") {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, to: ["alifbrur16@gmail.com"] }),
      });
    }
    return res.ok;
  } catch (err) {
    console.error("[email] Error sending notification:", err);
    return false;
  }
}
