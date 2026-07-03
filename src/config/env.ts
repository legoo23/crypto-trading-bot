import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

function num(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: num('PORT', 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',

  bybitApiKey: process.env.BYBIT_API_KEY ?? '',
  bybitApiSecret: process.env.BYBIT_API_SECRET ?? '',
  bybitTestnet: bool('BYBIT_TESTNET', true),

  tradingviewWebhookSecret: required('TRADINGVIEW_WEBHOOK_SECRET', 'cambia-esto-por-un-secreto-largo-y-aleatorio'),

  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',

  riskPerTradePct: num('RISK_PER_TRADE_PCT', 1),
  maxOpenPositions: num('MAX_OPEN_POSITIONS', 3),
  maxDailyLossPct: num('MAX_DAILY_LOSS_PCT', 5),

  databasePath: process.env.DATABASE_PATH ?? './data/trading-bot.sqlite',
};

if (!env.isProduction && env.tradingviewWebhookSecret === 'cambia-esto-por-un-secreto-largo-y-aleatorio') {
  console.warn('[config] Estás usando el TRADINGVIEW_WEBHOOK_SECRET de ejemplo. Cámbialo antes de exponer el webhook públicamente.');
}
