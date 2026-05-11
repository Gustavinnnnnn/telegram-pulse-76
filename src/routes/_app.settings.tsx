import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User, Bell, Shield, CreditCard, Bot, Globe, Palette, Code2, Key, Mail,
  Smartphone, Check, ChevronRight, LogOut, Trash2, Eye, EyeOff,
} from "lucide-react";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { shortId } from "@/lib/format";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

type Tab = "profile" | "notifications" | "security" | "appearance";

const TABS: { id: Tab; label: string; icon: typeof User; desc: string }[] = [
  { id: "profile", label: "Perfil", icon: User, desc: "Suas informações pessoais" },
  { id: "notifications", label: "Notificações", icon: Bell, desc: "Como você é avisado" },
  { id: "security", label: "Segurança", icon: Shield, desc: "Senha e autenticação" },
  { id: "appearance", label: "Aparência", icon: Palette, desc: "Tema e idioma" },
];

const inputCls = "w-full rounded-lg border border-border/60 bg-surface-1/60 px-3 py-2 text-[13px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

function SettingsPage() {
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[24px] font-bold tracking-tight md:text-[32px]">Configurações</h1>
        <p className="text-[13px] text-muted-foreground">Gerencie sua conta, segurança, notificações e integrações</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="tile h-fit p-2 lg:col-span-3 lg:sticky lg:top-[76px]">
          <nav className="space-y-0.5">
            {TABS.map(t => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                    active ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold leading-tight">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground hidden lg:block">{t.desc}</p>
                  </div>
                  <ChevronRight className={cn("h-3.5 w-3.5 transition", active ? "text-primary" : "text-muted-foreground/40")} />
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="lg:col-span-9 space-y-4">
          {tab === "profile" && <ProfileSection profile={profile} email={user?.email ?? ""} userId={user?.id ?? ""} />}
          {tab === "notifications" && <NotificationsSection />}
          {tab === "security" && <SecuritySection email={user?.email ?? ""} signOut={signOut} />}
          {tab === "appearance" && <AppearanceSection />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Profile ---------- */
function ProfileSection({ profile, email, userId }: { profile: any; email: string; userId: string }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (profile?.display_name) setName(profile.display_name); }, [profile]);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", userId);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Perfil atualizado!");
  };

  const initial = (name || email || "U").charAt(0).toUpperCase();

  return (
    <>
      <Card title="Foto e identidade" desc="Como você aparece no painel">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-3xl font-bold text-white">{initial}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold">Avatar gerado pelas suas iniciais</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">É atualizado automaticamente quando você muda o nome de exibição.</p>
          </div>
        </div>
      </Card>

      <Card title="Informações pessoais" desc="Atualize seus dados de cadastro">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome de exibição"><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></Field>
          <Field label="E-mail"><input value={email} disabled className={cn(inputCls, "opacity-60")} /></Field>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10.5px] font-mono text-muted-foreground">ID: {shortId(userId)}</p>
          <button onClick={save} disabled={busy} className="rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </Card>
    </>
  );
}

/* ---------- Notifications ---------- */
const PREFS_KEY = "tla_notif_prefs_v1";
const CHANNELS_KEY = "tla_notif_channels_v1";
function NotificationsSection() {
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === "undefined") return { campaign_complete: true, campaign_low_balance: true, daily_report: false, weekly_report: true, new_features: true, promos: false };
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "") || { campaign_complete: true, campaign_low_balance: true, daily_report: false, weekly_report: true, new_features: true, promos: false }; }
    catch { return { campaign_complete: true, campaign_low_balance: true, daily_report: false, weekly_report: true, new_features: true, promos: false }; }
  });
  const [channels, setChannels] = useState(() => {
    if (typeof window === "undefined") return { email: true, push: false };
    try { return JSON.parse(localStorage.getItem(CHANNELS_KEY) || "") || { email: true, push: false }; }
    catch { return { email: true, push: false }; }
  });

  const save = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
    toast.success("Preferências salvas");
  };

  return (
    <>
      <Card title="Canais de notificação" desc="Onde você quer receber avisos">
        <div className="grid gap-3 grid-cols-2">
          <ChannelTile icon={Mail} label="E-mail" active={channels.email} onClick={() => setChannels((c: any) => ({ ...c, email: !c.email }))} />
          <ChannelTile icon={Smartphone} label="Push no navegador" active={channels.push} onClick={() => setChannels((c: any) => ({ ...c, push: !c.push }))} />
        </div>
      </Card>

      <Card title="O que você quer receber" desc="Marque os eventos que importam">
        <ul className="space-y-1">
          <Toggle label="Campanha concluída" desc="Quando todas as DMs forem enviadas" value={prefs.campaign_complete} onChange={v => setPrefs((p: any) => ({ ...p, campaign_complete: v }))} />
          <Toggle label="Saldo baixo" desc="Quando seu saldo cair abaixo de 100 DMs" value={prefs.campaign_low_balance} onChange={v => setPrefs((p: any) => ({ ...p, campaign_low_balance: v }))} />
          <Toggle label="Relatório diário" desc="Resumo das suas campanhas todo dia às 09h" value={prefs.daily_report} onChange={v => setPrefs((p: any) => ({ ...p, daily_report: v }))} />
          <Toggle label="Relatório semanal" desc="Resumo de performance toda segunda" value={prefs.weekly_report} onChange={v => setPrefs((p: any) => ({ ...p, weekly_report: v }))} />
          <Toggle label="Novidades do produto" desc="Novas funcionalidades e melhorias" value={prefs.new_features} onChange={v => setPrefs((p: any) => ({ ...p, new_features: v }))} />
          <Toggle label="Promoções e descontos" desc="Cupons em pacotes de DMs" value={prefs.promos} onChange={v => setPrefs((p: any) => ({ ...p, promos: v }))} />
        </ul>
        <button onClick={save} className="mt-4 rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110">Salvar preferências</button>
      </Card>
    </>
  );
}

/* ---------- Security ---------- */
function SecuritySection({ email, signOut }: { email: string; signOut: () => void }) {
  const [show, setShow] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const updatePwd = async () => {
    if (pwd.length < 6) { toast.error("A senha precisa ter pelo menos 6 caracteres"); return; }
    if (pwd !== pwd2) { toast.error("Senhas não conferem"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Senha atualizada"); setPwd(""); setPwd2(""); }
  };

  return (
    <>
      <Card title="Alterar senha" desc="Use ao menos 8 caracteres com letras e números">
        <div className="space-y-3">
          <Field label="Nova senha">
            <div className="relative">
              <input type={show ? "text" : "password"} value={pwd} onChange={e => setPwd(e.target.value)} className={cn(inputCls, "pr-10")} />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirmar nova senha">
            <input type={show ? "text" : "password"} value={pwd2} onChange={e => setPwd2(e.target.value)} className={inputCls} />
          </Field>
          <button onClick={updatePwd} disabled={busy || !pwd} className="rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
            {busy ? "Atualizando…" : "Atualizar senha"}
          </button>
        </div>
      </Card>

      <Card title="Autenticação em duas etapas" desc="Camada extra de segurança no login">
        <Toggle label="Ativar 2FA por aplicativo" desc="Use Google Authenticator, Authy ou similar" value={twoFA} onChange={v => { setTwoFA(v); toast.success(v ? "2FA ativado (simulado)" : "2FA desativado"); }} />
      </Card>

      <Card title="Sessões ativas" desc="Dispositivos conectados à sua conta">
        <ul className="divide-y divide-border/40">
          <li className="flex items-center gap-3 py-2.5">
            <Globe className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold">Este navegador · agora</p>
              <p className="text-[10.5px] text-muted-foreground">{email}</p>
            </div>
            <span className="rounded-md bg-success/15 px-2 py-0.5 text-[9.5px] font-bold text-success">Atual</span>
          </li>
        </ul>
      </Card>

      <Card title="Zona de perigo" desc="Ações irreversíveis" danger>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/60 px-3 py-1.5 text-[12px] font-semibold transition hover:bg-surface-2">
            <LogOut className="h-3.5 w-3.5" /> Sair de todos os dispositivos
          </button>
          <button onClick={() => toast.error("Entre em contato com o suporte para excluir a conta")} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[12px] font-semibold text-destructive transition hover:bg-destructive/20">
            <Trash2 className="h-3.5 w-3.5" /> Excluir conta
          </button>
        </div>
      </Card>
    </>
  );
}

/* ---------- Billing ---------- */
function BillingSection() {
  return (
    <>
      <Card title="Métodos de pagamento" desc="Cartões e PIX salvos para compras rápidas">
        <div className="space-y-2">
          <PaymentMethod brand="Visa" last4="4242" exp="12/28" primary />
          <button className="w-full rounded-xl border-2 border-dashed border-border/60 bg-surface-1/40 py-3 text-[12px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary">
            + Adicionar novo cartão
          </button>
        </div>
      </Card>

      <Card title="Dados de cobrança" desc="Aparecerá nas suas notas fiscais">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Razão social / Nome"><input className={inputCls} /></Field>
          <Field label="CPF / CNPJ"><input className={inputCls} placeholder="000.000.000-00" /></Field>
          <Field label="Endereço"><input className={inputCls} /></Field>
          <Field label="CEP"><input className={inputCls} /></Field>
        </div>
        <button onClick={() => toast.success("Dados salvos")} className="mt-4 rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110">Salvar</button>
      </Card>
    </>
  );
}

/* ---------- Telegram bot ---------- */
function TelegramSection() {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);

  return (
    <>
      <Card title="Conectar Bot do Telegram" desc="Receba notificações e dispare DMs via @BotFather">
        <div className="rounded-xl border border-primary/30 bg-primary/8 p-3 text-[11.5px]">
          <p className="font-semibold text-primary">Como obter seu token:</p>
          <ol className="mt-1 ml-4 list-decimal space-y-0.5 text-muted-foreground">
            <li>Abra o Telegram e procure por <strong className="text-foreground">@BotFather</strong></li>
            <li>Envie <code className="rounded bg-surface-2 px-1 font-mono">/newbot</code> e siga as instruções</li>
            <li>Cole o token recebido abaixo</li>
          </ol>
        </div>
        <Field label="Bot token">
          <input value={token} onChange={e => setToken(e.target.value)} placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" className={cn(inputCls, "font-mono")} />
        </Field>
        <button onClick={() => { setConnected(!!token); toast.success(token ? "Bot conectado!" : "Token vazio"); }} className="rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110">
          {connected ? "Atualizar conexão" : "Conectar bot"}
        </button>
        {connected && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-[12px] text-success">
            <Check className="h-4 w-4" /> Bot conectado e funcionando
          </div>
        )}
      </Card>

      <Card title="Canais e grupos" desc="Adicione canais para análise de público-alvo">
        <button className="w-full rounded-xl border-2 border-dashed border-border/60 bg-surface-1/40 py-3 text-[12px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary">
          + Adicionar canal/grupo
        </button>
      </Card>
    </>
  );
}

/* ---------- API ---------- */
function ApiSection({ userId }: { userId: string }) {
  const [showKey, setShowKey] = useState(false);
  const apiKey = `tla_live_${userId.replace(/-/g, "").slice(0, 24)}`;
  const [webhook, setWebhook] = useState("");

  return (
    <>
      <Card title="Chave de API" desc="Use para integrar TeleAds no seu sistema">
        <div className="flex items-stretch gap-2">
          <input value={showKey ? apiKey : "•".repeat(28)} readOnly className={cn(inputCls, "font-mono text-[12px]")} />
          <button onClick={() => setShowKey(v => !v)} className="rounded-lg border border-border/60 bg-surface-1/60 px-3 text-muted-foreground hover:text-foreground">
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Chave copiada"); }} className="rounded-lg border border-border/60 bg-surface-1/60 px-3 text-[12px] font-semibold hover:border-primary/40">
            Copiar
          </button>
        </div>
        <button onClick={() => toast.success("Nova chave gerada (simulado)")} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-1.5 text-[11.5px] font-semibold text-warning transition hover:bg-warning/15">
          <Key className="h-3.5 w-3.5" /> Gerar nova chave
        </button>
      </Card>

      <Card title="Webhooks" desc="Receba eventos das suas campanhas em tempo real">
        <Field label="URL de webhook">
          <input value={webhook} onChange={e => setWebhook(e.target.value)} placeholder="https://api.suaempresa.com/webhooks/teleads" className={inputCls} />
        </Field>
        <p className="text-[10.5px] text-muted-foreground">Eventos: campaign.created · dm.sent · dm.delivered · click.received · campaign.completed</p>
        <button onClick={() => toast.success("Webhook salvo")} className="mt-3 rounded-lg gradient-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110">Salvar webhook</button>
      </Card>
    </>
  );
}

/* ---------- Appearance ---------- */
function AppearanceSection() {
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("dark");
  const [lang, setLang] = useState("pt-BR");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");

  return (
    <>
      <Card title="Tema" desc="Como o painel deve aparecer">
        <div className="grid grid-cols-3 gap-2">
          {(["dark", "light", "auto"] as const).map(t => (
            <button key={t} onClick={() => setTheme(t)} className={cn(
              "rounded-xl border p-3 text-center transition",
              theme === t ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40",
            )}>
              <div className={cn("mx-auto h-10 w-16 rounded-md border", t === "dark" ? "bg-[#0F1722] border-white/10" : t === "light" ? "bg-white border-black/10" : "bg-gradient-to-r from-[#0F1722] to-white")} />
              <p className="mt-2 text-[11.5px] font-semibold capitalize">{t === "auto" ? "Sistema" : t === "dark" ? "Escuro" : "Claro"}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Idioma" desc="Idioma da interface">
        <select value={lang} onChange={e => setLang(e.target.value)} className={inputCls}>
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
        </select>
      </Card>

      <Card title="Densidade da interface" desc="Compacto mostra mais informação por tela">
        <div className="grid grid-cols-2 gap-2">
          {(["compact", "comfortable"] as const).map(d => (
            <button key={d} onClick={() => setDensity(d)} className={cn(
              "rounded-xl border p-3 text-left transition",
              density === d ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40",
            )}>
              <p className="text-[12.5px] font-bold capitalize">{d === "compact" ? "Compacto" : "Confortável"}</p>
              <p className="text-[10.5px] text-muted-foreground">{d === "compact" ? "Mais dados visíveis" : "Mais espaço entre elementos"}</p>
            </button>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ---------- Building blocks ---------- */
function Card({ title, desc, children, danger }: { title: string; desc?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={cn("tile p-4 sm:p-5 space-y-3", danger && "border-destructive/30")}>
      <div>
        <h2 className="font-display text-[15px] font-bold">{title}</h2>
        {desc && <p className="text-[11.5px] text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
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

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-2/40">
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold">{label}</p>
        {desc && <p className="text-[10.5px] text-muted-foreground">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)} className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition",
        value ? "bg-primary" : "bg-surface-3",
      )}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", value ? "left-[18px]" : "left-0.5")} />
      </button>
    </li>
  );
}

function ChannelTile({ icon: Icon, label, active, onClick }: { icon: typeof Mail; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-2.5 rounded-xl border p-3 text-left transition",
      active ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40",
    )}>
      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
      <span className="flex-1 text-[12px] font-semibold">{label}</span>
      {active && <Check className="h-3.5 w-3.5 text-primary" />}
    </button>
  );
}

function PaymentMethod({ brand, last4, exp, primary }: { brand: string; last4: string; exp: string; primary?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-1/40 p-3">
      <div className="flex h-9 w-12 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-[10px] font-bold text-white">{brand.toUpperCase()}</div>
      <div className="flex-1">
        <p className="text-[12.5px] font-semibold">•••• •••• •••• {last4}</p>
        <p className="text-[10.5px] text-muted-foreground">Expira em {exp}</p>
      </div>
      {primary && <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[9.5px] font-bold text-primary">Principal</span>}
    </div>
  );
}
