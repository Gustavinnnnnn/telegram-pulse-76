import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Megaphone, PlusCircle, Wallet, Settings, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/campaigns", label: "Campanhas", icon: Megaphone },
  { to: "/campaigns/new", label: "Criar", icon: PlusCircle },
  { to: "/wallet", label: "Carteira", icon: Wallet },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary glow-primary">
            <Send className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">TeleAds</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Telegram Ads Platform</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 transition-transform group-hover:scale-110", active && "text-primary")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="m-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Saldo disponível</p>
          <p className="mt-1 text-xl font-bold text-gradient-primary">R$ 1.247,80</p>
          <Link
            to="/wallet"
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Adicionar créditos
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Send className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">TeleAds</span>
          </div>
          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground">Bem-vindo de volta</p>
            <p className="text-sm font-semibold">Painel de campanhas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium md:block">
              <span className="text-muted-foreground">Saldo: </span>
              <span className="text-gradient-primary font-bold">R$ 1.247,80</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-bold text-primary-foreground">
              U
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 md:px-8 md:pb-12 animate-[fade-in_0.4s_ease-out]">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-border bg-sidebar/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            const isCreate = item.to === "/campaigns/new";
            return (
              <li key={item.to} className="flex justify-center">
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isCreate ? (
                    <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full gradient-primary glow-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
