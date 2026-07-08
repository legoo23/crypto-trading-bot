# CLAUDE.md — Crypto Trading Bot

---

## PERFIL DEL USUARIO

**Alejandro Legorreta Barrera (ALB). Hospitales MAC. Builder, no ingeniero de software por formacion.**

- Respuestas directas primero. Sin em dashes. Nunca.
- Baja tolerancia a errores: reportar problemas de inmediato con opcion A y opcion B.
- Precision sobre velocidad. Siempre. Rapido y equivocado no es terminado.
- Nunca fallar silenciosamente. Nunca ocultar errores. Solo causas raiz, sin parches.
- Antes de marcar algo completo: lint pasa, build exitoso, logs claros.

---

## SEPARACION DE ROLES ENTRE SESIONES

La sesion que audita nunca implementa en produccion.

| Rol | Produce | No produce |
|---|---|---|
| **Consultoria / Auditoria** (Claude Code) | BRFs, OCBs, auditorias, diagnosticos exactos | Push directo a produccion |
| **Implementacion** (desarrollador / otra sesion) | Codigo real, commits a main | Decisiones de alcance sin BRF/OCB |

- Branch de trabajo de Claude: `claude/*`
- Branch de produccion: `main` — solo la toca quien implementa.
- Claude NUNCA pushea a produccion. Genera el brief exacto y quien implementa lo ejecuta.

---

## AUDITORIAS OBLIGATORIAS

Ninguna funcionalidad se considera lista para produccion sin pasar estas cuatro auditorias.

### 1. Auditoria de seguridad

- Webhook protegido por secreto compartido (`TRADINGVIEW_WEBHOOK_SECRET`). Sin esto, rechazar.
- Rate limiting activo en `/webhook` (30 req/min) y `/api` (120 req/min).
- Helmet activo en produccion con CSP por defecto.
- Ningun API key de Bybit en el repo. Solo en `.env` (ignorado por git).
- `npm audit` sin vulnerabilidades criticas o altas antes de cada deploy.

### 2. Auditoria operacional

- `npm run lint` pasa sin errores de tipos.
- `npm run build` genera `dist/server.cjs` y `web/dist/` sin errores.
- Los archivos que el build necesita existen en el contexto de build (revisar `.dockerignore` si se agrega uno).
- Kill switch verificado: al activarlo, el bot rechaza nuevas entradas sin detener posiciones abiertas.

### 3. Auditoria de servicios e infraestructura

- `NODE_ENV=production` en contenedor/servidor de produccion.
- `PORT` leido de variable de entorno (no hardcodeado).
- `BYBIT_TESTNET=false` solo tras validar dias en testnet.
- Base de datos SQLite con ruta configurable (`DATABASE_PATH`). En produccion, volumen persistente.
- Telegram configurado y recibiendo notificaciones antes de habilitar trading real.

### 4. Auditoria funcional

- Probar el flujo completo en testnet: alerta TradingView -> webhook -> confirmacion -> orden Bybit.
- Verificar kill switch desde el dashboard.
- Verificar que el limite de perdida diaria (`MAX_DAILY_LOSS_PCT`) activa el kill switch.
- Verificar que el limite de posiciones abiertas (`MAX_OPEN_POSITIONS`) se respeta.

---

## WORKFLOW DE SESION

### Inicio de sesion

1. Leer `tasks/todo.md` y `tasks/lessons.md`
2. Revisar `tasks/ocbs/` para OCBs abiertos
3. Preguntar a ALB si hay pendientes antes de trabajo nuevo

### Orchestration

- Plan mode para cualquier tarea no trivial (3+ pasos o decisiones arquitectonicas)
- Si algo sale mal: PARAR y replantear, no seguir empujando
- Subagentes para investigacion paralela; contexto principal limpio

### Verificacion antes de done

- Lint limpio + build exitoso + comportamiento verificado
- Nunca marcar completo sin demostrar que funciona

### Bugs

- Dado un bug: diagnosticar causa raiz y proponer el fix exacto (archivo, linea, bloque ANTES/DESPUES)
- Generar BRF si la sesion es de auditoria

---

## STACK TECNICO

```
Backend:   TypeScript + Node.js + Express
Frontend:  React 19 + Tailwind CSS v4 + Vite
Exchange:  ccxt v4 (Bybit perpetuos lineales)
DB:        SQLite via better-sqlite3
Notif:     Telegram Bot API
Indicadores: technicalindicators (RSI, EMA, MACD, ATR, SMA)
Contenedor: Docker (multi-stage build)
```

## COMANDOS DE DESARROLLO

```bash
npm run dev      # servidor local con hot reload (API + dashboard en http://localhost:3000)
npm run build    # build de produccion: Vite (frontend) + esbuild (backend)
npm run lint     # tsc --noEmit (verificacion de tipos)
npm start        # corre el build de produccion (necesita npm run build primero)
```

Variables de entorno requeridas (nombres, nunca valores): `BYBIT_API_KEY`, `BYBIT_API_SECRET`,
`TRADINGVIEW_WEBHOOK_SECRET`. Ver `.env.example` para la lista completa.

## ARQUITECTURA DE MODULOS

| Modulo | Ruta | Estado |
|--------|------|--------|
| Servidor principal | `server.ts` | Listo |
| Webhook TradingView | `src/webhook/tradingview.ts` | Listo |
| Estrategia multi-factor | `src/strategy/confirmation.ts` | Listo |
| Estrategia contrarian (funding rate + RSI) | `src/strategy/contrarian.ts` | Listo |
| Gestion de riesgo | `src/risk/riskManager.ts` | Listo |
| Ejecucion de ordenes | `src/execution/orderExecutor.ts` | Listo |
| Reconciliacion de posiciones | `src/execution/reconciler.ts` | Listo |
| Cliente Bybit (ccxt) | `src/exchange/bybit.ts` | Listo |
| Watcher de liquidaciones reales | `src/exchange/liquidationWatcher.ts` | Listo |
| Scheduler contrarian | `src/signals/contrarianScheduler.ts` | Listo |
| Notificaciones Telegram | `src/notify/telegram.ts` | Listo |
| Base de datos SQLite | `src/db/index.ts` | Listo |
| Config / env | `src/config/env.ts` | Listo |
| Mapeo simbolos TradingView | `src/config/tradingviewMapping.ts` | Listo |
| API REST del dashboard | `src/api/routes.ts` | Listo |
| Dashboard React | `web/src/` | Listo |
| Heatmap sintetico de OI | -- | Pendiente (ver OCB-001) |

## REGLAS CRITICAS DEL PROYECTO

- `BYBIT_TESTNET=true` por defecto. Cambiar a `false` SOLO tras validar en testnet.
- El kill switch bloquea nuevas entradas pero NO cierra posiciones abiertas automaticamente.
- La estrategia contrarian y el watcher de liquidaciones estan deshabilitados por defecto; requieren activacion explicita en `.env`.
- El secreto del webhook en el script Pine queda en texto plano: nunca publicar el indicador si tiene el secreto real.
- La base de datos SQLite debe vivir en un volumen persistente en produccion; si no, se pierde con cada redeploy.
- `DATABASE_PATH` apunta a `./data/trading-bot.sqlite` por defecto: crear el directorio `data/` antes de arrancar.

## HISTORIAL DE DECISIONES

| Num | Fecha | Decision |
|-----|-------|----------|
| 001 | 2026-07-07 | MVP: webhook TradingView + confirmacion multi-factor + ejecucion Bybit via ccxt |
| 002 | 2026-07-07 | Soporte multi-estrategia: TL Alerts, Supertrend, Koncorde (mismo webhook, campo `strategy`) |
| 003 | 2026-07-07 | Estrategia contrarian: funding rate extremo + RSI agotamiento = entrada contra la mayoria |
| 004 | 2026-07-07 | Liquidaciones reales via ccxt `watchLiquidations()` (feed Bybit, sin Coinglass, sin costo) |
| 005 | 2026-07-08 | Heatmap sintetico de OI documentado en docs/ como pendiente; no implementado aun |

---

*CLAUDE.md generado: 2026-07-08 | Build verificado: lint limpio, 0 vulnerabilidades, build exitoso*
