import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Users, ShoppingBag, Send, DollarSign, TrendingUp, Crown, Activity,
  Megaphone, AlertTriangle, ArrowUpRight, ArrowDownRight, Target, Wallet,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const RANGES = [
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
  { id: "all", label: "Tudo", days: 9999 },
] as const;

const COLORS = ["hsl(var(--primary))", "#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#84cc16"];

function AdminDashboard() {
  const [rangeId, setRangeId] = useState<typeof RANGES[number]["id"]>("30d");
  const range = RANGES.find(r => r.id === rangeId)!;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [profiles, purchases, campaigns, intents] = await Promise.all([
        supabase.from("profiles").select("id, dm_balance, banned, created_at, email, display_name"),
        supabase.from("dm_purchases").select("price_brl, quantity, status, created_at, package_name, user_id"),
        supabase.from("campaigns").select("dm_sent, dm_total, status, niche, created_at, name, user_id, clicks, impressions"),
        supabase.from("payment_intents").select("status, created_at, amount_cents"),
      ]);
      if (profiles.error) throw profiles.error;
      if (purchases.error) throw purchases.error;
      if (campaigns.error) throw campaigns.error;
      if (intents.error) throw intents.error;
      return { profiles: profiles.data, purchases: purchases.data, campaigns: campaigns.data, intents: intents.data };
    },
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    if (!data) return null;
    const cutoff = Date.now() - range.days * 86400000;
    const inRange = (d: string) => new Date(d).getTime() >= cutoff;
    return {
      ...data,
      purchases: data.purchases.filter(p => inRange(p.created_at)),
      campaigns: data.campaigns.filter(c => inRange(c.created_at)),
      intents: data.intents.filter(i => inRange(i.created_at)),
      newUsers: data.profiles.filter(p => inRange(p.created_at)).length,
    };
  }, [data, range.days]);

  if (isLoading || !data || !filtered) {
    return <div className="grid place-items-center py-20 text-sm text-muted-foreground">Carregando métricas…</div>;
  }

  const paidPurchases = filtered.purchases.filter(p => p.status === "paid");
  const totalRevenue = paidPurchases.reduce((s, p) => s + Number(p.price_brl), 0);
  const totalDmsSold = paidPurchases.reduce((s, p) => s + p.quantity, 0);
  const totalDmsSent = filtered.campaigns.reduce((s, c) => s + (c.dm_sent || 0), 0);
  const ticketAvg = paidPurchases.length ? totalRevenue / paidPurchases.length : 0;
  const totalUsers = data.profiles.length;
  const banned = data.profiles.filter(p => p.banned).length;
  const buyers = new Set(paidPurchases.map(p => p.user_id)).size;
  const conversion = totalUsers ? (buyers / totalUsers) * 100 : 0;
  const intentsTotal = filtered.intents.length;
  const intentsApproved = filtered.intents.filter(i => i.status === "approved").length;
  const intentConv = intentsTotal ? (intentsApproved / intentsTotal) * 100 : 0;
  const totalImpressions = filtered.campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalClicks = filtered.campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const ctr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;
  const activeCampaigns = filtered.campaigns.filter(c => c.status === "active").length;

  // Time series por dia
  const days = Math.min(range.days, 90);
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const dayPurchases = paidPurchases.filter(p => p.created_at.slice(0, 10) === key);
    const dayCampaigns = filtered.campaigns.filter(c => c.created_at.slice(0, 10) === key);
    return {
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      receita: Number(dayPurchases.reduce((s, p) => s + Number(p.price_brl), 0).toFixed(2)),
      vendas: dayPurchases.length,
      dmsVendidas: dayPurchases.reduce((s, p) => s + p.quantity, 0),
      dmsDisparadas: dayCampaigns.reduce((s, c) => s + (c.dm_sent || 0), 0),
    };
  });

  // Nichos
  const nicheCount: Record<string, number> = {};
  filtered.campaigns.forEach(c => { nicheCount[c.niche] = (nicheCount[c.niche] || 0) + 1; });
  const nicheData = Object.entries(nicheCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Top compradores
  const buyerMap = new Map<string, { revenue: number; count: number }>();
  paidPurchases.forEach(p => {
    const cur = buyerMap.get(p.user_id) || { revenue: 0, count: 0 };
    cur.revenue += Number(p.price_brl);
    cur.count += 1;
    buyerMap.set(p.user_id, cur);
  });
  const topBuyers = [...buyerMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)
    .map(([uid, v]) => {
      const prof = data.profiles.find(p => p.id === uid);
      return { id: uid, name: prof?.display_name || prof?.email || uid.slice(0, 8), ...v };
    });

  // Pacotes mais vendidos
  const pkgMap: Record<string, number> = {};
  paidPurchases.forEach(p => { pkgMap[p.package_name] = (pkgMap[p.package_name] || 0) + 1; });
  const pkgData = Object.entries(pkgMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const recentSales = [...paidPurchases].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Header + range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visão geral</h1>
          <p className="text-sm text-muted-foreground">Métricas em tempo real (atualiza a cada 30s)</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRangeId(r.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-bold transition",
                rangeId === r.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receita" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} accent="success" delta={`${paidPurchases.length} vendas`} />
        <Kpi label="Ticket médio" value={`R$ ${ticketAvg.toFixed(2)}`} icon={Wallet} accent="primary" delta={`${buyers} compradores`} />
        <Kpi label="DMs vendidas" value={totalDmsSold.toLocaleString("pt-BR")} icon={ShoppingBag} accent="cyan" delta={`${totalDmsSent.toLocaleString("pt-BR")} disparadas`} />
        <Kpi label="Conversão usuário→compra" value={`${conversion.toFixed(1)}%`} icon={Target} accent="warning" delta={`${filtered.newUsers} novos no período`} />
      </div>

      {/* KPIs secundários */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniKpi label="Usuários" value={totalUsers.toLocaleString("pt-BR")} icon={Users} sub={`${banned} banidos`} />
        <MiniKpi label="Campanhas ativas" value={activeCampaigns.toString()} icon={Megaphone} sub={`${filtered.campaigns.length} totais no período`} />
        <MiniKpi label="Conversão PIX" value={`${intentConv.toFixed(0)}%`} icon={Activity} sub={`${intentsApproved}/${intentsTotal} intents`} />
        <MiniKpi label="CTR médio" value={`${ctr.toFixed(2)}%`} icon={TrendingUp} sub={`${totalClicks.toLocaleString("pt-BR")} cliques`} />
      </div>

      {/* Gráfico receita */}
      <Card title="Receita por dia" subtitle="Acompanhe o faturamento do período">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gRev)" name="R$" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="DMs vendidas vs disparadas" subtitle="Saldo de consumo">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="dmsVendidas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Vendidas" />
                <Line type="monotone" dataKey="dmsDisparadas" stroke="#22c55e" strokeWidth={2} dot={false} name="Disparadas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Distribuição por nicho" subtitle={`${filtered.campaigns.length} campanhas no período`}>
          <div className="h-56">
            {nicheData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={nicheData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                    {nicheData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Pacotes mais vendidos" subtitle="Top do catálogo">
          <div className="h-56">
            {pkgData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pkgData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Top compradores" subtitle="Maiores receitas no período">
          <div className="space-y-2">
            {topBuyers.length === 0 && <Empty />}
            {topBuyers.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-1/50 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">#{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-semibold">{b.name}</p>
                    <p className="text-[11px] text-muted-foreground">{b.count} compras</p>
                  </div>
                </div>
                <span className="font-bold tabular text-success">R$ {b.revenue.toFixed(2)}</span>
              </div>
            ))}
            <Link to="/admin/members" className="block pt-2 text-center text-[11px] font-bold text-primary hover:underline">
              Ver todos os membros →
            </Link>
          </div>
        </Card>
      </div>

      {/* Últimas vendas + alertas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Últimas vendas" subtitle="Tempo real" className="lg:col-span-2">
          <div className="divide-y divide-border">
            {recentSales.length === 0 && <Empty />}
            {recentSales.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-[13px]">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="h-4 w-4 text-success" />
                  <div>
                    <p className="font-semibold">{s.package_name}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")} · {s.quantity.toLocaleString("pt-BR")} DMs</p>
                  </div>
                </div>
                <span className="font-bold tabular text-success">R$ {Number(s.price_brl).toFixed(2)}</span>
              </div>
            ))}
            <Link to="/admin/sales" className="block pt-3 text-center text-[11px] font-bold text-primary hover:underline">
              Ver histórico completo →
            </Link>
          </div>
        </Card>

        <div className="space-y-3">
          <Card title="Saúde da plataforma" subtitle="Indicadores rápidos">
            <div className="space-y-2.5 text-[12.5px]">
              <Health label="Conversão PIX" status={intentConv >= 60 ? "ok" : intentConv >= 30 ? "warn" : "bad"} value={`${intentConv.toFixed(0)}%`} />
              <Health label="Usuários banidos" status={banned === 0 ? "ok" : banned < 5 ? "warn" : "bad"} value={banned.toString()} />
              <Health label="Campanhas ativas" status={activeCampaigns > 0 ? "ok" : "warn"} value={activeCampaigns.toString()} />
              <Health label="CTR médio" status={ctr >= 5 ? "ok" : ctr >= 2 ? "warn" : "bad"} value={`${ctr.toFixed(2)}%`} />
            </div>
          </Card>

          {topBuyers.length > 0 && (
            <Card title="Top nicho" subtitle="Mais usado no período">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-xl font-bold capitalize">{nicheData[0]?.name || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{nicheData[0]?.value || 0} campanhas</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// === Building blocks ===
function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent, delta }: { label: string; value: string; icon: typeof Users; accent: "primary" | "success" | "warning" | "cyan"; delta?: string }) {
  const accents = {
    primary: "text-primary bg-primary/15",
    success: "text-success bg-success/15",
    warning: "text-warning bg-warning/15",
    cyan: "text-cyan bg-cyan/15",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", accents[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular">{value}</p>
      {delta && <p className="mt-1 text-[11px] text-muted-foreground">{delta}</p>}
    </div>
  );
}

function MiniKpi({ label, value, icon: Icon, sub }: { label: string; value: string; icon: typeof Users; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-base font-bold tabular">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Health({ label, value, status }: { label: string; value: string; status: "ok" | "warn" | "bad" }) {
  const dot = status === "ok" ? "bg-success" : status === "warn" ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-bold tabular">{value}</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="grid h-full place-items-center py-6 text-center text-[11px] text-muted-foreground">
      <div>
        <AlertTriangle className="mx-auto h-5 w-5 opacity-50" />
        <p className="mt-1">Sem dados no período</p>
      </div>
    </div>
  );
}
