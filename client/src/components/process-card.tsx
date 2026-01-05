import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Paperclip, MessageSquare, AlertCircle, Clock } from "lucide-react";
import type { Process } from "@shared/schema";
import type { Profile, AlertSettings } from "@shared/schema";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { Draggable } from "@hello-pangea/dnd";
import { useTotalTime } from "@/hooks/use-process-extras";
import { getPriorityBgColor } from "@/lib/priority-colors";

interface ProcessCardProps {
  process: Process;
  index: number;
  onClick: () => void;
  profiles: Profile[];
  alertSettings: AlertSettings | undefined;
}

export function ProcessCard({ process, index, onClick, profiles, alertSettings }: ProcessCardProps) {
  const { data: totalTimeData } = useTotalTime(process.id);
  const responsible = profiles?.find(u => u.id === process.responsibleId);
  
  const formatMinutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };
  
  const daysUntilDeadline = process.deadline 
    ? differenceInDays(new Date(process.deadline), new Date()) 
    : 999;

  let deadlineStatus = "text-muted-foreground";
  if (process.status !== 'approved' && process.status !== 'rejected' && alertSettings) {
    if (daysUntilDeadline < 0) deadlineStatus = "text-destructive font-bold";
    else if (daysUntilDeadline <= alertSettings.criticalDays) deadlineStatus = "text-destructive";
    else if (daysUntilDeadline <= alertSettings.warningDays) deadlineStatus = "text-yellow-600";
  }

  const priorityColors: Record<string, string> = {
    low: "bg-green-100 text-green-700 hover:bg-green-200",
    medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    high: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    critical: "bg-red-100 text-red-700 hover:bg-red-200",
    "Baixa": "bg-green-100 text-green-700 hover:bg-green-200",
    "Média": "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    "Alta": "bg-orange-100 text-orange-700 hover:bg-orange-200",
    "Crítica": "bg-red-100 text-red-700 hover:bg-red-200",
  };
  
  const priorityBorderColors: Record<string, string> = {
    low: "border-l-green-500",
    medium: "border-l-yellow-500",
    high: "border-l-orange-500",
    critical: "border-l-red-500",
    "Baixa": "border-l-green-500",
    "Média": "border-l-yellow-500",
    "Alta": "border-l-orange-500",
    "Crítica": "border-l-red-500",
  };

  return (
    <Draggable draggableId={String(process.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={provided.draggableProps.style}
          className={cn(
            "group relative mb-3 transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[1.02]",
            snapshot.isDragging && "shadow-xl rotate-1 z-50 opacity-90"
          )}
          data-testid={`card-process-${process.id}`}
        >
          <Card className={cn("cursor-pointer border-l-4 shadow-sm hover:shadow-md transition-shadow", priorityBorderColors[process.priority] || "border-l-gray-500")}>
            <CardHeader className="p-3 pb-0 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <Badge variant="secondary" className={cn("text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider", priorityColors[process.priority] || "bg-gray-100 text-gray-700")}>
                  {(process.priority === 'critical' || process.priority === 'Crítica') && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                  {process.priority}
                </Badge>
                {process.deadline && (
                  <div className={cn("text-xs flex items-center gap-1", deadlineStatus)} title="Prazo">
                    <Calendar className="w-3 h-3" />
                    {new Date(process.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                )}
              </div>
              <CardTitle className="text-sm font-medium leading-tight text-foreground line-clamp-2">
                {process.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {(totalTimeData?.total ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-xs" title="Tempo registrado" data-testid={`time-total-card-${process.id}`}>
                      <Clock className="w-3 h-3" />
                      <span>{formatMinutesToTime(totalTimeData?.total || 0)}</span>
                    </div>
                  )}
                </div>
                
                {responsible && (
                  <div className="flex items-center gap-1.5" title={`Responsável: ${responsible.name}`}>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium max-w-[80px] truncate text-right">
                      {responsible.name.split(' ')[0]}
                    </span>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={responsible.avatar || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {responsible.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1">
                 <span className="text-[10px] text-muted-foreground/70 font-mono bg-muted/50 px-1 rounded" data-testid={`text-process-id-${process.id}`}>
                   #{process.id}
                 </span>
                 <span className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]">
                   • {process.type}
                 </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
