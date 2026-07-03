# Conectar el indicador "Multiple indicators + TL Alerts [LUPOWN]"

Esta guía es para conectar tu indicador Pine (el que mezcla EMAs, Koncorde, Volume
Profile, Supertrend, pivotes, etc.) con este bot, usando tres de sus señales como
estrategias independientes: **TL Alerts** (momentum + pivotes ADX, el bloque que ya
trae en el título "TL Alerts"), **Supertrend** y **Koncorde**.

Cada una se registra en el bot con su propio nombre de `strategy`, así que en el
dashboard puedes ver cuál funciona mejor. Las tres pasan por el mismo filtro de
confirmación multi-factor del bot (tendencia, RSI, MACD, ATR, volumen) antes de
ejecutar cualquier orden — el bot no ejecuta la alerta a ciegas, sea cual sea el
indicador que la origina.

## 1. Por qué no basta con el `alert()` que ya existe

El bloque de "TL Alerts" original hace esto:

```pine
if (sell_c or buy_c)
    alert = sell_c?"Sell alert ":"Buy alert "
    alert( alert + tostring(close), freq = alert.freq_once_per_bar_close )
```

Eso manda texto libre (`"Buy alert 43250.5"`), no el JSON que el webhook del bot
espera (`secret`, `symbol`, `side`, `action`, `strategy`, `timeframe`). Hay que
reconstruir el mensaje como JSON, usando variables de Pine (`syminfo.ticker`,
`timeframe.period`) en vez de placeholders tipo `{{ticker}}` — esos placeholders
solo funcionan en el campo "Message" del diálogo de alertas de TradingView, **no**
dentro del string que arma el propio script con `alert()`.

## 2. Reemplaza el bloque de TL Alerts

Agrega esta línea una sola vez cerca del principio del script (junto a los demás
`input`, por ejemplo):

```pine
tv_secret = "REEMPLAZA_ESTO_POR_TU_TRADINGVIEW_WEBHOOK_SECRET"
```

Y reemplaza el bloque original de alerta por:

```pine
if (sell_c or buy_c)
    tl_side = buy_c ? "long" : "short"
    tl_msg = '{"secret":"' + tv_secret + '","symbol":"' + syminfo.ticker + '","side":"' + tl_side + '","action":"entry","strategy":"tl-momentum-adx","timeframe":"' + timeframe.period + '"}'
    alert(tl_msg, freq = alert.freq_once_per_bar_close)
```

## 3. Agrega el alert() de Supertrend

Justo debajo de donde el script calcula `buySignal`/`sellSignal` del Supertrend
(las líneas que ya tienen `alertcondition(buySignal, ...)` y
`alertcondition(sellSignal, ...)`), agrega:

```pine
if buySignal or sellSignal
    st_side = buySignal ? "long" : "short"
    st_msg = '{"secret":"' + tv_secret + '","symbol":"' + syminfo.ticker + '","side":"' + st_side + '","action":"entry","strategy":"supertrend","timeframe":"' + timeframe.period + '"}'
    alert(st_msg, freq = alert.freq_once_per_bar_close)
```

(Puedes dejar los `alertcondition()` existentes tal cual — no molestan, solo son
otra forma de elegir la condición manualmente en el diálogo de alertas si algún
día quieres una alerta *solo* de Supertrend en vez de "cualquier alert()".)

## 4. Agrega el alert() de Koncorde

Koncorde hoy solo dibuja triángulos (`plotshape`), no dispara ninguna alerta.
Justo debajo de donde el script calcula `buy_cK`/`sell_cK`, agrega:

```pine
if buy_cK or sell_cK
    k_side = buy_cK ? "long" : "short"
    k_msg = '{"secret":"' + tv_secret + '","symbol":"' + syminfo.ticker + '","side":"' + k_side + '","action":"entry","strategy":"koncorde","timeframe":"' + timeframe.period + '"}'
    alert(k_msg, freq = alert.freq_once_per_bar_close)
```

## 5. Crea UNA sola alerta en TradingView para las tres

Con los tres bloques de `alert()` en el mismo script:

1. Click derecho en el gráfico → **Add alert** (o el ícono de reloj de alertas).
2. **Condition**: selecciona el nombre de tu indicador ("Multiple indicators + TL
   Alerts [LUPOWN]").
3. En el segundo dropdown (el de la condición específica), elige **"Any alert()
   function call"** — así se dispara para las tres señales (TL, Supertrend,
   Koncorde), cada una con su propio JSON.
4. En **Webhook URL**, pon la URL pública de tu bot: `https://TU-DOMINIO/webhook/tradingview`.
5. El campo "Message" del diálogo se ignora cuando usas `alert()` en el código —
   lo que se manda es exactamente el string que construye el script. No hace
   falta escribir nada ahí.
6. Guarda la alerta con expiración larga (o "Open-ended" si tu plan de
   TradingView lo permite) para que no se desactive sola.

## 6. Configura el mapeo de símbolo/timeframe en el bot

TradingView manda `syminfo.ticker` (ej. `"BTCUSDT.P"`) y `timeframe.period` (ej.
`"60"`), pero el bot opera contra Bybit vía `ccxt`, que usa otro formato (ej.
`"BTC/USDT:USDT"` y `"1h"`). En tu `.env`:

```
TRADINGVIEW_SYMBOL_MAP={"BTCUSDT.P":"BTC/USDT:USDT","ETHUSDT.P":"ETH/USDT:USDT"}
```

Agrega ahí cada símbolo que vayas a operar. Si el bot recibe un ticker que no
está en el mapa, lo deja pasar tal cual y lo vas a ver fallar en el log del
servidor (`fetchCandles`/`createOrder` van a rechazar un símbolo que Bybit no
reconoce) — el mensaje de advertencia en consola te dice exactamente qué
símbolo agregar.

Los timeframes más comunes (`1`, `5`, `15`, `60`, `240`, `D`, etc.) ya vienen
mapeados por defecto en `src/config/tradingviewMapping.ts`; no hace falta
configurarlos a mano salvo que uses una resolución rara.

## 7. Importante sobre el secreto en el script

El `tv_secret` queda escrito en texto plano dentro de tu script de Pine. Mientras
el indicador sea **privado** (no lo publiques en la biblioteca pública de
TradingView ni lo compartas), no hay problema. Si alguna vez lo compartes o
publicas, considera ese secreto comprometido y genera uno nuevo (y actualízalo
en `TRADINGVIEW_WEBHOOK_SECRET` del `.env` del bot).

## 8. Nota sobre el resto del indicador

Todo lo demás en el script (EMAs, VWAP, Parabolic SAR, Bollinger, ATR, Ichimoku,
los tres Volume Profile, Pivotes, Soporte/Resistencia) es puramente visual —
no dispara ninguna alerta y no necesita ningún cambio para esta integración.
