import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DMPackage = Database["public"]["Tables"]["dm_packages"]["Row"];
export type DMPurchase = Database["public"]["Tables"]["dm_purchases"]["Row"];

export const objectiveLabels: Record<Campaign["objective"], string> = {
  traffic: "Tráfego",
  conversion: "Conversão",
  engagement: "Engajamento",
};
export const nicheLabels: Record<Campaign["niche"], string> = {
  apostas: "Apostas (Tigrinho)",
  hot: "Hot +18",
  finance: "Finanças",
  ecommerce: "E-commerce",
  fitness: "Fitness",
  gaming: "Gamer",
  income: "Renda extra",
  crypto: "Cripto",
  adult: "Adulto",
  news: "Notícias",
  tech: "Tecnologia",
  lifestyle: "Lifestyle",
};
export const genderLabels: Record<"all" | "male" | "female", string> = {
  all: "Todos",
  male: "Homens",
  female: "Mulheres",
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

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async (): Promise<DMPackage[]> => {
      const { data, error } = await supabase
        .from("dm_packages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async (): Promise<DMPurchase[]> => {
      const { data, error } = await supabase
        .from("dm_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePurchasePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (packageId: string) => {
      const { data, error } = await supabase.rpc("purchase_dm_package", { _package_id: packageId });
      if (error) throw error;
      return data as { purchase_id: string; quantity: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}
