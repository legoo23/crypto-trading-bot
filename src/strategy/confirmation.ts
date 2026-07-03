import { bybit } from '../exchange/bybit.ts';
import { atr, ema, last, macdHistogram, rsi, volumeSma } from './indicators.ts';
import { ConfirmationConfig, ConfirmationResult, TradeSignal, defaultConfirmationConfig } from './types.ts';

/**
 * Re-valida una señal recibida de TradingView contra datos en vivo del exchange antes
 * de ejecutar nada. Esto protege contra retrasos del webhook y exige confluencia de
 * varios factores (tendencia, momentum, volatilidad, volumen) en vez de operar a ciegas
 * sobre una sola alerta.
 */
export async function confirmSignal(
  signal: TradeSignal,
  config: ConfirmationConfig = defaultConfirmationConfig,
): Promise<ConfirmationResult> {
  const [entryCandles, trendCandles] = await Promise.all([
    bybit.fetchCandles(signal.symbol, signal.entryTimeframe, 250),
    bybit.fetchCandles(signal.symbol, config.trendTimeframe, config.trendSlowPeriod + 10),
  ]);

  if (entryCandles.length < 60 || trendCandles.length < config.trendSlowPeriod) {
    return { accepted: false, reason: 'Datos históricos insuficientes para confirmar la señal' };
  }

  const emaFast = last(ema(trendCandles, config.trendFastPeriod));
  const emaSlow = last(ema(trendCandles, config.trendSlowPeriod));
  if (emaFast === undefined || emaSlow === undefined) {
    return { accepted: false, reason: 'No se pudo calcular la tendencia (EMA)' };
  }
  const trendIsUp = emaFast > emaSlow;
  if (signal.side === 'long' && !trendIsUp) {
    return { accepted: false, reason: `Tendencia en ${config.trendTimeframe} es bajista, se rechaza señal long` };
  }
  if (signal.side === 'short' && trendIsUp) {
    return { accepted: false, reason: `Tendencia en ${config.trendTimeframe} es alcista, se rechaza señal short` };
  }

  const rsiValue = last(rsi(entryCandles, config.rsiPeriod));
  if (rsiValue === undefined) {
    return { accepted: false, reason: 'No se pudo calcular RSI' };
  }
  const [rsiMin, rsiMax] = signal.side === 'long' ? config.rsiLongRange : config.rsiShortRange;
  if (rsiValue < rsiMin || rsiValue > rsiMax) {
    return { accepted: false, reason: `RSI (${rsiValue.toFixed(1)}) fuera de rango [${rsiMin}, ${rsiMax}] para ${signal.side}` };
  }

  const macdHist = last(macdHistogram(entryCandles));
  if (macdHist === undefined) {
    return { accepted: false, reason: 'No se pudo calcular MACD' };
  }
  if (signal.side === 'long' && macdHist <= 0) {
    return { accepted: false, reason: 'Histograma MACD no confirma momentum alcista' };
  }
  if (signal.side === 'short' && macdHist >= 0) {
    return { accepted: false, reason: 'Histograma MACD no confirma momentum bajista' };
  }

  const atrValue = last(atr(entryCandles, config.atrPeriod));
  const currentPrice = entryCandles[entryCandles.length - 1].close;
  if (atrValue === undefined) {
    return { accepted: false, reason: 'No se pudo calcular ATR' };
  }
  const atrPct = (atrValue / currentPrice) * 100;
  if (atrPct < config.minAtrPct) {
    return { accepted: false, reason: `Volatilidad insuficiente (ATR ${atrPct.toFixed(2)}% < ${config.minAtrPct}%), mercado sin movimiento claro` };
  }

  const volSma = last(volumeSma(entryCandles, config.volumeSmaPeriod));
  const currentVolume = entryCandles[entryCandles.length - 1].volume;
  if (volSma === undefined || volSma === 0) {
    return { accepted: false, reason: 'No se pudo calcular volumen promedio' };
  }
  const volumeRatio = currentVolume / volSma;
  if (volumeRatio < config.minVolumeRatio) {
    return { accepted: false, reason: `Volumen insuficiente (${volumeRatio.toFixed(2)}x el promedio, mínimo ${config.minVolumeRatio}x)` };
  }

  const stopLossPrice =
    signal.side === 'long'
      ? currentPrice - atrValue * config.stopLossAtrMultiple
      : currentPrice + atrValue * config.stopLossAtrMultiple;
  const takeProfitPrice =
    signal.side === 'long'
      ? currentPrice + atrValue * config.takeProfitAtrMultiple
      : currentPrice - atrValue * config.takeProfitAtrMultiple;

  return { accepted: true, entryPrice: currentPrice, stopLossPrice, takeProfitPrice };
}
