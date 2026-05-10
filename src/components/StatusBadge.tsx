import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/mock-data";
import { statusLabels } from "@/lib/mock-data";

const styles: Record<CampaignStatus, string> = {
  active: "bg-success/15 text-success border-success/30",
  paused: "bg-warning/15 text-warning border-warning/30",
  draft: "bg-muted text-muted-foreground border-border",
  completed: "bg-primary/15 text-primary border-primary/30",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", styles[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "active" ? "bg-success animate-pulse" : "bg-current")} />
      {statusLabels[status]}
    </span>
  );
}
