import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Receipt, Settings as SettingsIcon, LogOut, Menu, X, Shield, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  component: AdminRoot,
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
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Verificando acesso…</div>;
  }
  if (!user) {
    return <AdminLogin />;
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <Shield className="h-10 w-10 text-destructive" />
        <h1 className="text-xl font-bold">Acesso negado</h1>
        <p className="text-sm text-muted-foreground">Esta conta não tem permissão de administrador.</p>
        <button onClick={() => signOut()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Entrar com outra conta
        </button>
      </div>
    );
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
            <Logo size={28} />
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

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error("Esta conta não é administradora.");
      }
      toast.success("Bem-vindo, admin!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground">Acesso restrito à equipe da plataforma</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail do admin" className={inputCls} />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className={inputCls} />
            <button type="submit" disabled={busy} className="w-full rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50">
              {busy ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Não é admin? <Link to="/auth" className="text-primary underline">Entrar como usuário</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

