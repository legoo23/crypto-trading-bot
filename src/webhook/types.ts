/**
 * Formato JSON esperado en el "Message" de la alerta de TradingView.
 * Ejemplo de configuración de alerta en TradingView:
 *
 * {
 *   "secret": "{{tu TRADINGVIEW_WEBHOOK_SECRET}}",
 *   "symbol": "{{ticker}}",
 *   "side": "long",
 *   "action": "entry",
 *   "strategy": "ema-trend-follow",
 *   "timeframe": "15m"
 * }
 */
export type TradingViewAlertPayload = {
  secret: string;
  symbol: string;
  side: 'long' | 'short';
  action: 'entry' | 'exit';
  strategy: string;
  timeframe: string;
};

export function isValidPayload(body: unknown): body is TradingViewAlertPayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.secret === 'string' &&
    typeof b.symbol === 'string' &&
    (b.side === 'long' || b.side === 'short') &&
    (b.action === 'entry' || b.action === 'exit') &&
    typeof b.strategy === 'string' &&
    typeof b.timeframe === 'string'
  );
}
