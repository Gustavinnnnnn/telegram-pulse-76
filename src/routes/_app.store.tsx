import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Package, Zap, ShieldCheck, Sparkles, Receipt, Check, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { useProfile, usePackages, usePurchases, usePurchasePackage, type DMPackage } from "@/lib/queries";
import { compactNumber, currency, dms } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/store")({
  component: StorePage,
});

const TIER_THEMES = [
  { gradient: "from-primary/30 via-primary/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.69_0.15_230_/_0.6)]", accent: "text-primary", border: "border-primary/30", chip: "bg-primary/15 text-primary" },
  { gradient: "from-cyan/35 via-cyan/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.84_0.16_178_/_0.6)]", accent: "text-cyan", border: "border-cyan/40", chip: "bg-cyan/15 text-cyan" },
  { gradient: "from-fuchsia-500/30 via-fuchsia-500/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.7_0.22_330_/_0.6)]", accent: "text-magenta", border: "border-fuchsia-500/30", chip: "bg-fuchsia-500/15 text-magenta" },
  { gradient: "from-warning/35 via-warning/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.78_0.17_60_/_0.6)]", accent: "text-warning", border: "border-warning/40", chip: "bg-warning/15 text-warning" },
];

function StorePage() {
  const { data: profile } = useProfile();
  const { data: packages = [], isLoading } = usePackages();
  const { data: purchases = [] } = usePurchases();
  const purchase = usePurchasePackage();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const balance = profile?.dm_balance ?? 0;

  const handleBuy = async (pkg: DMPackage) => {
    setPendingId(pkg.id);
    try {
      const res = await purchase.mutateAsync(pkg.id);
      toast.success(`+${compactNumber(res.quantity)} DMs adicionadas`, {
        description: `Pacote ${pkg.name} liberado · R$ ${Number(pkg.price_brl).toFixed(2).replace(".", ",")}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao processar compra");
    } finally {
      setPendingId(null);
    }
  };

  const totalBought = useMemo(() => purchases.reduce((a, p) => a + p.quantity, 0), [purchases]);
  const totalSpent = useMemo(() => purchases.reduce((a, p) => a + Number(p.price_brl), 0), [purchases]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Loja de DMs</span>
        </div>
        <h1 className="mt-1 font-display text-[26px] font-bold tracking-tight md:text-[32px]">Compre pacotes de disparos</h1>
        <p className="text-[13px] text-muted-foreground">Cada DM enviada do seu painel consome 1 crédito. Sem mensalidade. Sem assinatura.</p>
      </div>

      {/* Balance summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="tile relative overflow-hidden p-5 sm:col-span-1">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary/30 to-cyan/20 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo de DMs</p>
            <p className="mt-1 font-display text-4xl font-bold tabular text-gradient-primary">{compactNumber(balance)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{balance.toLocaleString("pt-BR")} disparos disponíveis</p>
          </div>
        </div>
        <div className="tile p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DMs adquiridas</p>
          <p className="mt-1 font-display text-3xl font-bold tabular">{compactNumber(totalBought)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{purchases.length} compras realizadas</p>
        </div>
        <div className="tile p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Investimento total</p>
          <p className="mt-1 font-display text-3xl font-bold tabular text-gradient-mint">{currency(totalSpent)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">acumulado em todas as compras</p>
        </div>
      </div>

      {/* Packages grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Pacotes disponíveis</h2>
          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> liberação imediata após confirmação
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando pacotes…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((pkg, i) => {
              const theme = TIER_THEMES[i % TIER_THEMES.length];
              const pricePerDm = Number(pkg.price_brl) / pkg.quantity;
              const isLoading = purchase.isPending && pendingId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "tile group relative overflow-hidden p-5 transition hover:scale-[1.015]",
                    pkg.featured && "ring-1 ring-primary/40",
                    pkg.featured && theme.glow,
                  )}
                >
                  <div className={cn("pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br blur-3xl opacity-70 group-hover:opacity-100 transition-opacity", theme.gradient)} />
                  {pkg.featured && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white">
                      <Sparkles className="h-2.5 w-2.5" /> popular
                    </span>
                  )}
                  <div className="relative">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", theme.chip)}>
                      <Package className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{pkg.name}</p>
                    <p className={cn("font-display text-4xl font-bold tabular leading-none", theme.accent)}>{compactNumber(pkg.quantity)}</p>
                    <p className="text-[11px] text-muted-foreground">DMs garantidas</p>

                    <div className="my-4 h-px bg-border/50" />

                    <p className="font-display text-2xl font-bold tabular">
                      R$ {Number(pkg.price_brl).toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-[10.5px] tabular text-muted-foreground">
                      ≈ R$ {pricePerDm.toFixed(3).replace(".", ",")} por DM
                    </p>

                    <ul className="mt-3 space-y-1 text-[11px]">
                      <Feat>Distribuição inteligente</Feat>
                      <Feat>Relatório em tempo real</Feat>
                      <Feat>Sem prazo para usar</Feat>
                    </ul>

                    <button
                      onClick={() => handleBuy(pkg)}
                      disabled={isLoading || purchase.isPending}
                      className={cn(
                        "mt-4 w-full rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-all disabled:opacity-50",
                        pkg.featured
                          ? "gradient-primary text-white glow-primary hover:brightness-110"
                          : cn("border bg-surface-1/60 hover:bg-surface-2", theme.border, theme.accent),
                      )}
                    >
                      {isLoading ? "Processando…" : <span className="inline-flex items-center justify-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Comprar agora</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="tile flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Info className="h-4 w-4" />
        </div>
        <div className="text-[12px] leading-relaxed">
          <p className="font-semibold">Como funciona?</p>
          <p className="text-muted-foreground">
            Após a compra, o saldo de DMs cai imediatamente na sua conta. Você cria campanhas no painel definindo
            quanto desse saldo quer usar em cada uma. Cada disparo bem-sucedido consome 1 DM. Sem dinheiro envolvido — só DMs.
          </p>
        </div>
      </div>

      {/* Purchase history */}
      <div className="tile overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-base font-bold">Histórico de compras</h2>
          </div>
          <span className="text-[10.5px] text-muted-foreground">{purchases.length} {purchases.length === 1 ? "registro" : "registros"}</span>
        </div>

        {purchases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold">Nenhuma compra ainda</p>
            <p className="text-[11px] text-muted-foreground">Suas aquisições de pacotes aparecerão aqui.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3.5 transition hover:bg-surface-1/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                  <Package className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">Pacote {p.package_name}</p>
                  <p className="text-[10.5px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · #{p.id.slice(0, 6)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold tabular text-success">+ {dms(p.quantity)}</p>
                  <p className="text-[10.5px] tabular text-muted-foreground">{currency(Number(p.price_brl))}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5 text-muted-foreground">
      <Check className="h-3 w-3 shrink-0 text-success" /> {children}
    </li>
  );
}
