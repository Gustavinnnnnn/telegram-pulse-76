// Server-only helper for Paradise (PIX) gateway
const PARADISE_BASE = "https://multi.paradisepags.com/api/v1";

export interface ParadiseTransactionResponse {
  status?: string;
  transaction_id: number;
  id: string;
  qr_code: string;
  qr_code_base64: string;
  amount: number;
  expires_at?: string;
}

export async function createParadiseTransaction(input: {
  amountCents: number;
  description: string;
  reference: string;
  customer: { name: string; email: string; document: string; phone: string };
  postbackUrl?: string;
}): Promise<ParadiseTransactionResponse> {
  const apiKey = process.env.PARADISE_API_KEY;
  if (!apiKey) throw new Error("PARADISE_API_KEY missing");

  const body = {
    amount: input.amountCents,
    description: input.description,
    reference: input.reference,
    source: "api_externa",
    postback_url: input.postbackUrl,
    customer: input.customer,
  };

  console.log("[Paradise] POST /transaction.php", { reference: input.reference, amount: input.amountCents });
  const res = await fetch(`${PARADISE_BASE}/transaction.php`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log("[Paradise] response status=", res.status, "body=", text.slice(0, 800));
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`Paradise respondeu inválido (HTTP ${res.status}): ${text.slice(0, 200)}`); }
  if (!res.ok || json?.status === "error" || json?.success === false) {
    throw new Error(json?.message || json?.error || `Paradise erro HTTP ${res.status}`);
  }
  // Normalize: some responses nest data under `data`
  const tx = (json?.data && typeof json.data === "object") ? json.data : json;
  if (!tx.qr_code && tx.pix?.qr_code) tx.qr_code = tx.pix.qr_code;
  if (!tx.qr_code_base64 && tx.pix?.qr_code_base64) tx.qr_code_base64 = tx.pix.qr_code_base64;
  if (!tx.transaction_id && tx.id) tx.transaction_id = tx.id;
  return tx as ParadiseTransactionResponse;
}

export async function getParadiseTransaction(id: number | string) {
  const apiKey = process.env.PARADISE_API_KEY;
  if (!apiKey) throw new Error("PARADISE_API_KEY missing");
  const res = await fetch(`${PARADISE_BASE}/query.php?action=get_transaction&id=${id}`, {
    headers: { "X-API-Key": apiKey },
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`Paradise: resposta inválida (${res.status})`); }
  if (!res.ok) throw new Error(json?.message || `Paradise: erro ${res.status}`);
  return json as { id: number; external_id: string; status: string };
}
