# tasks/todo.md — Crypto Trading Bot

Ultima actualizacion: 2026-07-08

---

## EN PROGRESO

(ninguno)

---

## PENDIENTE

### Infraestructura / Deploy

- [ ] Definir plataforma de deploy (VPS, Cloud Run, Railway, Fly.io)
- [ ] Crear directorio `data/` en produccion y montarlo como volumen persistente (SQLite)
- [ ] Configurar variables de entorno en el servidor de produccion (ver `.env.example`)
- [ ] Probar flujo completo en Bybit testnet antes de habilitar dinero real

### Features

- [ ] **OCB-001** — Heatmap sintetico de Open Interest (ver `tasks/ocbs/OCB-001.md`)
- [ ] Endpoint `/api/contrarian/status` — exponer estado actual del scheduler contrarian en el dashboard
- [ ] Panel de configuracion en el dashboard (ajustar parametros de riesgo sin reiniciar el servidor)

### Calidad

- [ ] Tests de integracion para el webhook (simular payload de TradingView y verificar flujo completo)
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
