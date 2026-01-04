import { useQuery } from "@tanstack/react-query";
import { getProcessEvents, getAllEvents } from "@/lib/api";

export function useProcessEvents(processId: number | null) {
  return useQuery({
    queryKey: ["events", processId],
    queryFn: () => processId ? getProcessEvents(processId) : Promise.resolve([]),
    enabled: !!processId,
  });
}

export function useAllEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: getAllEvents,
  });
}
