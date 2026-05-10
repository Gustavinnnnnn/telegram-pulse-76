import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowUpCircle, Plus, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { useProfile, useWalletTransactions, useAddCredits } from "@/lib/queries";

export const Route = createFileRoute("/_app/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const { data: profile } = useProfile();
  const { data: txs = [], isLoading } = useWalletTransactions();
  const addCredits = useAddCredits();
  const balance = Number(profile?.balance ?? 0);

  const handleAdd = async (amount: number) => {
    try {
      await addCredits.mutateAsync(amount);
      toast.success(`R$ ${amount.toFixed(2)} adicionados!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar créditos");
    }
  };

  const monthSpent = txs
    .filter((t) => t.type === "spend")
    .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

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
              <p className="text-3xl font-bold tracking-tight md:text-4xl">R$ {balance.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
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
              onClick={() => toast("Selecione um valor acima")}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Outro valor
            </button>
          </div>
        </div>

        <div className="card-elevated p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total gasto</p>
          <p className="mt-2 text-2xl font-bold">R$ {monthSpent.toFixed(2)}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">Acumulado em campanhas</p>
        </div>
      </div>

      <div className="card-elevated p-5">
        <h2 className="text-lg font-bold">Histórico de transações</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
        ) : txs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma transação ainda.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {txs.map((t) => {
              const isDeposit = t.type === "deposit";
              const amount = Number(t.amount);
              return (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDeposit ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      {isDeposit ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${isDeposit ? "text-success" : "text-destructive"}`}>
                    {isDeposit ? "+" : "-"}R$ {Math.abs(amount).toFixed(2)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
