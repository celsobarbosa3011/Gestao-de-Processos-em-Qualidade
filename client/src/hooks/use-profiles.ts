import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProfiles, updateProfile } from "@/lib/api";
import type { Profile } from "@shared/schema";
import { useToast } from "./use-toast";

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: getAllProfiles,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Profile> }) => 
      updateProfile(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "Perfil atualizado",
        description: "O perfil foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar o perfil.",
      });
    },
  });
}
