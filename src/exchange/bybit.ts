import { bybit as BybitExchange, Order, Position } from 'ccxt';
import { env } from '../config/env.ts';

export type Candle = { timestamp: number; open: number; high: number; low: number; close: number; volume: number };

class BybitConnector {
  readonly exchange: InstanceType<typeof BybitExchange>;

  constructor() {
    this.exchange = new BybitExchange({
      apiKey: env.bybitApiKey,
      secret: env.bybitApiSecret,
      enableRateLimit: true,
      options: { defaultType: 'linear' },
    });
    if (env.bybitTestnet) {
      this.exchange.setSandboxMode(true);
    }
  }

  get isTestnet(): boolean {
    return env.bybitTestnet;
  }

  async fetchCandles(symbol: string, timeframe: string, limit = 200): Promise<Candle[]> {
    const raw = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    return raw.map((c) => ({
      timestamp: c[0] as number,
      open: c[1] as number,
      high: c[2] as number,
      low: c[3] as number,
      close: c[4] as number,
      volume: c[5] as number,
    }));
  }

  async fetchBalanceUSDT(): Promise<number> {
    const balance = await this.exchange.fetchBalance();
    // Bybit UTA: balance may live under 'USDT' or as free+used on the CONTRACT account
    const usdt = balance['USDT'];
    if (usdt?.total !== undefined && usdt.total > 0) return usdt.total;
    // Fallback: sum free + used if total missing (some testnet UTA responses)
    const free = usdt?.free ?? 0;
    const used = usdt?.used ?? 0;
    if (free + used > 0) return free + used;
    console.warn('[bybit] fetchBalanceUSDT: balance USDT=0, raw keys:', Object.keys(balance));
    return 0;
  }

  async fetchOpenPositions(): Promise<Position[]> {
    if (!this.exchange.has['fetchPositions']) return [];
    return this.exchange.fetchPositions();
  }

  /**
   * Abre una posición de mercado con stop loss y take profit adjuntos.
   * Bybit (via ccxt unified params) acepta stopLoss/takeProfit como precios absolutos
   * en la orden de entrada para cuentas unificadas de derivados.
   */
  async openMarketPositionWithBrackets(params: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    stopLossPrice: number;
    takeProfitPrice: number;
  }): Promise<Order> {
    const { symbol, side, amount, stopLossPrice, takeProfitPrice } = params;
    return this.exchange.createOrder(symbol, 'market', side, amount, undefined, {
      stopLoss: { triggerPrice: stopLossPrice },
      takeProfit: { triggerPrice: takeProfitPrice },
    });
  }

  async closePosition(symbol: string, side: 'buy' | 'sell', amount: number): Promise<Order> {
    const closingSide = side === 'buy' ? 'sell' : 'buy';
    return this.exchange.createOrder(symbol, 'market', closingSide, amount, undefined, { reduceOnly: true });
  }
}

export const bybit = new BybitConnector();
