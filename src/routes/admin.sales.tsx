import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/sales")({
  component: AdminSales,
});

function AdminSales() {
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["admin", "sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_purchases")
        .select("id, package_name, quantity, price_brl, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const paid = sales.filter(s => s.status === "paid");
  const total = paid.reduce((s, p) => s + Number(p.price_brl), 0);
  const totalDms = paid.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Histórico de vendas</h1>
        <p className="text-sm text-muted-foreground">{paid.length} vendas pagas — R$ {total.toFixed(2)} arrecadados — {totalDms.toLocaleString("pt-BR")} DMs</p>
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
            {sales.map(s => (
              <tr key={s.id}>
                <td className="px-3 py-2 text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2 font-semibold">{s.package_name}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{s.user_id.slice(0, 8)}</td>
                <td className="px-3 py-2 text-right tabular">{s.quantity.toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2 text-right font-bold tabular text-success">R$ {Number(s.price_brl).toFixed(2)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    {s.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && sales.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem vendas ainda</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
