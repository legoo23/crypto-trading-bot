/**
 * TradingView y ccxt/Bybit no usan el mismo formato de símbolo ni de timeframe.
 * TradingView: "BTCUSDT" o "BTCUSDT.P", resoluciones como "15", "60", "D".
 * ccxt/Bybit:  "BTC/USDT:USDT" para perpetuos lineales, timeframes como "15m", "1h", "1d".
 * Este módulo traduce lo que llega en la alerta al formato que el resto del bot espera.
 */

const DEFAULT_TIMEFRAME_MAP: Record<string, string> = {
  '1': '1m',
  '3': '3m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '120': '2h',
  '240': '4h',
  '360': '6h',
  '480': '8h',
  '720': '12h',
  D: '1d',
  '1D': '1d',
  W: '1w',
  '1W': '1w',
  M: '1M',
  '1M': '1M',
};

function parseSymbolMap(): Record<string, string> {
  const raw = process.env.TRADINGVIEW_SYMBOL_MAP;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[config] TRADINGVIEW_SYMBOL_MAP no es JSON válido, se ignora');
    return {};
  }
}

const symbolMap = parseSymbolMap();

/** Traduce el ticker de TradingView (ej. "BTCUSDT.P") al símbolo ccxt (ej. "BTC/USDT:USDT"). */
export function mapTradingViewSymbol(tvSymbol: string): string {
  const mapped = symbolMap[tvSymbol];
  if (!mapped) {
    console.warn(
      `[tradingview-mapping] Sin mapeo para el símbolo "${tvSymbol}". Agrégalo a TRADINGVIEW_SYMBOL_MAP en .env, ej: {"${tvSymbol}":"BTC/USDT:USDT"}`,
    );
  }
  return mapped ?? tvSymbol;
}

/** Traduce la resolución de TradingView (ej. "15", "D") al timeframe ccxt (ej. "15m", "1d"). */
export function mapTradingViewTimeframe(tvTimeframe: string): string {
  return DEFAULT_TIMEFRAME_MAP[tvTimeframe] ?? tvTimeframe;
}
