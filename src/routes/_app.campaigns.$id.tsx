import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Eye, MousePointerClick, TrendingUp, Users, Target, MessageCircle,
  Ban, CheckCircle2, AlertTriangle, Activity, Wallet, Send, Pause, Play, Copy, Trash2,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Cell, PieChart, Pie,
} from "recharts";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricTile } from "@/components/MetricTile";
import { TelegramAdPreview } from "@/components/TelegramAdPreview";
import { QualityScore } from "@/components/QualityScore";
import {
  useCampaigns, objectiveLabels, nicheLabels, useUpdateCampaignStatus,
} from "@/lib/queries";
import { generateMetrics, statusColor, statusLabelRecipient } from "@/lib/fake-metrics";
import { compactNumber, currency, gradientForName, shortId } from "@/lib/format";
import { cn } from "@/lib/utils";

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

  const m = useMemo(() => (campaign ? generateMetrics(campaign) : null), [campaign]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!campaign || !m) {
    return (
      <div className="tile p-8 text-center">
        <p className="text-sm">Campanha não encontrada</p>
        <Link to="/campaigns" className="mt-3 inline-block text-sm font-semibold text-primary">Voltar</Link>
      </div>
    );
  }

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

  const PIE_COLORS = ["oklch(0.78 0.18 158)", "oklch(0.69 0.15 230)", "oklch(0.66 0.22 22)", "oklch(0.62 0.02 235)"];
  const deliveryPie = [
    { name: "Entregues", value: m.dmsReceived },
    { name: "Respondidas", value: Math.floor(m.dmsReceived * 0.18) },
    { name: "Bloqueadas", value: m.dmsBlocked },
    { name: "Não entregues", value: m.dmsNotReceived },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate({ to: "/campaigns" })}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Campanhas
          </button>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-cyan/20 text-base font-bold text-primary">
              {campaign.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-bold md:text-2xl">{campaign.name}</h1>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="text-[11.5px] text-muted-foreground">
                {objectiveLabels[campaign.objective]} · {nicheLabels[campaign.niche]} · ID #{shortId(campaign.id)} · criada em {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {!isDraft && (
            <button
              onClick={handleToggle}
              disabled={updateStatus.isPending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold transition disabled:opacity-50",
                isActive
                  ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
                  : "border-success/40 bg-success/10 text-success hover:bg-success/20",
              )}
            >
              {isActive ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Ativar</>}
            </button>
          )}
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/60 px-3 py-1.5 text-[11.5px] font-semibold transition hover:bg-surface-2">
            <Copy className="h-3 w-3" /> Duplicar
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-destructive transition hover:bg-destructive/20">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Impressões" value={m.impressions} icon={Eye} delta={9.2} accent="primary" />
        <MetricTile label="Alcance" value={m.reach} icon={Users} delta={6.8} accent="cyan" />
        <MetricTile label="Cliques" value={m.clicks} icon={MousePointerClick} delta={14.1} accent="warning" />
        <MetricTile label="CTR" value={m.ctr} format="percent" icon={TrendingUp} accent="magenta" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Conversões" value={m.conversions} icon={Target} delta={23.4} accent="primary" />
        <MetricTile label="DMs enviadas" value={m.dmsSent} icon={Send} delta={11.2} accent="cyan" />
        <MetricTile label="Frequência" value={m.frequency} icon={Activity} accent="warning" />
        <MetricTile label="Restantes" value={m.dmsRemaining} icon={Wallet} accent="magenta" />
      </div>

      {/* DM progress hero */}
      <div className="tile p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progresso do disparo</p>
            <p className="font-display text-2xl sm:text-3xl font-bold tabular text-gradient-primary">
              {compactNumber(m.dmsSent)} <span className="text-base text-muted-foreground font-medium">/ {compactNumber(m.dmTotal)} DMs</span>
            </p>
          </div>
          <span className="font-display text-2xl font-bold tabular text-primary">{m.progressPct.toFixed(1)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-3/60">
          <div className="h-full gradient-primary transition-all duration-700" style={{ width: `${m.progressPct}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex gap-1 rounded-xl border border-border/60 bg-surface-1/60 p-1">
        {([
          { k: "overview", l: "Visão geral" },
          { k: "delivery", l: "Entrega" },
          { k: "audience", l: "Público" },
          { k: "recipients", l: "Destinatários" },
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
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="tile p-5 lg:col-span-8">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-display text-base font-bold">Performance — últimas 24h</h2>
                  <p className="text-[11px] text-muted-foreground">Impressões e cliques por hora</p>
                </div>
                <div className="flex gap-3 text-[10.5px]">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Impressões</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan" />Cliques</span>
                </div>
              </div>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.hourly} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.69 0.15 230)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="oklch(0.69 0.15 230)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.84 0.16 178)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.84 0.16 178)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="oklch(0.3 0.02 240 / 0.4)" />
                    <XAxis dataKey="hour" stroke="oklch(0.62 0.02 235)" fontSize={10} axisLine={false} tickLine={false} interval={2} />
                    <YAxis stroke="oklch(0.62 0.02 235)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => compactNumber(v)} />
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.235 0.026 236)", border: "1px solid oklch(0.38 0.025 234)", borderRadius: "12px", fontSize: "11px" }} />
                    <Area type="monotone" dataKey="impressions" stroke="oklch(0.69 0.15 230)" strokeWidth={2} fill="url(#ga)" />
                    <Area type="monotone" dataKey="clicks" stroke="oklch(0.84 0.16 178)" strokeWidth={2} fill="url(#gb)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="tile p-5 lg:col-span-4">
              <h2 className="font-display text-base font-bold">Qualidade</h2>
              <p className="text-[11px] text-muted-foreground">Indicadores de entrega</p>
              <div className="mt-3 flex items-center justify-around">
                <div className="text-center">
                  <QualityScore value={m.approvalRate} label="aprovação" />
                </div>
                <div className="text-center">
                  <QualityScore value={m.audienceQuality} label="público" />
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-border/40 bg-surface-1/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conversões</p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular text-gradient-mint">{compactNumber(m.conversions)}</p>
                <p className="text-[10.5px] text-muted-foreground">cliques que viraram ação</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="tile p-5 lg:col-span-7">
              <h2 className="font-display text-base font-bold">DMs enviadas por dia</h2>
              <p className="text-[11px] text-muted-foreground">Últimos 7 dias</p>
              <div className="mt-3 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={m.daily} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="oklch(0.3 0.02 240 / 0.4)" />
                    <XAxis dataKey="day" stroke="oklch(0.62 0.02 235)" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="oklch(0.62 0.02 235)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => compactNumber(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "oklch(0.235 0.026 236)", border: "1px solid oklch(0.38 0.025 234)", borderRadius: "12px", fontSize: "11px" }}
                      formatter={(v: number) => [compactNumber(v), "DMs"]}
                    />
                    <Bar dataKey="sent" fill="oklch(0.69 0.15 230)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Criativo publicado</p>
              <TelegramAdPreview
                channelName={campaign.name}
                channelHandle="@telegram_ads"
                text={campaign.text}
                description={campaign.description ?? undefined}
                buttonLabel={campaign.button_label}
              />
            </div>
          </div>
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
            <div className="tile p-5">
              <h2 className="font-display text-base font-bold">Distribuição da entrega</h2>
              <div className="mt-4 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deliveryPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                      {deliveryPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "oklch(0.235 0.026 236)", border: "1px solid oklch(0.38 0.025 234)", borderRadius: "12px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {deliveryPie.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto tabular font-semibold">{compactNumber(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tile p-5">
              <h2 className="font-display text-base font-bold">Top canais</h2>
              <p className="text-[11px] text-muted-foreground">Onde sua campanha mais performou</p>
              <ul className="mt-3 space-y-2">
                {m.channels.map((ch) => {
                  const max = Math.max(...m.channels.map((c) => c.sent), 1);
                  return (
                    <li key={ch.name} className="rounded-xl border border-border/40 bg-surface-1/40 p-3">
                      <div className="flex items-center justify-between text-[12px]">
                        <p className="font-semibold">{ch.name}</p>
                        <span className="text-[10.5px] tabular text-muted-foreground">{compactNumber(ch.clicks)} cliques</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3/60">
                        <div className="h-full gradient-primary" style={{ width: `${(ch.sent / max) * 100}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] tabular text-muted-foreground">{compactNumber(ch.sent)} DMs enviadas</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}

      {tab === "audience" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="tile p-5">
            <h2 className="font-display text-base font-bold">Faixa etária</h2>
            <div className="mt-4 space-y-3">
              {m.demographics.map((d) => (
                <div key={d.label}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{d.label} anos</span>
                    <span className="tabular font-semibold">{d.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-3/60">
                    <div className="h-full gradient-primary" style={{ width: `${d.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="tile p-5">
            <h2 className="font-display text-base font-bold">Dispositivos</h2>
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.devices} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="oklch(0.3 0.02 240 / 0.4)" />
                  <XAxis type="number" stroke="oklch(0.62 0.02 235)" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="label" type="category" stroke="oklch(0.62 0.02 235)" fontSize={11} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.235 0.026 236)", border: "1px solid oklch(0.38 0.025 234)", borderRadius: "12px", fontSize: "11px" }}
                    formatter={(v: number) => [`${v}%`, "Share"]}
                  />
                  <Bar dataKey="value" fill="oklch(0.84 0.16 178)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "recipients" && (
        <div className="tile p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold">Quem recebeu sua mensagem</h2>
              <p className="text-[11px] text-muted-foreground">Atualização ao vivo · {m.recipients.length} usuários alcançados</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10.5px] font-bold text-success">
              <span className="dot-live !h-1.5 !w-1.5" /> ao vivo
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {m.recipients.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface-1/40 p-2.5 transition hover:bg-surface-1/80">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: gradientForName(r.name) }}
                >
                  {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{r.name}</p>
                  <p className="truncate text-[10.5px] text-muted-foreground">{r.username} · {r.time}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${statusColor[r.status]}`}>
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

function DeliveryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Send; color: string }) {
  return (
    <div className="tile p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular">{compactNumber(value)}</p>
    </div>
  );
}
