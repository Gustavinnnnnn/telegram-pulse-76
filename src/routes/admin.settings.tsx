import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT } from "@/lib/support";
import { useWhatsAppUrl, useUpdateWhatsAppUrl } from "@/lib/settings";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type Pkg = { id: string; name: string; quantity: number; price_brl: number; sort_order: number; featured: boolean };

function AdminSettings() {
  const qc = useQueryClient();
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: async (): Promise<Pkg[]> => {
      const { data, error } = await supabase.from("dm_packages").select("*").order("sort_order");
      if (error) throw error;
      return data as Pkg[];
    },
  });

  const [draft, setDraft] = useState<Record<string, Partial<Pkg>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const onChange = (id: string, patch: Partial<Pkg>) => {
    setDraft(d => ({ ...d, [id]: { ...d[id], ...patch } }));
  };

  const save = async (pkg: Pkg) => {
    const patch = draft[pkg.id];
    if (!patch || Object.keys(patch).length === 0) return;
    setBusy(pkg.id);
    try {
      const { error } = await supabase.from("dm_packages").update(patch).eq("id", pkg.id);
      if (error) throw error;
      toast.success("Pacote atualizado");
      setDraft(d => { const n = { ...d }; delete n[pkg.id]; return n; });
      await qc.invalidateQueries({ queryKey: ["admin", "packages"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este pacote?")) return;
    setBusy(id);
    try {
      const { error } = await supabase.from("dm_packages").delete().eq("id", id);
      if (error) throw error;
      toast.success("Pacote removido");
      await qc.invalidateQueries({ queryKey: ["admin", "packages"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(null); }
  };

  const create = async () => {
    setBusy("new");
    try {
      const sort = packages.length ? Math.max(...packages.map(p => p.sort_order)) + 1 : 1;
      const { error } = await supabase.from("dm_packages").insert({
        name: "Novo pacote", quantity: 100, price_brl: 49.9, sort_order: sort, featured: false,
      });
      if (error) throw error;
      toast.success("Pacote criado");
      await qc.invalidateQueries({ queryKey: ["admin", "packages"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie pacotes, gateway e canais de suporte</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pacotes de DMs</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Gateway aceita até R$ 400 por transação. Edite os valores diretamente nos campos.</p>
          </div>
          <button onClick={create} disabled={busy === "new"}
            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50">
            {busy === "new" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Novo pacote
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2 text-left">Nome</th><th className="text-right">Quantidade DM</th><th className="text-right">Preço (R$)</th><th className="text-center">Destaque</th><th className="text-right">Ordem</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Carregando…</td></tr>}
              {packages.map(p => {
                const d = { ...p, ...draft[p.id] };
                const dirty = !!draft[p.id];
                return (
                  <tr key={p.id} className="hover:bg-surface-1/40">
                    <td className="py-2 pr-2"><input value={d.name} onChange={(e) => onChange(p.id, { name: e.target.value })} className="w-full rounded-md border border-border bg-input/50 px-2 py-1.5 text-sm outline-none focus:border-primary" /></td>
                    <td className="px-2 py-2"><input type="number" value={d.quantity} onChange={(e) => onChange(p.id, { quantity: parseInt(e.target.value) || 0 })} className="w-24 rounded-md border border-border bg-input/50 px-2 py-1.5 text-right text-sm tabular outline-none focus:border-primary" /></td>
                    <td className="px-2 py-2"><input type="number" step="0.01" value={d.price_brl} onChange={(e) => onChange(p.id, { price_brl: parseFloat(e.target.value) || 0 })} className="w-24 rounded-md border border-border bg-input/50 px-2 py-1.5 text-right text-sm tabular outline-none focus:border-primary" /></td>
                    <td className="px-2 py-2 text-center"><input type="checkbox" checked={d.featured} onChange={(e) => onChange(p.id, { featured: e.target.checked })} className="h-4 w-4 accent-primary" /></td>
                    <td className="px-2 py-2"><input type="number" value={d.sort_order} onChange={(e) => onChange(p.id, { sort_order: parseInt(e.target.value) || 0 })} className="w-16 rounded-md border border-border bg-input/50 px-2 py-1.5 text-right text-sm tabular outline-none focus:border-primary" /></td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button disabled={!dirty || busy === p.id} onClick={() => save(p)}
                          className="rounded-md border border-primary/40 bg-primary/10 p-1.5 text-primary hover:bg-primary/20 disabled:opacity-30">
                          {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        </button>
                        <button disabled={busy === p.id} onClick={() => remove(p.id)} className="rounded-md border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Canais de suporte</h2>
        <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
          <div className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-3">
            <div className="flex items-center gap-2 text-[#25D366]"><MessageCircle className="h-4 w-4" /><span className="font-bold">Grupo WhatsApp</span></div>
            <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{SUPPORT.whatsappGroupUrl}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">Edite em <code className="rounded bg-surface-2 px-1">src/lib/support.ts</code></p>
          </div>
          <div className="rounded-lg border border-border bg-surface-1/50 p-3 opacity-60">
            <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /><span className="font-bold">Discord</span></div>
            <p className="mt-1 text-[11px] text-muted-foreground">Em breve</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gateway de pagamento</h2>
        <div className="mt-3 grid gap-2 text-[13px]">
          <Row label="Provedor" value="Paradise PIX" />
          <Row label="Limite por transação" value="R$ 400,00" />
          <Row label="Webhook" value="/api/public/paradise-webhook" mono />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Acesso administrativo</h2>
        <p className="mt-2 text-[13px] text-muted-foreground">Apenas contas com role admin acessam este painel. Para conceder acesso, insira a role correspondente em <code className="rounded bg-surface-2 px-1">user_roles</code>.</p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-[11px]" : "font-semibold"}>{value}</span>
    </div>
  );
}
