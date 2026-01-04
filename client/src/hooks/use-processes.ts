import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProcesses, createProcess, updateProcess } from "@/lib/api";
import type { InsertProcess, UpdateProcess, Process } from "@shared/schema";
import { useStore } from "@/lib/store";
import { useToast } from "./use-toast";

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
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertProcess) => createProcess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
      toast({
        title: "Processo criado",
        description: "O processo foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao criar processo",
        description: "Não foi possível criar o processo.",
      });
    },
  });
}

export function useUpdateProcess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser } = useStore();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateProcess }) => 
      updateProcess(id, { ...updates, userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
      toast({
        title: "Processo atualizado",
        description: "O processo foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar processo",
        description: "Não foi possível atualizar o processo.",
      });
    },
  });
}
