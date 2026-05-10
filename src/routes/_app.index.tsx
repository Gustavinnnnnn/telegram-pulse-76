import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, MousePointerClick, TrendingUp, Wallet, ArrowRight, Megaphone } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useCampaigns, objectiveLabels } from "@/lib/queries";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

// Mocked daily series for visual; real metrics will plug in once distribution runs
const series = [
  { day: "Seg", impressions: 0, clicks: 0 },
  { day: "Ter", impressions: 0, clicks: 0 },
  { day: "Qua", impressions: 0, clicks: 0 },
  { day: "Qui", impressions: 0, clicks: 0 },
  { day: "Sex", impressions: 0, clicks: 0 },
  { day: "Sáb", impressions: 0, clicks: 0 },
  { day: "Dom", impressions: 0, clicks: 0 },
];

function DashboardPage() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const totals = campaigns.reduce(
    (acc, c) => ({
      impressions: acc.impressions + Number(c.impressions),
      clicks: acc.clicks + Number(c.clicks),
      spent: acc.spent + Number(c.spent),
    }),
    { impressions: 0, clicks: 0, spent: 0 },
  );
  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral das suas campanhas</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:scale-[1.02]"
        >
          + Nova campanha
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Impressões" value={totals.impressions.toLocaleString("pt-BR")} icon={Eye} />
        <StatCard label="Cliques" value={totals.clicks.toLocaleString("pt-BR")} icon={MousePointerClick} />
        <StatCard label="CTR" value={`${ctr}%`} icon={TrendingUp} />
        <StatCard label="Investido" value={`R$ ${totals.spent.toFixed(2)}`} icon={Wallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold">Desempenho — últimos 7 dias</h2>
            <p className="text-xs text-muted-foreground">Impressões e cliques diários</p>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
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
            <h2 className="text-lg font-bold">Suas campanhas</h2>
            <Link to="/campaigns" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : campaigns.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhuma campanha ainda</p>
              <p className="text-[11px] text-muted-foreground">Crie sua primeira campanha para começar</p>
              <Link
                to="/campaigns/new"
                className="mt-2 rounded-lg gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
              >
                Criar campanha
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {campaigns.slice(0, 3).map((c) => (
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
                      <p className="font-semibold">{Number(c.impressions)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cliques</p>
                      <p className="font-semibold">{Number(c.clicks)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gasto</p>
                      <p className="font-semibold text-primary">R$ {Number(c.spent).toFixed(0)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
