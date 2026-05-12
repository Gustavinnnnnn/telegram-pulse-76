import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createParadiseTransaction, getParadiseTransaction } from "./paradise.server";
import type { Database } from "@/integrations/supabase/types";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const checkoutSchema = z.object({
  package_id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  document: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

function admin() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context as any;

    const { data: pkg, error: pkgErr } = await supabase
      .from("dm_packages").select("*").eq("id", data.package_id).maybeSingle();
    if (pkgErr || !pkg) throw new Error("Pacote inválido");

    const reference = `tla_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
    const amountCents = Math.round(Number(pkg.price_brl) * 100);

    const origin = process.env.PUBLIC_APP_URL ||
      "https://project--3f164f0d-eb76-4b26-a09b-f90951ebe76d.lovable.app";
    const postbackUrl = `${origin}/api/public/paradise-webhook`;

    // Default doc/phone — we don't ask the customer for these on the form
    const docDigits = onlyDigits(data.document || "") || "00000000000";
    const phoneDigits = onlyDigits(data.phone || "") || "11999999999";

    let tx;
    try {
      tx = await createParadiseTransaction({
        amountCents,
        description: `${pkg.name} — ${pkg.quantity} DMs`,
        reference,
        postbackUrl,
        customer: {
          name: data.name,
          email: data.email,
          document: docDigits,
          phone: phoneDigits,
        },
      });
    } catch (err) {
      console.error("[createCheckout] Paradise error:", err);
      throw new Error(err instanceof Error ? err.message : "Falha ao gerar PIX na Paradise");
    }
    if (!tx?.qr_code) {
      console.error("[createCheckout] Paradise sem qr_code:", tx);
      throw new Error("Paradise não retornou QR code");
    }

    const ad = admin();
    const { data: intent, error: intErr } = await ad.from("payment_intents").insert({
      user_id: userId,
      package_id: pkg.id,
      package_name: pkg.name,
      quantity: pkg.quantity,
      amount_cents: amountCents,
      customer_name: data.name,
      customer_email: data.email,
      customer_document: docDigits,
      customer_phone: phoneDigits,
      reference,
      gateway_transaction_id: String(tx.transaction_id),
      qr_code: tx.qr_code,
      qr_code_base64: tx.qr_code_base64,
      expires_at: tx.expires_at ? new Date(tx.expires_at.replace(" ", "T")).toISOString() : null,
      status: "pending",
    }).select().single();
    if (intErr) throw new Error(intErr.message);

    return { intent_id: intent.id };
  });

export const getCheckoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ intent_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    const ad = admin();
    const { data: intent } = await ad.from("payment_intents").select("*").eq("id", data.intent_id).eq("user_id", userId).maybeSingle();
    if (!intent) throw new Error("Pagamento não encontrado");

    // If still pending, poll Paradise to refresh
    if (intent.status === "pending" && intent.gateway_transaction_id) {
      try {
        const tx = await getParadiseTransaction(intent.gateway_transaction_id);
        if (tx.status === "approved") {
          await ad.rpc("confirm_payment_intent", {
            _reference: intent.reference,
            _gateway_tx: String(tx.id),
          });
          const { data: refreshed } = await ad.from("payment_intents").select("*").eq("id", intent.id).maybeSingle();
          return refreshed!;
        }
        if (["failed", "refunded", "chargeback"].includes(tx.status)) {
          await ad.from("payment_intents").update({ status: tx.status }).eq("id", intent.id);
        }
      } catch (e) {
        console.error("Paradise poll error", e);
      }
    }
    return intent;
  });
