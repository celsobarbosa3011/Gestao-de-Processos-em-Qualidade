import { useQuery } from "@tanstack/react-query";
import type { ProcessType } from "@shared/schema";

export function useProcessTypes() {
  return useQuery<ProcessType[]>({
    queryKey: ["/api/process-types"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/process-types", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch process types");
      return res.json();
    },
  });
}
