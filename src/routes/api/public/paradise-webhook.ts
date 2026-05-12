import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paradise-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.text();
          console.log("[paradise-webhook] body:", body.slice(0, 800));
          let payload: any;
          try { payload = JSON.parse(body); } catch {
            return new Response("invalid json", { status: 400 });
          }
          const status: string | undefined = payload?.status;
          const reference: string | undefined = payload?.external_id ?? payload?.reference;
          const gatewayTx: string | undefined = payload?.transaction_id ? String(payload.transaction_id) : undefined;
          if (!reference) return new Response("missing reference", { status: 400 });

          if (status === "approved") {
            const { error } = await supabaseAdmin.rpc("confirm_payment_intent", {
              _reference: reference,
              _gateway_tx: gatewayTx ?? "",
            });
            if (error) console.error("[paradise-webhook] confirm error", error);
          } else if (status) {
            await supabaseAdmin.from("payment_intents").update({ status }).eq("reference", reference);
          }
          return new Response("ok");
        } catch (e) {
          console.error("[paradise-webhook] error", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
