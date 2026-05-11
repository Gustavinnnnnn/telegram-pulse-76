import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Upload, Target, MousePointerClick, Users, Sparkles, Zap,
  Image as ImageIcon, Eye, X, Loader2, Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateCampaign, useProfile, nicheLabels } from "@/lib/queries";
import { TelegramAdPreview } from "@/components/TelegramAdPreview";
import { StepperVertical } from "@/components/StepperVertical";
import { compactNumber } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Objective = Database["public"]["Enums"]["campaign_objective"];
type Niche = Database["public"]["Enums"]["campaign_niche"];

export const Route = createFileRoute("/_app/campaigns/new")({
  component: NewCampaignPage,
});

const STEPS = [
  { id: "ident", title: "Identificação", subtitle: "Nome interno" },
  { id: "obj", title: "Objetivo", subtitle: "O que você quer?" },
  { id: "creative", title: "Criativo", subtitle: "Texto e mídia" },
  { id: "cta", title: "Chamada para ação", subtitle: "Botão e link" },
  { id: "delivery", title: "Disparo", subtitle: "Público e volume" },
];

const objectives: { id: Objective; label: string; description: string; icon: typeof Target; color: string }[] = [
  { id: "traffic", label: "Tráfego", description: "Levar usuários a um link externo", icon: MousePointerClick, color: "from-primary/30 to-primary/0" },
  { id: "conversion", label: "Conversão", description: "Direcionar para o seu bot do Telegram", icon: Target, color: "from-cyan/30 to-cyan/0" },
  { id: "engagement", label: "Engajamento", description: "Aumentar membros do seu canal/grupo", icon: Users, color: "from-warning/30 to-warning/0" },
];

const QUICK_VOLUMES = [100, 250, 500, 1000];

function NewCampaignPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const createCampaign = useCreateCampaign();
  const balance = Number(profile?.dm_balance ?? 0);

  const [current, setCurrent] = useState(0);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<Objective>("conversion");
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [buttonLabel, setButtonLabel] = useState("Saiba mais");
  const [buttonUrl, setButtonUrl] = useState("");
  const [niche, setNiche] = useState<Niche>("income");
  const [dmTotal, setDmTotal] = useState(Math.min(250, Math.max(100, balance)));
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const ctrEst = 8;
  const reachEst = Math.floor(dmTotal * 0.88);
  const clicksEst = Math.floor(reachEst * (ctrEst / 100));

  const next = () => setCurrent((c) => Math.min(STEPS.length - 1, c + 1));
  const prev = () => setCurrent((c) => Math.max(0, c - 1));

  const validateStep = (i: number) => {
    if (i === 0 && !name.trim()) return "Dê um nome para sua campanha";
    if (i === 2 && !text.trim()) return "Escreva o texto principal do anúncio";
    if (i === 3 && (!buttonLabel.trim() || !buttonUrl.trim())) return "Preencha o botão e o link";
    if (i === 4 && dmTotal < 100) return "Mínimo de 100 DMs por campanha";
    if (i === 4 && dmTotal > balance) return "Saldo insuficiente — compre mais DMs";
    return null;
  };

  const handleNext = () => {
    const err = validateStep(current);
    if (err) { toast.error(err); return; }
    if (current === STEPS.length - 1) handleSubmit();
    else next();
  };

  const handleUpload = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) { toast.error("Arquivo muito grande (máx. 8MB)"); return; }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("campaign-media").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("campaign-media").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
      toast.success("Imagem carregada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    try {
      await createCampaign.mutateAsync({
        name, objective, niche, text, description,
        button_label: buttonLabel, button_url: buttonUrl,
        dm_total: dmTotal, media_url: mediaUrl || null,
        status: "active",
      });
      toast.success("Campanha publicada!", { description: `"${name}" entrou na fila de disparo.` });
      navigate({ to: "/campaigns" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar campanha");
    }
  };

  const channelName = name || "Sua marca";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate({ to: "/campaigns" })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/60 px-2.5 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Saldo</span>
          <span className="font-display text-sm font-bold tabular text-gradient-primary">{balance.toLocaleString("pt-BR")} DMs</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Nova campanha</span>
        </div>
        <h1 className="mt-1 font-display text-[24px] font-bold tracking-tight md:text-[32px]">Crie seu disparo em 5 etapas</h1>
        <p className="text-[13px] text-muted-foreground">Pré-visualização ao vivo no Telegram à direita</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Stepper */}
        <aside className="tile h-fit p-3 lg:col-span-3 lg:sticky lg:top-[76px] order-1">
          <StepperVertical steps={STEPS} current={current} onJump={(i) => setCurrent(i)} />
        </aside>

        {/* Form */}
        <div className="order-3 lg:order-2 lg:col-span-5">
          <div className="tile p-4 sm:p-5 animate-[fade-in_0.3s_ease-out]" key={current}>
            {current === 0 && (
              <Section title="Identifique sua campanha" subtitle="Esse nome só aparece para você no painel.">
                <Field label="Nome da campanha *">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lançamento do bot — junho" autoFocus className={inputCls} />
                </Field>
                <p className="mt-3 text-[11px] text-muted-foreground">💡 Use um nome descritivo para encontrar facilmente depois.</p>
              </Section>
            )}

            {current === 1 && (
              <Section title="Qual seu objetivo?" subtitle="Vamos otimizar a entrega para você.">
                <div className="space-y-2">
                  {objectives.map((opt) => {
                    const active = objective === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button key={opt.id} type="button" onClick={() => setObjective(opt.id)}
                        className={cn(
                          "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3.5 text-left transition",
                          active ? "border-primary bg-primary/8 glow-primary" : "border-border/60 bg-surface-1/40 hover:border-primary/40",
                        )}
                      >
                        <div className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl transition", opt.color)} />
                        <div className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition", active ? "gradient-primary text-white" : "bg-surface-2 text-muted-foreground group-hover:text-foreground")}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <p className="text-[13px] font-bold">{opt.label}</p>
                          <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                        </div>
                        {active && <span className="relative h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {current === 2 && (
              <Section title="Crie o seu anúncio" subtitle="O conteúdo que aparecerá no Telegram.">
                {/* Image uploader */}
                <label className={cn(
                  "relative block cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition",
                  mediaUrl ? "border-primary/50 bg-primary/5" : "border-border/60 bg-surface-1/40 hover:border-primary/50",
                )}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                  />
                  {mediaUrl ? (
                    <div className="relative">
                      <img src={mediaUrl} alt="" className="mx-auto max-h-40 w-full rounded-lg object-cover" />
                      <button type="button" onClick={(e) => { e.preventDefault(); setMediaUrl(""); }} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="mt-2 text-[11px] text-muted-foreground">Clique para trocar a imagem</p>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                      </div>
                      <p className="mt-2 text-[12px] font-semibold">{uploading ? "Enviando…" : "Clique para enviar uma imagem"}</p>
                      <p className="text-[10.5px] text-muted-foreground">JPG, PNG ou WEBP — máx. 8MB</p>
                    </>
                  )}
                </label>

                <Field label={`Texto principal * (${text.length}/220)`}>
                  <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 220))} rows={4} placeholder="🚀 Conheça a forma mais rápida de…" className={inputCls} />
                </Field>
                <Field label="Descrição (opcional)">
                  <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 120))} rows={2} placeholder="Detalhe complementar curto" className={inputCls} />
                </Field>
              </Section>
            )}

            {current === 3 && (
              <Section title="Botão e destino" subtitle="Para onde os usuários vão ao clicar.">
                <Field label="Texto do botão *">
                  <div className="flex flex-wrap gap-1.5">
                    {["Saiba mais", "Acessar agora", "Quero participar", "Falar no bot", "Comprar"].map((s) => (
                      <button key={s} type="button" onClick={() => setButtonLabel(s)}
                        className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold transition", buttonLabel === s ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground")}>{s}</button>
                    ))}
                  </div>
                  <input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value.slice(0, 30))} className={cn(inputCls, "mt-2")} />
                </Field>
                <Field label="URL ou link Telegram *">
                  <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://t.me/seubot" className={inputCls} />
                </Field>
              </Section>
            )}

            {current === 4 && (
              <Section title="Para quem e quantos?" subtitle="Defina o nicho do público e o volume de DMs.">
                <Field label="Nicho do público">
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(nicheLabels) as Niche[]).map((n) => (
                      <button key={n} type="button" onClick={() => setNiche(n)}
                        className={cn("rounded-full border px-3 py-1.5 text-[11px] font-semibold transition", niche === n ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground")}>
                        {nicheLabels[n]}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Volume de DMs">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_VOLUMES.filter(v => v <= balance).map(v => (
                      <button key={v} type="button" onClick={() => setDmTotal(v)}
                        className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-bold tabular transition", dmTotal === v ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground")}>
                        {compactNumber(v)}
                      </button>
                    ))}
                    {balance >= 100 && (
                      <button type="button" onClick={() => setDmTotal(balance)}
                        className={cn("rounded-lg border px-2.5 py-1 text-[11px] font-bold tabular transition", dmTotal === balance ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground")}>
                        Tudo · {compactNumber(balance)}
                      </button>
                    )}
                  </div>
                  <input
                    type="range"
                    min={Math.min(100, balance)}
                    max={Math.max(100, balance)}
                    step={50}
                    value={dmTotal}
                    onChange={(e) => setDmTotal(parseInt(e.target.value))}
                    className="mt-3 w-full accent-[oklch(0.69_0.15_230)]"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>100 DMs</span>
                    <span className={cn("font-bold tabular", dmTotal > balance && "text-destructive")}>
                      {dmTotal.toLocaleString("pt-BR")} / {balance.toLocaleString("pt-BR")} DMs
                    </span>
                  </div>

                  {dmTotal > balance && (
                    <button type="button" onClick={() => navigate({ to: "/store" })}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[11.5px] font-semibold text-warning transition hover:bg-warning/15">
                      <Package className="h-3.5 w-3.5" /> Saldo insuficiente · Comprar mais DMs
                    </button>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/40 pt-3">
                    <Estimate label="Alcance estimado" value={compactNumber(reachEst)} />
                    <Estimate label="Cliques estimados" value={compactNumber(clicksEst)} accent="cyan" />
                    <Estimate label="CTR previsto" value={`${ctrEst}%`} accent="warning" />
                  </div>
                </Field>
              </Section>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" onClick={prev} disabled={current === 0} className="rounded-lg border border-border/60 bg-surface-1/60 px-3.5 py-2 text-[12px] font-semibold transition hover:bg-surface-2 disabled:opacity-30">← Voltar</button>
            <div className="flex flex-1 items-center justify-end gap-3">
              <span className="hidden sm:inline text-[10.5px] text-muted-foreground tabular">Etapa {current + 1} de {STEPS.length}</span>
              <button type="button" onClick={handleNext} disabled={createCampaign.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-[12.5px] font-semibold text-white transition hover:brightness-110 glow-primary disabled:opacity-50">
                {current === STEPS.length - 1
                  ? (createCampaign.isPending ? "Publicando…" : <><Zap className="h-3.5 w-3.5" /> Disparar campanha</>)
                  : <>Continuar <ArrowRight className="h-3.5 w-3.5" /></>}
              </button>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="order-2 lg:order-3 lg:col-span-4 lg:sticky lg:top-[76px] lg:h-fit">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Eye className="h-3 w-3" /> Pré-visualização ao vivo
          </div>
          <TelegramAdPreview
            channelName={channelName}
            channelHandle="@telegram_ads"
            text={text}
            description={description}
            buttonLabel={buttonLabel}
            mediaUrl={mediaUrl || undefined}
          />
          <div className="mt-3 rounded-xl border border-border/60 bg-surface-1/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resumo</p>
            <div className="mt-2 space-y-1 text-[11px]">
              <SummaryRow label="Objetivo" value={objectives.find((o) => o.id === objective)?.label ?? "-"} />
              <SummaryRow label="Nicho" value={nicheLabels[niche]} />
              <SummaryRow label="Volume" value={`${compactNumber(dmTotal)} DMs`} accent />
              <SummaryRow label="Alcance estimado" value={compactNumber(reachEst)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border/60 bg-surface-1/60 px-3 py-2 text-[13px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-[11.5px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-foreground/85">{label}</span>
      {children}
    </label>
  );
}

function Estimate({ label, value, accent = "primary" }: { label: string; value: string; accent?: "primary" | "cyan" | "warning" }) {
  const colorMap = { primary: "text-primary", cyan: "text-cyan", warning: "text-warning" };
  return (
    <div>
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-display text-base font-bold tabular", colorMap[accent])}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular", accent && "text-primary")}>{value}</span>
    </div>
  );
}
