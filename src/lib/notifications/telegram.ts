const DEFAULT_BOT_TOKEN = "8829533636:AAEUOBgy7AnpwhV8ES1675UZKk7olXvsXSY";
const DEFAULT_CHAT_ID = "-1004445399445";

export type TelegramMessageInput = {
  text: string;
  /** Optional single inline button shown under the message. */
  button?: {
    text: string;
    url: string;
  };
};

/**
 * Sends one HTML-formatted Telegram message to the configured admin chat.
 * Credentials come from env, with the project's existing admin bot as fallback
 * so notifications keep working in deployments without extra configuration.
 */
export async function sendTelegramMessage(
  input: TelegramMessageInput,
): Promise<boolean> {
  const token = process.env["TELEGRAM_BOT_TOKEN"] ?? DEFAULT_BOT_TOKEN;
  const chatId = process.env["TELEGRAM_CHAT_ID"] ?? DEFAULT_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: input.text,
      parse_mode: "HTML",
    };

    if (input.button) {
      payload["reply_markup"] = {
        inline_keyboard: [[input.button]],
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Telegram Dispatcher Error]", res.status, errBody);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Telegram Dispatcher Exception]", err);
    return false;
  }
}
