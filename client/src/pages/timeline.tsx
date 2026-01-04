import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, GanttChart, Filter } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  differenceInDays,
  isBefore,
  isAfter,
  min,
  max,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProcesses } from "@/hooks/use-processes";
import { useProfiles } from "@/hooks/use-profiles";
import type { Process, Profile } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-400",
  analysis: "bg-blue-500",
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  analysis: "Em Análise",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export default function TimelinePage() {
  const { data: processes = [], isLoading: processesLoading } = useProcesses();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );

  const units = useMemo(() => {
    const uniqueUnits = Array.from(new Set(processes.map((p) => p.unit)));
    return uniqueUnits.sort();
  }, [processes]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(processes.map((p) => p.type)));
    return uniqueTypes.sort();
  }, [processes]);

  const responsibles = useMemo(() => {
    const uniqueResponsibles = processes
      .filter((p) => p.responsibleId)
      .map((p) => p.responsibleId as string);
    return Array.from(new Set(uniqueResponsibles));
  }, [processes]);

  const getProfileName = (id: string | null): string => {
    if (!id) return "Não atribuído";
    const profile = profiles.find((p) => p.id === id);
    return profile?.name || "Desconhecido";
  };

  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      if (filterUnit !== "all" && p.unit !== filterUnit) return false;
      if (filterType !== "all" && p.type !== filterType) return false;
      if (filterResponsible !== "all" && p.responsibleId !== filterResponsible)
        return false;
      return true;
    });
  }, [processes, filterUnit, filterType, filterResponsible]);

  const processesInRange = useMemo(() => {
    return filteredProcesses.filter((p) => {
      const start = new Date(p.createdAt);
      const end = p.deadline ? new Date(p.deadline) : start;
      return !(isAfter(start, monthEnd) || isBefore(end, monthStart));
    });
  }, [filteredProcesses, monthStart, monthEnd]);

  const calculateBarPosition = (process: Process) => {
    const processStart = new Date(process.createdAt);
    const processEnd = process.deadline ? new Date(process.deadline) : processStart;

    const visibleStart = max([processStart, monthStart]);
    const visibleEnd = min([processEnd, monthEnd]);

    const startOffset = differenceInDays(visibleStart, monthStart);
    const duration = differenceInDays(visibleEnd, visibleStart) + 1;

    const dayWidth = 100 / daysInMonth.length;
    const left = startOffset * dayWidth;
    const width = Math.max(duration * dayWidth, dayWidth);

    return { left: `${left}%`, width: `${width}%` };
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const clearFilters = () => {
    setFilterUnit("all");
    setFilterType("all");
    setFilterResponsible("all");
  };

  const isLoading = processesLoading || profilesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Linha do Tempo
          </h1>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Linha do Tempo
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Visualização Gantt dos processos por período.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <GanttChart className="w-5 h-5" />
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  data-testid="button-today"
                >
                  Hoje
                </Button>
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

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filtros:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filterUnit}
                  onValueChange={setFilterUnit}
                  data-testid="select-unit"
                >
                  <SelectTrigger
                    className="w-[160px]"
                    data-testid="select-unit-trigger"
                  >
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterType}
                  onValueChange={setFilterType}
                  data-testid="select-type"
                >
                  <SelectTrigger
                    className="w-[160px]"
                    data-testid="select-type-trigger"
                  >
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterResponsible}
                  onValueChange={setFilterResponsible}
                  data-testid="select-responsible"
                >
                  <SelectTrigger
                    className="w-[180px]"
                    data-testid="select-responsible-trigger"
                  >
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                    {responsibles.map((id) => (
                      <SelectItem key={id} value={id}>
                        {getProfileName(id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(filterUnit !== "all" ||
                  filterType !== "all" ||
                  filterResponsible !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ScrollArea className="w-full" ref={scrollRef}>
            <div className="min-w-[800px]">
              <div className="grid border-b pb-2 mb-4" style={{ gridTemplateColumns: `200px 1fr` }}>
                <div className="text-sm font-medium text-muted-foreground px-2">
                  Processo
                </div>
                <div className="relative">
                  <div className="flex">
                    {daysInMonth.map((day) => {
                      const dayOfWeek = day.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      return (
                        <div
                          key={day.toISOString()}
                          className={`flex-1 text-center text-xs font-medium ${
                            isWeekend
                              ? "bg-muted/40 text-muted-foreground"
                              : "text-foreground"
                          }`}
                          style={{ minWidth: "28px" }}
                          title={format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        >
                          {format(day, "d")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {processesInRange.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GanttChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Nenhum processo encontrado neste período.
                  </p>
                  <p className="text-xs mt-1">
                    Tente navegar para outro mês ou ajustar os filtros.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {processesInRange.map((process) => {
                    const barPosition = calculateBarPosition(process);
                    return (
                      <div
                        key={process.id}
                        className="grid items-center"
                        style={{ gridTemplateColumns: `200px 1fr` }}
                        data-testid={`timeline-row-${process.id}`}
                      >
                        <div className="px-2 py-2 border-r">
                          <div
                            className="font-medium text-sm truncate"
                            title={process.title}
                          >
                            {process.title}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0"
                              data-testid={`badge-id-${process.id}`}
                            >
                              #{process.id}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {process.unit}
                            </span>
                          </div>
                        </div>
                        <div className="relative h-10 bg-muted/20 rounded">
                          <div className="absolute inset-0 flex">
                            {daysInMonth.map((day) => {
                              const dayOfWeek = day.getDay();
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                              return (
                                <div
                                  key={day.toISOString()}
                                  className={`flex-1 border-r border-dashed border-muted ${
                                    isWeekend ? "bg-muted/30" : ""
                                  }`}
                                  style={{ minWidth: "28px" }}
                                />
                              );
                            })}
                          </div>
                          <div
                            className={`absolute top-1 bottom-1 rounded-md ${
                              STATUS_COLORS[process.status]
                            } shadow-sm flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                            style={{
                              left: barPosition.left,
                              width: barPosition.width,
                              minWidth: "30px",
                            }}
                            title={`${process.title}\nStatus: ${
                              STATUS_LABELS[process.status]
                            }\nCriado: ${format(
                              new Date(process.createdAt),
                              "dd/MM/yyyy"
                            )}${
                              process.deadline
                                ? `\nPrazo: ${format(
                                    new Date(process.deadline),
                                    "dd/MM/yyyy"
                                  )}`
                                : ""
                            }`}
                            data-testid={`timeline-bar-${process.id}`}
                          >
                            <span className="text-white text-[10px] font-medium px-2 truncate">
                              {process.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded ${STATUS_COLORS[key]}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = processesInRange.filter(
                (p) => p.status === key
              ).length;
              return (
                <div
                  key={key}
                  className="text-center p-3 rounded-lg bg-muted/50"
                  data-testid={`summary-${key}`}
                >
                  <div
                    className={`w-4 h-4 rounded mx-auto mb-2 ${STATUS_COLORS[key]}`}
                  />
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
