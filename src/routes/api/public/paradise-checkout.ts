import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const PARADISE_BASE = "https://multi.paradisepags.com/api/v1";
const checkoutSchema = z.object({ package_id: z.string().uuid(), name: z.string().trim().min(2), email: z.string().trim().email() });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getUserId(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Não autenticado");
  const client = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Sessão inválida");
  return data.claims.sub;
}

async function paradiseCreate(input: { amountCents: number; description: string; reference: string; postbackUrl: string; customer: { name: string; email: string; document: string; phone: string } }) {
  const apiKey = process.env.PARADISE_API_KEY;
  if (!apiKey) throw new Error("Token da Paradise não configurado");
  console.log("[Paradise checkout] key/meta", { length: apiKey.length, prefix: apiKey.slice(0, 3), suffix: apiKey.slice(-3) });
  const res = await fetch(`${PARADISE_BASE}/transaction.php`, {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ amount: input.amountCents, description: input.description, reference: input.reference, postback_url: input.postbackUrl, source: "api_externa", customer: input.customer }),
  });
  const text = await res.text();
  console.log("[Paradise checkout] response", { status: res.status, body: text.slice(0, 700) });
  const raw = JSON.parse(text);
  if (!res.ok || raw?.status === "error" || raw?.success === false) throw new Error(raw?.message || raw?.error || `Paradise HTTP ${res.status}`);
  const tx = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  return { ...tx, qr_code: tx.qr_code || tx.pix?.qr_code, qr_code_base64: tx.qr_code_base64 || tx.pix?.qr_code_base64, transaction_id: tx.transaction_id || tx.id };
}

async function paradiseGet(id: string) {
  const apiKey = process.env.PARADISE_API_KEY;
  if (!apiKey) throw new Error("Token da Paradise não configurado");
  const res = await fetch(`${PARADISE_BASE}/query.php?action=get_transaction&id=${encodeURIComponent(id)}`, { headers: { "X-API-Key": apiKey, Accept: "application/json" } });
  const raw = await res.json();
  if (!res.ok) throw new Error(raw?.message || `Paradise HTTP ${res.status}`);
  return raw;
}

export const Route = createFileRoute("/api/public/paradise-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await getUserId(request);
          const data = checkoutSchema.parse(await request.json());
          const ad = admin();
          const { data: pkg, error: pkgErr } = await ad.from("dm_packages").select("*").eq("id", data.package_id).maybeSingle();
          if (pkgErr || !pkg) return json({ error: "Pacote inválido" }, 400);

          const reference = `tla_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
          const amountCents = Math.round(Number(pkg.price_brl) * 100);
          const origin = process.env.PUBLIC_APP_URL || new URL(request.url).origin;
          const tx = await paradiseCreate({
            amountCents,
            description: `${pkg.name} — ${pkg.quantity} DMs`,
            reference,
            postbackUrl: `${origin}/api/public/paradise-webhook`,
            customer: { name: data.name, email: data.email, document: "05531510101", phone: "11999999999" },
          });
          if (!tx.qr_code) return json({ error: "Paradise não retornou QR code" }, 502);

          const { data: intent, error } = await ad.from("payment_intents").insert({
            user_id: userId, package_id: pkg.id, package_name: pkg.name, quantity: pkg.quantity, amount_cents: amountCents,
            customer_name: data.name, customer_email: data.email, customer_document: "05531510101", customer_phone: "11999999999",
            reference, gateway_transaction_id: String(tx.transaction_id), qr_code: tx.qr_code, qr_code_base64: tx.qr_code_base64,
            expires_at: tx.expires_at ? new Date(String(tx.expires_at).replace(" ", "T")).toISOString() : null, status: "pending",
          }).select("id").single();
          if (error) return json({ error: error.message }, 500);
          return json({ intent_id: intent.id });
        } catch (e) {
          console.error("[Paradise checkout] error", e);
          return json({ error: e instanceof Error ? e.message : "Erro ao gerar PIX" }, 500);
        }
      },
      GET: async ({ request }) => {
        try {
          const userId = await getUserId(request);
          const intentId = z.string().uuid().parse(new URL(request.url).searchParams.get("intent_id"));
          const ad = admin();
          const { data: intent } = await ad.from("payment_intents").select("*").eq("id", intentId).eq("user_id", userId).maybeSingle();
          if (!intent) return json({ error: "Pagamento não encontrado" }, 404);
          if (intent.status === "pending" && intent.gateway_transaction_id) {
            const tx = await paradiseGet(intent.gateway_transaction_id).catch(() => null);
            if (tx?.status === "approved") {
              await ad.rpc("confirm_payment_intent", { _reference: intent.reference, _gateway_tx: String(tx.id) });
              const { data: refreshed } = await ad.from("payment_intents").select("*").eq("id", intent.id).maybeSingle();
              return json(refreshed);
            }
          }
          return json(intent);
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "Erro ao consultar PIX" }, 500);
        }
      },
    },
  },
});