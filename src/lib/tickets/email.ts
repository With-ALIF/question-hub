import "server-only";

import { sendBrevoEmail } from "@/lib/notifications/brevo";
import { TICKET_CATEGORIES, TICKET_STATUS_LABELS, type TicketCategory, type TicketStatus } from "./types";

export type SendTicketReplyEmailInput = {
  toEmail: string;
  customerName?: string | null;
  ticketCode: string;
  category: TicketCategory;
  status: TicketStatus;
  reply: string;
  originalMessage: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(text: string, max = 900): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Resend only delivers to the account owner unless a verified sender is set. */
function fromAddress(): string {
  const configured = process.env["RESEND_FROM_EMAIL"]?.trim();

  if (!configured) {
    return "QuestionBank Support <onboarding@resend.dev>";
  }

  return configured.includes("<")
    ? configured
    : `QuestionBank Support <${configured}>`;
}

function supportUrl(): string {
  const base = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://question-hub-bd.vercel.app";
  return `${base.replace(/\/$/, "")}/support`;
}

export async function sendTicketReplyEmail(
  input: SendTicketReplyEmailInput,
): Promise<boolean> {
  const category = TICKET_CATEGORIES[input.category]?.bn ?? input.category;
  const status = TICKET_STATUS_LABELS[input.status]?.bn ?? input.status;
  const greeting = input.customerName?.trim()
    ? `প্রিয় ${escapeHtml(input.customerName.trim())},`
    : "প্রিয় ব্যবহারকারী,";
  const subject = `[QuestionBank] টিকিট ${input.ticketCode}-এ উত্তর দেওয়া হয়েছে`;

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>টিকিটে উত্তর</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${category} · ${status} · ${input.ticketCode}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', Arial, sans-serif;">

          <tr>
            <td style="background-color: #0f172a; background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: #064e3b; border: 1px solid #10b981; color: #6ee7b7; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; border-radius: 9999px;">উত্তর দেওয়া হয়েছে</span>
              <h1 style="margin: 10px 0 0; font-size: 18px; line-height: 1.4; font-weight: 700; color: #f8fafc;">${category}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 14px; font-size: 14px; color: #1e293b;">${greeting}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 110px;">টিকিট নম্বর</td>
                  <td style="padding: 6px 0; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; color: #2563eb;">${escapeHtml(input.ticketCode)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">বিভাগ</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">স্ট্যাটাস</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${status}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 6px;">
                    <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.5px; font-weight: 700; color: #047857;">এডমিনের উত্তর</p>
                    <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(input.reply)}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.5px; font-weight: 700; color: #64748b;">আপনার বার্তা</p>
                    <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(truncate(input.originalMessage))}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #0f172a; border-radius: 8px;">
                    <a href="${supportUrl()}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 24px; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600;">টিকিট ও উত্তর দেখুন</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 18px 0 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                আরও কিছু থাকলে সাপোর্ট পেজে নতুন টিকিট খুলুন — এই ইমেইলের উত্তর দেবেন না।
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 14px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
              QuestionBank · আপনার প্রস্তুতির সঙ্গী
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = [
    input.customerName?.trim() ? `প্রিয় ${input.customerName.trim()},` : "প্রিয় ব্যবহারকারী,",
    "",
    `টিকিট ${input.ticketCode} (${category})-এ এডমিনের উত্তর দেওয়া হয়েছে।`,
    `স্ট্যাটাস: ${status}`,
    "",
    "এডমিনের উত্তর:",
    input.reply,
    "",
    `সব দেখতে: ${supportUrl()}`,
  ].join("\n");

  if (process.env["BREVO_API_KEY"]) {
    const brevoOk = await sendBrevoEmail({
      to: { email: input.toEmail, name: input.customerName ?? undefined },
      subject,
      htmlContent: html,
      textContent,
    });

    if (brevoOk) {
      return true;
    }
  }

  const resendApiKey = process.env["RESEND_API_KEY"];

  if (!resendApiKey) {
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [input.toEmail],
        subject,
        html,
        text: textContent,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[email] Ticket reply email failed via Resend:", res.status, errBody);
    }

    return res.ok;
  } catch (err) {
    console.error("[email] Error sending ticket reply email:", err);
    return false;
  }
}
