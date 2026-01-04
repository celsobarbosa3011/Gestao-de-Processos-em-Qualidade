import { useQuery } from "@tanstack/react-query";
import { getAllProcessTypes } from "@/lib/api";
import type { ProcessType } from "@shared/schema";

export function useProcessTypes() {
  return useQuery<ProcessType[]>({
    queryKey: ["/api/process-types"],
    queryFn: getAllProcessTypes,
  });
}
