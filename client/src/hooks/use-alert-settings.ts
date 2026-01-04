import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlertSettings, updateAlertSettings } from "@/lib/api";
import type { AlertSettings } from "@shared/schema";
import { useToast } from "./use-toast";

export function useAlertSettings() {
  return useQuery({
    queryKey: ["alertSettings"],
    queryFn: getAlertSettings,
  });
}

export function useUpdateAlertSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (settings: Partial<AlertSettings>) => updateAlertSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertSettings"] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações de alertas foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar configurações",
        description: "Não foi possível atualizar as configurações.",
      });
    },
  });
}
