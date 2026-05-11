import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Send, Zap, Target, BarChart3, Users, Shield, Sparkles, ArrowRight,
  Check, Star, Globe, Cpu, Lock, Rocket, MessageCircle, MousePointerClick,
  TrendingUp, Bot, ChevronRight, Play, Menu, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo, Wordmark } from "@/components/Logo";
import { TelegramAdPreview } from "@/components/TelegramAdPreview";
import { compactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "TeleAds — A plataforma profissional de DM Ads para Telegram" },
      { name: "description", content: "Dispare anúncios diretos no Telegram em escala. Pacotes de 500 a 20.000 DMs com analytics em tempo real, segmentação por nicho e preview ao vivo." },
      { property: "og:title", content: "TeleAds — DM Ads para Telegram" },
      { property: "og:description", content: "A primeira plataforma profissional para vender através de mensagens diretas no Telegram." },
    ],
  }),
});

function LandingPage() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute top-[40%] -right-20 h-[400px] w-[400px] rounded-full bg-cyan/15 blur-[140px]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={32} />
            <Wordmark />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Recursos</a>
            <a href="#how" className="hover:text-foreground transition">Como funciona</a>
            <a href="#pricing" className="hover:text-foreground transition">Pacotes</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition hover:text-foreground">
              Entrar
            </Link>
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:brightness-110 glow-primary">
              Criar conta <ArrowRight className="h-3 w-3" />
            </Link>
            <button onClick={() => setMenuOpen(v => !v)} className="md:hidden ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60">
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t border-border/40 px-4 py-3 flex flex-col gap-3 text-[13px] bg-background/95">
            <a onClick={() => setMenuOpen(false)} href="#features">Recursos</a>
            <a onClick={() => setMenuOpen(false)} href="#how">Como funciona</a>
            <a onClick={() => setMenuOpen(false)} href="#pricing">Pacotes</a>
            <a onClick={() => setMenuOpen(false)} href="#faq">FAQ</a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 md:px-6 md:pt-20 md:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> Beta limitado · Novos cadastros recebem 100 DMs grátis
            </span>
            <h1 className="mt-5 font-display text-[36px] sm:text-[48px] md:text-[64px] font-bold leading-[1.05] tracking-tight">
              Venda direto na <span className="text-gradient-primary">caixa de entrada</span> do Telegram.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] md:text-[17px] leading-relaxed text-muted-foreground">
              A primeira plataforma profissional de <strong className="text-foreground">DM Ads para Telegram</strong>. Envie milhares de mensagens diretas segmentadas, acompanhe entregas, cliques e conversões em tempo real.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-5 py-3 text-[14px] font-semibold text-white transition hover:brightness-110 glow-primary">
                Começar grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-surface-1/60 px-5 py-3 text-[13px] font-semibold transition hover:border-primary/40">
                <Play className="h-3.5 w-3.5 text-primary" /> Ver como funciona
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-muted-foreground">
              <Trust label="2.4M+ DMs entregues" icon={Send} />
              <Trust label="800+ marcas ativas" icon={Users} />
              <Trust label="98.7% taxa de entrega" icon={Shield} />
            </div>
          </div>
          <div className="lg:col-span-5 mx-auto w-full max-w-md">
            <TelegramAdPreview
              channelName="Sua marca"
              channelHandle="@teleads_demo"
              text={"🚀 Lançamento exclusivo!\n\nDescubra o método que está faturando R$ 50k/mês. Vagas limitadas — clique abaixo:"}
              description="Acesso imediato após confirmar"
              buttonLabel="Quero garantir 🔥"
              simulateDelivery
            />
          </div>
        </div>
      </section>

      {/* Logo cloud */}
      <section className="border-y border-border/40 bg-surface-1/30 py-6">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Confiança de quem vende todos os dias no Telegram</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[14px] font-display font-bold text-muted-foreground/60">
            <span>NEXTRADE</span><span>CryptoBR</span><span>InfoStudio</span><span>Renda+</span><span>BotsHub</span><span>GamersPRO</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value="2.4M+" label="DMs entregues" />
          <Stat value="98.7%" label="Taxa de entrega" />
          <Stat value="12.4%" label="CTR médio" />
          <Stat value="< 90s" label="Tempo de envio" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="text-center">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">RECURSOS</span>
          <h2 className="mt-3 font-display text-[28px] md:text-[44px] font-bold leading-tight">
            Tudo que você precisa para escalar<br className="hidden md:block" /> seus disparos no Telegram
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] text-muted-foreground">
            Da criação do anúncio à conversão. Sem código, sem bot pessoal, sem risco de banimento.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Zap} title="Disparo em segundos" desc="Compre um pacote, monte o criativo e dispare em até 90 segundos. Nossa infraestrutura distribuída entrega DMs em paralelo." color="from-primary/30" />
          <Feature icon={Target} title="Segmentação por nicho" desc="Cripto, renda extra, gaming, tecnologia, lifestyle e mais. Atinja exatamente o público que converte para sua oferta." color="from-cyan/30" />
          <Feature icon={BarChart3} title="Analytics em tempo real" desc="Acompanhe DMs entregues, bloqueadas, cliques, CTR e conversões com gráficos atualizados a cada segundo." color="from-warning/30" />
          <Feature icon={Bot} title="Anti-banimento" desc="Rotação inteligente de IPs, contas verificadas e padrões humanizados — entregas sem afetar suas contas pessoais." color="from-magenta/30" />
          <Feature icon={MessageCircle} title="Preview realista" desc="Veja exatamente como seu anúncio vai aparecer no Telegram do destinatário antes de disparar — incluindo botão de CTA." color="from-primary/30" />
          <Feature icon={Lock} title="Pacotes pré-pagos" desc="Sem assinatura. Compre apenas as DMs que vai usar. Saldo nunca expira, e você usa quando quiser." color="from-cyan/30" />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/40 bg-surface-1/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">COMO FUNCIONA</span>
            <h2 className="mt-3 font-display text-[28px] md:text-[44px] font-bold">3 passos para começar a vender</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Step n={1} title="Compre seu pacote" desc="Escolha entre 500 e 20.000 DMs. Pague uma vez, use quando quiser. Saldo não expira." icon={Rocket} />
            <Step n={2} title="Crie sua campanha" desc="Wizard de 5 etapas com preview ao vivo do Telegram. Texto, imagem, botão e segmentação." icon={Sparkles} />
            <Step n={3} title="Acompanhe os resultados" desc="Dashboard em tempo real com cada DM entregue, clique e conversão. Otimize na hora." icon={TrendingUp} />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="text-center">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">PACOTES</span>
          <h2 className="mt-3 font-display text-[28px] md:text-[44px] font-bold">Escolha quanto você quer disparar</h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] text-muted-foreground">Pague uma vez, use quando quiser. Quanto maior o pacote, menor o custo por DM.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Plan name="Starter" qty={500} price={47} cpd={0.094} />
          <Plan name="Growth" qty={1000} price={87} cpd={0.087} popular />
          <Plan name="Pro" qty={5000} price={397} cpd={0.079} />
          <Plan name="Scale" qty={20000} price={1397} cpd={0.069} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border/40 bg-surface-1/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">DEPOIMENTOS</span>
            <h2 className="mt-3 font-display text-[28px] md:text-[44px] font-bold">Marcas que já escalaram com TeleAds</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Quote name="Rafael S." role="Infoprodutor — Cripto" quote="Faturei R$ 38k em uma semana com um único disparo de 5.000 DMs. Nada se compara à conversão direta no Telegram." />
            <Quote name="Camila T." role="Agência — Renda extra" quote="Meu CTR no Meta era 1.2%. Aqui chega a 14%. As pessoas leem mesmo a mensagem porque é íntima." />
            <Quote name="Bruno L." role="Trader — Crypto" quote="Substituí completamente meu tráfego pago. ROI 6x mais alto e zero risco de bloqueio de conta." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <div className="text-center">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">FAQ</span>
          <h2 className="mt-3 font-display text-[28px] md:text-[44px] font-bold">Perguntas frequentes</h2>
        </div>
        <div className="mt-10 space-y-3">
          <FAQ q="Como vocês conseguem entregar DMs no Telegram?" a="Operamos uma rede própria de contas verificadas e seguimos rigorosamente os padrões humanizados de uso. Cada DM é enviada de forma distribuída, respeitando os limites técnicos do Telegram." />
          <FAQ q="Minha conta pessoal corre algum risco?" a="Não. Nunca utilizamos sua conta — todo disparo é feito pela nossa infraestrutura. Você só usa o painel para criar e acompanhar campanhas." />
          <FAQ q="O saldo de DMs expira?" a="Não. Pague uma vez e use quando quiser. Seus DMs não comprados não expiram." />
          <FAQ q="Posso segmentar por região ou idioma?" a="Sim. Atualmente temos segmentação por nicho de interesse (cripto, renda, gaming, etc.). Em breve adicionaremos região, idioma e idade." />
          <FAQ q="Quanto tempo leva o disparo?" a="Pacotes de até 1.000 DMs disparam em menos de 90 segundos. Pacotes maiores são distribuídos ao longo de algumas horas para máxima qualidade." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20 md:px-6">
        <div className="tile relative overflow-hidden p-8 sm:p-12 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-cyan/10 to-transparent" />
          <div className="relative">
            <h2 className="font-display text-[28px] md:text-[40px] font-bold">Pronto para vender direto no Telegram?</h2>
            <p className="mx-auto mt-3 max-w-lg text-[14px] text-muted-foreground">Crie sua conta agora e ganhe <strong className="text-primary">100 DMs grátis</strong> para testar a plataforma. Sem cartão.</p>
            <Link to="/auth" className="mt-6 inline-flex items-center gap-1.5 rounded-xl gradient-primary px-6 py-3 text-[14px] font-semibold text-white transition hover:brightness-110 glow-primary">
              Criar conta grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 md:flex-row md:px-6">
          <div className="flex items-center gap-2"><Logo size={24} /><Wordmark /></div>
          <p className="text-[11px] text-muted-foreground">© 2026 TeleAds. Não somos afiliados ao Telegram Messenger Inc.</p>
          <div className="flex gap-4 text-[11.5px] text-muted-foreground">
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Trust({ label, icon: Icon }: { label: string; icon: typeof Send }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="tile p-5 text-center">
      <p className="font-display text-3xl md:text-4xl font-bold tabular text-gradient-primary">{value}</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, desc, color }: { icon: typeof Zap; title: string; desc: string; color: string }) {
  return (
    <div className="tile group relative overflow-hidden p-5 transition hover:border-primary/40">
      <div className={cn("pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-2xl opacity-60 bg-gradient-to-br to-transparent", color)} />
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-3 font-display text-[16px] font-bold">{title}</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function Step({ n, title, desc, icon: Icon }: { n: number; title: string; desc: string; icon: typeof Zap }) {
  return (
    <div className="tile p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary glow-primary text-white">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary">Passo {n}</p>
      <h3 className="mt-1 font-display text-[18px] font-bold">{title}</h3>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function Plan({ name, qty, price, cpd, popular }: { name: string; qty: number; price: number; cpd: number; popular?: boolean }) {
  return (
    <div className={cn("tile relative overflow-hidden p-5 transition", popular && "border-primary/60 glow-primary")}>
      {popular && <span className="absolute right-3 top-3 rounded-full gradient-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Popular</span>}
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">{name}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular text-gradient-primary">{compactNumber(qty)}</p>
      <p className="text-[11.5px] text-muted-foreground">DMs disparadas</p>
      <p className="mt-4 font-display text-2xl font-bold tabular">R$ {price.toLocaleString("pt-BR")}</p>
      <p className="text-[11px] text-muted-foreground">≈ R$ {cpd.toFixed(3).replace(".", ",")} por DM</p>
      <Link to="/auth" className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-border/60 bg-surface-1/60 px-3 py-2 text-[12px] font-semibold transition hover:border-primary/40">
        Começar agora <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function Quote({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <div className="tile p-5">
      <div className="flex gap-0.5 text-warning">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed">"{quote}"</p>
      <div className="mt-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan text-[12px] font-bold text-white">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-[12px] font-semibold">{name}</p>
          <p className="text-[10.5px] text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(v => !v)} className="tile w-full text-left p-4 transition hover:border-primary/30">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13.5px] font-semibold">{q}</p>
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-90 text-primary")} />
      </div>
      {open && <p className="mt-2 text-[12.5px] text-muted-foreground">{a}</p>}
    </button>
  );
}
