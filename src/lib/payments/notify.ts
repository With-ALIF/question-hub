import "server-only";

import type { PlanAudience } from "@/data/plans";
import { sendBrevoEmail } from "@/lib/notifications/brevo";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import type { PaymentMethod } from "@/lib/supabase/types";

import { PAYMENT_METHODS } from "./config";

export type PaymentNotificationInput = {
  orderCode: string;
  planName: string;
  planNameBn: string;
  audience: PlanAudience;
  amountBdt: number;
  durationLabel: string;
  method: PaymentMethod;
  trxId: string;
  senderNumber: string | null;
  customerName: string | null;
  customerEmail: string | null;
};

const ADMIN_ORDERS_URL = "https://question-hub-bd.vercel.app/admin/orders";
const DEFAULT_ADMIN_EMAIL = "qbank273@gmail.com";
const FALLBACK_ADMIN_EMAIL = "alifbrur16@gmail.com";

/**
 * Resend only allows `onboarding@resend.dev` to deliver to the account owner.
 * Set RESEND_FROM_EMAIL to an address on a verified domain to email customers.
 */
function fromAddress(displayName: string): string {
  const configured = process.env["RESEND_FROM_EMAIL"]?.trim();

  if (!configured) {
    return `${displayName} <onboarding@resend.dev>`;
  }

  return configured.includes("<")
    ? configured
    : `${displayName} <${configured}>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDhakaTime(): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Dhaka",
    }).format(new Date());
  } catch {
    return new Date().toISOString();
  }
}

export type PaymentNotificationResult = {
  adminEmail: boolean;
  customerEmail: boolean | null;
  telegram: boolean;
};

function settledValue(
  result: PromiseSettledResult<boolean> | undefined,
): boolean {
  return result?.status === "fulfilled" ? result.value : false;
}

/** Sends alerts for a newly submitted manual payment (admin + customer). */
export async function sendPaymentNotifications(
  input: PaymentNotificationInput,
): Promise<PaymentNotificationResult> {
  const [adminResult, telegramResult] = await Promise.allSettled([
    sendAdminPaymentEmail(input),
    sendPaymentTelegram(input),
  ]);

  // Send the customer copy after the admin copy so the two Resend requests
  // don't hit the per-second rate limit at the same moment.
  const customerEmail = input.customerEmail
    ? await sendCustomerPaymentEmail(input)
    : null;

  return {
    adminEmail: settledValue(adminResult),
    telegram: settledValue(telegramResult),
    customerEmail,
  };
}

async function sendPaymentTelegram(
  input: PaymentNotificationInput,
): Promise<boolean> {
  const method = PAYMENT_METHODS[input.method].name;
  const audience = input.audience === "teacher" ? "শিক্ষক" : "শিক্ষার্থী";
  const customer = input.customerName || input.customerEmail;

  const lines = [
    "💳 <b>নতুন ম্যানুয়াল পেমেন্ট</b>",
    "━━━━━━━━━━━━━━━━━━",
    `<b>অর্ডার:</b> <code>${escapeHtml(input.orderCode)}</code>`,
    `<b>প্ল্যান:</b> ${escapeHtml(input.planNameBn)} (${escapeHtml(input.planName)}) · ${escapeHtml(input.durationLabel)}`,
    `<b>শ্রেণি:</b> ${audience}`,
    `<b>পরিমাণ:</b> <b>৳${input.amountBdt}</b>`,
    `<b>মাধ্যম:</b> ${method}`,
    `<b>TrxID:</b> <code>${escapeHtml(input.trxId)}</code>`,
  ];

  if (input.senderNumber) {
    lines.push(`<b>প্রেরক নম্বর:</b> <code>${escapeHtml(input.senderNumber)}</code>`);
  }

  if (customer) {
    lines.push(`<b>গ্রাহক:</b> ${escapeHtml(customer)}`);
  }

  if (input.customerName && input.customerEmail) {
    lines.push(`<b>ইমেইল:</b> ${escapeHtml(input.customerEmail)}`);
  }

  lines.push(`<b>সময়:</b> ${escapeHtml(formatDhakaTime())} (BD)`);

  return sendTelegramMessage({
    text: lines.join("\n"),
    button: {
      text: "✅ অর্ডার যাচাই করুন",
      url: ADMIN_ORDERS_URL,
    },
  });
}

async function sendCustomerPaymentEmail(
  input: PaymentNotificationInput,
): Promise<boolean> {
  const toEmail = input.customerEmail;

  if (!toEmail) {
    return false;
  }

  const method = PAYMENT_METHODS[input.method].name;
  const time = formatDhakaTime();

  const safe = {
    orderCode: escapeHtml(input.orderCode),
    planName: escapeHtml(input.planNameBn),
    planNameEn: escapeHtml(input.planName),
    duration: escapeHtml(input.durationLabel),
    amount: input.amountBdt,
    method: escapeHtml(method),
    trxId: escapeHtml(input.trxId),
    time: escapeHtml(time),
  };

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>পেমেন্ট জমা হয়েছে</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${safe.orderCode} · ৳${safe.amount} · ${safe.method}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', Arial, sans-serif;">

          <tr>
            <td style="background-color: #0f172a; background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: #052e16; border: 1px solid #22c55e; color: #86efac; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; border-radius: 9999px;">পেমেন্ট জমা হয়েছে</span>
              <h1 style="margin: 10px 0 0; font-size: 20px; line-height: 1.4; font-weight: 700; color: #f8fafc;">৳${safe.amount} · ${safe.method}</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">${safe.planName} · ${safe.duration}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.6;">
                আপনার পেমেন্টটি আমরা পেয়েছি। TrxID যাচাই করে প্ল্যানটি অ্যাক্টিভ করা হবে — সাধারণত ২৪ ঘণ্টার মধ্যে।
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
                <tr>
                  <td style="padding: 12px 14px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                    <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.6;">
                      <strong>স্ট্যাটাস:</strong> যাচাই চলছে। অ্যাপ্রুভ হলে ড্যাশবোর্ডে সাবস্ক্রিপশন দেখা যাবে।
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; font-size: 13px; border-top: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 7px 0; color: #64748b; width: 110px;">অর্ডার</td>
                  <td style="padding: 7px 0; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; color: #2563eb;">${safe.orderCode}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">প্ল্যান</td>
                  <td style="padding: 7px 0; color: #0f172a;"><strong>${safe.planName}</strong> <span style="color: #64748b;">(${safe.planNameEn})</span></td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">মেয়াদ</td>
                  <td style="padding: 7px 0; color: #334155;">${safe.duration}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">মাধ্যম</td>
                  <td style="padding: 7px 0; color: #0f172a;"><strong>${safe.method}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">TrxID</td>
                  <td style="padding: 7px 0; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; color: #b91c1c;">${safe.trxId}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">সময়</td>
                  <td style="padding: 7px 0; color: #334155;">${safe.time} (BD)</td>
                </tr>
              </table>

              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #0f172a; border-radius: 8px;">
                    <a href="https://question-hub-bd.vercel.app/dashboard" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 24px; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600;">ড্যাশবোর্ডে দেখুন</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 18px 0 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                কোনো সমস্যা হলে এই ইমেইলের উত্তর দিন অথবা সাপোর্টে যোগাযোগ করুন।
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

  // Deliver customer receipt via Brevo first
  if (process.env["BREVO_API_KEY"]) {
    const brevoOk = await sendBrevoEmail({
      to: {
        email: toEmail,
        name: input.customerName ?? undefined,
      },
      subject: `[QuestionBank] পেমেন্ট জমা হয়েছে · ${input.orderCode}`,
      htmlContent: html,
    });

    if (brevoOk) {
      return true;
    }
  }

  // Fallback to Resend if configured
  const resendApiKey = process.env["RESEND_API_KEY"];
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress("QuestionBank"),
          to: [toEmail],
          subject: `[QuestionBank] পেমেন্ট জমা হয়েছে · ${input.orderCode}`,
          html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error("[email] Customer payment email failed via Resend:", res.status, errBody);
      }

      return res.ok;
    } catch (err) {
      console.error("[email] Error sending customer payment email:", err);
      return false;
    }
  }

  return false;
}

async function sendAdminPaymentEmail(
  input: PaymentNotificationInput,
): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  const toEmail = process.env["ADMIN_NOTIFICATION_EMAIL"] ?? DEFAULT_ADMIN_EMAIL;

  const method = PAYMENT_METHODS[input.method].name;
  const audience = input.audience === "teacher" ? "শিক্ষক" : "শিক্ষার্থী";
  const time = formatDhakaTime();

  const safe = {
    orderCode: escapeHtml(input.orderCode),
    planName: escapeHtml(input.planName),
    planNameBn: escapeHtml(input.planNameBn),
    duration: escapeHtml(input.durationLabel),
    amount: input.amountBdt,
    method: escapeHtml(method),
    trxId: escapeHtml(input.trxId),
    sender: input.senderNumber ? escapeHtml(input.senderNumber) : "",
    customerName: input.customerName ? escapeHtml(input.customerName) : "",
    customerEmail: input.customerEmail ? escapeHtml(input.customerEmail) : "",
    time: escapeHtml(time),
  };

  const detailRows = [
    ["অর্ডার", `<code style="font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; color: #2563eb;">${safe.orderCode}</code>`],
    ["প্ল্যান", `<strong style="color: #0f172a;">${safe.planNameBn}</strong> <span style="color: #64748b;">(${safe.planName})</span>`],
    ["মেয়াদ", safe.duration],
    ["শ্রেণি", audience],
    ["মাধ্যম", `<strong style="color: #0f172a;">${safe.method}</strong>`],
    ["TrxID", `<code style="font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; color: #b91c1c;">${safe.trxId}</code>`],
    ...(safe.sender ? [["প্রেরক নম্বর", safe.sender]] : []),
    ...(safe.customerName ? [["গ্রাহক", safe.customerName]] : []),
    ...(safe.customerEmail ? [["ইমেইল", safe.customerEmail]] : []),
    ["সময়", `${safe.time} (BD)`],
  ]
    .map(
      ([label, value]) => `
                <tr>
                  <td style="padding: 7px 0; color: #64748b; width: 130px; vertical-align: top;">${label}</td>
                  <td style="padding: 7px 0; color: #334155; vertical-align: top;">${value}</td>
                </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>নতুন ম্যানুয়াল পেমেন্ট</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${safe.orderCode} · ৳${safe.amount} · ${safe.method}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', Arial, sans-serif;">

          <tr>
            <td style="background-color: #0f172a; background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: #052e16; border: 1px solid #22c55e; color: #86efac; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; border-radius: 9999px;">নতুন পেমেন্ট</span>
              <h1 style="margin: 10px 0 0; font-size: 20px; line-height: 1.4; font-weight: 700; color: #f8fafc;">৳${safe.amount} · ${safe.method}</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">${safe.planNameBn} · ${safe.duration}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 18px; font-size: 14px; color: #334155; line-height: 1.6;">
                একজন ব্যবহারকারী ম্যানুয়াল পেমেন্ট সাবমিট করেছেন। TrxID যাচাই করে অর্ডারটি approve বা reject করুন।
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; font-size: 13px; border-top: 1px solid #e2e8f0;">
${detailRows}
              </table>

              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #0f172a; border-radius: 8px;">
                    <a href="${ADMIN_ORDERS_URL}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 24px; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600;">অর্ডার যাচাই করুন</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 14px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
              QuestionBank Payment Dispatcher
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    if (apiKey) {
      const payload = {
        from: fromAddress("QuestionBank Payments"),
        to: [toEmail],
        subject: `[নতুন পেমেন্ট] ${input.orderCode} · ৳${input.amountBdt} · ${method}`,
        html,
      };

      let res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status === 403 && toEmail !== FALLBACK_ADMIN_EMAIL) {
        res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...payload, to: [FALLBACK_ADMIN_EMAIL] }),
        });
      }

      if (res.ok) {
        return true;
      }

      const errBody = await res.text();
      console.error("[email] Admin payment email failed via Resend:", res.status, errBody);
    }

    // Fallback to Brevo for admin notification if Resend is unavailable or fails
    if (process.env["BREVO_API_KEY"]) {
      const brevoOk = await sendBrevoEmail({
        to: { email: toEmail },
        subject: `[নতুন পেমেন্ট] ${input.orderCode} · ৳${input.amountBdt} · ${method}`,
        htmlContent: html,
      });

      if (brevoOk) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("[email] Error sending payment notification:", err);
    return false;
  }
}

export type SubscriptionApprovedNotificationInput = {
  customerEmail: string;
  customerName?: string | null;
  orderCode: string;
  planName: string;
  amountBdt: number;
  durationDays: number;
};

/**
 * Sends a confirmation email to the student when an admin approves their plan order.
 */
export async function sendSubscriptionApprovedEmail(
  input: SubscriptionApprovedNotificationInput,
): Promise<boolean> {
  const toEmail = input.customerEmail;
  if (!toEmail) return false;

  const safe = {
    orderCode: escapeHtml(input.orderCode),
    planName: escapeHtml(input.planName),
    amount: input.amountBdt,
    duration: input.durationDays,
    customerName: input.customerName ? escapeHtml(input.customerName) : "",
    time: escapeHtml(formatDhakaTime()),
  };

  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>সাবস্ক্রিপশন সক্রিয় হয়েছে</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${safe.orderCode} · আপনার প্ল্যান সক্রিয় হয়েছে
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', Arial, sans-serif;">
          <tr>
            <td style="background-color: #064e3b; background-image: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 24px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: #022c22; border: 1px solid #10b981; color: #a7f3d0; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; border-radius: 9999px;">সক্রিয় (Active)</span>
              <h1 style="margin: 10px 0 0; font-size: 20px; line-height: 1.4; font-weight: 700; color: #f8fafc;">অভিনন্দন! আপনার সাবস্ক্রিপশন সক্রিয় হয়েছে</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">${safe.planName} · ${safe.duration} দিন মেয়াদ</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.6;">
                ${safe.customerName ? `প্রিয় <strong>${safe.customerName}</strong>, ` : ""}আপনার পেমেন্টটি সফলভাবে অনুমোদিত হয়েছে। এখন আপনি QuestionBank-এর সকল প্রিমিয়াম ফিচার ব্যবহার করতে পারবেন।
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; font-size: 13px; border-top: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 7px 0; color: #64748b; width: 110px;">অর্ডার কোড</td>
                  <td style="padding: 7px 0; font-family: 'SFMono-Regular', Consolas, monospace; font-weight: 700; color: #2563eb;">${safe.orderCode}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">প্ল্যান</td>
                  <td style="padding: 7px 0; color: #0f172a;"><strong>${safe.planName}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">মেয়াদ</td>
                  <td style="padding: 7px 0; color: #334155;">${safe.duration} দিন</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">পরিশোধিত</td>
                  <td style="padding: 7px 0; color: #0f172a;"><strong>৳${safe.amount}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; color: #64748b;">সময়</td>
                  <td style="padding: 7px 0; color: #334155;">${safe.time} (BD)</td>
                </tr>
              </table>

              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: #059669; border-radius: 8px;">
                    <a href="https://question-hub-bd.vercel.app/dashboard" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 24px; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600;">ড্যাশবোর্ডে প্রবেশ করুন</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 18px 0 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                যেকোনো প্রশ্ন বা সহায়তার জন্য সরাসরি এই ইমেইলে রিপ্লাই দিতে পারেন।
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 14px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
              QuestionBank · আপনার প্রস্তুতির বিশ্বস্ত সঙ্গী
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Brevo delivers directly to the student
  if (process.env["BREVO_API_KEY"]) {
    const sent = await sendBrevoEmail({
      to: {
        email: toEmail,
        name: input.customerName ?? undefined,
      },
      subject: `[QuestionBank] আপনার সাবস্ক্রিপশন সক্রিয় হয়েছে · ${input.orderCode}`,
      htmlContent: html,
    });
    if (sent) return true;
  }

  const resendApiKey = process.env["RESEND_API_KEY"];
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress("QuestionBank"),
          to: [toEmail],
          subject: `[QuestionBank] আপনার সাবস্ক্রিপশন সক্রিয় হয়েছে · ${input.orderCode}`,
          html,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  return false;
}
