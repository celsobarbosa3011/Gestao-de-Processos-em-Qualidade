import { useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useStore } from "@/lib/store";
import { ProcessCard } from "@/components/process-card";
import { ProcessDialog } from "@/components/process-dialog";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CreateProcessDialog } from "@/components/create-process-dialog";
import { useProcesses, useUpdateProcess } from "@/hooks/use-processes";
import { useProfiles } from "@/hooks/use-profiles";
import { useAlertSettings } from "@/hooks/use-alert-settings";
import type { Process } from "@shared/schema";

type ProcessStatus = 'new' | 'analysis' | 'pending' | 'approved' | 'rejected';

const COLUMNS: { id: ProcessStatus; title: string }[] = [
  { id: 'new', title: 'Novos' },
  { id: 'analysis', title: 'Em Análise' },
  { id: 'pending', title: 'Pendentes' },
  { id: 'approved', title: 'Aprovados' },
  { id: 'rejected', title: 'Rejeitados' },
];

export default function KanbanPage() {
  const { currentUser } = useStore();
  const { data: processes = [], isLoading } = useProcesses();
  const { data: profiles = [] } = useProfiles();
  const { data: alertSettings } = useAlertSettings();
  const updateProcess = useUpdateProcess();
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");

  // Filter processes
  const visibleProcesses = processes.filter(p => {
    // Search filter
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !String(p.id).includes(search)) {
      return false;
    }
    // Admin unit filter
    if (currentUser?.role === 'admin' && unitFilter !== 'all' && p.unit !== unitFilter) {
      return false;
    }
    return true;
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const processId = parseInt(draggableId);
    const newStatus = destination.droppableId as ProcessStatus;
    
    updateProcess.mutate({
      id: processId,
      updates: { status: newStatus }
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Processos</h1>
          <p className="text-muted-foreground mt-1">Gerencie solicitações e acompanhe o fluxo de trabalho.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative w-full sm:w-64">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               data-testid="input-search"
               placeholder="Buscar processos..." 
               className="pl-9"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           {currentUser?.role === 'admin' && (
             <Select value={unitFilter} onValueChange={setUnitFilter}>
               <SelectTrigger className="w-[180px]" data-testid="select-unit-filter">
                 <Filter className="w-4 h-4 mr-2" />
                 <SelectValue placeholder="Filtrar Unidade" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todas Unidades</SelectItem>
                 <SelectItem value="Unidade A">Unidade A</SelectItem>
                 <SelectItem value="Unidade B">Unidade B</SelectItem>
                 <SelectItem value="Central">Central</SelectItem>
               </SelectContent>
             </Select>
           )}
           <Button 
             data-testid="button-new-process"
             className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
             onClick={() => setIsCreateOpen(true)}
           >
             <Plus className="w-4 h-4 mr-2" />
             Novo Processo
           </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1200px] h-full">
            {COLUMNS.map(column => {
              const columnProcesses = visibleProcesses.filter(p => p.status === column.id);
              return (
                <div key={column.id} className="flex-1 flex flex-col min-w-[280px] max-w-[350px] bg-secondary/30 rounded-xl border border-border/50 h-full">
                  <div className="p-4 border-b border-border/50 flex items-center justify-between bg-secondary/50 rounded-t-xl sticky top-0 z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground/80">{column.title}</h3>
                      <span 
                        data-testid={`count-${column.id}`}
                        className="bg-background text-foreground text-xs font-bold px-2 py-0.5 rounded-full border shadow-sm"
                      >
                        {columnProcesses.length}
                      </span>
                    </div>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
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
