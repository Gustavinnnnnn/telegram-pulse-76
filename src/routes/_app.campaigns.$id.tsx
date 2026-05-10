import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Eye, MousePointerClick, TrendingUp, Users, Target, MessageCircle,
  Ban, CheckCircle2, AlertTriangle, Activity, Wallet, Send, Pause, Play,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Cell, PieChart, Pie,
} from "recharts";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import {
  useCampaigns, objectiveLabels, nicheLabels, statusLabels, useUpdateCampaignStatus,
} from "@/lib/queries";
import { generateMetrics, statusColor, statusLabelRecipient } from "@/lib/fake-metrics";

export const Route = createFileRoute("/_app/campaigns/$id")({
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { id } = useParams({ from: "/_app/campaigns/$id" });
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading } = useCampaigns();
  const campaign = campaigns.find((c) => c.id === id);
  const updateStatus = useUpdateCampaignStatus();
  const [tab, setTab] = useState<"overview" | "delivery" | "audience" | "recipients">("overview");

  const metrics = useMemo(() => (campaign ? generateMetrics(campaign) : null), [campaign]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!campaign || !metrics) {
    return (
      <div className="card-elevated p-8 text-center">
        <p className="text-sm">Campanha não encontrada</p>
        <Link to="/campaigns" className="mt-3 inline-block text-sm font-semibold text-primary">Voltar</Link>
      </div>
    );
  }

  const m = metrics;
  const isActive = campaign.status === "active";
  const isDraft = campaign.status === "draft";

  const handleToggle = async () => {
    const next = isActive ? "paused" : "active";
    try {
      await updateStatus.mutateAsync({ id: campaign.id, status: next });
      toast.success(next === "active" ? "Campanha ativada" : "Campanha pausada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const PIE_COLORS = ["oklch(0.7 0.16 155)", "oklch(0.68 0.14 230)", "oklch(0.62 0.22 25)", "oklch(0.68 0.02 240)"];
  const deliveryPie = [
    { name: "Entregues", value: m.dmsReceived },
    { name: "Respondidas", value: Math.floor(m.dmsReceived * 0.18) },
    { name: "Bloqueadas", value: m.dmsBlocked },
    { name: "Não entregues", value: m.dmsNotReceived },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/campaigns" })}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold md:text-2xl">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {objectiveLabels[campaign.objective]} · {nicheLabels[campaign.niche]} · Criada em {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        {!isDraft && (
          <button
            onClick={handleToggle}
            disabled={updateStatus.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:border-primary disabled:opacity-50"
          >
            {isActive ? <><Pause className="h-3.5 w-3.5" /> Pausar</> : <><Play className="h-3.5 w-3.5" /> Ativar</>}
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Impressões" value={m.impressions.toLocaleString("pt-BR")} icon={Eye} />
        <StatCard label="Alcance" value={m.reach.toLocaleString("pt-BR")} icon={Users} />
        <StatCard label="Cliques" value={m.clicks.toLocaleString("pt-BR")} icon={MousePointerClick} />
        <StatCard label="CTR" value={`${m.ctr}%`} icon={TrendingUp} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Conversões" value={m.conversions.toLocaleString("pt-BR")} icon={Target} />
        <StatCard label="CPC" value={`R$ ${m.cpc.toFixed(2)}`} icon={Activity} />
        <StatCard label="CPM" value={`R$ ${m.cpm.toFixed(2)}`} icon={TrendingUp} />
        <StatCard label="Investido" value={`R$ ${m.spent.toFixed(2)}`} icon={Wallet} />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {[
          { k: "overview", label: "Visão geral" },
          { k: "delivery", label: "Entrega" },
          { k: "audience", label: "Público" },
          { k: "recipients", label: "Destinatários" },
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
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card-elevated p-5 lg:col-span-2">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-base font-bold">Desempenho — últimas 24h</h2>
                  <p className="text-xs text-muted-foreground">Impressões e cliques por hora</p>
                </div>
                <div className="flex gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Impressões</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Cliques</span>
                </div>
              </div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.hourly}>
                    <defs>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.68 0.14 230)" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="oklch(0.68 0.14 230)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="oklch(0.7 0.16 155)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 240)" />
                    <XAxis dataKey="hour" stroke="oklch(0.68 0.02 240)" fontSize={11} />
                    <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.23 0.025 240)", border: "1px solid oklch(0.3 0.02 240)", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="impressions" stroke="oklch(0.68 0.14 230)" strokeWidth={2} fill="url(#ga)" />
                    <Area type="monotone" dataKey="clicks" stroke="oklch(0.7 0.16 155)" strokeWidth={2} fill="url(#gb)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-elevated p-5">
              <h2 className="text-base font-bold">Qualidade da entrega</h2>
              <div className="mt-4 space-y-4">
                <Quality label="Taxa de aprovação" value={m.approvalRate} icon={CheckCircle2} color="text-success" />
                <Quality label="Qualidade do público" value={m.audienceQuality} icon={Users} color="text-primary" />
                <Quality label="Frequência (impr/usuário)" value={m.frequency} suffix="x" icon={Activity} color="text-warning" />
              </div>
              <div className="mt-5 rounded-xl bg-background/40 p-4">
                <p className="text-[11px] uppercase text-muted-foreground">Custo por conversão</p>
                <p className="mt-1 text-2xl font-bold text-gradient-primary">R$ {m.costPerConversion.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">{m.conversions} conversões realizadas</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-5">
            <h2 className="text-base font-bold">Investimento por dia (últimos 7 dias)</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 240)" />
                  <XAxis dataKey="day" stroke="oklch(0.68 0.02 240)" fontSize={11} />
                  <YAxis stroke="oklch(0.68 0.02 240)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.23 0.025 240)", border: "1px solid oklch(0.3 0.02 240)", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Gasto"]}
                  />
                  <Bar dataKey="spent" fill="oklch(0.68 0.14 230)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <CreativePreview campaign={campaign} />
        </>
      )}

      {tab === "delivery" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DeliveryCard label="DMs enviadas" value={m.dmsSent} icon={Send} color="text-primary" />
            <DeliveryCard label="DMs entregues" value={m.dmsReceived} icon={CheckCircle2} color="text-success" />
            <DeliveryCard label="Bloqueadas" value={m.dmsBlocked} icon={Ban} color="text-destructive" />
            <DeliveryCard label="Não entregues" value={m.dmsNotReceived} icon={AlertTriangle} color="text-warning" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-elevated p-5">
              <h2 className="text-base font-bold">Distribuição da entrega</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deliveryPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {deliveryPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.23 0.025 240)", border: "1px solid oklch(0.3 0.02 240)", borderRadius: "12px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {deliveryPie.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-semibold">{d.value.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated p-5">
              <h2 className="text-base font-bold">Top canais</h2>
              <p className="text-xs text-muted-foreground">Onde sua campanha mais performou</p>
              <ul className="mt-4 space-y-3">
                {m.channels.map((ch) => (
                  <li key={ch.name} className="rounded-xl border border-border bg-background/40 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold">{ch.name}</p>
                      <span className="text-xs text-muted-foreground">{ch.clicks} cliques</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full gradient-primary"
                        style={{ width: `${Math.min(100, (ch.impressions / Math.max(...m.channels.map(c => c.impressions), 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{ch.impressions.toLocaleString("pt-BR")} impressões</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {tab === "audience" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card-elevated p-5">
            <h2 className="text-base font-bold">Faixa etária</h2>
            <div className="mt-4 space-y-3">
              {m.demographics.map((d) => (
                <div key={d.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{d.label} anos</span>
                    <span className="font-semibold">{d.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full gradient-primary" style={{ width: `${d.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card-elevated p-5">
            <h2 className="text-base font-bold">Dispositivo</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.devices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 240)" />
                  <XAxis type="number" stroke="oklch(0.68 0.02 240)" fontSize={11} />
                  <YAxis dataKey="label" type="category" stroke="oklch(0.68 0.02 240)" fontSize={11} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.23 0.025 240)", border: "1px solid oklch(0.3 0.02 240)", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v: number) => [`${v}%`, "Share"]}
                  />
                  <Bar dataKey="value" fill="oklch(0.7 0.16 155)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "recipients" && (
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Quem recebeu sua mensagem</h2>
              <p className="text-xs text-muted-foreground">Últimos {m.recipients.length} usuários alcançados (atualização ao vivo)</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> ao vivo
            </span>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {m.recipients.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-lg">
                  {r.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{r.username} · {r.time}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusColor[r.status]}`}>
                  {r.status === "received" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {r.status === "replied" && <MessageCircle className="h-3.5 w-3.5" />}
                  {r.status === "blocked" && <Ban className="h-3.5 w-3.5" />}
                  {r.status === "not_received" && <AlertTriangle className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{statusLabelRecipient[r.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusLabelText({ status }: { status: string }) {
  return <span>{statusLabels[status as keyof typeof statusLabels] ?? status}</span>;
}

function Quality({ label, value, suffix = "%", icon: Icon, color }: { label: string; value: number; suffix?: string; icon: typeof CheckCircle2; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
        </span>
        <span className="text-sm font-bold">{value}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full gradient-primary" style={{ width: `${Math.min(100, suffix === "x" ? value * 25 : value)}%` }} />
      </div>
    </div>
  );
}

function DeliveryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Send; color: string }) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function CreativePreview({ campaign }: { campaign: ReturnType<typeof useCampaigns>["data"] extends (infer U)[] | undefined ? U : never }) {
  return (
    <div className="card-elevated p-5">
      <h2 className="text-base font-bold">Pré-visualização do anúncio</h2>
      <p className="text-xs text-muted-foreground">Como ele aparece no Telegram</p>
      <div className="mt-4 mx-auto max-w-sm rounded-2xl bg-[oklch(0.16_0.02_240)] p-4 shadow-2xl">
        <div className="rounded-xl bg-[oklch(0.22_0.025_240)] p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
              <Send className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Patrocinado</p>
              <p className="text-[10px] text-muted-foreground">via TeleAds</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold">{campaign.text || "Sua chamada principal aparece aqui"}</p>
          {campaign.description && <p className="mt-1 text-xs text-muted-foreground">{campaign.description}</p>}
          {campaign.button_label && (
            <button className="mt-3 w-full rounded-lg gradient-primary py-2 text-xs font-semibold text-primary-foreground">
              {campaign.button_label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

void StatusLabelText;
