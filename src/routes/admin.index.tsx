import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, ShoppingBag, Send, DollarSign, TrendingUp, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [profiles, purchases, campaigns] = await Promise.all([
        supabase.from("profiles").select("id, dm_balance, banned, created_at"),
        supabase.from("dm_purchases").select("price_brl, quantity, status, created_at, package_name"),
        supabase.from("campaigns").select("dm_sent, dm_total, status, niche, created_at"),
      ]);
      if (profiles.error) throw profiles.error;
      if (purchases.error) throw purchases.error;
      if (campaigns.error) throw campaigns.error;
      return { profiles: profiles.data, purchases: purchases.data, campaigns: campaigns.data };
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Carregando métricas…</p>;

  const buyers = new Set(data.purchases.filter(p => p.status === "paid").map((_, i) => i));
  const totalUsers = data.profiles.length;
  const banned = data.profiles.filter(p => p.banned).length;
  const totalRevenue = data.purchases.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.price_brl), 0);
  const totalDmsSold = data.purchases.filter(p => p.status === "paid").reduce((s, p) => s + p.quantity, 0);
  const totalDmsSent = data.campaigns.reduce((s, c) => s + (c.dm_sent || 0), 0);
  const activeCampaigns = data.campaigns.filter(c => c.status === "active").length;

  const nicheCount: Record<string, number> = {};
  data.campaigns.forEach(c => { nicheCount[c.niche] = (nicheCount[c.niche] || 0) + 1; });
  const topNiche = Object.entries(nicheCount).sort((a, b) => b[1] - a[1])[0];

  const recentSales = [...data.purchases].filter(p => p.status === "paid").sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Métricas em tempo real da plataforma</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Receita total" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} accent="text-success" />
        <Stat label="DMs vendidas" value={totalDmsSold.toLocaleString("pt-BR")} icon={ShoppingBag} accent="text-primary" />
        <Stat label="DMs disparadas" value={totalDmsSent.toLocaleString("pt-BR")} icon={Send} accent="text-cyan" />
        <Stat label="Usuários" value={`${totalUsers} (${banned} banidos)`} icon={Users} accent="text-warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Últimas vendas</h2>
            <Receipt />
          </div>
          <div className="mt-4 divide-y divide-border">
            {recentSales.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Sem vendas ainda</p>}
            {recentSales.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-[13px]">
                <div>
                  <p className="font-semibold">{s.package_name}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <span className="font-bold tabular text-success">R$ {Number(s.price_brl).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Crown className="h-4 w-4" /> <span className="text-xs uppercase tracking-wider">Nicho mais usado</span>
            </div>
            <p className="mt-2 text-xl font-bold capitalize">{topNiche?.[0] || "—"}</p>
            <p className="text-xs text-muted-foreground">{topNiche?.[1] || 0} campanhas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> <span className="text-xs uppercase tracking-wider">Campanhas ativas</span>
            </div>
            <p className="mt-2 text-xl font-bold">{activeCampaigns}</p>
            <p className="text-xs text-muted-foreground">de {data.campaigns.length} totais</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof Users; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function Receipt() {
  return <ShoppingBag className="h-4 w-4 text-muted-foreground" />;
}
