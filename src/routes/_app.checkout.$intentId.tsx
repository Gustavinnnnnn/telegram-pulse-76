import { createFileRoute, useParams, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Check, ShieldCheck, Clock, ArrowLeft, Loader2, Package, Sparkles, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { getCheckoutStatus } from "@/lib/paradise.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { compactNumber, currency } from "@/lib/format";
import { Logo, Wordmark } from "@/components/Logo";

export const Route = createFileRoute("/_app/checkout/$intentId")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { intentId } = useParams({ from: "/_app/checkout/$intentId" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getCheckoutStatus);
  const [copied, setCopied] = useState(false);
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const { data: intent, isLoading } = useQuery({
    queryKey: ["intent", intentId],
    queryFn: () => fetchStatus({ data: { intent_id: intentId } }),
    refetchInterval: (q) => (q.state.data && (q.state.data as any).status === "pending" ? 4000 : false),
  });

  // Countdown
  useEffect(() => {
    if (!intent?.expires_at) return;
    const target = new Date(intent.expires_at).getTime();
    const tick = () => setSecsLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const int = setInterval(tick, 1000);
    return () => clearInterval(int);
  }, [intent?.expires_at]);

  // Generate QR locally as fallback / always (more reliable than provider base64)
  useEffect(() => {
    if (!intent?.qr_code) { setQrDataUrl(null); return; }
    let cancelled = false;
    QRCode.toDataURL(intent.qr_code, { width: 320, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [intent?.qr_code]);

  // Approved → redirect
  useEffect(() => {
    if (intent?.status === "approved") {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Pagamento confirmado!", { description: `+${(intent.quantity ?? 0).toLocaleString("pt-BR")} DMs creditadas` });
      const t = setTimeout(() => navigate({ to: "/dashboard" }), 1800);
      return () => clearTimeout(t);
    }
  }, [intent?.status]);

  const copy = async () => {
    if (!intent?.qr_code) return;
    await navigator.clipboard.writeText(intent.qr_code);
    setCopied(true);
    toast.success("Código PIX copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !intent) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const mins = secsLeft != null ? Math.floor(secsLeft / 60) : null;
  const secs = secsLeft != null ? secsLeft % 60 : null;
  const expired = secsLeft === 0;
  const approved = intent.status === "approved";
  const failed = ["failed", "refunded", "chargeback"].includes(intent.status);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button onClick={() => navigate({ to: "/store" })} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar à loja
      </button>

      <div className="tile relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/30 via-cyan/20 to-transparent blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <Wordmark />
            <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">checkout seguro</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10.5px] font-bold text-success">
            <ShieldCheck className="h-3 w-3" /> PIX · Paradise Pay
          </span>
        </div>

        <div className="relative mt-5 grid gap-5 md:grid-cols-2">
          {/* Left — package summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Pedido
            </div>
            <div className="rounded-2xl border border-border/40 bg-surface-1/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-white">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pacote</p>
                  <p className="font-display text-lg font-bold truncate">{intent.package_name}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DMs</p>
                  <p className="font-display text-xl font-bold tabular text-gradient-primary">{compactNumber(intent.quantity)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="font-display text-xl font-bold tabular">{currency(intent.amount_cents / 100)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-surface-1/40 p-3 text-[12px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pagador</p>
              <p className="mt-0.5 font-semibold truncate">{intent.customer_name}</p>
              <p className="text-muted-foreground truncate">{intent.customer_email}</p>
            </div>

            {!approved && !failed && !expired && secsLeft !== null && (
              <div className="flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-[11.5px] text-warning">
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> QR expira em</span>
                <span className="font-mono font-bold tabular">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
              </div>
            )}
          </div>

          {/* Right — QR / status */}
          <div className="space-y-3">
            {approved ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white animate-[scale-in_0.3s_ease-out]">
                  <Check className="h-7 w-7" />
                </div>
                <p className="font-display text-lg font-bold text-success">Pagamento aprovado!</p>
                <p className="text-[12px] text-muted-foreground">{compactNumber(intent.quantity)} DMs creditadas. Redirecionando…</p>
              </div>
            ) : failed ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
                <p className="font-bold text-destructive">Pagamento {intent.status}</p>
                <Link to="/store" className="mt-3 inline-block rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white">Tentar novamente</Link>
              </div>
            ) : expired ? (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center">
                <p className="font-bold text-warning">QR Code expirado</p>
                <Link to="/store" className="mt-3 inline-block rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white">Gerar novo</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <QrCode className="h-3 w-3" /> Aponte a câmera ou copie o código
                </div>
                <div className="flex justify-center rounded-2xl border border-border/40 bg-white p-4">
                  {qrDataUrl || intent.qr_code_base64 ? (
                    <img src={qrDataUrl || intent.qr_code_base64!} alt="QR Code PIX" className="h-56 w-56" />
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={copy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-[13px] font-semibold text-white transition hover:brightness-110 glow-primary"
                >
                  {copied ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar código PIX</>}
                </button>
                <p className="rounded-lg border border-border/40 bg-surface-1/60 p-2.5 font-mono text-[10.5px] break-all leading-relaxed text-muted-foreground">
                  {intent.qr_code}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Aguardando confirmação automática…
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[10.5px] text-muted-foreground">
        Pagamento processado por Paradise Pay · liberação imediata após confirmação bancária
      </p>
    </div>
  );
}
