import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProfile } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setName(profile.display_name);
  }, [profile]);

  const inputCls =
    "w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado!");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie a sua conta e preferências</p>
      </div>

      <section className="card-elevated p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Perfil</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">E-mail</span>
            <input value={user?.email ?? ""} disabled className={inputCls + " opacity-60"} />
          </label>
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="mt-4 rounded-xl gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>

      <section className="card-elevated p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Conta</h2>
        <button
          onClick={() => signOut()}
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20"
        >
          Sair da conta
        </button>
      </section>
    </div>
  );
}
