import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getProcessChecklists, 
  createProcessChecklist, 
  updateProcessChecklist, 
  deleteProcessChecklist,
  getProcessAttachments,
  uploadProcessAttachment,
  deleteProcessAttachment,
  getAllLabels,
  createLabel,
  deleteLabel,
  getProcessLabels,
  addLabelToProcess,
  removeLabelFromProcess
} from "@/lib/api";
import { useStore } from "@/lib/store";
import type { ProcessChecklist, ProcessAttachment, ProcessLabel } from "@shared/schema";

export function useProcessChecklists(processId: number | null) {
  const { authToken } = useStore();
  return useQuery<ProcessChecklist[]>({
    queryKey: ["checklists", processId],
    queryFn: () => getProcessChecklists(processId!),
    enabled: !!processId && !!authToken,
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, text }: { processId: number; text: string }) => 
      createProcessChecklist(processId, text),
    onSuccess: (_, { processId }) => {
      queryClient.invalidateQueries({ queryKey: ["checklists", processId] });
    },
  });
}

export function useUpdateChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed, processId }: { id: number; completed: boolean; processId: number }) => 
      updateProcessChecklist(id, completed),
    onSuccess: (_, { processId }) => {
      queryClient.invalidateQueries({ queryKey: ["checklists", processId] });
    },
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, processId }: { id: number; processId: number }) => 
      deleteProcessChecklist(id),
    onSuccess: (_, { processId }) => {
      queryClient.invalidateQueries({ queryKey: ["checklists", processId] });
    },
  });
}

export function useProcessAttachments(processId: number | null) {
  const { authToken } = useStore();
  return useQuery<ProcessAttachment[]>({
    queryKey: ["attachments", processId],
    queryFn: () => getProcessAttachments(processId!),
    enabled: !!processId && !!authToken,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ processId, file }: { processId: number; file: File }) => {
      return uploadProcessAttachment(processId, file);
    },
    onSuccess: (_, { processId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", processId] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, processId }: { id: number; processId: number }) => 
      deleteProcessAttachment(id),
    onSuccess: (_, { processId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", processId] });
    },
  });
}

export function useAllLabels() {
  const { authToken } = useStore();
  return useQuery<ProcessLabel[]>({
    queryKey: ["labels"],
    queryFn: getAllLabels,
    enabled: !!authToken,
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => 
      createLabel(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

export function useProcessLabels(processId: number | null) {
  const { authToken } = useStore();
  return useQuery<ProcessLabel[]>({
    queryKey: ["process-labels", processId],
    queryFn: () => getProcessLabels(processId!),
    enabled: !!processId && !!authToken,
  });
}

export function useAddLabelToProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, labelId }: { processId: number; labelId: number }) => 
      addLabelToProcess(processId, labelId),
    onSuccess: (_, { processId }) => {
      queryClient.invalidateQueries({ queryKey: ["process-labels", processId] });
    },
  });
}

export function useRemoveLabelFromProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, labelId }: { processId: number; labelId: number }) => 
      removeLabelFromProcess(processId, labelId),
    onSuccess: (_, { processId }) => {
      queryClient.invalidateQueries({ queryKey: ["process-labels", processId] });
    },
  });
}
