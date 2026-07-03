export type Status = {
  mode: 'testnet' | 'live';
  killSwitchEngaged: boolean;
  killSwitchReason: string;
  balanceUsdt: number;
  pnlToday: number;
};

export type Trade = {
  id: number;
  signal_id: number;
  opened_at: string;
  closed_at: string | null;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  amount: number;
  stop_loss: number;
  take_profit: number;
  exit_price: number | null;
  pnl: number | null;
  status: 'open' | 'closed';
};

export type Signal = {
  id: number;
  received_at: string;
  symbol: string;
  side: 'long' | 'short';
  action: string;
  strategy: string;
  accepted: number;
  reject_reason: string | null;
};

export type Liquidation = {
  id: number;
  received_at: string;
  symbol: string;
  side: string | null;
  price: number;
  quote_value: number | null;
  exchange_timestamp: number | null;
};

export type LiquidationCluster = {
  symbol: string;
  side: string;
  count: number;
  totalQuoteValue: number;
};
