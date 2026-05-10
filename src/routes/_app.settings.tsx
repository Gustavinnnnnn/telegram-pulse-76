import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const inputCls =
    "w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

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
            <input defaultValue="Usuário Demo" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">E-mail</span>
            <input defaultValue="demo@teleads.app" className={inputCls} />
          </label>
        </div>
      </section>

      <section className="card-elevated p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Preferências de notificação</h2>
        <div className="mt-4 space-y-3">
          {["Campanha pausada", "Saldo baixo", "Relatório diário"].map((label) => (
            <label key={label} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
              <span className="text-sm font-medium">{label}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[oklch(0.68_0.14_230)]" />
            </label>
          ))}
        </div>
      </section>

      <button
        onClick={() => toast.success("Preferências salvas!")}
        className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
      >
        Salvar alterações
      </button>
    </div>
  );
}
