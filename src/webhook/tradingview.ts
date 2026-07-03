import crypto from 'crypto';
import { Router } from 'express';
import { env } from '../config/env.ts';
import { isValidPayload } from './types.ts';
import { processTradingViewAlert } from '../signals/signalProcessor.ts';

export const tradingviewWebhookRouter = Router();

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

tradingviewWebhookRouter.post('/tradingview', async (req, res) => {
  const body = req.body;

  if (!isValidPayload(body)) {
    return res.status(400).json({ error: 'Payload inválido' });
  }

  if (!safeCompare(body.secret, env.tradingviewWebhookSecret)) {
    return res.status(401).json({ error: 'Secreto inválido' });
  }

  try {
    const result = await processTradingViewAlert(body);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[webhook] Error procesando alerta:', err);
    return res.status(500).json({ error: 'Error interno procesando la alerta' });
  }
});
