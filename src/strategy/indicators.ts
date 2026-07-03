import { EMA, RSI, MACD, ATR, SMA } from 'technicalindicators';
import type { Candle } from '../exchange/bybit.ts';

export function ema(candles: Candle[], period: number): number[] {
  return EMA.calculate({ period, values: candles.map((c) => c.close) });
}

export function rsi(candles: Candle[], period = 14): number[] {
  return RSI.calculate({ period, values: candles.map((c) => c.close) });
}

export function macdHistogram(candles: Candle[]): number[] {
  const result = MACD.calculate({
    values: candles.map((c) => c.close),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  return result.map((r) => r.histogram ?? 0);
}

export function atr(candles: Candle[], period = 14): number[] {
  return ATR.calculate({
    period,
    high: candles.map((c) => c.high),
    low: candles.map((c) => c.low),
    close: candles.map((c) => c.close),
  });
}

export function volumeSma(candles: Candle[], period = 20): number[] {
  return SMA.calculate({ period, values: candles.map((c) => c.volume) });
}

export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}
