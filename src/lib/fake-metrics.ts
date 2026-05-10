// Deterministic fake-but-realistic metrics for campaigns.
// While the real distribution backend isn't ready, we generate believable
// numbers from the campaign id + created_at + budget so the same campaign
// always shows the same evolving stats (and grows over time).

import type { Campaign } from "./queries";

// Seedable PRNG (mulberry32)
function rng(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let t = h >>> 0;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Recipient {
  id: string;
  name: string;
  username: string;
  avatar: string; // emoji
  status: "received" | "blocked" | "not_received" | "replied";
  time: string; // "há X min"
}

export interface FakeMetrics {
  impressions: number;
  views: number;
  clicks: number;
  ctr: number; // %
  cpc: number; // R$
  cpm: number;
  reach: number;
  frequency: number;
  spent: number;
  budget: number;
  // Telegram-specific
  dmsSent: number;
  dmsReceived: number;
  dmsBlocked: number;
  dmsNotReceived: number;
  approvalRate: number; // %
  audienceQuality: number; // %
  conversions: number;
  costPerConversion: number;
  // Series
  hourly: { hour: string; impressions: number; clicks: number; spent: number }[];
  daily: { day: string; impressions: number; clicks: number; spent: number; conversions: number }[];
  recipients: Recipient[];
  channels: { name: string; impressions: number; clicks: number }[];
  demographics: { label: string; value: number }[];
  devices: { label: string; value: number }[];
}

const FIRST_NAMES = ["Lucas","Mariana","João","Ana","Pedro","Beatriz","Rafael","Camila","Bruno","Larissa","Gustavo","Juliana","Felipe","Carolina","Diego","Letícia","Thiago","Amanda","Vinícius","Patrícia","Rodrigo","Fernanda","Matheus","Gabriela","André","Isabela","Henrique","Natália","Leonardo","Vanessa"];
const LAST_NAMES = ["Silva","Santos","Oliveira","Souza","Pereira","Lima","Costa","Ferreira","Almeida","Ribeiro","Carvalho","Gomes","Martins","Araújo","Rocha","Alves"];
const AVATARS = ["👨‍💻","👩‍🎨","🧑‍💼","👨‍🚀","👩‍🔬","🧑‍🎤","👨‍🌾","👩‍⚕️","🧑‍🏫","👨‍🍳","👩‍✈️","🧑‍🎮","🧑","👤","🦊","🐻","🐯","🦁","🐼","🐸"];

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

// Generate fake metrics; intensity grows with hours since campaign started
export function generateMetrics(c: Campaign): FakeMetrics {
  const r = rng(c.id + c.name);
  const now = Date.now();
  const created = new Date(c.created_at).getTime();
  const hoursLive = Math.max(0.5, (now - created) / 3600_000);
  const isActive = c.status === "active" || c.status === "completed";
  const factor = isActive ? Math.min(hoursLive, 24 * 30) : 0;

  const budget = Number(c.budget) || 100;
  // Pace: 2-5% of budget per hour, capped at budget
  const pace = 0.02 + r() * 0.03;
  const spentRaw = Math.min(budget, factor * pace * budget);
  const spent = c.status === "draft" ? 0 : Math.round(spentRaw * 100) / 100;

  const cpm = 1.2 + r() * 1.8; // R$/1000 imp
  const impressions = Math.floor((spent / cpm) * 1000) + (isActive ? Math.floor(factor * (40 + r() * 80)) : 0);
  const ctrPct = 1.5 + r() * 4; // 1.5% - 5.5%
  const clicks = Math.floor(impressions * (ctrPct / 100));
  const ctr = impressions ? +(clicks / impressions * 100).toFixed(2) : 0;
  const cpc = clicks ? +(spent / clicks).toFixed(2) : 0;
  const reach = Math.floor(impressions * (0.55 + r() * 0.25));
  const frequency = reach ? +(impressions / reach).toFixed(2) : 0;
  const views = Math.floor(impressions * (0.6 + r() * 0.3));

  // Telegram delivery
  const dmsSent = Math.floor(impressions * (0.3 + r() * 0.2));
  const blockRate = 0.04 + r() * 0.06;
  const notReceivedRate = 0.05 + r() * 0.08;
  const dmsBlocked = Math.floor(dmsSent * blockRate);
  const dmsNotReceived = Math.floor(dmsSent * notReceivedRate);
  const dmsReceived = Math.max(0, dmsSent - dmsBlocked - dmsNotReceived);

  const approvalRate = +(85 + r() * 13).toFixed(1);
  const audienceQuality = +(72 + r() * 22).toFixed(1);

  const convRate = 0.04 + r() * 0.08;
  const conversions = Math.floor(clicks * convRate);
  const costPerConversion = conversions ? +(spent / conversions).toFixed(2) : 0;

  // Hourly series — last 24h
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const h = 23 - i;
    const t = new Date(now - h * 3600_000);
    const variance = 0.4 + r() * 1.2;
    const imps = Math.floor((impressions / 24) * variance);
    return {
      hour: `${t.getHours().toString().padStart(2, "0")}h`,
      impressions: imps,
      clicks: Math.floor(imps * (ctr / 100)),
      spent: +(imps * (cpm / 1000)).toFixed(2),
    };
  });

  // Daily series — last 7 days
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = 6 - i;
    const t = new Date(now - d * 86400_000);
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const variance = 0.6 + r() * 0.9;
    const imps = Math.floor((impressions / 7) * variance);
    const cl = Math.floor(imps * (ctr / 100));
    return {
      day: days[t.getDay()],
      impressions: imps,
      clicks: cl,
      spent: +(imps * (cpm / 1000)).toFixed(2),
      conversions: Math.floor(cl * convRate),
    };
  });

  // Recipients preview (24)
  const recipients: Recipient[] = Array.from({ length: 24 }, (_, i) => {
    const fn = pick(FIRST_NAMES, r);
    const ln = pick(LAST_NAMES, r);
    const roll = r();
    const status: Recipient["status"] =
      roll < 0.7 ? "received" : roll < 0.82 ? "replied" : roll < 0.92 ? "blocked" : "not_received";
    const minsAgo = Math.floor(r() * 600);
    return {
      id: `rec-${c.id}-${i}`,
      name: `${fn} ${ln}`,
      username: `@${fn.toLowerCase()}_${Math.floor(r() * 9999)}`,
      avatar: pick(AVATARS, r),
      status,
      time: minsAgo < 60 ? `há ${minsAgo} min` : `há ${Math.floor(minsAgo / 60)}h`,
    };
  });

  // Channels distribution
  const channelNames = ["Cripto Brasil", "Renda Online BR", "Tech Today", "Gamer Hub", "News Flash", "Lifestyle Pro", "Trade Alerts", "Bolsa em Ação"];
  const channels = channelNames.slice(0, 5).map((name) => ({
    name,
    impressions: Math.floor(impressions * (0.08 + r() * 0.22)),
    clicks: Math.floor(clicks * (0.08 + r() * 0.22)),
  }));

  const demographics = [
    { label: "18-24", value: Math.floor(15 + r() * 15) },
    { label: "25-34", value: Math.floor(30 + r() * 15) },
    { label: "35-44", value: Math.floor(20 + r() * 12) },
    { label: "45-54", value: Math.floor(8 + r() * 10) },
    { label: "55+", value: Math.floor(3 + r() * 8) },
  ];
  const devices = [
    { label: "Android", value: Math.floor(55 + r() * 15) },
    { label: "iOS", value: Math.floor(20 + r() * 15) },
    { label: "Desktop", value: Math.floor(5 + r() * 10) },
  ];

  return {
    impressions, views, clicks, ctr, cpc, cpm: +cpm.toFixed(2), reach, frequency,
    spent, budget,
    dmsSent, dmsReceived, dmsBlocked, dmsNotReceived,
    approvalRate, audienceQuality,
    conversions, costPerConversion,
    hourly, daily, recipients, channels, demographics, devices,
  };
}

export const statusColor: Record<Recipient["status"], string> = {
  received: "text-success",
  replied: "text-primary",
  blocked: "text-destructive",
  not_received: "text-muted-foreground",
};
export const statusLabelRecipient: Record<Recipient["status"], string> = {
  received: "Entregue",
  replied: "Respondeu",
  blocked: "Bloqueado",
  not_received: "Não entregue",
};
