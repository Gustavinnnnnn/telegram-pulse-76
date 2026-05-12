import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Minus, Ban, CheckCircle2, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/members")({
  component: AdminMembers,
});

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  dm_balance: number;
  banned: boolean;
  created_at: string;
};

function AdminMembers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin", "members"],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, dm_balance, banned, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["admin", "members-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_purchases")
        .select("user_id, price_brl, status");
      if (error) throw error;
      return data;
    },
  });

  const purchaseMap = new Map<string, { count: number; revenue: number }>();
  purchases.filter(p => p.status === "paid").forEach(p => {
    const cur = purchaseMap.get(p.user_id) || { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(p.price_brl);
    purchaseMap.set(p.user_id, cur);
  });

  const filtered = members.filter(m =>
    !q || m.email?.toLowerCase().includes(q.toLowerCase()) || m.display_name?.toLowerCase().includes(q.toLowerCase())
  );

  const adjustBalance = async (userId: string, delta: number) => {
    setBusyId(userId);
    try {
      const { error } = await supabase.rpc("admin_adjust_balance", { _user_id: userId, _delta: delta });
      if (error) throw error;
      toast.success(delta > 0 ? `+${delta} DMs adicionadas` : `${delta} DMs removidas`);
      await qc.invalidateQueries({ queryKey: ["admin", "members"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally { setBusyId(null); }
  };

  const toggleBan = async (userId: string, banned: boolean) => {
    setBusyId(userId);
    try {
      const { error } = await supabase.rpc("admin_set_banned", { _user_id: userId, _banned: !banned });
      if (error) throw error;
      toast.success(!banned ? "Usuário banido" : "Usuário desbanido");
      await qc.invalidateQueries({ queryKey: ["admin", "members"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally { setBusyId(null); }
  };

  const promptAdjust = (userId: string) => {
    const raw = prompt("Quantas DMs adicionar? (use número negativo para remover)");
    if (!raw) return;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n === 0) { toast.error("Valor inválido"); return; }
    adjustBalance(userId, n);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Membros</h1>
        <p className="text-sm text-muted-foreground">{members.length} contas — {purchaseMap.size} compradores</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por email ou nome…"
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Usuário</th>
              <th className="px-3 py-2 text-right">Saldo DM</th>
              <th className="px-3 py-2 text-right">Compras</th>
              <th className="px-3 py-2 text-right">Receita</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Carregando…</td></tr>}
            {filtered.map(m => {
              const p = purchaseMap.get(m.id);
              return (
                <tr key={m.id} className={cn("hover:bg-surface-1/50", m.banned && "opacity-60")}>
                  <td className="px-3 py-3">
                    <p className="font-semibold">{m.display_name || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{m.email || m.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-bold tabular text-primary">{m.dm_balance.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-3 text-right tabular">{p?.count || 0}</td>
                  <td className="px-3 py-3 text-right tabular text-success">R$ {(p?.revenue || 0).toFixed(2)}</td>
                  <td className="px-3 py-3 text-center">
                    {m.banned
                      ? <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">BANIDO</span>
                      : <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">ATIVO</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button disabled={busyId === m.id} onClick={() => promptAdjust(m.id)} title="Ajustar saldo"
                        className="rounded-md border border-border bg-surface-2 p-1.5 text-muted-foreground hover:text-primary disabled:opacity-50">
                        {busyId === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      </button>
                      <button disabled={busyId === m.id} onClick={() => adjustBalance(m.id, -100)} title="Remover 100"
                        className="rounded-md border border-border bg-surface-2 p-1.5 text-muted-foreground hover:text-warning disabled:opacity-50">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button disabled={busyId === m.id} onClick={() => toggleBan(m.id, m.banned)} title={m.banned ? "Desbanir" : "Banir"}
                        className={cn("rounded-md border p-1.5 disabled:opacity-50",
                          m.banned ? "border-success/40 text-success hover:bg-success/10" : "border-destructive/40 text-destructive hover:bg-destructive/10")}>
                        {m.banned ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
