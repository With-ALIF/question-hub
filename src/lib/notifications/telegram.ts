export type TelegramMessageInput = {
  text: string;
  button?: {
    text: string;
    url: string;
  };
};

export async function sendTelegramMessage(
  input: TelegramMessageInput,
): Promise<boolean> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  const chatId = process.env["TELEGRAM_CHAT_ID"];

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
