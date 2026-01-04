import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProcesses } from "@/hooks/use-processes";
import type { Process } from "@shared/schema";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-green-500 text-white",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarPage() {
  const { data: processes = [], isLoading } = useProcesses();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const processesWithDeadlines = useMemo(() => {
    return processes.filter((p) => p.deadline);
  }, [processes]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = getDay(monthStart);
    const paddingDays = Array(startDayOfWeek).fill(null);

    return [...paddingDays, ...days];
  }, [currentDate]);

  const getProcessesForDay = (day: Date): Process[] => {
    return processesWithDeadlines.filter((p) =>
      isSameDay(new Date(p.deadline!), day)
    );
  };

  const selectedDayProcesses = useMemo(() => {
    if (!selectedDate) return [];
    return getProcessesForDay(selectedDate);
  }, [selectedDate, processesWithDeadlines]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendário de Prazos</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Visualize os processos organizados por data de vencimento.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CalendarIcon className="w-5 h-5" />
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayProcesses = getProcessesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const todayClass = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                    className={`
                      aspect-square p-1 rounded-lg border transition-all text-sm
                      ${isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"}
                      ${isSelected ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/50"}
                      ${todayClass ? "font-bold bg-primary/10" : ""}
                      ${dayProcesses.length > 0 ? "cursor-pointer" : ""}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <span className="text-xs sm:text-sm">{format(day, "d")}</span>
                      {dayProcesses.length > 0 && (
                        <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                          {dayProcesses.slice(0, 3).map((p) => (
                            <div
                              key={p.id}
                              className={`w-full h-1.5 rounded-full ${PRIORITY_COLORS[p.priority].split(" ")[0]}`}
                              title={p.title}
                            />
                          ))}
                          {dayProcesses.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{dayProcesses.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Crítico</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Alto</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Médio</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Baixo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Clique em um dia do calendário para ver os processos com prazo nessa data.
              </p>
            ) : selectedDayProcesses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum processo com prazo nesta data.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayProcesses.map((process) => (
                  <div
                    key={process.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    data-testid={`process-item-${process.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">{process.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          #{process.id} • {process.unit}
                        </p>
                      </div>
                      <Badge
                        className={`${PRIORITY_COLORS[process.priority]} text-[10px] shrink-0`}
                        data-testid={`badge-priority-${process.id}`}
                      >
                        {process.priority === "critical"
                          ? "Crítico"
                          : process.priority === "high"
                          ? "Alto"
                          : process.priority === "medium"
                          ? "Médio"
                          : "Baixo"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        {process.status === "new"
                          ? "Novo"
                          : process.status === "analysis"
                          ? "Em Análise"
                          : process.status === "pending"
                          ? "Pendente"
                          : process.status === "approved"
                          ? "Aprovado"
                          : "Rejeitado"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
