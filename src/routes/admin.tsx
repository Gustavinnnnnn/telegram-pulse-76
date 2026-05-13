import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Receipt, Settings as SettingsIcon, LogOut, Menu, X, Shield, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const Route = createFileRoute("/admin")({
  component: AdminRoot,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Não encontrado" }] }),
});

const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/members", label: "Membros", icon: Users },
  { to: "/admin/sales", label: "Vendas", icon: Receipt },
  { to: "/admin/settings", label: "Configurações", icon: SettingsIcon },
] as const;

function AdminRoot() {
  const { user, loading, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(Boolean(data));
    });
  }, [user, loading]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (loading || isAdmin === null) {
    return <NotFoundShell />;
  }
  if (!user || !isAdmin) {
    return <NotFoundShell />;
  }

  const isActive = (to: string, end?: boolean) => end ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop fixed, mobile drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-sidebar/95 backdrop-blur-xl transition-transform md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Logo size={44} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Admin</p>
              <p className="text-[10px] text-muted-foreground">Painel da plataforma</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, "end" in item ? item.end : false);
            return (
              <Link key={item.to} to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                  active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-border p-3">
          <WhatsAppButton variant="outline" size="sm" label="Suporte" className="w-full" />
          <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Ir para o app
          </Link>
          <button onClick={() => signOut()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/60 md:hidden" />}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <button onClick={() => setOpen(true)} className="md:hidden"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-[13px] font-semibold">Painel administrativo</span>
          </div>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">{user?.email}</span>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

function NotFoundShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
          Voltar
        </Link>
      </div>
    </div>
  );
}

