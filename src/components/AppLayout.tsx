import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Megaphone, PlusCircle, Package, Settings, LogOut, Search, Bell, ChevronDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile, useCampaigns } from "@/lib/queries";
import { useAuth } from "@/contexts/AuthContext";
import { Logo, Wordmark } from "./Logo";
import { shortId } from "@/lib/format";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/campaigns", label: "Campanhas", icon: Megaphone },
  { to: "/campaigns/new", label: "Criar campanha", icon: PlusCircle, accent: true },
] as const;
const accountNav = [
  { to: "/store", label: "Loja de DMs", icon: Package },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { data: campaigns = [] } = useCampaigns();
  const { signOut, user } = useAuth();
  const initial = (profile?.display_name || user?.email || "U").charAt(0).toUpperCase();
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const accountId = user ? shortId(user.id) : "------";

  const isActive = (to: string, end?: boolean) => (end ? pathname === to : pathname === to || pathname.startsWith(to + "/") || pathname.startsWith(to + "?") || pathname === to);

  return (
    <div className="min-h-screen text-foreground">
      {/* === DESKTOP SIDEBAR === */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-sidebar-border/70 bg-sidebar/85 backdrop-blur-xl md:flex">
        <div className="flex h-[60px] items-center gap-2.5 px-5">
          <Logo size={32} />
          <Wordmark />
        </div>

        <div className="px-3 pb-2">
          <button className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-surface-1/60 px-2.5 py-2 text-left text-[12px] text-muted-foreground transition hover:border-primary/40">
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1">Buscar…</span>
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-px text-[9px] font-mono">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3 scroll-thin">
          <p className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">Anúncios</p>
          <ul className="space-y-0.5">
            {mainNav.map((item) => {
              const active = isActive(item.to, "end" in item ? item.end : false);
              const Icon = item.icon;
              const showActiveCount = item.to === "/campaigns" && activeCount > 0;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                      active
                        ? "bg-primary/12 text-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-foreground",
                      ("accent" in item && item.accent) && !active && "text-primary",
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />}
                    <Icon className={cn("h-4 w-4", active && "text-primary")} strokeWidth={1.75} />
                    <span className="flex-1">{item.label}</span>
                    {showActiveCount && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold text-success">
                        <span className="dot-live !h-1.5 !w-1.5" /> {activeCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-5 px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">Conta</p>
          <ul className="space-y-0.5">
            {accountNav.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                      active ? "bg-primary/12 text-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-foreground",
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />}
                    <Icon className={cn("h-4 w-4", active && "text-primary")} strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Account chip */}
        <div className="m-2.5 rounded-xl border border-border/60 bg-surface-1/70 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-[13px] font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-tight">{profile?.display_name || user?.email?.split("@")[0]}</p>
              <p className="truncate text-[10px] font-mono text-muted-foreground">TLG · {accountId}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sair"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-surface-2 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-[238px]">
        {/* === TOPBAR === */}
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between gap-3 border-b border-border/50 bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-2.5 md:hidden">
            <Logo size={28} />
            <Wordmark />
          </div>

          <div className="hidden items-center gap-1.5 md:flex">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/60 px-2.5 py-1.5 text-[11px] font-semibold transition hover:border-primary/40">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-primary to-primary-glow text-[8px] text-white">A</span>
              {profile?.display_name || user?.email?.split("@")[0] || "Conta"}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <span className="rounded-md border border-border/60 bg-surface-1/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">
              ID · {accountId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/store" className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 transition hover:bg-primary/15 sm:flex">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">DMs</span>
              <span className="font-display text-sm font-bold tabular text-gradient-primary">
                {(profile?.dm_balance ?? 0).toLocaleString("pt-BR")}
              </span>
              <span className="ml-1 rounded-md gradient-primary px-1.5 py-0.5 text-[9px] font-bold text-white">+</span>
            </Link>

            <button className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-surface-1/60 text-muted-foreground transition hover:text-foreground">
              <Bell className="h-3.5 w-3.5" />
              {activeCount > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning" />}
            </button>

            <Link to="/settings" className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-[13px] font-bold text-white">
              {initial}
            </Link>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 md:px-6 md:pb-10 animate-[fade-in_0.4s_ease-out]">
          <Outlet />
        </main>
      </div>

      {/* === MOBILE BOTTOM NAV === */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sidebar-border/70 bg-sidebar/95 backdrop-blur-xl md:hidden">
        <ul className="grid grid-cols-5">
          {[mainNav[0], mainNav[1], mainNav[2], accountNav[0], accountNav[1]].map((item) => {
            const active = isActive(item.to, "end" in item ? item.end : false);
            const Icon = item.icon;
            const isCreate = item.to === "/campaigns/new";
            return (
              <li key={item.to} className="flex justify-center">
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-2 text-[9.5px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isCreate ? (
                    <span className="-mt-7 flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary glow-primary text-white">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                  ) : (
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  )}
                  <span>{item.label.split(" ")[0]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
