import { useQuery } from "@tanstack/react-query";
import { getAllUnits } from "@/lib/api";

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: getAllUnits,
  });
}
