import { env } from '../config/env.ts';

export async function notifyTelegram(message: string): Promise<void> {
  if (!env.telegramBotToken || !env.telegramChatId) return;
  try {
    const url = `https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.telegramChatId, text: message, parse_mode: 'HTML' }),
    });
    if (!response.ok) {
      console.error('[telegram] Error al enviar notificación:', await response.text());
    }
  } catch (err) {
    console.error('[telegram] Error al enviar notificación:', err);
  }
}
