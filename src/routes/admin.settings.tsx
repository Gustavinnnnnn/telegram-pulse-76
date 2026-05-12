import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { data: packages = [] } = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_packages").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Pacotes de DMs e parâmetros da plataforma</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pacotes ativos</h2>
        <p className="mt-1 text-[12px] text-muted-foreground">O gateway de pagamento aceita até R$ 400 por transação. Não cadastre pacotes acima desse valor.</p>
        <div className="mt-4 divide-y divide-border">
          {packages.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.quantity.toLocaleString("pt-BR")} DMs</p>
              </div>
              <span className="font-display text-lg font-bold tabular text-primary">R$ {Number(p.price_brl).toFixed(2)}</span>
            </div>
          ))}
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
        <p className="mt-2 text-[13px] text-muted-foreground">Apenas a conta cadastrada como administrador tem acesso a este painel. Para revogar acesso, remova a role correspondente no banco de dados.</p>
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
