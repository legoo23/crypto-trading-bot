import { useEffect, useState } from 'react';
import { StatusBar } from './components/StatusBar.tsx';
import { TradesTable } from './components/TradesTable.tsx';
import { SignalsTable } from './components/SignalsTable.tsx';
import { LiquidationsPanel } from './components/LiquidationsPanel.tsx';
import { Liquidation, LiquidationCluster, Signal, Status, Trade } from './types.ts';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [liquidationSummary, setLiquidationSummary] = useState<LiquidationCluster[]>([]);

  async function refresh() {
    try {
      const [statusData, openData, recentData, signalsData, liqData, liqSummaryData] = await Promise.all([
        fetchJson<Status>('/api/status'),
        fetchJson<Trade[]>('/api/trades/open'),
        fetchJson<Trade[]>('/api/trades/recent'),
        fetchJson<Signal[]>('/api/signals/recent'),
        fetchJson<Liquidation[]>('/api/liquidations/recent'),
        fetchJson<LiquidationCluster[]>('/api/liquidations/summary?minutes=15'),
      ]);
      setStatus(statusData);
      setOpenTrades(openData);
      setRecentTrades(recentData);
      setSignals(signalsData);
      setLiquidations(liqData);
      setLiquidationSummary(liqSummaryData);
    } catch (err) {
      console.error('Error refrescando dashboard:', err);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  async function toggleKillSwitch() {
    if (!status) return;
    const endpoint = status.killSwitchEngaged ? '/api/kill-switch/disengage' : '/api/kill-switch/engage';
    await fetch(endpoint, { method: 'POST' });
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-xl font-bold">Crypto Trading Bot</h1>
      <StatusBar status={status} onToggleKillSwitch={toggleKillSwitch} />
      <TradesTable trades={openTrades} title="Posiciones abiertas" />
      <TradesTable trades={recentTrades} title="Historial reciente" />
      <SignalsTable signals={signals} />
      <LiquidationsPanel recent={liquidations} summary={liquidationSummary} />
    </div>
  );
}
