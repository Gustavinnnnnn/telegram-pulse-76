import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type WalletTx = Database["public"]["Tables"]["wallet_transactions"]["Row"];

export const objectiveLabels: Record<Campaign["objective"], string> = {
  traffic: "Tráfego",
  conversion: "Conversão",
  engagement: "Engajamento",
};
export const nicheLabels: Record<Campaign["niche"], string> = {
  gaming: "Gamer",
  income: "Renda extra",
  crypto: "Cripto",
  adult: "Adulto",
  news: "Notícias",
  tech: "Tecnologia",
  lifestyle: "Lifestyle",
};
export const statusLabels: Record<Campaign["status"], string> = {
  active: "Ativa",
  paused: "Pausada",
  draft: "Rascunho",
  completed: "Concluída",
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CampaignInsert, "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("campaigns")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign["status"] }) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async (): Promise<WalletTx[]> => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      // Insert transaction
      const { error: txError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount,
        description: `Depósito de R$ ${amount.toFixed(2)}`,
      });
      if (txError) throw txError;
      // Update balance (read-modify-write)
      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
      const newBalance = Number(profile?.balance ?? 0) + amount;
      const { error: pErr } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id);
      if (pErr) throw pErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
