import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, MousePointerClick, TrendingUp, Wallet, ArrowRight, Megaphone, Users, Target, Activity, DollarSign } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useCampaigns, objectiveLabels } from "@/lib/queries";
import { generateMetrics } from "@/lib/fake-metrics";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: campaigns = [], isLoading } = useCampaigns();

  const { totals, daily, topCampaigns } = useMemo(() => {
    const metricsList = campaigns.map((c) => ({ c, m: generateMetrics(c) }));
    const totals = metricsList.reduce(
      (acc, { m }) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        spent: acc.spent + m.spent,
        reach: acc.reach + m.reach,
        conversions: acc.conversions + m.conversions,
        dmsReceived: acc.dmsReceived + m.dmsReceived,
      }),
      { impressions: 0, clicks: 0, spent: 0, reach: 0, conversions: 0, dmsReceived: 0 },
    );
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const daily = days.map((day) => {
      const agg = metricsList.reduce(
        (acc, { m }) => {
          const d = m.daily.find((x) => x.day === day);
          if (d) {
            acc.impressions += d.impressions;
            acc.clicks += d.clicks;
            acc.spent += d.spent;
          }
          return acc;
        },
        { day, impressions: 0, clicks: 0, spent: 0 },
      );
      return agg;
    });
    const topCampaigns = [...metricsList].sort((a, b) => b.m.spent - a.m.spent).slice(0, 4);
    return { totals, daily, topCampaigns };
  }, [campaigns]);

  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";
  const cpc = totals.clicks > 0 ? (totals.spent / totals.clicks).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Visão geral</h1>
          <p className="text-sm text-muted-foreground">Performance consolidada de todas as suas campanhas — últimos 7 dias</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:scale-[1.02]"
        >
          + Nova campanha
        </Link>
      </div>

      {/* Top KPIs grid — Facebook Ads style */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alcance" value={totals.reach.toLocaleString("pt-BR")} icon={Users} />
        <StatCard label="Impressões" value={totals.impressions.toLocaleString("pt-BR")} icon={Eye} />
        <StatCard label="Cliques no link" value={totals.clicks.toLocaleString("pt-BR")} icon={MousePointerClick} />
        <StatCard label="CTR" value={`${ctr}%`} icon={TrendingUp} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Conversões" value={totals.conversions.toLocaleString("pt-BR")} icon={Target} />
        <StatCard label="DMs entregues" value={totals.dmsReceived.toLocaleString("pt-BR")} icon={Activity} />
        <StatCard label="CPC médio" value={`R$ ${cpc}`} icon={DollarSign} />
        <StatCard label="Investido" value={`R$ ${totals.spent.toFixed(2)}`} icon={Wallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Desempenho diário</h2>
              <p className="text-xs text-muted-foreground">Impressões e cliques na última semana</p>
            </div>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Impressões</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Cliques</span>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
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
            <h2 className="text-lg font-bold">Investimento por dia</h2>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 240)" />
                <XAxis dataKey="day" stroke="oklch(0.68 0.02 240)" fontSize={12} />
                <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.23 0.025 240)", border: "1px solid oklch(0.3 0.02 240)", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Gasto"]}
                />
                <Bar dataKey="spent" fill="oklch(0.68 0.14 230)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elevated p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Campanhas em destaque</h2>
            <p className="text-xs text-muted-foreground">Ordenadas por investimento</p>
          </div>
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
            <Link to="/campaigns/new" className="mt-2 rounded-lg gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
              Criar campanha
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-[11px] uppercase text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left font-medium">Campanha</th>
                  <th className="px-2 py-2 text-right font-medium">Status</th>
                  <th className="px-2 py-2 text-right font-medium">Impr.</th>
                  <th className="px-2 py-2 text-right font-medium">Cliques</th>
                  <th className="px-2 py-2 text-right font-medium">CTR</th>
                  <th className="px-2 py-2 text-right font-medium">Gasto</th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map(({ c, m }) => (
                  <tr key={c.id} className="border-b border-border/50 transition hover:bg-accent/30">
                    <td className="px-2 py-3">
                      <Link to="/campaigns/$id" params={{ id: c.id }} className="font-semibold hover:text-primary">
                        {c.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{objectiveLabels[c.objective]}</p>
                    </td>
                    <td className="px-2 py-3 text-right"><StatusBadge status={c.status} /></td>
                    <td className="px-2 py-3 text-right font-mono text-xs">{m.impressions.toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-3 text-right font-mono text-xs">{m.clicks.toLocaleString("pt-BR")}</td>
                    <td className="px-2 py-3 text-right font-mono text-xs text-primary">{m.ctr}%</td>
                    <td className="px-2 py-3 text-right font-mono text-xs font-bold">R$ {m.spent.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
