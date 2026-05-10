import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus, Megaphone, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useCampaigns, objectiveLabels, nicheLabels } from "@/lib/queries";
import { generateMetrics } from "@/lib/fake-metrics";

export const Route = createFileRoute("/_app/campaigns/")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft">("all");
  const { data: campaigns = [], isLoading } = useCampaigns();

  const filtered = campaigns.filter((c) => {
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
          {(["all", "active", "paused", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
                (filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              {f === "all" ? "Todas" : f === "active" ? "Ativas" : f === "paused" ? "Pausadas" : "Rascunhos"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando campanhas...</p>
      ) : filtered.length === 0 ? (
        <div className="card-elevated flex flex-col items-center gap-3 p-12 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-semibold">Nenhuma campanha encontrada</p>
          <Link to="/campaigns/new" className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const m = generateMetrics(c);
            const progress = m.budget > 0 ? Math.min(100, (m.spent / m.budget) * 100) : 0;
            return (
              <Link
                key={c.id}
                to="/campaigns/$id"
                params={{ id: c.id }}
                className="card-elevated group p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold group-hover:text-primary transition">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {objectiveLabels[c.objective]} · {nicheLabels[c.niche]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-background/40 p-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Impressões</p>
                    <p className="text-sm font-bold">{m.impressions.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Cliques</p>
                    <p className="text-sm font-bold">{m.clicks.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">CTR</p>
                    <p className="text-sm font-bold text-primary">{m.ctr}%</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div>
                    <p className="text-muted-foreground">DMs</p>
                    <p className="font-semibold text-success">{m.dmsReceived.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Aprovação</p>
                    <p className="font-semibold">{m.approvalRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conv.</p>
                    <p className="font-semibold">{m.conversions}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Orçamento</span>
                    <span className="font-semibold">
                      R$ {m.spent.toFixed(2)} / R$ {m.budget.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full gradient-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
