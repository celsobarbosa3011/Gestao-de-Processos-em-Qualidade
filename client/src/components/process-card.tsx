import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Paperclip, MessageSquare, AlertCircle } from "lucide-react";
import type { Process } from "@shared/schema";
import type { Profile, AlertSettings } from "@shared/schema";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { Draggable } from "@hello-pangea/dnd";

interface ProcessCardProps {
  process: Process;
  index: number;
  onClick: () => void;
  profiles: Profile[];
  alertSettings: AlertSettings | undefined;
}

export function ProcessCard({ process, index, onClick, profiles, alertSettings }: ProcessCardProps) {
  
  const responsible = profiles?.find(u => u.id === process.responsibleId);
  
  const daysUntilDeadline = process.deadline 
    ? differenceInDays(new Date(process.deadline), new Date()) 
    : 999;

  let deadlineStatus = "text-muted-foreground";
  if (process.status !== 'approved' && process.status !== 'rejected' && alertSettings) {
    if (daysUntilDeadline < 0) deadlineStatus = "text-destructive font-bold";
    else if (daysUntilDeadline <= alertSettings.criticalDays) deadlineStatus = "text-destructive";
    else if (daysUntilDeadline <= alertSettings.warningDays) deadlineStatus = "text-yellow-600";
  }

  const priorityColors = {
    low: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    medium: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    high: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    critical: "bg-red-100 text-red-700 hover:bg-red-200",
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
          <Card className="cursor-pointer border-l-4 border-l-transparent hover:border-l-primary/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-3 pb-0 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <Badge variant="secondary" className={cn("text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider", priorityColors[process.priority as keyof typeof priorityColors])}>
                  {process.priority === 'critical' && <AlertCircle className="w-3 h-3 mr-1 inline" />}
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
                  {/* Comment count removed from card for simplicity */}
                </div>
                
                {responsible && (
                  <div className="flex items-center gap-1.5" title={`Responsável: ${responsible.name}`}>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium max-w-[80px] truncate text-right">
                      {responsible.name.split(' ')[0]}
                    </span>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={responsible.avatar} />
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
