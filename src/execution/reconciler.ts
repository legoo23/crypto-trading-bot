import { bybit } from '../exchange/bybit.ts';
import { db } from '../db/index.ts';
import { closeTradeRecord } from './orderExecutor.ts';
import { reevaluateKillSwitchAfterTradeClose } from '../risk/riskManager.ts';
import { notifyTelegram } from '../notify/telegram.ts';

type OpenTradeRow = {
  id: number;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  amount: number;
};

/**
 * El bot coloca SL/TP directamente en el exchange, así que un cierre puede pasar sin que
 * este proceso haga nada (Bybit lo ejecuta solo). Este reconciliador detecta esos cierres
 * comparando el registro local contra las posiciones reales en Bybit, calcula el P&L
 * aproximado con el último precio de la vela y actualiza SQLite + kill switch.
 *
 * Nota: el precio de salida usado es un estimado (último close disponible), no el precio
 * exacto de ejecución del SL/TP. Para P&L exacto se debería cruzar contra
 * fetchMyTrades/fetchClosedOrders, que varía según el tipo de cuenta de Bybit.
 */
export async function reconcileOpenTrades(): Promise<void> {
  const openTrades = db.prepare(`SELECT id, symbol, side, entry_price, amount FROM trades WHERE status = 'open'`).all() as OpenTradeRow[];
  if (openTrades.length === 0) return;

  let positions: Awaited<ReturnType<typeof bybit.fetchOpenPositions>> = [];
  try {
    positions = await bybit.fetchOpenPositions();
  } catch (err) {
    console.error('[reconciler] Error obteniendo posiciones de Bybit:', err);
    return;
  }

  const openSymbols = new Set(
    positions.filter((p) => Math.abs(Number(p.contracts ?? 0)) > 0).map((p) => p.symbol),
  );

  for (const trade of openTrades) {
    if (openSymbols.has(trade.symbol)) continue;

    try {
      const candles = await bybit.fetchCandles(trade.symbol, '1m', 1);
      const exitPrice = candles[0]?.close ?? trade.entry_price;
      const direction = trade.side === 'long' ? 1 : -1;
      const pnl = (exitPrice - trade.entry_price) * trade.amount * direction;

      closeTradeRecord(trade.id, exitPrice, pnl);

      const balance = await bybit.fetchBalanceUSDT();
      reevaluateKillSwitchAfterTradeClose(balance);

      await notifyTelegram(
        `${pnl >= 0 ? '🟢' : '🔴'} Posición cerrada (#${trade.id})\n${trade.symbol} ${trade.side}\nP&L estimado: ${pnl.toFixed(2)} USDT`,
      );
    } catch (err) {
      console.error(`[reconciler] Error reconciliando trade #${trade.id}:`, err);
    }
  }
}

export function startReconciliationLoop(intervalMs = 30_000): NodeJS.Timeout {
  return setInterval(() => {
    reconcileOpenTrades().catch((err) => console.error('[reconciler] Error en el ciclo de reconciliación:', err));
  }, intervalMs);
}
