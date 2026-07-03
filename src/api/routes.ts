import { Router } from 'express';
import { bybit } from '../exchange/bybit.ts';
import { listOpenTrades, listRecentSignals, listRecentTrades } from '../execution/orderExecutor.ts';
import { listRecentLiquidations, summarizeRecentLiquidations } from '../exchange/liquidationWatcher.ts';
import {
  disengageKillSwitch,
  engageKillSwitch,
  isKillSwitchEngaged,
  killSwitchReason,
  todayRealizedPnl,
} from '../risk/riskManager.ts';

export const apiRouter = Router();

apiRouter.get('/status', async (_req, res) => {
  let balance = 0;
  try {
    balance = await bybit.fetchBalanceUSDT();
  } catch (err) {
    console.error('[api] Error obteniendo balance:', err);
  }
  res.json({
    mode: bybit.isTestnet ? 'testnet' : 'live',
    killSwitchEngaged: isKillSwitchEngaged(),
    killSwitchReason: killSwitchReason(),
    balanceUsdt: balance,
    pnlToday: todayRealizedPnl(),
  });
});

apiRouter.get('/trades/open', (_req, res) => {
  res.json(listOpenTrades());
});

apiRouter.get('/trades/recent', (_req, res) => {
  res.json(listRecentTrades());
});

apiRouter.get('/signals/recent', (_req, res) => {
  res.json(listRecentSignals());
});

apiRouter.post('/kill-switch/engage', (req, res) => {
  const reason = typeof req.body?.reason === 'string' && req.body.reason.trim() ? req.body.reason : 'Activado manualmente desde el dashboard';
  engageKillSwitch(reason);
  res.json({ ok: true });
});

apiRouter.post('/kill-switch/disengage', (_req, res) => {
  disengageKillSwitch();
  res.json({ ok: true });
});

apiRouter.get('/liquidations/recent', (_req, res) => {
  res.json(listRecentLiquidations());
});

apiRouter.get('/liquidations/summary', (req, res) => {
  const minutes = Number(req.query.minutes) || 15;
  res.json(summarizeRecentLiquidations(minutes));
});
