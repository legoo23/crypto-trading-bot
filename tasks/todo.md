# tasks/todo.md — Crypto Trading Bot

Ultima actualizacion: 2026-07-08

---

## EN PROGRESO

(ninguno)

---

## PENDIENTE

### Testnet — siguiente sesion

- [ ] Fondear cuenta Bybit testnet (faucet en testnet.bybit.com — solicitar USDT simulados)
- [ ] Con fondos en testnet: repetir prueba curl y verificar que el bot ejecuta la orden completa (confirmacion multi-factor + orden en Bybit)
- [ ] Instalar y configurar ngrok para exponer el webhook a TradingView
- [ ] Conectar indicador de TradingView (definir cual estrategia usar) y crear alerta con webhook URL

### Infraestructura / Deploy

- [ ] Definir plataforma de deploy permanente (recomendacion: Fly.io por soporte de volumen SQLite)
- [ ] Crear directorio `data/` en produccion y montarlo como volumen persistente (SQLite)
- [ ] Configurar variables de entorno en el servidor de produccion (ver `.env.example`)

### Features

- [ ] **OCB-001** — Heatmap sintetico de Open Interest (ver `tasks/ocbs/OCB-001.md`)
- [ ] Endpoint `/api/contrarian/status` — exponer estado actual del scheduler contrarian en el dashboard
- [ ] Panel de configuracion en el dashboard (ajustar parametros de riesgo sin reiniciar el servidor)

### Calidad

- [ ] Agregar `.dockerignore` explicito (actualmente no existe; el build de Docker copia todo el repo)

---

## COMPLETADO

- [x] MVP: webhook TradingView + confirmacion multi-factor + ejecucion Bybit via ccxt (2026-07-07)
- [x] Soporte multi-estrategia: TL Alerts, Supertrend, Koncorde (2026-07-07)
- [x] Estrategia contrarian: funding rate + RSI (2026-07-07)
- [x] Watcher de liquidaciones reales via ccxt WebSocket (2026-07-07)
- [x] Dashboard React: StatusBar, TradesTable, SignalsTable, LiquidationsPanel (2026-07-07)
- [x] Build verificado: lint limpio, 0 vulnerabilidades, build exitoso (2026-07-08)
- [x] CLAUDE.md del proyecto creado (2026-07-08)
- [x] Estructura tasks/ creada (2026-07-08)
- [x] Entorno local Windows configurado: Git, Node 20, Python 3.11, VS Build Tools (2026-07-08)
- [x] npm install exitoso en Windows (2026-07-08)
- [x] Servidor corriendo en testnet: dashboard visible en http://localhost:3000 (2026-07-08)
- [x] Webhook probado con curl: recibe señal, valida secreto, pasa al gestor de riesgo (2026-07-08)
- [x] Confirmado: rechazo por balance 0 es comportamiento correcto del gestor de riesgo (2026-07-08)
