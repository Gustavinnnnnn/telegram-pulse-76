import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, Plus, CreditCard, Receipt, TrendingUp, Calendar,
  Search, FileText, Banknote, ShieldCheck, Zap, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useProfile, useWalletTransactions, useAddCredits, useCampaigns } from "@/lib/queries";
import { generateMetrics } from "@/lib/fake-metrics";
import { useAuth } from "@/contexts/AuthContext";
import { BalanceCard } from "@/components/BalanceCard";
import { MetricTile } from "@/components/MetricTile";
import { compactNumber, currency, shortId } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const { data: profile } = useProfile();
  const { data: txs = [] } = useWalletTransactions();
  const { data: campaigns = [] } = useCampaigns();
  const { user } = useAuth();
  const addCredits = useAddCredits();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "history" | "methods">("overview");
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const balance = Number(profile?.balance ?? 0);
  const accountId = user ? shortId(user.id) : "------";

  const handleAdd = async (amount: number) => {
    if (amount <= 0) return;
    try {
      await addCredits.mutateAsync(amount);
      toast.success("Créditos adicionados", { description: `R$ ${amount.toFixed(2)} disponíveis na sua conta.` });
      setShowCustom(false); setCustomAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar créditos");
    }
  };

  const { totalSpent, dailySpend } = useMemo(() => {
    const list = campaigns.map((c) => generateMetrics(c));
    const totalSpent = list.reduce((a, m) => a + m.spent, 0);
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const dailySpend = days.map((day) => ({
      day,
      spent: list.reduce((a, m) => a + (m.daily.find((d) => d.day === day)?.spent ?? 0), 0),
    }));
    return { totalSpent, dailySpend };
  }, [campaigns]);

  // Group transactions by date
  const grouped = useMemo(() => {
    const filtered = txs.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()));
    const map = new Map<string, typeof filtered>();
    filtered.forEach((t) => {
      const key = new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries());
  }, [txs, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight md:text-[32px]">Faturamento</h1>
        <p className="text-[13px] text-muted-foreground">Gerencie créditos, formas de pagamento e histórico financeiro</p>
      </div>

      {/* Hero: virtual card + quick add */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <BalanceCard balance={balance} accountId={accountId} />
        </div>

        <div className="tile p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold">Adicionar créditos</h2>
              <p className="text-[11px] text-muted-foreground">1 crédito = R$ 1,00 em mídia · liberação imediata</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
              <Zap className="h-3 w-3" /> instantâneo
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[50, 100, 250, 500].map((v) => (
              <button
                key={v}
                disabled={addCredits.isPending}
                onClick={() => handleAdd(v)}
                className="group rounded-xl border border-border/60 bg-surface-1/40 p-3 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-50"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">+ R$</p>
                <p className="font-display text-2xl font-bold tabular">{v}</p>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => handleAdd(1000)}
              disabled={addCredits.isPending}
              className="flex-1 rounded-xl border border-primary/40 bg-primary/10 p-3 text-left transition hover:bg-primary/20 disabled:opacity-50"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Pacote pro</p>
              <p className="font-display text-xl font-bold tabular text-primary">+ R$ 1.000</p>
              <p className="text-[10px] text-muted-foreground">+5% bônus em mídia</p>
            </button>
            <button
              onClick={() => setShowCustom((s) => !s)}
              className="flex-1 rounded-xl border border-dashed border-border bg-surface-1/40 p-3 text-left transition hover:border-primary"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outro valor</p>
              <p className="font-display text-xl font-bold tabular">Personalizado</p>
            </button>
          </div>
          {showCustom && (
            <div className="mt-3 flex gap-2 animate-[fade-in_0.3s_ease-out]">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <input
                  type="number"
                  min={10}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-border/60 bg-surface-1/60 py-2 pl-9 pr-3 text-sm font-semibold tabular outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={() => handleAdd(Number(customAmount))}
                className="rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white"
              >
                Confirmar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Gasto total" value={totalSpent} format="currency" icon={TrendingUp} accent="primary" />
        <MetricTile label="Este mês" value={totalSpent} format="currency" icon={Calendar} accent="cyan" />
        <MetricTile label="Campanhas ativas" value={campaigns.filter((c) => c.status === "active").length} format="raw" icon={Banknote} accent="warning" />
        <MetricTile label="Transações" value={txs.length} format="raw" icon={Receipt} accent="magenta" />
      </div>

      {/* Tabs */}
      <div className="inline-flex gap-1 rounded-xl border border-border/60 bg-surface-1/60 p-1">
        {([
          { k: "overview", l: "Visão geral" },
          { k: "history", l: "Histórico" },
          { k: "methods", l: "Pagamentos" },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-[11.5px] font-semibold transition",
              tab === t.k ? "gradient-primary text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="tile p-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-base font-bold">Gastos por dia</h2>
              <p className="text-[11px] text-muted-foreground">Investimento consolidado nos últimos 7 dias</p>
            </div>
            <p className="font-display text-2xl font-bold tabular text-gradient-primary">{currency(totalSpent)}</p>
          </div>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySpend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wgw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.69 0.15 230)" stopOpacity={0.65} />
                    <stop offset="100%" stopColor="oklch(0.69 0.15 230)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="oklch(0.3 0.02 240 / 0.4)" />
                <XAxis dataKey="day" stroke="oklch(0.62 0.02 235)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="oklch(0.62 0.02 235)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${compactNumber(v)}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.235 0.026 236)", border: "1px solid oklch(0.38 0.025 234)", borderRadius: "12px", fontSize: "11px" }}
                  formatter={(v: number) => [currency(v), "Gasto"]}
                />
                <Area type="monotone" dataKey="spent" stroke="oklch(0.69 0.15 230)" strokeWidth={2.5} fill="url(#wgw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="tile overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-base font-bold">Histórico de transações</h2>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar transação…"
                className="w-full rounded-lg border border-border/60 bg-surface-1/60 py-1.5 pl-8 pr-3 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhuma transação ainda</p>
              <p className="text-[11px] text-muted-foreground">Adicione créditos para começar.</p>
            </div>
          ) : (
            <ul className="p-3">
              {grouped.map(([date, list]) => (
                <li key={date} className="mb-4 last:mb-0">
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{date}</p>
                  <ul className="space-y-1.5">
                    {list.map((t) => {
                      const isDeposit = t.type === "deposit";
                      return (
                        <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface-1/40 p-3 transition hover:bg-surface-1/80">
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            isDeposit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                          )}>
                            {isDeposit ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold">{t.description}</p>
                            <p className="text-[10.5px] text-muted-foreground">
                              {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · ID #{t.id.slice(0, 6)}
                            </p>
                          </div>
                          <p className={cn(
                            "font-display tabular text-base font-bold",
                            isDeposit ? "text-success" : "text-destructive",
                          )}>
                            {isDeposit ? "+" : "-"}{currency(Math.abs(Number(t.amount)))}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "methods" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <MethodRow icon={CreditCard} title="Cartão Visa" subtitle="•••• 4242 · expira 12/28" badge="Padrão" />
          <MethodRow icon={Building2} title="Pix" subtitle="cobrança automática quando saldo < R$ 50" />
          <MethodRow icon={ShieldCheck} title="Boleto" subtitle="liberação em até 1 dia útil" />
          <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-1/30 p-6 text-center transition hover:border-primary hover:bg-primary/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-[12px] font-semibold">Adicionar forma de pagamento</p>
          </button>
        </div>
      )}
    </div>
  );
}

function MethodRow({ icon: Icon, title, subtitle, badge }: { icon: typeof CreditCard; title: string; subtitle: string; badge?: string }) {
  return (
    <div className="tile flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="truncate text-[10.5px] text-muted-foreground">{subtitle}</p>
      </div>
      {badge && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9.5px] font-bold text-primary">{badge}</span>}
    </div>
  );
}
