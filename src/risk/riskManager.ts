import { env } from '../config/env.ts';
import { db, getState, setState } from '../db/index.ts';

const KILL_SWITCH_KEY = 'kill_switch_engaged';
const KILL_SWITCH_REASON_KEY = 'kill_switch_reason';

export function isKillSwitchEngaged(): boolean {
  return getState(KILL_SWITCH_KEY) === 'true';
}

export function engageKillSwitch(reason: string): void {
  setState(KILL_SWITCH_KEY, 'true');
  setState(KILL_SWITCH_REASON_KEY, reason);
  console.warn(`[risk] KILL SWITCH ACTIVADO: ${reason}`);
}

export function disengageKillSwitch(): void {
  setState(KILL_SWITCH_KEY, 'false');
  setState(KILL_SWITCH_REASON_KEY, '');
}

export function killSwitchReason(): string {
  return getState(KILL_SWITCH_REASON_KEY) ?? '';
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function todayRealizedPnl(): number {
  const row = db
    .prepare(`SELECT COALESCE(SUM(pnl), 0) as total FROM trades WHERE closed_at IS NOT NULL AND closed_at >= ?`)
    .get(todayStart()) as { total: number };
  return row.total;
}

export function openPositionsCount(): number {
  const row = db.prepare(`SELECT COUNT(*) as count FROM trades WHERE status = 'open'`).get() as { count: number };
  return row.count;
}

export type RiskCheckResult = { allowed: true } | { allowed: false; reason: string };

/** Debe llamarse antes de ejecutar cualquier orden nueva. */
export function checkRiskBeforeTrade(accountBalance: number): RiskCheckResult {
  if (isKillSwitchEngaged()) {
    return { allowed: false, reason: `Kill switch activo: ${killSwitchReason()}` };
  }

  if (openPositionsCount() >= env.maxOpenPositions) {
    return { allowed: false, reason: `Máximo de posiciones abiertas alcanzado (${env.maxOpenPositions})` };
  }

  if (accountBalance <= 0) {
    return { allowed: false, reason: 'Balance no disponible o cero, operación bloqueada por seguridad' };
  }

  const dailyLossLimit = -(accountBalance * (env.maxDailyLossPct / 100));
  const pnlToday = todayRealizedPnl();
  if (pnlToday < dailyLossLimit) {
    engageKillSwitch(`Pérdida diaria máxima alcanzada (${pnlToday.toFixed(2)} USDT, límite ${dailyLossLimit.toFixed(2)})`);
    return { allowed: false, reason: `Pérdida diaria máxima alcanzada, kill switch activado` };
  }

  return { allowed: true };
}

/**
 * Calcula el tamaño de posición (en unidades del activo base) para arriesgar
 * exactamente RISK_PER_TRADE_PCT del balance en la distancia entre entrada y stop loss.
 */
export function calculatePositionSize(params: {
  accountBalance: number;
  entryPrice: number;
  stopLossPrice: number;
}): number {
  const { accountBalance, entryPrice, stopLossPrice } = params;
  const riskAmountUsdt = accountBalance * (env.riskPerTradePct / 100);
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  if (priceDistance === 0) return 0;
  return riskAmountUsdt / priceDistance;
}

/** Verifica el estado de la cuenta tras cada cierre de operación y activa el kill switch si corresponde. */
export function reevaluateKillSwitchAfterTradeClose(accountBalance: number): void {
  const dailyLossLimit = -(accountBalance * (env.maxDailyLossPct / 100));
  const pnlToday = todayRealizedPnl();
  if (accountBalance > 0 && pnlToday < dailyLossLimit && !isKillSwitchEngaged()) {
    engageKillSwitch(`Pérdida diaria máxima alcanzada (${pnlToday.toFixed(2)} USDT, límite ${dailyLossLimit.toFixed(2)})`);
  }
}
