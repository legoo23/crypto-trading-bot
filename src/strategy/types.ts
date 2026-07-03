export type Side = 'long' | 'short';

export type TradeSignal = {
  symbol: string;
  side: Side;
  strategy: string;
  entryTimeframe: string;
};

export type ConfirmationResult =
  | { accepted: true; stopLossPrice: number; takeProfitPrice: number; entryPrice: number }
  | { accepted: false; reason: string };

export type ConfirmationConfig = {
  trendTimeframe: string;
  trendFastPeriod: number;
  trendSlowPeriod: number;
  rsiPeriod: number;
  rsiLongRange: [number, number];
  rsiShortRange: [number, number];
  atrPeriod: number;
  minAtrPct: number;
  stopLossAtrMultiple: number;
  takeProfitAtrMultiple: number;
  volumeSmaPeriod: number;
  minVolumeRatio: number;
};

export const defaultConfirmationConfig: ConfirmationConfig = {
  trendTimeframe: '1h',
  trendFastPeriod: 50,
  trendSlowPeriod: 200,
  rsiPeriod: 14,
  rsiLongRange: [40, 75],
  rsiShortRange: [25, 60],
  atrPeriod: 14,
  minAtrPct: 0.15,
  stopLossAtrMultiple: 1.5,
  takeProfitAtrMultiple: 2.5,
  volumeSmaPeriod: 20,
  minVolumeRatio: 1.0,
};
