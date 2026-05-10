// Simple in-memory mock data store for the MVP.
// Will be replaced by Lovable Cloud (Postgres + Auth) in a future iteration.

export type CampaignObjective = "traffic" | "conversion" | "engagement";
export type CampaignStatus = "active" | "paused" | "draft" | "completed";
export type Niche = "gaming" | "income" | "crypto" | "adult" | "news" | "tech" | "lifestyle";

export interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  niche: Niche;
  buttonLabel: string;
  buttonUrl: string;
  text: string;
  description: string;
  createdAt: string;
}

export const mockCampaigns: Campaign[] = [
  {
    id: "c1",
    name: "Lançamento Bot de Sinais",
    objective: "conversion",
    status: "active",
    budget: 500,
    spent: 312.4,
    impressions: 18420,
    clicks: 1240,
    niche: "income",
    buttonLabel: "Acessar bot",
    buttonUrl: "https://t.me/MeuBotSinais",
    text: "🚀 Sinais grátis todos os dias. Entre agora!",
    description: "Campanha de aquisição via bot de sinais.",
    createdAt: "2025-05-02",
  },
  {
    id: "c2",
    name: "Grupo VIP Gamer",
    objective: "engagement",
    status: "active",
    budget: 200,
    spent: 88.9,
    impressions: 9210,
    clicks: 612,
    niche: "gaming",
    buttonLabel: "Entrar no grupo",
    buttonUrl: "https://t.me/+grupovip",
    text: "🎮 Entre no grupo VIP de gamers e receba dicas diárias.",
    description: "Crescimento de comunidade gamer.",
    createdAt: "2025-05-04",
  },
  {
    id: "c3",
    name: "Curso Cripto - Tráfego",
    objective: "traffic",
    status: "paused",
    budget: 800,
    spent: 540.0,
    impressions: 32100,
    clicks: 2104,
    niche: "crypto",
    buttonLabel: "Ver oferta",
    buttonUrl: "https://exemplo.com/curso",
    text: "💎 Curso completo de cripto com 70% OFF essa semana.",
    description: "Tráfego para landing page do curso.",
    createdAt: "2025-04-28",
  },
];

export const performanceSeries = [
  { day: "Seg", impressions: 4200, clicks: 312 },
  { day: "Ter", impressions: 5180, clicks: 401 },
  { day: "Qua", impressions: 4870, clicks: 389 },
  { day: "Qui", impressions: 6120, clicks: 502 },
  { day: "Sex", impressions: 7340, clicks: 624 },
  { day: "Sáb", impressions: 6890, clicks: 588 },
  { day: "Dom", impressions: 5990, clicks: 471 },
];

export const walletTransactions = [
  { id: "t1", type: "deposit", amount: 500, date: "2025-05-08", description: "Depósito via PIX" },
  { id: "t2", type: "spend", amount: -120.4, date: "2025-05-07", description: "Campanha: Lançamento Bot de Sinais" },
  { id: "t3", type: "deposit", amount: 200, date: "2025-05-05", description: "Depósito via cartão" },
  { id: "t4", type: "spend", amount: -88.9, date: "2025-05-04", description: "Campanha: Grupo VIP Gamer" },
];

export const objectiveLabels: Record<CampaignObjective, string> = {
  traffic: "Tráfego",
  conversion: "Conversão",
  engagement: "Engajamento",
};

export const nicheLabels: Record<Niche, string> = {
  gaming: "Gamer",
  income: "Renda extra",
  crypto: "Cripto",
  adult: "Adulto",
  news: "Notícias",
  tech: "Tecnologia",
  lifestyle: "Lifestyle",
};

export const statusLabels: Record<CampaignStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  draft: "Rascunho",
  completed: "Concluída",
};
