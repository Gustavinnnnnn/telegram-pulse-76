import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, Megaphone, Filter, Pause, Play, MoreHorizontal, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { useCampaigns, objectiveLabels, nicheLabels, useUpdateCampaignStatus, type Campaign } from "@/lib/queries";
import { generateMetrics } from "@/lib/fake-metrics";
import { compactNumber, currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/campaigns/")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "draft" | "completed">("all");
  const { data: campaigns = [], isLoading } = useCampaigns();
  const updateStatus = useUpdateCampaignStatus();

  const filtered = campaigns.filter((c) => {
    const matches = c.name.toLowerCase().includes(query.toLowerCase());
    const statusOk = filter === "all" || c.status === filter;
    return matches && statusOk;
  });

  const counts = {
    all: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    paused: campaigns.filter((c) => c.status === "paused").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };

  const totalSpent = filtered.reduce((a, c) => a + generateMetrics(c).spent, 0);
  const totalImpr = filtered.reduce((a, c) => a + generateMetrics(c).impressions, 0);
  const totalClicks = filtered.reduce((a, c) => a + generateMetrics(c).clicks, 0);

  const toggle = async (c: Campaign) => {
    const next = c.status === "active" ? "paused" : "active";
    try {
      await updateStatus.mutateAsync({ id: c.id, status: next });
      toast.success(next === "active" ? "Campanha ativada" : "Campanha pausada");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight md:text-[32px]">Campanhas</h1>
          <p className="text-[13px] text-muted-foreground">Gerencie e otimize todas as suas entregas</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110 glow-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Nova campanha
        </Link>
      </div>

      {/* Filter tabs strip — Meta Ads style */}
      <div className="tile overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-border/40 px-2 py-1.5">
          {([
            { k: "all", l: "Todas" },
            { k: "active", l: "Ativas" },
            { k: "paused", l: "Pausadas" },
            { k: "draft", l: "Rascunhos" },
            { k: "completed", l: "Concluídas" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setFilter(t.k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold transition",
                filter === t.k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface-2/50",
              )}
            >
              {t.l}
              <span className={cn("rounded-full px-1.5 py-0 text-[9px] tabular", filter === t.k ? "bg-primary/25" : "bg-surface-2/80")}>
                {counts[t.k]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-b border-border/40 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome da campanha…"
              className="w-full rounded-lg border border-border/60 bg-surface-1/60 py-1.5 pl-8 pr-3 text-[12px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/60 px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filtros avançados
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-4">
          <SummaryCell label="Campanhas" value={String(filtered.length)} />
          <SummaryCell label="Investido" value={currency(totalSpent, { compact: true })} accent />
          <SummaryCell label="Impressões" value={compactNumber(totalImpr)} />
          <SummaryCell label="Cliques" value={compactNumber(totalClicks)} />
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <table className="w-full text-[12px]">
              <thead className="bg-surface-1/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-2.5"></th>
                  <th className="px-2 py-2.5 text-left font-semibold">Campanha</th>
                  <th className="px-2 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-2 py-2.5 text-left font-semibold">Entrega</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Impressões</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Cliques</th>
                  <th className="px-2 py-2.5 text-right font-semibold">CTR</th>
                  <th className="px-2 py-2.5 text-right font-semibold">CPC</th>
                  <th className="px-2 py-2.5 text-right font-semibold">Gasto</th>
                  <th className="w-10 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const m = generateMetrics(c);
                  const progress = m.budget > 0 ? Math.min(100, (m.spent / m.budget) * 100) : 0;
                  return (
                    <tr key={c.id} className="group border-t border-border/30 transition hover:bg-primary/[0.04]">
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggle(c); }}
                          disabled={updateStatus.isPending || c.status === "draft"}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-md border transition",
                            c.status === "active"
                              ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
                              : "border-success/40 bg-success/10 text-success hover:bg-success/20",
                            c.status === "draft" && "opacity-30",
                          )}
                          title={c.status === "active" ? "Pausar" : "Ativar"}
                        >
                          {c.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <Link to="/campaigns/$id" params={{ id: c.id }} className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-cyan/20 text-[11px] font-bold text-primary">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold group-hover:text-primary">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">{objectiveLabels[c.objective]} · {nicheLabels[c.niche]}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-2 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-2 py-3 min-w-[120px]">
                        <div className="flex items-center justify-between text-[10px] tabular">
                          <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
                          <span className="font-mono">{currency(m.spent, { compact: true })}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3/60">
                          <div className="h-full gradient-primary" style={{ width: `${progress}%` }} />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right font-mono tabular">{compactNumber(m.impressions)}</td>
                      <td className="px-2 py-3 text-right font-mono tabular">{compactNumber(m.clicks)}</td>
                      <td className="px-2 py-3 text-right font-mono tabular text-cyan">{m.ctr.toFixed(2)}%</td>
                      <td className="px-2 py-3 text-right font-mono tabular text-muted-foreground">R$ {m.cpc.toFixed(2)}</td>
                      <td className="px-2 py-3 text-right font-mono tabular font-bold">{currency(m.spent)}</td>
                      <td className="px-2 py-3">
                        <Link to="/campaigns/$id" params={{ id: c.id }} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border/40">
              {filtered.map((c) => {
                const m = generateMetrics(c);
                const progress = m.budget > 0 ? Math.min(100, (m.spent / m.budget) * 100) : 0;
                return (
                  <li key={c.id}>
                    <Link to="/campaigns/$id" params={{ id: c.id }} className="block p-3.5 transition active:bg-primary/[0.05]">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-cyan/20 text-[12px] font-bold text-primary">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-semibold">{c.name}</p>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="text-[10.5px] text-muted-foreground">{objectiveLabels[c.objective]} · {nicheLabels[c.niche]}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[10.5px]">
                            <div><p className="text-muted-foreground">Impr.</p><p className="tabular font-semibold">{compactNumber(m.impressions)}</p></div>
                            <div><p className="text-muted-foreground">CTR</p><p className="tabular font-semibold text-cyan">{m.ctr.toFixed(1)}%</p></div>
                            <div className="text-right"><p className="text-muted-foreground">Gasto</p><p className="tabular font-semibold">{currency(m.spent)}</p></div>
                          </div>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3/60">
                            <div className="h-full gradient-primary" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface-1/40 px-4 py-3">
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-display text-lg font-bold tabular", accent && "text-gradient-mint")}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Megaphone className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold">Nenhuma campanha encontrada</p>
      <Link to="/campaigns/new" className="rounded-lg gradient-primary px-3.5 py-1.5 text-[12px] font-semibold text-white">
        Criar campanha
      </Link>
    </div>
  );
}
