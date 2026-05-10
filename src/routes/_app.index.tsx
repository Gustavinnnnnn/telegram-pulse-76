import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, MousePointerClick, TrendingUp, Wallet, ArrowRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { mockCampaigns, performanceSeries, objectiveLabels } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const totals = mockCampaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      spent: acc.spent + c.spent,
    }),
    { impressions: 0, clicks: 0, spent: 0 },
  );
  const ctr = ((totals.clicks / totals.impressions) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral das suas campanhas no Telegram</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:scale-[1.02]"
        >
          + Nova campanha
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Impressões" value={totals.impressions.toLocaleString("pt-BR")} delta="12,4% vs semana" icon={Eye} />
        <StatCard label="Cliques" value={totals.clicks.toLocaleString("pt-BR")} delta="8,1% vs semana" icon={MousePointerClick} />
        <StatCard label="CTR" value={`${ctr}%`} delta="0,4 pp" icon={TrendingUp} />
        <StatCard label="Investido" value={`R$ ${totals.spent.toFixed(2)}`} delta="3 campanhas ativas" icon={Wallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Desempenho — últimos 7 dias</h2>
              <p className="text-xs text-muted-foreground">Impressões e cliques diários</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceSeries}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.68 0.14 230)" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="oklch(0.68 0.14 230)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 240)" />
                <XAxis dataKey="day" stroke="oklch(0.68 0.02 240)" fontSize={12} />
                <YAxis stroke="oklch(0.68 0.02 240)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.23 0.025 240)",
                    border: "1px solid oklch(0.3 0.02 240)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="impressions" stroke="oklch(0.68 0.14 230)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="clicks" stroke="oklch(0.7 0.16 155)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Top campanhas</h2>
            <Link to="/campaigns" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {mockCampaigns.slice(0, 3).map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-background/40 p-3 transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{objectiveLabels[c.objective]}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Impr.</p>
                    <p className="font-semibold">{(c.impressions / 1000).toFixed(1)}k</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cliques</p>
                    <p className="font-semibold">{c.clicks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gasto</p>
                    <p className="font-semibold text-primary">R$ {c.spent.toFixed(0)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
