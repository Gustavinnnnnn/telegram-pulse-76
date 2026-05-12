import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/sales")({
  component: AdminSales,
});

function AdminSales() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["admin", "sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_purchases")
        .select("id, package_name, quantity, price_brl, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "sales-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, display_name");
      if (error) throw error;
      return data;
    },
  });

  const profMap = useMemo(() => {
    const m = new Map<string, { email: string | null; name: string | null }>();
    profiles.forEach(p => m.set(p.id, { email: p.email, name: p.display_name }));
    return m;
  }, [profiles]);

  const filtered = sales.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (q) {
      const prof = profMap.get(s.user_id);
      const hay = `${s.package_name} ${prof?.email || ""} ${prof?.name || ""} ${s.user_id}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const paid = filtered.filter(s => s.status === "paid");
  const total = paid.reduce((s, p) => s + Number(p.price_brl), 0);
  const totalDms = paid.reduce((s, p) => s + p.quantity, 0);
  const ticketAvg = paid.length ? total / paid.length : 0;

  const exportCsv = () => {
    const rows = [
      ["data", "pacote", "comprador_email", "comprador_nome", "user_id", "dms", "valor_brl", "status"],
      ...filtered.map(s => {
        const p = profMap.get(s.user_id);
        return [
          new Date(s.created_at).toISOString(),
          s.package_name,
          p?.email || "",
          p?.name || "",
          s.user_id,
          s.quantity.toString(),
          Number(s.price_brl).toFixed(2),
          s.status,
        ];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vendas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de vendas</h1>
          <p className="text-sm text-muted-foreground">{paid.length} pagas — R$ {total.toFixed(2)} — ticket R$ {ticketAvg.toFixed(2)} — {totalDms.toLocaleString("pt-BR")} DMs</p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-[12px] font-bold text-primary-foreground hover:brightness-110">
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por pacote, email ou ID…"
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(["all", "paid", "pending"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition",
                statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {s === "all" ? "Todos" : s === "paid" ? "Pagas" : "Pendentes"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Pacote</th>
              <th className="px-3 py-2 text-left">Comprador</th>
              <th className="px-3 py-2 text-right">DMs</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Carregando…</td></tr>}
            {filtered.map(s => {
              const p = profMap.get(s.user_id);
              return (
                <tr key={s.id} className="hover:bg-surface-1/40">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2 font-semibold">{s.package_name}</td>
                  <td className="px-3 py-2">
                    <p className="text-[12px]">{p?.name || p?.email || "—"}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{s.user_id.slice(0, 8)}</p>
                  </td>
                  <td className="px-3 py-2 text-right tabular">{s.quantity.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2 text-right font-bold tabular text-success">R$ {Number(s.price_brl).toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                      s.status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma venda encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
