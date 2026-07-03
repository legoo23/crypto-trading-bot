# Crypto Trading Bot

Bot de trading automatizado de criptomonedas para Bybit, con señales generadas en TradingView
y una capa de confirmación multi-factor antes de ejecutar cualquier orden.

## ⚠️ Antes de usarlo con dinero real

Este bot **opera de forma totalmente automática**. Antes de conectarlo a tu cuenta real:

1. Configura `BYBIT_TESTNET=true` y prueba varios días en el [testnet de Bybit](https://testnet.bybit.com).
2. Verifica que el kill switch (botón en el dashboard) detiene el bot correctamente.
3. Revisa que los límites de riesgo (`RISK_PER_TRADE_PCT`, `MAX_OPEN_POSITIONS`, `MAX_DAILY_LOSS_PCT`) tengan valores con los que estés cómodo perdiendo.
4. Solo después de validar esto, cambia `BYBIT_TESTNET=false` y usa API keys reales.

Nadie puede garantizar ganancias en trading. Este proyecto es una herramienta de ejecución
y gestión de riesgo, no una promesa de resultados.

## Arquitectura

```
TradingView (alerta) --webhook--> /webhook/tradingview
                                        |
                                        v
                          Confirmación multi-factor (src/strategy)
                          - Tendencia (EMA 50/200 en timeframe superior)
                          - Momentum (RSI, MACD)
                          - Volatilidad (ATR, define SL/TP)
                          - Volumen (vs SMA de volumen)
                                        |
                                        v
                          Gestión de riesgo (src/risk)
                          - Kill switch
                          - Máximo de posiciones abiertas
                          - Máxima pérdida diaria
                          - Tamaño de posición según % de riesgo
                                        |
                                        v
                          Ejecución en Bybit vía ccxt (src/exchange, src/execution)
                                        |
                                        v
                    SQLite (historial) + Telegram (notificaciones) + Dashboard React
```

## Configuración

1. Copia `.env.example` a `.env` y completa tus valores (API keys de Bybit, secreto del
   webhook, bot de Telegram, parámetros de riesgo).
2. Instala dependencias: `npm install`
3. Modo desarrollo: `npm run dev` (levanta API + dashboard en `http://localhost:3000`)
4. Build de producción: `npm run build && npm start`

## Configurar la alerta en TradingView

En tu estrategia o indicador de TradingView, crea una alerta con "Webhook URL" apuntando a:

```
https://TU-DOMINIO/webhook/tradingview
```

Y como mensaje (Message), un JSON como este:

```json
{
  "secret": "EL_MISMO_VALOR_DE_TRADINGVIEW_WEBHOOK_SECRET",
  "symbol": "{{ticker}}",
  "side": "long",
  "action": "entry",
  "strategy": "mi-estrategia",
  "timeframe": "15m"
}
```

- `secret`: debe coincidir con `TRADINGVIEW_WEBHOOK_SECRET` del `.env`. Sin esto, el webhook
  rechaza la alerta.
- `side`: `long` o `short`.
- `action`: por ahora solo se ejecutan `entry` (las salidas se gestionan con el stop
  loss / take profit que el bot coloca directamente en Bybit).
- `symbol`: símbolo en formato ccxt/Bybit, ej. `BTC/USDT:USDT` para perpetuos lineales.
- `timeframe`: timeframe de la vela de entrada usado para recalcular los indicadores
  (ej. `15m`, `1h`).

Importante: el bot **no ejecuta la alerta a ciegas**. Antes de operar, vuelve a calcular
tendencia/momentum/volatilidad/volumen contra datos en vivo del exchange. Si la señal ya
no se sostiene en el momento de llegar, la rechaza y queda registrada en el dashboard con
el motivo.

Nota: el JSON de arriba (con `{{ticker}}` en el campo Message del diálogo de alertas)
sirve para una alerta simple sin código. Si tu indicador ya arma el mensaje con `alert()`
dentro del propio script Pine (como el indicador multi-función con TL Alerts/Supertrend/
Koncorde), el campo Message del diálogo se ignora — el string lo controla el script. Ver
[`docs/pine-integration.md`](docs/pine-integration.md) para ese caso, incluyendo el mapeo
de símbolo/timeframe (`TRADINGVIEW_SYMBOL_MAP`) que hace falta porque TradingView y ccxt/
Bybit no usan el mismo formato de ticker ni de resolución.

## Kill switch

- Se activa automáticamente si se alcanza `MAX_DAILY_LOSS_PCT` de pérdida en el día.
- Se puede activar/desactivar manualmente desde el botón del dashboard o vía API:
  - `POST /api/kill-switch/engage`
  - `POST /api/kill-switch/disengage`
- Mientras está activo, ninguna señal nueva ejecuta órdenes (se siguen registrando y
  rechazando, para que quede visibilidad de lo que se descartó).

## Ajustar la estrategia

Los parámetros de confirmación (`src/strategy/types.ts`, `defaultConfirmationConfig`)
controlan:

- `trendTimeframe` / `trendFastPeriod` / `trendSlowPeriod`: filtro de tendencia (EMA).
- `rsiPeriod`, `rsiLongRange`, `rsiShortRange`: filtro de momentum.
- `atrPeriod`, `minAtrPct`: filtro de volatilidad mínima y cálculo de SL/TP.
- `stopLossAtrMultiple`, `takeProfitAtrMultiple`: distancia de stop loss / take profit en
  múltiplos de ATR.
- `volumeSmaPeriod`, `minVolumeRatio`: filtro de volumen mínimo.

## Estado del proyecto

Este es un MVP funcional pensado para validarse primero en testnet:

- [x] Recepción y validación de alertas de TradingView (webhook con secreto compartido)
- [x] Confirmación multi-factor (tendencia, momentum, volatilidad, volumen)
- [x] Gestión de riesgo (tamaño de posición, límite diario, kill switch)
- [x] Ejecución en Bybit con SL/TP adjuntos (vía ccxt)
- [x] Persistencia de señales y operaciones en SQLite
- [x] Notificaciones por Telegram
- [x] Dashboard con posiciones, historial, señales y kill switch
- [x] Reconciliación periódica (cada 30s) contra `fetchPositions()` de Bybit para detectar
  cierres por SL/TP y actualizar el P&L — el precio de salida es un estimado (última vela
  de 1m), no el precio exacto de ejecución del SL/TP
- [ ] Backtesting histórico de la estrategia antes de operar en vivo
- [ ] Múltiples estrategias configurables simultáneamente
- [ ] P&L exacto cruzando contra `fetchMyTrades`/`fetchClosedOrders` en vez de estimado

Antes de dejarlo corriendo en real sin supervisión, valida en testnet que la reconciliación
detecta correctamente los cierres por SL/TP y que el P&L estimado es razonablemente preciso
para tu símbolo y timeframe.
