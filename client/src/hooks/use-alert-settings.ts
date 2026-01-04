import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlertSettings, updateAlertSettings } from "@/lib/api";
import type { AlertSettings } from "@shared/schema";
import { toast } from "sonner";

export function useAlertSettings() {
  return useQuery({
    queryKey: ["alertSettings"],
    queryFn: getAlertSettings,
  });
}

export function useUpdateAlertSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<AlertSettings>) => updateAlertSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertSettings"] });
      toast.success("Configurações atualizadas");
    },
    onError: () => {
      toast.error("Erro ao atualizar configurações");
    },
  });
}
