# Ver liquidez (liquidaciones) sin usar Coinglass

Coinglass no es la única forma de ver dónde se está limpiando apalancamiento en el
mercado. Ningún exchange (Bybit incluido) publica una lista de "aquí están las
posiciones de otros traders y a qué precio se liquidan" — eso no existe como dato
público en ningún lado, ni siquiera Coinglass lo tiene: su "mapa de liquidaciones"
también es una **estimación**, construida a partir de open interest + supuestos de
apalancamiento, no de posiciones reales.

Con eso claro, hay dos caminos honestos y gratuitos:

## 1. Liquidaciones reales en tiempo real (lo que este bot ya implementa)

Bybit transmite públicamente, por WebSocket y sin necesidad de API key, cada
liquidación que **ya ocurrió** (feed `allLiquidation`). `ccxt` lo expone gratis con
`watchLiquidations()` (esto es parte de "ccxt pro", que desde ccxt v4 es open source
y viene incluido en el paquete normal de `ccxt`, sin costo).

Esto es dato real, no una predicción: cada evento que ves ya pasó. Es útil para:
- Ver en qué dirección se está limpiando más apalancamiento ahora mismo (el panel de
  "Liquidaciones reales" del dashboard agrupa esto por símbolo/lado en los últimos 15
  minutos).
- Detectar clusters/cascadas de liquidaciones (muchas en poco tiempo) como señal de
  posible agotamiento de un movimiento — un patrón clásico es: cascada de
  liquidaciones de largos → capitulación → rebote. Pero **ojo**: fadear una cascada
  también puede ser "atrapar un cuchillo cayendo" si la tendencia sigue. Por ahora
  el bot solo registra y muestra estos eventos — **no dispara ninguna orden
  automáticamente a partir de ellos**. Si más adelante quieres automatizar una
  entrada por cascada de liquidaciones, es una decisión de riesgo que conviene tomar
  aparte, viendo primero cómo se ven los datos reales en tu dashboard.

Está implementado en `src/exchange/liquidationWatcher.ts`, activable con:

```
LIQUIDATION_WATCH_ENABLED=true
LIQUIDATION_WATCH_SYMBOLS=BTC/USDT:USDT,ETH/USDT:USDT
```

## 2. Heatmap sintético a partir de Open Interest (no implementado todavía)

Si más adelante quieres algo visualmente parecido al mapa de Coinglass (zonas de
precio con "más probabilidad" de concentrar liquidaciones futuras, no solo las que
ya pasaron), se puede construir una aproximación con datos 100% públicos de Bybit:

1. Pedir el historial de Open Interest (`fetchOpenInterestHistory`, ya soportado por
   ccxt/Bybit) y el histórico de velas del mismo período.
2. Para cada vela, tomar el cambio de OI (proxy de "cuántas posiciones nuevas se
   abrieron ahí") y repartirlo entre un set de apalancamientos típicos de Bybit (5x,
   10x, 20x, 25x, 50x, 100x).
3. Para cada combinación (precio de esa vela, apalancamiento asumido), calcular el
   precio teórico de liquidación de una posición long y short abiertas ahí.
4. Acumular esos precios teóricos en un histograma por nivel de precio → esa
   distribución es el "heatmap".

Esto es exactamente el tipo de cálculo que hacen las herramientas de terceros (con o
sin costo): es una estimación basada en supuestos de apalancamiento, no un dato
certero, porque ningún exchange revela el apalancamiento real que cada trader está
usando. Vale la pena tenerlo en mente para no sobre-confiar en el resultado si algún
día se implementa.

**Recomendación**: usar la opción 1 (ya implementada, dato real) como referencia
principal, y considerar la opción 2 solo como una capa visual adicional más adelante
si hace falta, dejando claro en el dashboard que es una estimación y no un hecho.
