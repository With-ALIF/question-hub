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

export async function sendReportNotificationEmail(input: SendReportEmailInput): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const toEmail = process.env["ADMIN_NOTIFICATION_EMAIL"] ?? "qbank273@gmail.com";
  if (!apiKey) return false;

  const qData = await findQuestionById(input.questionId).catch(() => null);
  const subName = qData?.subject ? SUBJECT_MAP[qData.subject] || qData.subject : "অনির্দিষ্ট বিষয়";
  const qText = qData?.question?.question_text?.slice(0, 400) || "প্রশ্নের বিস্তারিত পাওয়া যায়নি।";
  const label = REPORT_TYPE_LABELS[input.reportType] || input.reportType;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px 24px; color: #ffffff;">
        <span style="display: inline-block; padding: 4px 10px; background: rgba(225,29,72,0.25); border: 1px solid #e11d48; color: #fda4af; font-weight: 700; font-size: 11px; border-radius: 9999px;">নতুন রিপোর্ট</span>
        <h1 style="margin: 8px 0 0; font-size: 18px; font-weight: 700; color: #f8fafc;">${label}</h1>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 100px;">বিষয়:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${subName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">প্রশ্ন আইডি:</td>
            <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #2563eb;">#${input.questionId}</td>
          </tr>
          ${input.userEmail ? `<tr><td style="padding: 6px 0; color: #64748b;">রিপোর্টার:</td><td style="padding: 6px 0; color: #334155;">${input.userEmail}</td></tr>` : ""}
        </table>

        <div style="margin-bottom: 18px; padding: 14px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
          <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #b91c1c;">শিক্ষার্থীর অভিযোগ / মন্তব্য:</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${input.message}</p>
        </div>

        <div style="margin-bottom: 22px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">মূল প্রশ্ন:</p>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${qText}</p>
        </div>

        <div style="text-align: center; margin-bottom: 8px;">
          <a href="https://question-hub-bd.vercel.app/admin/reports" style="display: inline-block; padding: 10px 22px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">এডমিন প্যানেলে দেখুন</a>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 12px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
        QuestionBank Automated Report Dispatcher
      </div>
    </div>
  `;

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
