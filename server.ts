import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './src/config/env.ts';
import { tradingviewWebhookRouter } from './src/webhook/tradingview.ts';
import { apiRouter } from './src/api/routes.ts';
import { startReconciliationLoop } from './src/execution/reconciler.ts';
import { startContrarianLoop } from './src/signals/contrarianScheduler.ts';
import { startLiquidationWatcher } from './src/exchange/liquidationWatcher.ts';

// El proyecto siempre se arranca desde la raíz (tsx en dev, node dist/server.cjs en
// producción vía el Dockerfile/npm start), así que process.cwd() es estable en ambos
// casos, a diferencia de import.meta.url que queda vacío al empaquetar a CJS con esbuild.
const projectRoot = process.cwd();

const app = express();
app.set('trust proxy', 1);
app.use(
  helmet({
    // El CSP estricto por defecto de helmet bloquea los scripts inline y el
    // websocket de HMR que inyecta el dev server de Vite. En producción se sirven
    // únicamente los assets ya compilados, así que el CSP por defecto no aplica ahí.
    contentSecurityPolicy: env.isProduction ? undefined : false,
  }),
);
app.use(cors());
app.use(express.json());

// El webhook de TradingView es el endpoint más sensible: limita intentos para
// dificultar fuerza bruta contra el secreto compartido.
const webhookLimiter = rateLimit({ windowMs: 60_000, max: 30 });
app.use('/webhook', webhookLimiter, tradingviewWebhookRouter);

const apiLimiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use('/api', apiLimiter, apiRouter);

async function start() {
  if (env.isProduction) {
    app.use(express.static(path.join(projectRoot, 'web/dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(projectRoot, 'web/dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.join(projectRoot, 'web/vite.config.ts'),
      root: path.join(projectRoot, 'web'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  startReconciliationLoop();
  startContrarianLoop();
  startLiquidationWatcher();

  app.listen(env.port, () => {
    console.log(`[server] Escuchando en http://localhost:${env.port} (modo Bybit: ${env.bybitTestnet ? 'TESTNET' : 'LIVE'})`);
  });
}

start();
