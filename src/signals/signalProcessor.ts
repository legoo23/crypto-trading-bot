import { bybit } from '../exchange/bybit.ts';
import { confirmSignal } from '../strategy/confirmation.ts';
import { TradeSignal } from '../strategy/types.ts';
import { calculatePositionSize, checkRiskBeforeTrade } from '../risk/riskManager.ts';
import { executeEntry, recordSignal } from '../execution/orderExecutor.ts';
import { notifyTelegram } from '../notify/telegram.ts';
import { TradingViewAlertPayload } from '../webhook/types.ts';

export async function processTradingViewAlert(payload: TradingViewAlertPayload): Promise<{ accepted: boolean; reason?: string }> {
  if (payload.action !== 'entry') {
    // Las salidas manuales desde TradingView no se ejecutan en esta versión:
    // las salidas las gestiona el stop loss / take profit puestos en el exchange.
    recordSignal({
      symbol: payload.symbol,
      side: payload.side,
      action: payload.action,
      strategy: payload.strategy,
      rawPayload: payload,
      accepted: false,
      rejectReason: 'Señales de salida manual no soportadas; se usa SL/TP del exchange',
    });
    return { accepted: false, reason: 'Acción no soportada' };
  }

  const signal: TradeSignal = {
    symbol: payload.symbol,
    side: payload.side,
    strategy: payload.strategy,
    entryTimeframe: payload.timeframe,
  };

  const balance = await bybit.fetchBalanceUSDT();
  const riskCheck = checkRiskBeforeTrade(balance);
  if (!riskCheck.allowed) {
    const signalId = recordSignal({
      symbol: payload.symbol,
      side: payload.side,
      action: payload.action,
      strategy: payload.strategy,
      rawPayload: payload,
      accepted: false,
      rejectReason: riskCheck.reason,
    });
    await notifyTelegram(`⛔ Señal rechazada por gestión de riesgo (#${signalId})\n${payload.symbol} ${payload.side}\nMotivo: ${riskCheck.reason}`);
    return { accepted: false, reason: riskCheck.reason };
  }

  const confirmation = await confirmSignal(signal);
  if (!confirmation.accepted) {
    const signalId = recordSignal({
      symbol: payload.symbol,
      side: payload.side,
      action: payload.action,
      strategy: payload.strategy,
      rawPayload: payload,
      accepted: false,
      rejectReason: confirmation.reason,
    });
    await notifyTelegram(`⚠️ Señal descartada tras confirmación (#${signalId})\n${payload.symbol} ${payload.side}\nMotivo: ${confirmation.reason}`);
    return { accepted: false, reason: confirmation.reason };
  }

  const signalId = recordSignal({
    symbol: payload.symbol,
    side: payload.side,
    action: payload.action,
    strategy: payload.strategy,
    rawPayload: payload,
    accepted: true,
  });

  const amount = calculatePositionSize({
    accountBalance: balance,
    entryPrice: confirmation.entryPrice,
    stopLossPrice: confirmation.stopLossPrice,
  });

  if (amount <= 0) {
    await notifyTelegram(`⚠️ Señal aceptada pero tamaño de posición calculado es 0 (#${signalId})`);
    return { accepted: false, reason: 'Tamaño de posición inválido' };
  }

  await executeEntry({
    signalId,
    symbol: payload.symbol,
    side: payload.side,
    amount,
    entryPrice: confirmation.entryPrice,
    stopLossPrice: confirmation.stopLossPrice,
    takeProfitPrice: confirmation.takeProfitPrice,
  });

  await notifyTelegram(
    `✅ Entrada ejecutada (#${signalId})\n${payload.symbol} ${payload.side.toUpperCase()}\nEntrada: ${confirmation.entryPrice}\nSL: ${confirmation.stopLossPrice.toFixed(4)} · TP: ${confirmation.takeProfitPrice.toFixed(4)}\nTamaño: ${amount.toFixed(6)}\nModo: ${bybit.isTestnet ? 'TESTNET' : 'LIVE'}`,
  );

  return { accepted: true };
}
