import { useQuery } from "@tanstack/react-query";
import { getAllPriorities } from "@/lib/api";
import type { Priority } from "@shared/schema";

export function usePriorities() {
  return useQuery<Priority[]>({
    queryKey: ["/api/priorities"],
    queryFn: getAllPriorities,
  });
}
