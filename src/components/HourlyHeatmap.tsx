// 24h × 7d heatmap of best delivery hours (deterministic from seed).
import { useMemo } from "react";

const DAYS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

export function HourlyHeatmap({ seed = "default" }: { seed?: string }) {
  const cells = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return DAYS.map((_, di) =>
      Array.from({ length: 24 }).map((__, hi) => {
        h = (h * 1103515245 + 12345) >>> 0;
        const base = (h / 0xffffffff);
        // Higher activity 18h-23h, lower 0h-6h
        const peak = hi >= 18 && hi <= 23 ? 1 : hi >= 8 && hi < 18 ? 0.6 : 0.15;
        const wkd = di < 5 ? 1 : 0.85;
        return Math.min(1, base * 0.4 + peak * wkd * 0.7);
      }),
    );
  }, [seed]);

  return (
    <div className="tile p-4">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-bold">Mapa de calor — entrega</h3>
          <p className="text-[10px] text-muted-foreground">Melhor horário para impactar seu público</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>baixo</span>
          <div className="flex h-2.5 w-20 overflow-hidden rounded-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1" style={{ background: `oklch(0.69 0.15 230 / ${0.1 + i * 0.12})` }} />
            ))}
          </div>
          <span>alto</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto scroll-thin">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: "auto repeat(24, minmax(14px, 1fr))" }}>
          <div />
          {Array.from({ length: 24 }).map((_, hi) => (
            <div key={hi} className="text-center text-[8px] text-muted-foreground">{hi % 3 === 0 ? hi : ""}</div>
          ))}
          {DAYS.flatMap((d, di) => [
            <div key={`l-${d}`} className="pr-2 text-right text-[10px] font-semibold text-muted-foreground self-center">{d}</div>,
            ...cells[di].map((v, hi) => (
              <div
                key={`c-${di}-${hi}`}
                className="aspect-square rounded-[3px] transition hover:scale-125"
                style={{ background: `oklch(0.69 0.15 230 / ${0.06 + v * 0.85})` }}
                title={`${d} ${hi}h — intensidade ${(v * 100).toFixed(0)}%`}
              />
            )),
          ])}
        </div>
      </div>
    </div>
  );
}
