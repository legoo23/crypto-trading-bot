import { Liquidation, LiquidationCluster } from '../types.ts';

export function LiquidationsPanel({ recent, summary }: { recent: Liquidation[]; summary: LiquidationCluster[] }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-1 text-sm font-semibold text-neutral-300">Liquidaciones reales (Bybit, últimos 15 min)</h2>
      <p className="mb-3 text-xs text-neutral-500">
        Dato real del exchange, no una predicción: eventos de liquidación que ya ocurrieron. Útil como referencia de
        zonas donde se limpió apalancamiento recientemente.
      </p>

      {summary.length === 0 ? (
        <p className="mb-4 text-sm text-neutral-500">Sin liquidaciones registradas en la ventana reciente</p>
      ) : (
        <div className="mb-4 space-y-1">
          {summary.map((s) => (
            <div key={`${s.symbol}-${s.side}`} className="flex items-center gap-3 text-sm">
              <span className="w-32 font-mono">{s.symbol}</span>
              <span className={s.side.toLowerCase() === 'buy' ? 'text-emerald-400' : 'text-red-400'}>{s.side}</span>
              <span className="text-neutral-400">{s.count} eventos</span>
              <span className="font-mono text-neutral-300">{s.totalQuoteValue.toFixed(0)} USDT</span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-neutral-500">
              <th className="pb-2 pr-4">Hora</th>
              <th className="pb-2 pr-4">Símbolo</th>
              <th className="pb-2 pr-4">Lado</th>
              <th className="pb-2 pr-4">Precio</th>
              <th className="pb-2 pr-4">Valor (USDT)</th>
            </tr>
          </thead>
          <tbody>
            {recent.slice(0, 20).map((l) => (
              <tr key={l.id} className="border-t border-neutral-800">
                <td className="py-2 pr-4 font-mono text-xs">{new Date(l.received_at).toLocaleString()}</td>
                <td className="py-2 pr-4 font-mono">{l.symbol}</td>
                <td className={`py-2 pr-4 ${l.side?.toLowerCase() === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>{l.side ?? '—'}</td>
                <td className="py-2 pr-4 font-mono">{l.price}</td>
                <td className="py-2 pr-4 font-mono">{l.quote_value?.toFixed(0) ?? '—'}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-neutral-500">
                  Sin liquidaciones todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
