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

  const res = await fetch(`${PARADISE_BASE}/transaction.php`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`Paradise: resposta inválida (${res.status})`); }
  if (!res.ok || json?.status === "error") {
    throw new Error(json?.message || `Paradise: erro ${res.status}`);
  }
  return json as ParadiseTransactionResponse;
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
