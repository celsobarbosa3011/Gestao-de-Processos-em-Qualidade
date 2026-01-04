import { useQuery } from "@tanstack/react-query";
import type { Priority } from "@shared/schema";

export function usePriorities() {
  return useQuery<Priority[]>({
    queryKey: ["/api/priorities"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/priorities", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch priorities");
      return res.json();
    },
  });
}
