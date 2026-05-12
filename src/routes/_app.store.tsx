import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Package, Zap, ShieldCheck, Sparkles, Receipt, Check, Clock, Info, X, Loader2, Copy, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useProfile, usePackages, usePurchases, type DMPackage } from "@/lib/queries";
import { compactNumber, currency, dms } from "@/lib/format";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/store")({
  component: StorePage,
});

const TIER_THEMES = [
  { gradient: "from-primary/30 via-primary/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.69_0.15_230_/_0.6)]", accent: "text-primary", border: "border-primary/30", chip: "bg-primary/15 text-primary" },
  { gradient: "from-cyan/35 via-cyan/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.84_0.16_178_/_0.6)]", accent: "text-cyan", border: "border-cyan/40", chip: "bg-cyan/15 text-cyan" },
  { gradient: "from-fuchsia-500/30 via-fuchsia-500/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.7_0.22_330_/_0.6)]", accent: "text-magenta", border: "border-fuchsia-500/30", chip: "bg-fuchsia-500/15 text-magenta" },
  { gradient: "from-warning/35 via-warning/10 to-transparent", glow: "shadow-[0_20px_60px_-30px_oklch(0.78_0.17_60_/_0.6)]", accent: "text-warning", border: "border-warning/40", chip: "bg-warning/15 text-warning" },
];

type PixIntent = {
  intent_id: string;
  reference: string;
  qr_code: string;
  qr_code_base64: string | null;
  amount_cents: number;
  expires_at: string | null;
};

function StorePage() {
  const { data: profile } = useProfile();
  const { data: packages = [], isLoading } = usePackages();
  const { data: purchases = [] } = usePurchases();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<DMPackage | null>(null);
  const [form, setForm] = useState({ name: "", email: "", document: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [pix, setPix] = useState<PixIntent | null>(null);
  const [pixStatus, setPixStatus] = useState<"pending" | "approved" | "failed" | string>("pending");
  const pollRef = useRef<number | null>(null);

  const balance = profile?.dm_balance ?? 0;
  const totalBought = useMemo(() => purchases.reduce((a, p) => a + p.quantity, 0), [purchases]);
  const totalSpent = useMemo(() => purchases.reduce((a, p) => a + Number(p.price_brl), 0), [purchases]);

  // Prefill form with user info
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setForm((f) => ({
          ...f,
          email: f.email || user.email || "",
          name: f.name || (user.user_metadata?.display_name as string) || "",
        }));
      }
    })();
  }, []);

  const closeModal = () => {
    setSelected(null);
    setPix(null);
    setPixStatus("pending");
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const generatePix = async () => {
    if (!selected) return;
    if (!form.name || !form.email || !form.document || !form.phone) {
      toast.error("Preencha todos os dados para gerar o PIX");
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada"); setCreating(false); return; }
      const res = await fetch("/api/public/paradise-create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ package_id: selected.id, customer: form }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Falha ao gerar PIX");
        setCreating(false);
        return;
      }
      setPix(json as PixIntent);
      setPixStatus("pending");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar PIX");
    } finally {
      setCreating(false);
    }
  };

  // Poll status while modal open with PIX
  useEffect(() => {
    if (!pix || pixStatus === "approved") return;
    const tick = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const r = await fetch(`/api/public/paradise-status?reference=${encodeURIComponent(pix.reference)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const j = await r.json();
        if (j?.status) {
          setPixStatus(j.status);
          if (j.status === "approved") {
            qc.invalidateQueries({ queryKey: ["profile"] });
            qc.invalidateQueries({ queryKey: ["purchases"] });
            toast.success("Pagamento confirmado! DMs creditadas.");
          }
        }
      } catch {}
    };
    tick();
    pollRef.current = window.setInterval(tick, 4000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [pix, pixStatus, qc]);

  const copyPix = async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.qr_code);
      toast.success("Código PIX copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Loja de DMs</span>
        </div>
        <h1 className="mt-1 font-display text-[22px] font-bold tracking-tight sm:text-[28px] md:text-[32px]">Compre pacotes de disparos</h1>
        <p className="text-[12.5px] text-muted-foreground">Pagamento via PIX. Saldo creditado automaticamente após confirmação.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="tile relative overflow-hidden p-4 sm:p-5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary/30 to-cyan/20 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo de DMs</p>
            <p className="mt-1 font-display text-3xl sm:text-4xl font-bold tabular text-gradient-primary">{compactNumber(balance)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{balance.toLocaleString("pt-BR")} disparos disponíveis</p>
          </div>
        </div>
        <div className="tile p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DMs adquiridas</p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold tabular">{compactNumber(totalBought)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{purchases.length} compras realizadas</p>
        </div>
        <div className="tile p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Investimento total</p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-bold tabular text-gradient-mint">{currency(totalSpent)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">acumulado em todas as compras</p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Pacotes disponíveis</h2>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> liberação após PIX
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando pacotes…</p>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((pkg, i) => {
              const theme = TIER_THEMES[i % TIER_THEMES.length];
              const pricePerDm = Number(pkg.price_brl) / pkg.quantity;
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "tile group relative overflow-hidden p-4 sm:p-5 transition hover:scale-[1.015]",
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
                    <p className={cn("font-display text-3xl sm:text-4xl font-bold tabular leading-none", theme.accent)}>{compactNumber(pkg.quantity)}</p>
                    <p className="text-[11px] text-muted-foreground">DMs garantidas</p>

                    <div className="my-4 h-px bg-border/50" />

                    <p className="font-display text-2xl font-bold tabular">{currency(Number(pkg.price_brl))}</p>
                    <p className="text-[10.5px] tabular text-muted-foreground">≈ {currency(pricePerDm)} por DM</p>

                    <ul className="mt-3 space-y-1 text-[11px]">
                      <Feat>Distribuição inteligente</Feat>
                      <Feat>Relatório em tempo real</Feat>
                      <Feat>Sem prazo para usar</Feat>
                    </ul>

                    <button
                      onClick={() => { setSelected(pkg); setPix(null); setPixStatus("pending"); }}
                      className={cn(
                        "mt-4 w-full rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-all",
                        pkg.featured
                          ? "gradient-primary text-white glow-primary hover:brightness-110"
                          : cn("border bg-surface-1/60 hover:bg-surface-2", theme.border, theme.accent),
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Comprar com PIX</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="tile flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Info className="h-4 w-4" />
        </div>
        <div className="text-[12px] leading-relaxed">
          <p className="font-semibold">Como funciona?</p>
          <p className="text-muted-foreground">Selecione o pacote, preencha seus dados e gere o PIX. Após pagar, suas DMs entram no saldo automaticamente.</p>
        </div>
      </div>

      <div className="tile overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 p-4">
          <div className="flex items-center gap-2 min-w-0">
            <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
            <h2 className="font-display text-base font-bold truncate">Histórico de compras</h2>
          </div>
          <span className="text-[10.5px] text-muted-foreground shrink-0">{purchases.length} {purchases.length === 1 ? "registro" : "registros"}</span>
        </div>

        {purchases.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Clock className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-semibold">Nenhuma compra ainda</p>
            <p className="text-[11px] text-muted-foreground">Suas aquisições de pacotes aparecerão aqui.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold truncate">Pacote {p.package_name}</p>
                  <p className="text-[10.5px] text-muted-foreground truncate">
                    {new Date(p.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · #{p.id.slice(0, 6)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-sm sm:text-base font-bold tabular text-success">+ {dms(p.quantity)}</p>
                  <p className="text-[10.5px] tabular text-muted-foreground">{currency(Number(p.price_brl))}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checkout modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border/60 bg-surface-1 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{pix ? "Pagamento PIX" : "Checkout"}</p>
                <h3 className="mt-0.5 font-display text-lg font-bold truncate">{selected.name} · {compactNumber(selected.quantity)} DMs</h3>
                <p className="text-[12px] text-muted-foreground">{currency(Number(selected.price_brl))}</p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!pix ? (
              <div className="mt-4 space-y-3">
                <Field label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Seu nome" />
                <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="voce@email.com" />
                <Field label="CPF" value={form.document} onChange={(v) => setForm({ ...form, document: v.replace(/\D/g, "").slice(0, 14) })} placeholder="000.000.000-00" inputMode="numeric" />
                <Field label="Telefone (DDD + número)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "").slice(0, 13) })} placeholder="11999999999" inputMode="numeric" />

                <button
                  onClick={generatePix}
                  disabled={creating}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-[13px] font-semibold text-white transition hover:brightness-110 glow-primary disabled:opacity-50"
                >
                  {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando PIX…</> : <><QrCode className="h-4 w-4" /> Gerar PIX</>}
                </button>
                <p className="text-center text-[10.5px] text-muted-foreground">
                  <ShieldCheck className="inline h-3 w-3 mr-1" /> Pagamento processado com segurança
                </p>
              </div>
            ) : pixStatus === "approved" ? (
              <div className="mt-6 flex flex-col items-center text-center gap-3 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h4 className="font-display text-lg font-bold">Pagamento confirmado!</h4>
                <p className="text-[12.5px] text-muted-foreground">{dms(selected.quantity)} foram creditadas no seu saldo.</p>
                <button onClick={closeModal} className="mt-3 w-full rounded-xl gradient-primary px-4 py-3 text-[13px] font-semibold text-white">
                  Fechar
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-border/40 bg-white p-3 flex items-center justify-center">
                  {pix.qr_code_base64 ? (
                    <img src={pix.qr_code_base64} alt="QR Code PIX" className="h-56 w-56 object-contain" />
                  ) : (
                    <div className="h-56 w-56 flex items-center justify-center text-xs text-black/60">
                      QR não disponível, use o código abaixo
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1">PIX Copia e Cola</p>
                  <div className="flex items-stretch gap-2">
                    <div className="flex-1 min-w-0 rounded-lg border border-border/40 bg-surface-2/40 p-2 text-[10.5px] font-mono break-all max-h-20 overflow-y-auto">
                      {pix.qr_code}
                    </div>
                    <button onClick={copyPix} className="shrink-0 rounded-lg border border-border/40 bg-surface-2 px-3 text-xs font-semibold hover:bg-surface-1 inline-flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Aguardando pagamento…
                </div>
                <p className="text-center text-[10.5px] text-muted-foreground">
                  Status: <span className="font-semibold">{pixStatus}</span> · ref {pix.reference.slice(-6)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", inputMode }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: "numeric" | "text" | "email" }) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/40 bg-surface-2/40 px-3 py-2 text-[13px] outline-none focus:border-primary/60"
      />
    </label>
  );
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5 text-muted-foreground">
      <Check className="h-3 w-3 shrink-0 text-success" /> {children}
    </li>
  );
}
