import ccxt, { Liquidation } from 'ccxt';
import { env } from '../config/env.ts';
import { db } from '../db/index.ts';

/**
 * Fuente real (no estimada) de liquidez: el feed público de liquidaciones de Bybit
 * ("allLiquidation"), que ccxt expone gratis vía WebSocket con watchLiquidations() —
 * no requiere API key ni ningún servicio de terceros tipo Coinglass. Cada evento es
 * una liquidación que YA ocurrió en el exchange, así que esto es un registro de zonas
 * de precio donde recientemente se limpió apalancamiento, útil como referencia de
 * soporte/resistencia — no una predicción de dónde se liquidará gente en el futuro
 * (eso requeriría estimar posiciones abiertas por nivel de apalancamiento, que ningún
 * exchange expone públicamente; ver docs/liquidity-without-coinglass.md).
 */

function recordLiquidation(liq: Liquidation): void {
  db.prepare(
    `INSERT INTO liquidations (received_at, symbol, side, price, quote_value, exchange_timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    new Date().toISOString(),
    liq.symbol ?? '',
    liq.side ?? null,
    liq.price ?? 0,
    liq.quoteValue ?? null,
    liq.timestamp ?? null,
  );
}

async function watchSymbol(exchange: InstanceType<typeof ccxt.pro.bybit>, symbol: string): Promise<void> {
  // watchLiquidations resuelve cada vez que llega un nuevo evento por el socket; por eso
  // se corre en un loop infinito en vez de hacer una sola llamada.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const liquidations = await exchange.watchLiquidations(symbol);
      for (const liq of liquidations) {
        recordLiquidation(liq);
      }
    } catch (err) {
      console.error(`[liquidations] Error en el stream de ${symbol}, reintentando en 5s:`, err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export function startLiquidationWatcher(): void {
  if (!env.liquidationWatchEnabled) {
    console.log('[liquidations] Deshabilitado (LIQUIDATION_WATCH_ENABLED=false)');
    return;
  }
  if (env.liquidationWatchSymbols.length === 0) {
    console.warn('[liquidations] LIQUIDATION_WATCH_ENABLED=true pero LIQUIDATION_WATCH_SYMBOLS está vacío');
    return;
  }

  const exchange = new ccxt.pro.bybit({ options: { defaultType: 'linear' } });
  if (env.bybitTestnet) {
    exchange.setSandboxMode(true);
  }

  console.log(`[liquidations] Escuchando liquidaciones reales de Bybit para: ${env.liquidationWatchSymbols.join(', ')}`);
  for (const symbol of env.liquidationWatchSymbols) {
    watchSymbol(exchange, symbol).catch((err) => console.error(`[liquidations] Loop de ${symbol} terminó inesperadamente:`, err));
  }
}

export function listRecentLiquidations(limit = 100) {
  return db.prepare(`SELECT * FROM liquidations ORDER BY received_at DESC LIMIT ?`).all(limit);
}

export type LiquidationCluster = { symbol: string; side: string; count: number; totalQuoteValue: number };

/** Agrupa las liquidaciones de los últimos `minutes` minutos por símbolo y lado, como referencia
 * rápida de en qué dirección se está limpiando más apalancamiento ahora mismo. */
export function summarizeRecentLiquidations(minutes = 15): LiquidationCluster[] {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  return db
    .prepare(
      `SELECT symbol, side, COUNT(*) as count, COALESCE(SUM(quote_value), 0) as totalQuoteValue
       FROM liquidations
       WHERE received_at >= ? AND side IS NOT NULL
       GROUP BY symbol, side
       ORDER BY totalQuoteValue DESC`,
    )
    .all(since) as LiquidationCluster[];
}
