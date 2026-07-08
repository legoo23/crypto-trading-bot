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

**Google Cloud Run: permisos necesarios para deploy desde source**
- La cuenta de servicio de Cloud Build (`790920529308@cloudbuild.gserviceaccount.com`) necesita `roles/artifactregistry.writer` a nivel de repositorio, no solo de proyecto.
- La cuenta de computo (`790920529308-compute@developer.gserviceaccount.com`) necesita `roles/secretmanager.secretAccessor` para leer secretos en tiempo de ejecucion.
- Otorgar roles a nivel de proyecto no siempre se propaga al repositorio de Artifact Registry — otorgarlo directamente con `gcloud artifacts repositories add-iam-policy-binding`.

**Windows: npm install con modulos nativos requiere herramientas de build**
- `better-sqlite3` compila codigo nativo y necesita Python 3.x y Visual Studio Build Tools en Windows.
- `windows-build-tools` de npm esta obsoleto y roto con Node 20+. No usarlo.
- Solucion correcta: instalar manualmente Python 3.11.9 (ultima con instalador binario para Windows) desde python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe y Visual Studio Build Tools 2022 con el workload "Desarrollo para escritorio con C++".
- Node 24 no tiene binarios precompilados de `better-sqlite3`. Usar Node 20 LTS.
- PowerShell bloquea scripts por defecto: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` antes de correr npm.

**Windows: `curl` en PowerShell no es curl de Unix**
- En PowerShell, `curl` es un alias de `Invoke-WebRequest`, no el binario de curl.
- Los flags `-H`, `-d`, `-X` no funcionan igual. Usar `Invoke-WebRequest` con sus parametros nativos o instalar curl.exe por separado.

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
