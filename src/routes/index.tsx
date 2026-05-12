import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  Gauge,
  Layers3,
  Lock,
  Menu,
  MessageCircle,
  MousePointerClick,
  Play,
  Rocket,
  Send,
  Target,
  ShieldCheck,
  X,
  Zap,
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
      { title: "TeleAds — Disparos no Telegram por DM" },
      {
        name: "description",
        content:
          "Crie campanhas de DM Ads no Telegram, compre créditos por PIX e acompanhe entregas, cliques e conversões em tempo real.",
      },
      { property: "og:title", content: "TeleAds — Disparos no Telegram por DM" },
      {
        property: "og:description",
        content:
          "A plataforma para vender direto na caixa de entrada do Telegram com preview real, pacotes pré-pagos e métricas ao vivo.",
      },
    ],
  }),
});

const proof = [
  { value: "2.4M+", label: "DMs processadas" },
  { value: "98.7%", label: "entrega média" },
  { value: "12.4%", label: "CTR médio" },
];

const segments = ["Cripto", "Renda extra", "Gaming", "Tecnologia", "Apostas", "Infoprodutos"];

function LandingPage() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="TeleAds">
            <Logo size={34} />
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-muted-foreground md:flex">
            <a href="#produto" className="transition hover:text-foreground">Produto</a>
            <a href="#fluxo" className="transition hover:text-foreground">Fluxo</a>
            <a href="#pacotes" className="transition hover:text-foreground">Pacotes</a>
            <a href="#faq" className="transition hover:text-foreground">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden rounded-lg px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition hover:text-foreground sm:inline-flex">
              Entrar
            </Link>
            <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:brightness-110">
              Criar conta <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-1 text-foreground md:hidden"
              aria-label="Abrir menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="grid gap-3 border-t border-border bg-background px-4 py-4 text-[13px] font-semibold md:hidden">
            <a onClick={() => setMenuOpen(false)} href="#produto">Produto</a>
            <a onClick={() => setMenuOpen(false)} href="#fluxo">Fluxo</a>
            <a onClick={() => setMenuOpen(false)} href="#pacotes">Pacotes</a>
            <a onClick={() => setMenuOpen(false)} href="#faq">FAQ</a>
          </nav>
        ) : null}
      </header>

      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--surface-2)_54%,transparent),transparent_72%)]" />
        <div className="mx-auto grid min-h-[calc(100svh-64px)] max-w-7xl gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[1fr_460px] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> DM Ads para Telegram
            </div>
            <h1 className="mt-5 font-display text-[40px] font-bold leading-[0.98] tracking-normal sm:text-[56px] md:text-[72px]">
              Venda no Telegram sem depender de grupo, bot ou algoritmo.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-[18px]">
              Monte uma campanha, escolha o público, compre créditos por PIX e envie sua oferta direto para conversas privadas com métricas de entrega e clique no painel.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-3.5 text-[14px] font-bold text-primary-foreground transition hover:brightness-110 glow-primary">
                Começar agora <Rocket className="h-4 w-4" />
              </Link>
              <a href="#produto" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-1 px-6 py-3.5 text-[14px] font-bold transition hover:border-primary/50">
                Ver demonstração <Play className="h-4 w-4 text-primary" />
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
              {proof.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface-1/70 p-3">
                  <p className="font-display text-xl font-bold tabular text-gradient-primary sm:text-2xl">{item.value}</p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[460px] lg:mx-0">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] border border-primary/15 bg-primary/5" />
            <TelegramAdPreview
              channelName="Oferta VIP"
              channelHandle="@teleads_pro"
              text={"🔥 Entrada liberada por poucos minutos\n\nReceba a condição especial e entre antes que a lista feche."}
              description="Clique para garantir o acesso agora"
              buttonLabel="Quero acessar"
              simulateDelivery
            />
          </div>
        </div>
      </section>

      <section id="produto" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">Painel de campanha</span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-normal md:text-[48px]">
              Um cockpit para criar, pagar e medir cada disparo.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground md:text-[16px]">
              A landing agora mostra o produto de verdade: criação rápida de campanha, pacote pré-pago, checkout PIX e leitura dos resultados sem enrolação.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {segments.map((segment) => (
                <span key={segment} className="rounded-full border border-border bg-surface-1 px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground">
                  {segment}
                </span>
              ))}
            </div>
          </div>
          <ProductBoard />
        </div>
      </section>

      <section id="fluxo" className="border-y border-border/50 bg-surface-1/35 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="max-w-2xl">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">Fluxo direto</span>
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-normal md:text-[48px]">Da ideia ao disparo em quatro etapas.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <Step number="01" icon={MessageCircle} title="Escreva a DM" text="Texto, CTA e preview no formato que o usuário recebe no Telegram." />
            <Step number="02" icon={Target} title="Escolha o público" text="Nicho, intenção e volume para não desperdiçar créditos." />
            <Step number="03" icon={Zap} title="Pague por PIX" text="Checkout com QR Code e copia e cola, saldo liberado após confirmação." />
            <Step number="04" icon={BarChart3} title="Acompanhe" text="Entregas, bloqueios, cliques e CTR no dashboard." />
          </div>
        </div>
      </section>

      <section id="pacotes" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">Pacotes pré-pagos</span>
            <h2 className="mt-3 font-display text-[30px] font-bold tracking-normal md:text-[48px]">Compre DMs, use quando quiser.</h2>
          </div>
          <p className="max-w-md text-[14px] text-muted-foreground">Sem assinatura mensal. Os créditos ficam no saldo da sua conta e são consumidos somente quando uma campanha roda.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Plan name="Starter" qty={500} price="R$ 47" tag="teste rápido" />
          <Plan name="Growth" qty={1000} price="R$ 87" tag="mais escolhido" popular />
          <Plan name="Pro" qty={5000} price="R$ 397" tag="escala diária" />
          <Plan name="Scale" qty={20000} price="R$ 1.397" tag="operação pesada" />
        </div>
      </section>

      <section className="border-y border-border/50 bg-surface-1/35 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">Prova operacional</span>
            <h2 className="mt-3 font-display text-[30px] font-bold tracking-normal md:text-[44px]">Feito para performance, não para enfeite.</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">Cada parte da tela empurra o usuário para entender o valor e criar conta: promessa clara, produto visível, fluxo simples e pacotes objetivos.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Signal icon={Gauge} title="Entrega monitorada" text="Status de cada disparo sem esperar relatório manual." />
            <Signal icon={MousePointerClick} title="Cliques rastreados" text="CTR por campanha para comparar criativos." />
            <Signal icon={ShieldCheck} title="Conta isolada" text="O envio não usa a conta pessoal do cliente." />
            <Signal icon={Lock} title="Saldo controlado" text="Créditos pré-pagos com histórico de compras." />
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <div className="text-center">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-primary">FAQ</span>
          <h2 className="mt-3 font-display text-[30px] font-bold tracking-normal md:text-[44px]">Perguntas rápidas</h2>
        </div>
        <div className="mt-8 space-y-3">
          <FAQ q="O pagamento aparece na hora?" a="O PIX é gerado no checkout. Depois que a confirmação chega, os créditos entram automaticamente no saldo." />
          <FAQ q="Preciso conectar meu Telegram?" a="Não. A campanha é criada no painel e o envio usa a infraestrutura da plataforma." />
          <FAQ q="O QR Code aparece junto com o copia e cola?" a="Sim. O checkout mostra QR Code e código PIX copia e cola na mesma tela." />
          <FAQ q="Os créditos expiram?" a="Não. Você compra um pacote e usa os disparos quando quiser." />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <div className="overflow-hidden rounded-2xl border border-primary/30 bg-surface-1">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <h2 className="font-display text-[28px] font-bold tracking-normal md:text-[42px]">Coloque sua oferta dentro do Telegram hoje.</h2>
              <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">Crie a conta, escolha o pacote e rode o primeiro disparo com preview antes de enviar.</p>
            </div>
            <Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-3.5 text-[14px] font-bold text-primary-foreground transition hover:brightness-110 glow-primary">
              Criar conta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 md:flex-row md:px-6">
          <div className="flex items-center gap-2"><Logo size={26} /><Wordmark /></div>
          <p className="text-center text-[11px] text-muted-foreground">© 2026 TeleAds. Plataforma independente para anúncios no Telegram.</p>
          <div className="flex gap-4 text-[11.5px] text-muted-foreground">
            <a href="#faq" className="hover:text-foreground">Dúvidas</a>
            <Link to="/auth" className="hover:text-foreground">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductBoard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-tile">
      <div className="flex items-center justify-between border-b border-border bg-surface-2/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><Layers3 className="h-4 w-4" /></div>
          <div>
            <p className="text-[12.5px] font-bold">Campanha Black Friday VIP</p>
            <p className="text-[10.5px] text-muted-foreground">Segmento: cripto · pacote Growth</p>
          </div>
        </div>
        <span className="rounded-full bg-success/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-success">ativa</span>
      </div>
      <div className="grid gap-0 md:grid-cols-[1fr_190px]">
        <div className="space-y-3 p-4">
          <MiniMetric icon={Send} label="Enviadas" value="1.000" progress="w-[92%]" />
          <MiniMetric icon={Check} label="Entregues" value="987" progress="w-[88%]" />
          <MiniMetric icon={MousePointerClick} label="Cliques" value="124" progress="w-[44%]" />
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="mb-2 flex items-center justify-between text-[10.5px] text-muted-foreground">
              <span>Atividade ao vivo</span>
              <span>agora</span>
            </div>
            {[
              "Lucas clicou no CTA",
              "39 DMs entregues no último minuto",
              "Público gaming pausado",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 border-t border-border/50 py-2 first:border-t-0">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <p className="text-[11.5px] text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border bg-background/30 p-4 md:border-l md:border-t-0">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Mensagem</p>
          <div className="mt-3 rounded-2xl rounded-br-md bg-primary/20 p-3 text-[12px] leading-relaxed">
            Oferta liberada por poucas horas. Clique e garanta a condição VIP.
          </div>
          <button type="button" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-[11.5px] font-bold text-primary">
            <Copy className="h-3.5 w-3.5" /> Duplicar criativo
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value, progress }: { icon: typeof Send; label: string; value: string; progress: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/35 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" /> {label}</span>
        <span className="font-display text-lg font-bold tabular">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className={cn("h-full rounded-full gradient-primary", progress)} /></div>
    </div>
  );
}

function Step({ number, icon: Icon, title, text }: { number: string; icon: typeof MessageCircle; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/45 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
        <span className="font-mono text-[12px] font-bold text-muted-foreground">{number}</span>
      </div>
      <h3 className="mt-4 font-display text-[17px] font-bold tracking-normal">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function Plan({ name, qty, price, tag, popular }: { name: string; qty: number; price: string; tag: string; popular?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-surface-1 p-5", popular ? "border-primary/60 shadow-glow" : "border-border")}>
      {popular ? <span className="absolute right-3 top-3 rounded-full gradient-primary px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">Popular</span> : null}
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">{tag}</p>
      <h3 className="mt-2 font-display text-xl font-bold tracking-normal">{name}</h3>
      <p className="mt-4 font-display text-4xl font-bold tabular text-gradient-primary">{compactNumber(qty)}</p>
      <p className="text-[11.5px] text-muted-foreground">DMs no saldo</p>
      <p className="mt-5 font-display text-2xl font-bold tabular">{price}</p>
      <ul className="mt-4 space-y-2 text-[12px] text-muted-foreground">
        <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> QR Code PIX</li>
        <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Saldo sem expiração</li>
        <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> Métricas ao vivo</li>
      </ul>
      <Link to="/auth" className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-[12px] font-bold transition hover:border-primary/50">
        Comprar pacote <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Signal({ icon: Icon, title, text }: { icon: typeof Gauge; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/45 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
      <h3 className="mt-3 font-display text-[16px] font-bold tracking-normal">{title}</h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" onClick={() => setOpen((value) => !value)} className="w-full rounded-2xl border border-border bg-surface-1 p-4 text-left transition hover:border-primary/40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13.5px] font-bold">{q}</p>
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-90 text-primary")} />
      </div>
      {open ? <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{a}</p> : null}
    </button>
  );
}
