import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProcesses, createProcess, updateProcess } from "@/lib/api";
import type { InsertProcess, UpdateProcess, Process } from "@shared/schema";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function useProcesses() {
  const { currentUser } = useStore();
  
  return useQuery({
    queryKey: ["processes"],
    queryFn: getAllProcesses,
    select: (processes) => {
      if (!currentUser) return [];
      
      // Filter based on user role
      if (currentUser.role === 'user') {
        // Users see processes from their unit OR assigned to them
        return processes.filter(
          (p) => p.unit === currentUser.unit || p.responsibleId === currentUser.id
        );
      }
      
      // Admins see all
      return processes;
    },
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertProcess) => createProcess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
      toast.success("Processo criado");
    },
    onError: () => {
      toast.error("Erro ao criar processo");
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();
  const { currentUser } = useStore();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateProcess }) => 
      updateProcess(id, { ...updates, userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
      toast.success("Processo atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar processo");
    },
  });
}
