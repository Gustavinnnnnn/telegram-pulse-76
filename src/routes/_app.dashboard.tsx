import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Eye, MousePointerClick, Users, Target, MessageCircle, TrendingUp, Activity,
  Megaphone, ArrowRight, Calendar, Download, Zap, Send, Package,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { MetricTile } from "@/components/MetricTile";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { HourlyHeatmap } from "@/components/HourlyHeatmap";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { StatusBadge } from "@/components/StatusBadge";
import { DMProgressBar } from "@/components/DMProgressBar";
import { useCampaigns, objectiveLabels, useProfile } from "@/lib/queries";
import { generateMetrics } from "@/lib/fake-metrics";
import { compactNumber, shortId } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: campaigns = [] } = useCampaigns();
  const { data: profile } = useProfile();
  const { user } = useAuth();

  const { totals, daily, top, sparks } = useMemo(() => {
    const list = campaigns.map((c) => ({ c, m: generateMetrics(c) }));
    const totals = list.reduce(
      (acc, { m }) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        dmsSent: acc.dmsSent + m.dmsSent,
        reach: acc.reach + m.reach,
        conversions: acc.conversions + m.conversions,
        dmsReceived: acc.dmsReceived + m.dmsReceived,
        dmTotal: acc.dmTotal + m.dmTotal,
      }),
      { impressions: 0, clicks: 0, dmsSent: 0, reach: 0, conversions: 0, dmsReceived: 0, dmTotal: 0 },
    );
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const daily = days.map((day) => {
      return list.reduce(
        (acc, { m }) => {
          const d = m.daily.find((x) => x.day === day);
          if (d) { acc.impressions += d.impressions; acc.clicks += d.clicks; acc.sent += d.sent; acc.conversions += d.conversions; }
          return acc;
        },
        { day, impressions: 0, clicks: 0, sent: 0, conversions: 0 },
      );
    });
    const activeOnly = list.filter(({ c }) => c.status === "active");
    const top = [...activeOnly, ...list.filter(({ c }) => c.status !== "active")]
      .sort((a, b) => b.m.dmsSent - a.m.dmsSent).slice(0, 5);
    const sparks = {
      reach: daily.map((d) => d.impressions * 0.7),
      sent: daily.map((d) => d.sent),
      clicks: daily.map((d) => d.clicks),
      conv: daily.map((d) => d.conversions),
    };
    return { totals, daily, top, sparks };
  }, [campaigns]);

  const ctr = totals.dmsReceived > 0 ? (totals.clicks / totals.dmsReceived) * 100 : 0;
  const balance = profile?.dm_balance ?? 0;
  const remaining = Math.max(0, totals.dmTotal - totals.dmsSent);
  const accountId = user ? shortId(user.id) : "------";
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border/60 bg-surface-1/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">TLG · {accountId}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
              <span className="dot-live !h-1.5 !w-1.5" /> {activeCount} {activeCount === 1 ? "campanha ativa" : "campanhas ativas"}
            </span>
          </div>
          <h1 className="mt-2 font-display text-[26px] font-bold leading-tight md:text-[32px]">
            Olá, {(profile?.display_name || user?.email?.split("@")[0] || "anunciante").split(" ")[0]} 👋
          </h1>
          <p className="text-[13px] text-muted-foreground">Visão consolidada das suas campanhas de DM nos últimos 7 dias</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/60 px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40">
            <Calendar className="h-3.5 w-3.5" /> Últimos 7 dias
          </button>
          <button className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/60 px-3 py-1.5 text-[12px] font-semibold transition hover:border-primary/40">
            <Download className="h-3.5 w-3.5" /> Exportar
          </button>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg gradient-primary px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:brightness-110 glow-primary"
          >
            + Nova campanha
          </Link>
        </div>
      </div>

      {/* DM balance hero */}
      <div className="tile relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-primary/30 via-cyan/15 to-transparent blur-3xl" />
        <div className="relative grid gap-4 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Saldo de DMs</span>
            </div>
            <p className="mt-1 font-display text-5xl font-bold tabular text-gradient-primary leading-none">{compactNumber(balance)}</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">{balance.toLocaleString("pt-BR")} disparos disponíveis para usar em campanhas</p>
            <Link to="/store" className="mt-3 inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3.5 py-1.5 text-[12px] font-semibold text-white glow-primary">
              <Package className="h-3.5 w-3.5" /> Comprar mais DMs
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:col-span-7">
            <MiniStat label="DMs enviadas" value={compactNumber(totals.dmsSent)} accent="text-cyan" icon={Send} />
            <MiniStat label="A enviar" value={compactNumber(remaining)} accent="text-warning" icon={Activity} />
            <MiniStat label="Campanhas" value={String(campaigns.length)} accent="text-magenta" icon={Megaphone} />
          </div>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="DMs entregues" value={totals.dmsReceived} icon={MessageCircle} delta={9.4} spark={sparks.sent} accent="primary" />
        <MetricTile label="Cliques" value={totals.clicks} icon={MousePointerClick} delta={15.6} spark={sparks.clicks} accent="cyan" />
        <MetricTile label="CTR médio" value={ctr} format="percent" icon={TrendingUp} delta={2.1} accent="warning" />
        <MetricTile label="Conversões" value={totals.conversions} icon={Target} delta={22.3} spark={sparks.conv} accent="magenta" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Alcance único" value={totals.reach} icon={Users} accent="primary" />
        <MetricTile label="Impressões" value={totals.impressions} icon={Eye} accent="cyan" />
        <MetricTile label="Taxa de aprovação" value={92.4} format="percent" icon={Activity} accent="warning" />
        <MetricTile label="Disparos / dia" value={Math.round(totals.dmsSent / 7)} icon={Send} accent="magenta" />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="tile p-5 lg:col-span-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">Performance diária</h2>
              <p className="text-[11px] text-muted-foreground">DMs enviadas, cliques e conversões nos últimos 7 dias</p>
            </div>
            <div className="flex gap-3 text-[10.5px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />DMs</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan" />Cliques</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" />Conversões</span>
            </div>
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.69 0.15 230)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.69 0.15 230)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.84 0.16 178)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.84 0.16 178)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dg3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.17 60)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.17 60)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="oklch(0.3 0.02 240 / 0.4)" />
                <XAxis dataKey="day" stroke="oklch(0.62 0.02 235)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.62 0.02 235)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => compactNumber(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.235 0.026 236)", border: "1px solid oklch(0.38 0.025 234)", borderRadius: "12px", fontSize: "11px", boxShadow: "0 8px 30px -8px rgba(0,0,0,0.6)" }}
                  labelStyle={{ color: "oklch(0.62 0.02 235)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}
                />
                <Area type="monotone" dataKey="sent" stroke="oklch(0.69 0.15 230)" strokeWidth={2} fill="url(#dg1)" />
                <Area type="monotone" dataKey="clicks" stroke="oklch(0.84 0.16 178)" strokeWidth={2} fill="url(#dg2)" />
                <Area type="monotone" dataKey="conversions" stroke="oklch(0.78 0.17 60)" strokeWidth={2} fill="url(#dg3)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4">
          <LiveActivityFeed height={340} />
        </div>
      </div>

      {/* Lower row */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <HourlyHeatmap seed={user?.id ?? "x"} />
        </div>
        <div className="lg:col-span-5">
          <ConversionFunnel
            stages={[
              { label: "DMs enviadas", value: totals.dmsSent, color: "linear-gradient(90deg, oklch(0.69 0.15 230), oklch(0.6 0.15 230))" },
              { label: "DMs entregues", value: totals.dmsReceived, color: "linear-gradient(90deg, oklch(0.84 0.16 178), oklch(0.74 0.16 178))" },
              { label: "Cliques", value: totals.clicks, color: "linear-gradient(90deg, oklch(0.78 0.17 60), oklch(0.68 0.17 60))" },
              { label: "Conversões", value: totals.conversions, color: "linear-gradient(90deg, oklch(0.7 0.22 330), oklch(0.6 0.22 330))" },
            ]}
          />
        </div>
      </div>

      {/* Top campaigns */}
      <div className="tile p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold">Campanhas em destaque</h2>
            <p className="text-[11px] text-muted-foreground">Ordenadas por volume de DMs enviadas</p>
          </div>
          <Link to="/campaigns" className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-surface-1/40 p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold">Você ainda não criou campanhas</p>
            <p className="text-[11px] text-muted-foreground">Use seu saldo de DMs para começar a impactar usuários no Telegram.</p>
            <Link to="/campaigns/new" className="mt-2 rounded-lg gradient-primary px-3.5 py-1.5 text-[12px] font-semibold text-white">
              Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {top.map(({ c, m }) => (
              <Link
                key={c.id}
                to="/campaigns/$id"
                params={{ id: c.id }}
                className="group grid grid-cols-12 items-center gap-3 rounded-xl border border-border/40 bg-surface-1/40 p-3 transition hover:border-primary/40 hover:bg-surface-1/80"
              >
                <div className="col-span-12 sm:col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-cyan/20 text-[11px] font-bold text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold group-hover:text-primary">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{objectiveLabels[c.objective]}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-2"><StatusBadge status={c.status} /></div>
                <div className="col-span-4 sm:col-span-2 text-right tabular text-[11.5px]"><p className="text-muted-foreground">Cliques</p><p className="font-semibold">{compactNumber(m.clicks)}</p></div>
                <div className="col-span-4 sm:col-span-1 text-right tabular text-[11.5px]"><p className="text-muted-foreground">CTR</p><p className="font-semibold text-cyan">{m.ctr.toFixed(1)}%</p></div>
                <div className="col-span-12 sm:col-span-3">
                  <DMProgressBar sent={m.dmsSent} total={m.dmTotal} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent, icon: Icon }: { label: string; value: string; accent: string; icon: typeof Send }) {
  return (
    <div className="rounded-xl border border-border/40 bg-surface-1/50 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${accent}`} />
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`mt-1 font-display text-2xl font-bold tabular ${accent}`}>{value}</p>
    </div>
  );
}
