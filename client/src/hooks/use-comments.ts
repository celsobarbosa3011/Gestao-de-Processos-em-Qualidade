import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProcessComments, createComment } from "@/lib/api";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function useProcessComments(processId: number | null) {
  return useQuery({
    queryKey: ["comments", processId],
    queryFn: () => processId ? getProcessComments(processId) : Promise.resolve([]),
    enabled: !!processId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { currentUser } = useStore();
  
  return useMutation({
    mutationFn: ({ processId, text }: { processId: number; text: string }) => {
      if (!currentUser) throw new Error("User not authenticated");
      return createComment(processId, currentUser.id, text);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.processId] });
      queryClient.invalidateQueries({ queryKey: ["events", variables.processId] });
      toast.success("Comentário adicionado");
    },
    onError: () => {
      toast.error("Erro ao adicionar comentário");
    },
  });
}
