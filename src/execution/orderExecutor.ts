import { bybit } from '../exchange/bybit.ts';
import { db } from '../db/index.ts';
import { Side } from '../strategy/types.ts';

export function recordSignal(params: {
  symbol: string;
  side: Side;
  action: string;
  strategy: string;
  rawPayload: unknown;
  accepted: boolean;
  rejectReason?: string;
}): number {
  const result = db
    .prepare(
      `INSERT INTO signals (received_at, symbol, side, action, strategy, raw_payload, accepted, reject_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      new Date().toISOString(),
      params.symbol,
      params.side,
      params.action,
      params.strategy,
      JSON.stringify(params.rawPayload),
      params.accepted ? 1 : 0,
      params.rejectReason ?? null,
    );
  return Number(result.lastInsertRowid);
}

export async function executeEntry(params: {
  signalId: number;
  symbol: string;
  side: Side;
  amount: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}): Promise<void> {
  const ccxtSide = params.side === 'long' ? 'buy' : 'sell';
  const order = await bybit.openMarketPositionWithBrackets({
    symbol: params.symbol,
    side: ccxtSide,
    amount: params.amount,
    stopLossPrice: params.stopLossPrice,
    takeProfitPrice: params.takeProfitPrice,
  });

  db.prepare(
    `INSERT INTO trades (signal_id, opened_at, symbol, side, entry_price, amount, stop_loss, take_profit, status, exchange_order_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
  ).run(
    params.signalId,
    new Date().toISOString(),
    params.symbol,
    params.side,
    params.entryPrice,
    params.amount,
    params.stopLossPrice,
    params.takeProfitPrice,
    order.id ?? null,
  );
}

export function closeTradeRecord(tradeId: number, exitPrice: number, pnl: number): void {
  db.prepare(`UPDATE trades SET closed_at = ?, exit_price = ?, pnl = ?, status = 'closed' WHERE id = ?`).run(
    new Date().toISOString(),
    exitPrice,
    pnl,
    tradeId,
  );
}

export function listOpenTrades() {
  return db.prepare(`SELECT * FROM trades WHERE status = 'open' ORDER BY opened_at DESC`).all();
}

export function listRecentTrades(limit = 50) {
  return db.prepare(`SELECT * FROM trades ORDER BY opened_at DESC LIMIT ?`).all(limit);
}

export function listRecentSignals(limit = 50) {
  return db.prepare(`SELECT * FROM signals ORDER BY received_at DESC LIMIT ?`).all(limit);
}
