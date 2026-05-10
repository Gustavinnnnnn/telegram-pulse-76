import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Target, MousePointerClick, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateCampaign, useProfile, nicheLabels } from "@/lib/queries";
import type { Database } from "@/integrations/supabase/types";

type Objective = Database["public"]["Enums"]["campaign_objective"];
type Niche = Database["public"]["Enums"]["campaign_niche"];

export const Route = createFileRoute("/_app/campaigns/new")({
  component: NewCampaignPage,
});

const objectives: { id: Objective; label: string; description: string; icon: typeof Target }[] = [
  { id: "traffic", label: "Tráfego", description: "Envie usuários para um link externo", icon: MousePointerClick },
  { id: "conversion", label: "Conversão", description: "Direcione para o seu bot Telegram", icon: Target },
  { id: "engagement", label: "Engajamento", description: "Aumente membros do seu grupo", icon: Users },
];

function NewCampaignPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const createCampaign = useCreateCampaign();
  const balance = Number(profile?.balance ?? 0);

  const [name, setName] = useState("");
  const [objective, setObjective] = useState<Objective>("conversion");
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [niche, setNiche] = useState<Niche>("income");
  const [budget, setBudget] = useState(50);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !text || !buttonLabel || !buttonUrl) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (budget > balance) {
      toast.error("Saldo insuficiente", { description: "Adicione créditos na carteira para criar essa campanha." });
      return;
    }
    try {
      await createCampaign.mutateAsync({
        name,
        objective,
        niche,
        text,
        description,
        button_label: buttonLabel,
        button_url: buttonUrl,
        budget,
        status: "active",
      });
      toast.success("Campanha criada!", { description: `"${name}" entrou na fila de distribuição.` });
      navigate({ to: "/campaigns" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar campanha");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate({ to: "/campaigns" })}
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Criar campanha</h1>
        <p className="text-sm text-muted-foreground">
          Saldo disponível: <span className="font-semibold text-primary">R$ {balance.toFixed(2)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card-elevated p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">1. Identificação</h2>
          <Field label="Nome da campanha *">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lançamento Bot" className={inputCls} />
          </Field>
        </section>

        <section className="card-elevated p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">2. Objetivo</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {objectives.map((opt) => {
              const active = objective === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setObjective(opt.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    active ? "border-primary bg-primary/10 glow-primary" : "border-border bg-background/40 hover:border-primary/40",
                  )}
                >
                  <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg", active ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-elevated p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">3. Criativo</h2>
          <div className="grid gap-4">
            <div className="rounded-xl border-2 border-dashed border-border p-6 text-center transition hover:border-primary/50">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">Arraste um vídeo ou imagem</p>
              <p className="text-xs text-muted-foreground">MP4, MOV, JPG ou PNG (em breve)</p>
            </div>
            <Field label="Texto principal *">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="🚀 Texto chamativo..." className={inputCls} />
            </Field>
            <Field label="Descrição">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descrição complementar (opcional)" className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="card-elevated p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">4. Botão de ação</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto do botão *">
              <input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder="Acessar agora" className={inputCls} />
            </Field>
            <Field label="URL ou link Telegram *">
              <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://t.me/seubot" className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="card-elevated p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">5. Segmentação & orçamento</h2>
          <Field label="Nicho">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(nicheLabels) as Niche[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNiche(n)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    niche === n ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {nicheLabels[n]}
                </button>
              ))}
            </div>
          </Field>
          <div className="mt-5">
            <Field label={`Orçamento — R$ ${budget.toFixed(2)}`}>
              <input
                type="range"
                min={10}
                max={Math.max(10, Math.floor(balance) || 1000)}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-[oklch(0.68_0.14_230)]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>R$ 10</span>
                <span>Saldo: R$ {balance.toFixed(2)}</span>
              </div>
            </Field>
          </div>
        </section>

        <div className="sticky bottom-20 z-10 flex flex-col-reverse gap-2 sm:bottom-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate({ to: "/campaigns" })}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createCampaign.isPending}
            className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:scale-[1.02] glow-primary disabled:opacity-50"
          >
            {createCampaign.isPending ? "Publicando..." : "Publicar campanha"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</span>
      {children}
    </label>
  );
}
