import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useStore } from "@/lib/store";
import { ProcessCard } from "@/components/process-card";
import { ProcessDialog } from "@/components/process-dialog";
import { Plus, Filter, Search, AlertTriangle, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CreateProcessDialog } from "@/components/create-process-dialog";
import { useProcesses, useUpdateProcess } from "@/hooks/use-processes";
import { useProfiles } from "@/hooks/use-profiles";
import { useUnits } from "@/hooks/use-units";
import { useAlertSettings } from "@/hooks/use-alert-settings";
import { useWipLimits } from "@/hooks/use-wip-limits";
import { useWebSocketEvent } from "@/hooks/use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Process, Profile } from "@shared/schema";

type ProcessStatus = 'new' | 'analysis' | 'pending' | 'approved' | 'completed' | 'rejected';
type SwimlaneGrouping = 'none' | 'unit' | 'type' | 'priority' | 'responsible';

const COLUMNS: { id: ProcessStatus; title: string }[] = [
  { id: 'new', title: 'Novos' },
  { id: 'analysis', title: 'Em Análise' },
  { id: 'pending', title: 'Pendentes' },
  { id: 'approved', title: 'Aprovados' },
  { id: 'completed', title: 'Concluídos' },
  { id: 'rejected', title: 'Rejeitados' },
];

const SWIMLANE_OPTIONS: { value: SwimlaneGrouping; label: string }[] = [
  { value: 'none', label: 'Sem Raias' },
  { value: 'unit', label: 'Unidade' },
  { value: 'type', label: 'Tipo' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'responsible', label: 'Responsável' },
];

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const STORAGE_KEY = 'kanban-swimlane-grouping';
const COLLAPSED_KEY = 'kanban-swimlane-collapsed';

interface SwimlaneData {
  key: string;
  label: string;
  processes: Process[];
}

export default function KanbanPage() {
  const { currentUser } = useStore();
  const queryClient = useQueryClient();
  const { data: processes = [], isLoading } = useProcesses();
  const { data: profiles = [] } = useProfiles();
  const { data: units = [] } = useUnits();
  const { data: alertSettings } = useAlertSettings();
  const { data: wipLimits = [] } = useWipLimits();
  const updateProcess = useUpdateProcess();
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");

  useWebSocketEvent('process_created', () => {
    queryClient.invalidateQueries({ queryKey: ['processes'] });
  });

  useWebSocketEvent('process_updated', () => {
    queryClient.invalidateQueries({ queryKey: ['processes'] });
  });
  
  const [swimlaneGrouping, setSwimlaneGrouping] = useState<SwimlaneGrouping>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as SwimlaneGrouping) || 'none';
  });
  
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, swimlaneGrouping);
  }, [swimlaneGrouping]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(Array.from(collapsedSwimlanes)));
  }, [collapsedSwimlanes]);
  
  const getWipLimitForColumn = (columnId: string) => {
    return wipLimits.find(l => l.columnId === columnId);
  };

  const visibleProcesses = processes.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !String(p.id).includes(search)) {
      return false;
    }
    if (currentUser?.role === 'admin' && unitFilter !== 'all' && p.unit !== unitFilter) {
      return false;
    }
    return true;
  });

  const getResponsibleName = (responsibleId: string | null): string => {
    if (!responsibleId) return 'Sem Responsável';
    const profile = profiles.find(p => p.id === responsibleId);
    return profile?.name || 'Desconhecido';
  };

  const swimlanes = useMemo((): SwimlaneData[] => {
    if (swimlaneGrouping === 'none') {
      return [{ key: 'all', label: '', processes: visibleProcesses }];
    }

    const grouped = new Map<string, Process[]>();

    visibleProcesses.forEach(process => {
      let key: string;
      switch (swimlaneGrouping) {
        case 'unit':
          key = process.unit || 'Sem Unidade';
          break;
        case 'type':
          key = process.type || 'Sem Tipo';
          break;
        case 'priority':
          key = process.priority || 'medium';
          break;
        case 'responsible':
          key = process.responsibleId || 'none';
          break;
        default:
          key = 'all';
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(process);
    });

    let sortedKeys = Array.from(grouped.keys());
    
    if (swimlaneGrouping === 'priority') {
      sortedKeys.sort((a, b) => PRIORITY_ORDER.indexOf(a) - PRIORITY_ORDER.indexOf(b));
    } else {
      sortedKeys.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    return sortedKeys.map(key => {
      let label: string;
      switch (swimlaneGrouping) {
        case 'priority':
          label = PRIORITY_LABELS[key] || key;
          break;
        case 'responsible':
          label = key === 'none' ? 'Sem Responsável' : getResponsibleName(key);
          break;
        default:
          label = key;
      }
      return {
        key,
        label,
        processes: grouped.get(key) || [],
      };
    });
  }, [visibleProcesses, swimlaneGrouping, profiles]);

  const toggleSwimlane = (key: string) => {
    setCollapsedSwimlanes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const processId = parseInt(draggableId);
    const destParts = destination.droppableId.split('::');
    const sourceParts = source.droppableId.split('::');
    
    const newStatus = destParts[destParts.length - 1] as ProcessStatus;
    const oldStatus = sourceParts[sourceParts.length - 1] as ProcessStatus;
    
    if (newStatus !== oldStatus) {
      const wipLimit = getWipLimitForColumn(newStatus);
      const destinationCount = processes.filter(p => p.status === newStatus).length;
      
      if (wipLimit?.enabled && destinationCount >= wipLimit.maxItems) {
        toast.error(`Limite WIP atingido`, {
          description: `A coluna "${COLUMNS.find(c => c.id === newStatus)?.title}" já possui ${wipLimit.maxItems} itens.`,
        });
        return;
      }
    }
    
    updateProcess.mutate({
      id: processId,
      updates: { status: newStatus }
    });
  };

  const renderKanbanColumns = (swimlaneProcesses: Process[], swimlaneKey: string) => {
    return (
      <div className="flex gap-4 lg:gap-6 pb-4" style={{ minWidth: 'max-content' }}>
        {COLUMNS.map(column => {
          const columnProcesses = swimlaneProcesses.filter(p => p.status === column.id);
          const totalColumnCount = processes.filter(p => p.status === column.id).length;
          const wipLimit = getWipLimitForColumn(column.id);
          const isAtLimit = wipLimit?.enabled && totalColumnCount >= wipLimit.maxItems;
          const isNearLimit = wipLimit?.enabled && totalColumnCount >= wipLimit.maxItems * 0.8;
          const droppableId = swimlaneKey === 'all' ? column.id : `${swimlaneKey}::${column.id}`;
          
          return (
            <div key={`${swimlaneKey}-${column.id}`} className={cn(
              "flex-1 flex flex-col w-[260px] sm:w-[280px] lg:w-[300px] flex-shrink-0 rounded-xl border",
              swimlaneGrouping === 'none' ? "h-full" : "min-h-[200px]",
              isAtLimit ? "bg-red-500/10 border-red-500/50" : 
              isNearLimit ? "bg-yellow-500/10 border-yellow-500/50" : 
              "bg-secondary/30 border-border/50"
            )}>
              <div className={cn(
                "p-4 border-b flex items-center justify-between rounded-t-xl sticky top-0 z-10 backdrop-blur-sm",
                isAtLimit ? "bg-red-500/20 border-red-500/50" :
                isNearLimit ? "bg-yellow-500/20 border-yellow-500/50" :
                "bg-secondary/50 border-border/50"
              )}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground/80">{column.title}</h3>
                  <span 
                    data-testid={swimlaneKey === 'all' ? `count-${column.id}` : `count-${swimlaneKey}-${column.id}`}
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full border shadow-sm",
                      isAtLimit ? "bg-red-500 text-white border-red-600" :
                      isNearLimit ? "bg-yellow-500 text-white border-yellow-600" :
                      "bg-background text-foreground"
                    )}
                  >
                    {columnProcesses.length}{wipLimit?.enabled && swimlaneKey === 'all' ? `/${wipLimit.maxItems}` : ''}
                  </span>
                  {isAtLimit && swimlaneKey === 'all' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Limite WIP atingido</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              
              <Droppable droppableId={droppableId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    data-testid={swimlaneKey === 'all' ? `droppable-${column.id}` : `droppable-${swimlaneKey}-${column.id}`}
                    className={cn(
                      "flex-1 p-3 overflow-y-auto space-y-3 transition-colors rounded-b-xl scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40",
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    )}
                  >
                    {columnProcesses.map((process, index) => (
                      <ProcessCard 
                        key={process.id} 
                        process={process} 
                        index={index} 
                        onClick={() => setSelectedProcess(process)}
                        profiles={profiles}
                        alertSettings={alertSettings}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-muted-foreground">Carregando processos...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col gap-4 mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Gestão de Processos</h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">Gerencie solicitações e acompanhe o fluxo de trabalho.</p>
          </div>
          <Button 
            data-testid="button-new-process"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm w-full sm:w-auto"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
           <div className="relative flex-1 sm:flex-none sm:w-64">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               data-testid="input-search"
               placeholder="Buscar processos..." 
               className="pl-9"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           
           <div className="flex items-center gap-2 flex-wrap">
             <Select value={swimlaneGrouping} onValueChange={(v) => setSwimlaneGrouping(v as SwimlaneGrouping)}>
               <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-swimlane-grouping">
                 <Layers className="w-4 h-4 mr-2" />
                 <SelectValue placeholder="Agrupar por" />
               </SelectTrigger>
               <SelectContent>
                 {SWIMLANE_OPTIONS.map(option => (
                   <SelectItem key={option.value} value={option.value} data-testid={`swimlane-option-${option.value}`}>
                     {option.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             
             {currentUser?.role === 'admin' && (
               <Select value={unitFilter} onValueChange={setUnitFilter}>
                 <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-unit-filter">
                   <Filter className="w-4 h-4 mr-2" />
                   <SelectValue placeholder="Filtrar Unidade" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todas Unidades</SelectItem>
                   {units.map((unit) => (
                     <SelectItem key={unit.id} value={unit.razaoSocial}>
                       {unit.nomeFantasia || unit.razaoSocial}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             )}
           </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-auto pb-4">
          {swimlaneGrouping === 'none' ? (
            <div className="h-full overflow-x-auto">
              {renderKanbanColumns(visibleProcesses, 'all')}
            </div>
          ) : (
            <div className="space-y-4">
              {swimlanes.map(swimlane => {
                const isCollapsed = collapsedSwimlanes.has(swimlane.key);
                const processCount = swimlane.processes.length;
                
                return (
                  <Collapsible
                    key={swimlane.key}
                    open={!isCollapsed}
                    onOpenChange={() => toggleSwimlane(swimlane.key)}
                    data-testid={`swimlane-${swimlane.key}`}
                  >
                    <div className="border rounded-lg bg-background/50">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start p-4 h-auto hover:bg-muted/50"
                          data-testid={`swimlane-toggle-${swimlane.key}`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {isCollapsed ? (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="font-semibold text-lg" data-testid={`swimlane-label-${swimlane.key}`}>
                              {swimlane.label}
                            </span>
                            <span 
                              className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                              data-testid={`swimlane-count-${swimlane.key}`}
                            >
                              {processCount} {processCount === 1 ? 'processo' : 'processos'}
                            </span>
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="p-4 pt-0 overflow-x-auto">
                          {renderKanbanColumns(swimlane.processes, swimlane.key)}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
              
              {swimlanes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum processo encontrado para exibir.
                </div>
              )}
            </div>
          )}
        </div>
      </DragDropContext>

      <ProcessDialog 
        process={selectedProcess} 
        open={!!selectedProcess} 
        onOpenChange={(open) => !open && setSelectedProcess(null)} 
      />
      
      <CreateProcessDialog 
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
