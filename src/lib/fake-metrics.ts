// Deterministic fake-but-realistic metrics for DM campaigns.
// Numbers grow with time so the same campaign always shows consistent
// evolving stats. Built around DM dispatch (no money / budget concept).

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
  avatar: string;
  status: "received" | "blocked" | "not_received" | "replied";
  time: string;
}

export interface FakeMetrics {
  // DM core
  dmTotal: number;
  dmsSent: number;
  dmsReceived: number;
  dmsBlocked: number;
  dmsNotReceived: number;
  dmsRemaining: number;
  progressPct: number; // 0-100
  // Engagement
  impressions: number;
  views: number;
  clicks: number;
  ctr: number;
  reach: number;
  frequency: number;
  approvalRate: number;
  audienceQuality: number;
  conversions: number;
  // Series
  hourly: { hour: string; sent: number; clicks: number }[];
  daily: { day: string; sent: number; clicks: number; conversions: number; impressions: number }[];
  recipients: Recipient[];
  channels: { name: string; sent: number; clicks: number }[];
  demographics: { label: string; value: number }[];
  devices: { label: string; value: number }[];
}

const FIRST_NAMES = ["Lucas","Mariana","João","Ana","Pedro","Beatriz","Rafael","Camila","Bruno","Larissa","Gustavo","Juliana","Felipe","Carolina","Diego","Letícia","Thiago","Amanda","Vinícius","Patrícia","Rodrigo","Fernanda","Matheus","Gabriela","André","Isabela","Henrique","Natália","Leonardo","Vanessa"];
const LAST_NAMES = ["Silva","Santos","Oliveira","Souza","Pereira","Lima","Costa","Ferreira","Almeida","Ribeiro","Carvalho","Gomes","Martins","Araújo","Rocha","Alves"];
const AVATARS = ["👨‍💻","👩‍🎨","🧑‍💼","👨‍🚀","👩‍🔬","🧑‍🎤","👨‍🌾","👩‍⚕️","🧑‍🏫","👨‍🍳","👩‍✈️","🧑‍🎮","🧑","👤","🦊","🐻","🐯","🦁","🐼","🐸"];

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

export function generateMetrics(c: Campaign): FakeMetrics {
  const r = rng(c.id + c.name);
  const now = Date.now();
  const created = new Date(c.created_at).getTime();
  const hoursLive = Math.max(0.5, (now - created) / 3600_000);
  const isActive = c.status === "active" || c.status === "completed";
  const isCompleted = c.status === "completed";

  const dmTotal = c.dm_total || 1000;

  // Pace: 4-9% of total per hour
  const pace = 0.04 + r() * 0.05;
  const projected = isActive ? Math.min(dmTotal, hoursLive * pace * dmTotal) : 0;
  // Persisted dm_sent (db) takes priority if higher
  const dmsSent = isCompleted
    ? dmTotal
    : Math.max(c.dm_sent || 0, Math.floor(projected));

  const blockRate = 0.04 + r() * 0.05;
  const notReceivedRate = 0.04 + r() * 0.06;
  const dmsBlocked = Math.floor(dmsSent * blockRate);
  const dmsNotReceived = Math.floor(dmsSent * notReceivedRate);
  const dmsReceived = Math.max(0, dmsSent - dmsBlocked - dmsNotReceived);
  const dmsRemaining = Math.max(0, dmTotal - dmsSent);
  const progressPct = dmTotal > 0 ? Math.min(100, (dmsSent / dmTotal) * 100) : 0;

  // Each delivered DM ~ 1.4 impressions, click rate 5-12%
  const impressions = Math.floor(dmsReceived * (1.2 + r() * 0.5));
  const ctrPct = 5 + r() * 7;
  const clicks = Math.floor(dmsReceived * (ctrPct / 100));
  const ctr = dmsReceived ? +((clicks / dmsReceived) * 100).toFixed(2) : 0;
  const reach = Math.floor(impressions * (0.65 + r() * 0.2));
  const frequency = reach ? +(impressions / reach).toFixed(2) : 0;
  const views = Math.floor(impressions * (0.7 + r() * 0.25));

  const approvalRate = +(85 + r() * 13).toFixed(1);
  const audienceQuality = +(72 + r() * 22).toFixed(1);

  const convRate = 0.06 + r() * 0.08;
  const conversions = Math.floor(clicks * convRate);

  // Hourly series — last 24h
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const h = 23 - i;
    const t = new Date(now - h * 3600_000);
    const variance = 0.4 + r() * 1.2;
    const sent = Math.floor((dmsSent / 24) * variance);
    return {
      hour: `${t.getHours().toString().padStart(2, "0")}h`,
      sent,
      clicks: Math.floor(sent * (ctr / 100)),
    };
  });

  // Daily series — last 7 days
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = 6 - i;
    const t = new Date(now - d * 86400_000);
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    const variance = 0.6 + r() * 0.9;
    const sent = Math.floor((dmsSent / 7) * variance);
    const cl = Math.floor(sent * (ctr / 100));
    const imps = Math.floor(sent * 1.3);
    return {
      day: days[t.getDay()],
      sent,
      clicks: cl,
      conversions: Math.floor(cl * convRate),
      impressions: imps,
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

  const channelNames = ["Cripto Brasil", "Renda Online BR", "Tech Today", "Gamer Hub", "News Flash", "Lifestyle Pro", "Trade Alerts", "Bolsa em Ação"];
  const channels = channelNames.slice(0, 5).map((name) => ({
    name,
    sent: Math.floor(dmsSent * (0.08 + r() * 0.22)),
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
    dmTotal, dmsSent, dmsReceived, dmsBlocked, dmsNotReceived, dmsRemaining, progressPct,
    impressions, views, clicks, ctr, reach, frequency,
    approvalRate, audienceQuality, conversions,
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
