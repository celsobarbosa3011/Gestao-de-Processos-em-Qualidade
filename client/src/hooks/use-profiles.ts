import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProfiles, updateProfile } from "@/lib/api";
import type { Profile } from "@shared/schema";
import { toast } from "sonner";

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: getAllProfiles,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Profile> }) => 
      updateProfile(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Perfil atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });
}
