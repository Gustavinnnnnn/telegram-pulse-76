import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PARADISE_QUERY = "https://multi.paradisepags.com/api/v1/query.php";

export const Route = createFileRoute("/api/public/paradise-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const reference = url.searchParams.get("reference");
          if (!reference) return Response.json({ error: "reference obrigatório" }, { status: 400 });

          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) return Response.json({ error: "Não autenticado" }, { status: 401 });
          const userClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: ud } = await userClient.auth.getUser();
          if (!ud.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

          const { data: intent } = await supabaseAdmin
            .from("payment_intents")
            .select("*")
            .eq("reference", reference)
            .eq("user_id", ud.user.id)
            .maybeSingle();
          if (!intent) return Response.json({ error: "Intenção não encontrada" }, { status: 404 });

          if (intent.status === "approved") {
            return Response.json({ status: "approved", intent_id: intent.id });
          }

          // Poll Paradise
          const apiKey = process.env.PARADISE_API_KEY;
          if (!apiKey) return Response.json({ status: intent.status });

          const qUrl = `${PARADISE_QUERY}?action=list_transactions&external_id=${encodeURIComponent(reference)}`;
          const r = await fetch(qUrl, { headers: { "X-API-Key": apiKey } });
          const text = await r.text();
          console.log("[paradise-status]", reference, r.status, text.slice(0, 400));
          if (!r.ok) return Response.json({ status: intent.status });
          let arr: any;
          try { arr = JSON.parse(text); } catch { return Response.json({ status: intent.status }); }
          const tx = Array.isArray(arr) ? arr[0] : arr;
          const remoteStatus: string | undefined = tx?.status;

          if (remoteStatus === "approved") {
            const { error: rpcErr } = await supabaseAdmin.rpc("confirm_payment_intent", {
              _reference: reference,
              _gateway_tx: tx?.id ? String(tx.id) : null,
            });
            if (rpcErr) console.error("[paradise-status] confirm rpc error", rpcErr);
            return Response.json({ status: "approved", intent_id: intent.id });
          }

          // Update local status if changed
          if (remoteStatus && remoteStatus !== intent.status) {
            await supabaseAdmin.from("payment_intents").update({ status: remoteStatus }).eq("id", intent.id);
          }

          return Response.json({ status: remoteStatus ?? intent.status });
        } catch (e) {
          console.error("[paradise-status] error", e);
          return Response.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
        }
      },
    },
  },
});
