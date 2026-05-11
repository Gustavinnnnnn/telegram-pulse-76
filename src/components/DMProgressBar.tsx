import { cn } from "@/lib/utils";
import { compactNumber } from "@/lib/format";

interface Props {
  sent: number;
  total: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function DMProgressBar({ sent, total, size = "md", showLabel = true, className }: Props) {
  const pct = total > 0 ? Math.min(100, (sent / total) * 100) : 0;
  const heightCls = size === "sm" ? "h-1" : size === "lg" ? "h-2.5" : "h-1.5";

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className={cn(
          "mb-1 flex items-center justify-between tabular",
          size === "lg" ? "text-[12px]" : "text-[10.5px]",
        )}>
          <span className="font-mono font-semibold">
            {compactNumber(sent)} / {compactNumber(total)} <span className="text-muted-foreground font-normal">DMs</span>
          </span>
          <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn("overflow-hidden rounded-full bg-surface-3/60", heightCls)}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-cyan to-primary bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
