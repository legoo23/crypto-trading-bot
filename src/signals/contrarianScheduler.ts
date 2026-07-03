import { env } from '../config/env.ts';
import { checkContrarianSignal } from '../strategy/contrarian.ts';
import { processSignal } from './signalProcessor.ts';

async function runContrarianCheck(): Promise<void> {
  for (const symbol of env.contrarianSymbols) {
    try {
      const result = await checkContrarianSignal(symbol, env.contrarianTimeframe, {
        fundingRateThreshold: env.contrarianFundingRateThreshold,
        rsiOverbought: env.contrarianRsiOverbought,
        rsiOversold: env.contrarianRsiOversold,
      });

      if (result.signal) {
        await processSignal(result.signal, {
          source: 'contrarian-funding-rate',
          fundingRate: result.fundingRate,
          rsiValue: result.rsiValue,
        });
      }
    } catch (err) {
      console.error(`[contrarian] Error revisando ${symbol}:`, err);
    }
  }
}

export function startContrarianLoop(): NodeJS.Timeout | null {
  if (!env.contrarianEnabled) {
    console.log('[contrarian] Deshabilitado (CONTRARIAN_ENABLED=false)');
    return null;
  }
  if (env.contrarianSymbols.length === 0) {
    console.warn('[contrarian] CONTRARIAN_ENABLED=true pero CONTRARIAN_SYMBOLS está vacío, no hay nada que revisar');
    return null;
  }

  console.log(`[contrarian] Activo para: ${env.contrarianSymbols.join(', ')} (cada ${env.contrarianCheckIntervalMinutes} min)`);
  runContrarianCheck().catch((err) => console.error('[contrarian] Error en la primera revisión:', err));

  return setInterval(() => {
    runContrarianCheck().catch((err) => console.error('[contrarian] Error en el ciclo:', err));
  }, env.contrarianCheckIntervalMinutes * 60_000);
}
