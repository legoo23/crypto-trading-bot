import { AlertTriangle, Power, PowerOff } from 'lucide-react';
import { Status } from '../types.ts';

export function StatusBar({ status, onToggleKillSwitch }: { status: Status | null; onToggleKillSwitch: () => void }) {
  if (!status) return null;

  const pnlColor = status.pnlToday >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          status.mode === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        }`}
      >
        {status.mode === 'live' ? 'LIVE · DINERO REAL' : 'TESTNET · SIMULADO'}
      </span>

      <div className="text-sm text-neutral-400">
        Balance: <span className="font-mono text-neutral-100">{status.balanceUsdt.toFixed(2)} USDT</span>
      </div>

      <div className="text-sm text-neutral-400">
        P&L hoy: <span className={`font-mono ${pnlColor}`}>{status.pnlToday.toFixed(2)} USDT</span>
      </div>

      {status.killSwitchEngaged && (
        <div className="flex items-center gap-1 text-sm text-red-400">
          <AlertTriangle size={16} />
          Kill switch activo: {status.killSwitchReason}
        </div>
      )}

      <button
        onClick={onToggleKillSwitch}
        className={`ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
          status.killSwitchEngaged
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : 'bg-red-600 hover:bg-red-500'
        }`}
      >
        {status.killSwitchEngaged ? <Power size={16} /> : <PowerOff size={16} />}
        {status.killSwitchEngaged ? 'Reactivar bot' : 'Detener bot (kill switch)'}
      </button>
    </div>
  );
}
