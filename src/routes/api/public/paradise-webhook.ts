import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/paradise-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          // Optional shared secret check
          const expected = process.env.PARADISE_WEBHOOK_SECRET;
          if (expected) {
            const provided = request.headers.get("x-webhook-secret") || (payload as any)?.secret;
            if (provided !== expected) {
              return new Response("unauthorized", { status: 401 });
            }
          }

          const reference: string | undefined = payload?.external_id || payload?.reference;
          const status: string | undefined = payload?.status;
          const txId: string | undefined = payload?.transaction_id ? String(payload.transaction_id) : undefined;
          if (!reference || !status) return new Response("bad payload", { status: 400 });

          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );

          if (status === "approved") {
            await supabase.rpc("confirm_payment_intent", { _reference: reference, _gateway_tx: txId ?? "" });
          } else {
            await supabase.from("payment_intents")
              .update({ status, gateway_transaction_id: txId ?? null })
              .eq("reference", reference);
          }
          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("paradise webhook error", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
