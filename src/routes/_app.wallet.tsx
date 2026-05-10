import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, Plus, Wallet as WalletIcon, CreditCard,
  Receipt, TrendingUp, Calendar, Download, Search, FileText, Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useProfile, useWalletTransactions, useAddCredits, useCampaigns } from "@/lib/queries";
import { generateMetrics } from "@/lib/fake-metrics";
import { StatCard } from "@/components/StatCard";

export const Route = createFileRoute("/_app/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const { data: profile } = useProfile();
  const { data: txs = [], isLoading } = useWalletTransactions();
  const { data: campaigns = [] } = useCampaigns();
  const addCredits = useAddCredits();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "billing" | "methods">("overview");

  const balance = Number(profile?.balance ?? 0);

  const handleAdd = async (amount: number) => {
    try {
      await addCredits.mutateAsync(amount);
      toast.success(`R$ ${amount.toFixed(2)} adicionados!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar créditos");
    }
  };

  // Aggregate spending across campaigns
  const { totalSpent, dailySpend, monthSpent } = useMemo(() => {
    const list = campaigns.map((c) => generateMetrics(c));
    const totalSpent = list.reduce((a, m) => a + m.spent, 0);
    const monthSpent = totalSpent;
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const dailySpend = days.map((day) => ({
      day,
      spent: list.reduce((a, m) => a + (m.daily.find((d) => d.day === day)?.spent ?? 0), 0),
    }));
    return { totalSpent, dailySpend, monthSpent };
  }, [campaigns]);

  const filteredTxs = txs.filter((t) =>
    t.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Faturamento</h1>
        <p className="text-sm text-muted-foreground">Gerencie créditos, formas de pagamento e histórico</p>
      </div>

      {/* Hero balance + KPIs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated relative overflow-hidden p-6 lg:col-span-2">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full gradient-primary opacity-20 blur-3xl" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary glow-primary">
                <WalletIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo disponível</p>
                <p className="text-3xl font-bold tracking-tight md:text-4xl">R$ {balance.toFixed(2)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">1 crédito = R$ 1,00 em mídia</p>
              </div>
            </div>
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
              Conta ativa
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {[50, 100, 250, 500, 1000].map((v) => (
              <button
                key={v}
                disabled={addCredits.isPending}
                onClick={() => handleAdd(v)}
                className="rounded-xl border border-border bg-background/40 px-4 py-2 text-sm font-semibold transition hover:border-primary hover:bg-primary/10 disabled:opacity-50"
              >
                + R$ {v}
              </button>
            ))}
            <button
              onClick={() => {
                const v = Number(prompt("Quanto deseja adicionar? (R$)"));
                if (v > 0) handleAdd(v);
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Outro valor
            </button>
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Limite de cobrança</p>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-2xl font-bold">R$ 500,00</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Sua próxima fatura é gerada quando os gastos atingem este limite.</p>
          <button className="mt-3 w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-xs font-semibold transition hover:border-primary">
            Alterar limite
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gasto total" value={`R$ ${totalSpent.toFixed(2)}`} icon={TrendingUp} />
        <StatCard label="Este mês" value={`R$ ${monthSpent.toFixed(2)}`} icon={Calendar} />
        <StatCard label="Campanhas ativas" value={String(campaigns.filter((c) => c.status === "active").length)} icon={Banknote} />
        <StatCard label="Transações" value={String(txs.length)} icon={Receipt} />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {([
          { k: "overview", label: "Visão geral" },
          { k: "billing", label: "Histórico de transações" },
          { k: "methods", label: "Formas de pagamento" },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={
              "whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition " +
              (tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card-elevated p-5">
          <h2 className="text-base font-bold">Gastos diários (últimos 7 dias)</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySpend}>
                <defs>
                  <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.68 0.14 230)" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="oklch(0.68 0.14 230)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 240)" />
                <XAxis dataKey="day" stroke="oklch(0.68 0.02 240)" fontSize={11} />
                <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.23 0.025 240)", border: "1px solid oklch(0.3 0.02 240)", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Gasto"]}
                />
                <Area type="monotone" dataKey="spent" stroke="oklch(0.68 0.14 230)" strokeWidth={2} fill="url(#gw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="card-elevated p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold">Transações</h2>
            <div className="flex flex-1 items-center gap-2 sm:max-w-md">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar transação..."
                  className="w-full rounded-xl border border-border bg-input/60 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : filteredTxs.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-2 py-2 text-left font-medium">Descrição</th>
                    <th className="px-2 py-2 text-left font-medium">Tipo</th>
                    <th className="px-2 py-2 text-left font-medium">Data</th>
                    <th className="px-2 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map((t) => {
                    const isDeposit = t.type === "deposit";
                    const amount = Number(t.amount);
                    return (
                      <tr key={t.id} className="border-b border-border/50 transition hover:bg-accent/30">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDeposit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                              {isDeposit ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                            </div>
                            <span className="font-medium">{t.description}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDeposit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {isDeposit ? "Crédito" : "Débito"}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className={`px-2 py-3 text-right font-mono font-bold ${isDeposit ? "text-success" : "text-destructive"}`}>
                          {isDeposit ? "+" : "-"}R$ {Math.abs(amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "methods" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PaymentMethodCard
            type="Cartão Visa"
            number="•••• •••• •••• 4242"
            holder={profile?.display_name ?? "Titular"}
            primary
          />
          <button className="card-elevated flex flex-col items-center justify-center gap-2 border-dashed p-8 text-center transition hover:border-primary">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold">Adicionar forma de pagamento</p>
            <p className="text-[11px] text-muted-foreground">Cartão de crédito, Pix ou boleto</p>
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentMethodCard({ type, number, holder, primary }: { type: string; number: string; holder: string; primary?: boolean }) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <CreditCard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">{type}</p>
            <p className="text-xs text-muted-foreground">{number}</p>
          </div>
        </div>
        {primary && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">Padrão</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Titular</p>
          <p className="font-semibold">{holder}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Validade</p>
          <p className="font-semibold">12/28</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs font-semibold transition hover:border-primary">
          Editar
        </button>
        <button className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10">
          Remover
        </button>
      </div>
    </div>
  );
}
