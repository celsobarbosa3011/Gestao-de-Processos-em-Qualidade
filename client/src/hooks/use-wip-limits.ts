import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWipLimits, updateWipLimit } from "@/lib/api";
import type { WipLimit, UpdateWipLimit } from "@shared/schema";

export function useWipLimits() {
  return useQuery<WipLimit[]>({
    queryKey: ["wip-limits"],
    queryFn: getWipLimits,
  });
}

export function useWipLimitByColumn(columnId: string) {
  const { data: limits = [] } = useWipLimits();
  return limits.find(l => l.columnId === columnId);
}

export function useUpdateWipLimit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ columnId, updates }: { columnId: string; updates: UpdateWipLimit }) => {
      return updateWipLimit(columnId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wip-limits"] });
    },
  });
}
