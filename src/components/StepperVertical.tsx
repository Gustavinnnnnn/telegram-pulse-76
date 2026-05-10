import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step { id: string; title: string; subtitle?: string }

export function StepperVertical({ steps, current, onJump }: { steps: Step[]; current: number; onJump?: (i: number) => void }) {
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id}>
            <button
              type="button"
              disabled={!onJump || i > current}
              onClick={() => onJump?.(i)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition",
                active ? "bg-primary/10" : "hover:bg-surface-2/50",
                i > current && "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition",
                  done && "bg-success text-success-foreground",
                  active && "gradient-primary text-white shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_25%,transparent)]",
                  !done && !active && "bg-surface-2 text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className={cn("text-[12px] font-semibold", active ? "text-foreground" : "text-foreground/80")}>{s.title}</p>
                {s.subtitle && <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>}
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
