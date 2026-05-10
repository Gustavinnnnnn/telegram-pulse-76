import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowUpCircle, Plus, Wallet as WalletIcon } from "lucide-react";
import { walletTransactions } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/wallet")({
  component: WalletPage,
});

function WalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Carteira</h1>
        <p className="text-sm text-muted-foreground">1 real = 1 crédito · use para impulsionar suas campanhas</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated relative overflow-hidden p-6 lg:col-span-2">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full gradient-primary opacity-20 blur-3xl" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary glow-primary">
              <WalletIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo disponível</p>
              <p className="text-3xl font-bold tracking-tight md:text-4xl">R$ 1.247,80</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[50, 100, 250, 500, 1000].map((v) => (
              <button
                key={v}
                onClick={() => toast.success(`R$ ${v} adicionados (simulação)`)}
                className="rounded-xl border border-border bg-background/40 px-4 py-2 text-sm font-semibold transition hover:border-primary hover:bg-primary/10"
              >
                + R$ {v}
              </button>
            ))}
            <button
              onClick={() => toast("Selecione um valor acima")}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Outro valor
            </button>
          </div>
        </div>

        <div className="card-elevated p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Gasto este mês</p>
          <p className="mt-2 text-2xl font-bold">R$ 941,30</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[62%] gradient-primary" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">62% do orçamento mensal</p>
        </div>
      </div>

      <div className="card-elevated p-5">
        <h2 className="text-lg font-bold">Histórico de transações</h2>
        <ul className="mt-4 divide-y divide-border">
          {walletTransactions.map((t) => {
            const isDeposit = t.type === "deposit";
            return (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDeposit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {isDeposit ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground">{t.date}</p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${isDeposit ? "text-success" : "text-destructive"}`}>
                  {isDeposit ? "+" : ""}R$ {Math.abs(t.amount).toFixed(2)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
