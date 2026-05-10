import { useCountUp } from "@/hooks/useCountUp";
import { compactNumber } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format?: "compact" | "currency" | "percent" | "raw";
  delta?: number; // %
  icon: LucideIcon;
  spark?: number[];
  accent?: "primary" | "cyan" | "warning" | "magenta";
}

const accentMap = {
  primary: { glow: "from-primary/40 via-primary/10 to-transparent", icon: "text-primary", stroke: "oklch(0.69 0.15 230)" },
  cyan:    { glow: "from-cyan/40 via-cyan/10 to-transparent", icon: "text-cyan", stroke: "oklch(0.84 0.16 178)" },
  warning: { glow: "from-warning/40 via-warning/10 to-transparent", icon: "text-warning", stroke: "oklch(0.78 0.17 60)" },
  magenta: { glow: "from-magenta/40 via-magenta/10 to-transparent", icon: "text-magenta", stroke: "oklch(0.7 0.22 330)" },
};

export function MetricTile({ label, value, prefix = "", suffix = "", format = "compact", delta, icon: Icon, spark, accent = "primary" }: MetricTileProps) {
  const animated = useCountUp(value);
  const a = accentMap[accent];

  const display =
    format === "currency"
      ? `R$ ${animated.toFixed(2).replace(".", ",")}`
      : format === "percent"
      ? `${animated.toFixed(2).replace(".", ",")}%`
      : format === "raw"
      ? Math.round(animated).toLocaleString("pt-BR")
      : compactNumber(animated);

  const positive = (delta ?? 0) >= 0;

  return (
    <div className="tile tile-hover group relative overflow-hidden p-4">
      <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${a.glow} blur-2xl opacity-60 transition group-hover:opacity-90`} />

      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-surface-3/60 ${a.icon}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      </div>

      <div className="relative mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tabular tracking-tight">
          {prefix}{display}{suffix}
        </span>
      </div>

      <div className="relative mt-1 flex items-center justify-between gap-2">
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {spark && spark.length > 1 && <Sparkline data={spark} stroke={a.stroke} />}
      </div>
    </div>
  );
}

let __sgId = 0;
function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  const w = 80, h = 24;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = w / Math.max(1, data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  const gid = `sg${++__sgId}`;
  return (
    <svg width={w} height={h} className="ml-auto">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
