import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PARADISE_URL = "https://multi.paradisepags.com/api/v1/transaction.php";

export const Route = createFileRoute("/api/public/paradise-create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.PARADISE_API_KEY;
          if (!apiKey) {
            return Response.json({ error: "PARADISE_API_KEY não configurada no servidor" }, { status: 500 });
          }

          // Auth: get user from bearer token
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) return Response.json({ error: "Não autenticado" }, { status: 401 });

          const userClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userData, error: userErr } = await userClient.auth.getUser();
          if (userErr || !userData.user) return Response.json({ error: "Sessão inválida" }, { status: 401 });
          const user = userData.user;

          const body = await request.json().catch(() => null) as {
            package_id?: string;
            customer?: { name?: string; email?: string; document?: string; phone?: string };
          } | null;
          if (!body?.package_id || !body.customer) {
            return Response.json({ error: "package_id e customer são obrigatórios" }, { status: 400 });
          }
          const c = body.customer;
          if (!c.name || !c.email || !c.document || !c.phone) {
            return Response.json({ error: "Dados do cliente incompletos" }, { status: 400 });
          }
          const doc = c.document.replace(/\D/g, "");
          const phone = c.phone.replace(/\D/g, "");
          if (doc.length < 11) return Response.json({ error: "CPF inválido" }, { status: 400 });
          if (phone.length < 10) return Response.json({ error: "Telefone inválido" }, { status: 400 });

          // Load package
          const { data: pkg, error: pkgErr } = await supabaseAdmin
            .from("dm_packages")
            .select("*")
            .eq("id", body.package_id)
            .maybeSingle();
          if (pkgErr || !pkg) return Response.json({ error: "Pacote não encontrado" }, { status: 404 });

          const amount_cents = Math.round(Number(pkg.price_brl) * 100);
          const reference = `dm-${user.id.slice(0, 8)}-${Date.now()}`;

          const payload = {
            amount: amount_cents,
            description: pkg.name,
            reference,
            source: "api_externa",
            customer: { name: c.name, email: c.email, document: doc, phone },
          };

          console.log("[paradise-create] POST", PARADISE_URL, "ref:", reference, "amount:", amount_cents);
          const res = await fetch(PARADISE_URL, {
            method: "POST",
            headers: {
              "X-API-Key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          const text = await res.text();
          console.log("[paradise-create] status:", res.status, "body:", text.slice(0, 800));
          if (!res.ok) {
            return Response.json({ error: `Paradise HTTP ${res.status}`, detail: text.slice(0, 400) }, { status: 502 });
          }
          let json: any;
          try { json = JSON.parse(text); } catch {
            return Response.json({ error: "Resposta inválida da Paradise" }, { status: 502 });
          }
          const qr_code: string | undefined = json.qr_code;
          const qr_code_base64: string | undefined = json.qr_code_base64;
          const gateway_tx = json.transaction_id ? String(json.transaction_id) : null;
          if (!qr_code) {
            return Response.json({ error: "Paradise não retornou qr_code", detail: json }, { status: 502 });
          }

          const expiresAt = json.expires_at ? new Date(json.expires_at.replace(" ", "T") + "Z").toISOString() : null;

          const { data: intent, error: intErr } = await supabaseAdmin
            .from("payment_intents")
            .insert({
              user_id: user.id,
              package_id: pkg.id,
              package_name: pkg.name,
              quantity: pkg.quantity,
              amount_cents,
              reference,
              gateway_transaction_id: gateway_tx,
              customer_name: c.name,
              customer_email: c.email,
              customer_document: doc,
              customer_phone: phone,
              qr_code,
              qr_code_base64: qr_code_base64 ?? null,
              status: "pending",
              expires_at: expiresAt,
            })
            .select()
            .single();
          if (intErr) {
            console.error("[paradise-create] insert intent failed:", intErr);
            return Response.json({ error: "Falha ao salvar intenção de pagamento" }, { status: 500 });
          }

          return Response.json({
            intent_id: intent.id,
            reference,
            qr_code,
            qr_code_base64: qr_code_base64 ?? null,
            amount_cents,
            expires_at: expiresAt,
          });
        } catch (e) {
          console.error("[paradise-create] error", e);
          return Response.json({ error: e instanceof Error ? e.message : "Erro inesperado" }, { status: 500 });
        }
      },
    },
  },
});
