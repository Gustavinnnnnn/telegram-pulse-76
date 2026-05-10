import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { mockCampaigns, objectiveLabels, nicheLabels } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/campaigns/")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const filtered = mockCampaigns.filter((c) => {
    const matches = c.name.toLowerCase().includes(query.toLowerCase());
    const statusOk = filter === "all" || c.status === filter;
    return matches && statusOk;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Campanhas</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as suas campanhas em um só lugar</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" /> Nova campanha
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar campanha..."
            className="w-full rounded-xl border border-border bg-input/60 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 rounded-xl border border-border bg-card p-1">
          {(["all", "active", "paused"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
                (filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Pausadas"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const ctr = ((c.clicks / c.impressions) * 100).toFixed(2);
          const progress = Math.min(100, (c.spent / c.budget) * 100);
          return (
            <div key={c.id} className="card-elevated p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {objectiveLabels[c.objective]} · {nicheLabels[c.niche]}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-background/40 p-3 text-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Impressões</p>
                  <p className="text-sm font-bold">{c.impressions.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Cliques</p>
                  <p className="text-sm font-bold">{c.clicks.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">CTR</p>
                  <p className="text-sm font-bold text-primary">{ctr}%</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Orçamento</span>
                  <span className="font-semibold">
                    R$ {c.spent.toFixed(2)} / R$ {c.budget.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full gradient-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card-elevated col-span-full p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
