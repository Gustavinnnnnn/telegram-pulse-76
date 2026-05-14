import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT } from "@/lib/support";

export const WHATSAPP_KEY = "whatsapp_group_url";

export function useWhatsAppUrl() {
  const { data } = useQuery({
    queryKey: ["app_settings", WHATSAPP_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", WHATSAPP_KEY)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? SUPPORT.whatsappGroupUrl;
    },
    staleTime: 60_000,
  });
  return data ?? SUPPORT.whatsappGroupUrl;
}

export function useUpdateWhatsAppUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: WHATSAPP_KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app_settings", WHATSAPP_KEY] }),
  });
}
