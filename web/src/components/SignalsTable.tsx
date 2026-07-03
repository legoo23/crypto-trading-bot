import { Signal } from '../types.ts';

export function SignalsTable({ signals }: { signals: Signal[] }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-neutral-300">Señales recibidas</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-neutral-500">
              <th className="pb-2 pr-4">Hora</th>
              <th className="pb-2 pr-4">Símbolo</th>
              <th className="pb-2 pr-4">Lado</th>
              <th className="pb-2 pr-4">Estrategia</th>
              <th className="pb-2 pr-4">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s) => (
              <tr key={s.id} className="border-t border-neutral-800">
                <td className="py-2 pr-4 font-mono text-xs">{new Date(s.received_at).toLocaleString()}</td>
                <td className="py-2 pr-4 font-mono">{s.symbol}</td>
                <td className={`py-2 pr-4 ${s.side === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>{s.side}</td>
                <td className="py-2 pr-4">{s.strategy}</td>
                <td className="py-2 pr-4">
                  {s.accepted ? (
                    <span className="text-emerald-400">Aceptada</span>
                  ) : (
                    <span className="text-neutral-500" title={s.reject_reason ?? ''}>
                      Rechazada: {s.reject_reason}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {signals.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-neutral-500">
                  Sin señales todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
