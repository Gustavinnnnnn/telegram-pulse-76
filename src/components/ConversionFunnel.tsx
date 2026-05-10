import { compactNumber } from "@/lib/format";

interface Stage { label: string; value: number; color: string }

export function ConversionFunnel({ stages }: { stages: Stage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="tile p-4">
      <h3 className="text-sm font-bold">Funil de conversão</h3>
      <p className="text-[10px] text-muted-foreground">Da impressão à conversão</p>
      <div className="mt-4 space-y-2">
        {stages.map((s, i) => {
          const width = (s.value / max) * 100;
          const prev = i > 0 ? stages[i - 1].value : null;
          const rate = prev && prev > 0 ? (s.value / prev) * 100 : null;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold">{s.label}</span>
                <span className="tabular text-muted-foreground">
                  {compactNumber(s.value)}
                  {rate !== null && <span className="ml-2 text-success">{rate.toFixed(1)}%</span>}
                </span>
              </div>
              <div className="mt-1 h-7 overflow-hidden rounded-md bg-surface-1/60">
                <div
                  className="flex h-full items-center justify-end pr-2 text-[10px] font-bold text-white transition-all"
                  style={{ width: `${width}%`, background: s.color }}
                >
                  {width > 30 && compactNumber(s.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
