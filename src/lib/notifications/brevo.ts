import "server-only";

export type BrevoRecipient = {
  email: string;
  name?: string | null | undefined;
};

export type BrevoEmailInput = {
  to: BrevoRecipient | BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string | undefined;
  sender?: {
    email: string;
    name: string;
  } | undefined;
};

export async function sendBrevoEmail(input: BrevoEmailInput): Promise<boolean> {
  let apiKey = process.env["BREVO_API_KEY"]?.trim();

  if (!apiKey) {
    console.error("[Brevo] Missing BREVO_API_KEY in environment variables.");
    return false;
  }

  // Sanitize accidental leading character or prefix if pasted with typos
  if (apiKey.startsWith("yxkeysib-")) {
    apiKey = apiKey.slice(1);
  }

  const senderEmail =
    input.sender?.email?.trim() ||
    process.env["BREVO_SENDER_EMAIL"]?.trim() ||
    "qbank273@gmail.com";

  const senderName =
    input.sender?.name?.trim() ||
    process.env["BREVO_SENDER_NAME"]?.trim() ||
    "QuestionBank";

  const rawRecipients = Array.isArray(input.to) ? input.to : [input.to];
  const validRecipients = rawRecipients
    .filter((r) => Boolean(r && typeof r.email === "string" && r.email.trim()))
    .map((r) => ({
      email: r.email.trim(),
      ...(r.name?.trim() ? { name: r.name.trim() } : {}),
    }));

  if (validRecipients.length === 0) {
    console.error("[Brevo] No valid recipient email provided.");
    return false;
  }

  const payload: Record<string, unknown> = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: validRecipients,
    subject: input.subject,
    htmlContent: input.htmlContent,
  };

  if (input.textContent?.trim()) {
    payload["textContent"] = input.textContent.trim();
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Brevo Dispatcher Error]", res.status, errBody);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Brevo Dispatcher Exception]", err);
    return false;
  }
}
