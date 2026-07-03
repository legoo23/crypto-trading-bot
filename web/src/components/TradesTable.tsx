import { Trade } from '../types.ts';

export function TradesTable({ trades, title }: { trades: Trade[]; title: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-neutral-300">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-neutral-500">
              <th className="pb-2 pr-4">Símbolo</th>
              <th className="pb-2 pr-4">Lado</th>
              <th className="pb-2 pr-4">Entrada</th>
              <th className="pb-2 pr-4">SL / TP</th>
              <th className="pb-2 pr-4">Cantidad</th>
              <th className="pb-2 pr-4">P&L</th>
              <th className="pb-2 pr-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-neutral-800">
                <td className="py-2 pr-4 font-mono">{t.symbol}</td>
                <td className={`py-2 pr-4 ${t.side === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>{t.side}</td>
                <td className="py-2 pr-4 font-mono">{t.entry_price}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  {t.stop_loss.toFixed(4)} / {t.take_profit.toFixed(4)}
                </td>
                <td className="py-2 pr-4 font-mono">{t.amount}</td>
                <td className={`py-2 pr-4 font-mono ${t.pnl && t.pnl < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {t.pnl !== null ? t.pnl.toFixed(2) : '—'}
                </td>
                <td className="py-2 pr-4">{t.status === 'open' ? 'Abierta' : 'Cerrada'}</td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-neutral-500">
                  Sin operaciones todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
