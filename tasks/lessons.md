# tasks/lessons.md — Crypto Trading Bot

Lecciones tecnicas especificas de este proyecto. Las lecciones generalizables viven en el CLAUDE.md.

---

## 2026-07-08

**ccxt watchLiquidations() esta en ccxt v4 sin costo adicional**
- ccxt Pro (WebSockets) se fusiono con ccxt desde v4 y viene incluido en el paquete `ccxt` normal.
- No hay que instalar `ccxt-pro` por separado ni pagar licencia. `watchLiquidations()` funciona directamente.

**El feed `allLiquidation` de Bybit es dato real, no estimacion**
- Bybit transmite por WebSocket cada liquidacion que YA ocurrio (no predicciones de donde ocurriran).
- El "mapa de liquidaciones" de Coinglass es una estimacion basada en OI + supuestos de apalancamiento.
- Ningun exchange publica posiciones individuales de traders. Cualquier heatmap es una aproximacion.

**syminfo.ticker vs {{ticker}} en Pine Script**
- `{{ticker}}` y `{{interval}}` son placeholders del campo "Message" del dialogo de alertas de TradingView.
- Dentro de un `alert()` en el codigo Pine, hay que usar `syminfo.ticker` y `timeframe.period` directamente.
- Mezclar los dos formatos rompe el JSON que recibe el webhook silenciosamente.

**Mapeo de simbolos TradingView -> ccxt es obligatorio**
- TradingView manda `"BTCUSDT.P"`, Bybit via ccxt espera `"BTC/USDT:USDT"`.
- Si el simbolo no esta en `TRADINGVIEW_SYMBOL_MAP`, el bot lo pasa tal cual y Bybit lo rechaza.
- El log del servidor dice exactamente que simbolo agregar al mapa.

**SQLite necesita directorio `data/` preexistente**
- `better-sqlite3` no crea directorios intermedios. Si `./data/` no existe, el servidor falla al arrancar.
- En Docker: crear el directorio en el Dockerfile o montarlo como volumen antes de `CMD`.
- En desarrollo: `mkdir -p data` antes de `npm run dev` la primera vez.

**esbuild + import.meta.url**
- `import.meta.url` queda vacio al empaquetar a CJS con esbuild. Usar `process.cwd()` para rutas absolutas en produccion.
- El servidor ya usa `process.cwd()` para resolver rutas de assets; no cambiar a `import.meta.url`.
