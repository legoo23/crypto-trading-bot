import { bybit } from '../exchange/bybit.ts';
import { last, rsi } from './indicators.ts';
import { Side, TradeSignal } from './types.ts';

export type ContrarianConfig = {
  fundingRateThreshold: number;
  rsiOverbought: number;
  rsiOversold: number;
};

export type ContrarianCheckResult = {
  symbol: string;
  fundingRate: number | undefined;
  rsiValue: number | undefined;
  signal: TradeSignal | null;
};

/**
 * Idea: cuando el funding rate está en un extremo, la mayoría del mercado está parado
 * de un solo lado (todos long o todos short) pagando o cobrando una tasa fuera de lo normal.
 * Eso es una posición de mercado "abarrotada" (crowded trade): estadísticamente, cuando
 * además el precio muestra agotamiento (RSI en sobrecompra/sobreventa) en la misma
 * dirección, hay más probabilidad de una reversión que de que la mayoría tenga razón.
 * Por eso la señal es contraria (contrarian) al sesgo de la mayoría, no a favor de él.
 */
export async function checkContrarianSignal(
  symbol: string,
  timeframe: string,
  config: ContrarianConfig,
): Promise<ContrarianCheckResult> {
  const [fundingRateInfo, candles] = await Promise.all([
    bybit.exchange.fetchFundingRate(symbol),
    bybit.fetchCandles(symbol, timeframe, 60),
  ]);

  const fundingRate = fundingRateInfo.fundingRate ?? undefined;
  const rsiValue = last(rsi(candles, 14));

  if (fundingRate === undefined || rsiValue === undefined) {
    return { symbol, fundingRate, rsiValue, signal: null };
  }

  let side: Side | null = null;
  if (fundingRate >= config.fundingRateThreshold && rsiValue >= config.rsiOverbought) {
    // Funding muy positivo = mayoría paga por estar long = mercado abarrotado de largos.
    // Con RSI también en sobrecompra, se apuesta a la reversión: entrar en corto.
    side = 'short';
  } else if (fundingRate <= -config.fundingRateThreshold && rsiValue <= config.rsiOversold) {
    // Funding muy negativo = mayoría paga por estar short = mercado abarrotado de cortos.
    // Con RSI también en sobreventa, se apuesta a la reversión: entrar en largo.
    side = 'long';
  }

  if (!side) {
    return { symbol, fundingRate, rsiValue, signal: null };
  }

  return {
    symbol,
    fundingRate,
    rsiValue,
    signal: { symbol, side, strategy: 'contrarian-funding-rate', entryTimeframe: timeframe },
  };
}
