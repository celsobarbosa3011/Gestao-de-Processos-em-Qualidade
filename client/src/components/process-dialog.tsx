import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { Process } from "@shared/schema";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { useProfiles } from "@/hooks/use-profiles";
import { useProcessComments, useCreateComment } from "@/hooks/use-comments";
import { useProcessEvents } from "@/hooks/use-events";

interface ProcessDialogProps {
  process: Process | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessDialog({ process, open, onOpenChange }: ProcessDialogProps) {
  const { currentUser } = useStore();
  const { data: profiles = [] } = useProfiles();
  const { data: comments = [] } = useProcessComments(process?.id || null);
  const { data: events = [] } = useProcessEvents(process?.id || null);
  const createComment = useCreateComment();
  const [commentText, setCommentText] = useState("");

  if (!process) return null;

  const responsible = profiles.find(u => u.id === process.responsibleId);

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await createComment.mutateAsync({
      processId: process.id,
      text: commentText
    });
    setCommentText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono text-xs text-muted-foreground" data-testid={`badge-process-${process.id}`}>
              #{process.id}
            </Badge>
            <Badge className={
              process.priority === 'critical' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20' :
              process.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
              'bg-slate-100 text-slate-700 border-slate-200'
            }>
              {process.priority.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {process.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold leading-tight">
            {process.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {process.unit}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Criado em {format(new Date(process.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-2">
              <TabsList className="w-full justify-start h-10 bg-transparent p-0 border-b rounded-none">
                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4">
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4" data-testid="tab-comments">
                  Comentários ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4" data-testid="tab-history">
                  Histórico ({events.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Descrição</h3>
                  <div className="bg-muted/30 p-4 rounded-lg border text-sm leading-relaxed">
                    {process.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Responsável</h3>
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={responsible?.avatar || undefined} />
                        <AvatarFallback>{responsible?.name.slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{responsible?.name || 'Não atribuído'}</p>
                        <p className="text-xs text-muted-foreground">{responsible?.role}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Prazo</h3>
                    <div className="flex items-center gap-2 p-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {process.deadline ? format(new Date(process.deadline), "dd 'de' MMMM", { locale: ptBR }) : 'Sem prazo'}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 flex flex-col mt-0 h-full overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {comments.length === 0 && (
                     <div className="text-center py-8 text-muted-foreground text-sm">
                       Nenhum comentário ainda.
                     </div>
                  )}
                  {comments.map((comment) => {
                    const author = profiles.find(u => u.id === comment.userId);
                    const isMe = author?.id === currentUser?.id;
                    return (
                      <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`} data-testid={`comment-${comment.id}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{author?.name.slice(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'items-end' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{author?.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(comment.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div className={`p-3 rounded-lg text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input 
                    data-testid="input-comment"
                    placeholder="Escreva um comentário..." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  />
                  <Button 
                    data-testid="button-send-comment"
                    size="icon" 
                    onClick={handleSendComment}
                    disabled={createComment.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-y-auto p-6 mt-0">
               <div className="relative border-l ml-2 space-y-6">
                 {events.length === 0 && (
                    <div className="pl-6 text-sm text-muted-foreground">Sem histórico registrado.</div>
                 )}
                 {events.map((event) => {
                   const user = profiles.find(u => u.id === event.userId);
                   return (
                     <div key={event.id} className="ml-6 relative" data-testid={`event-${event.id}`}>
                       <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                       <div className="flex flex-col gap-1">
                         <span className="text-sm font-medium">{event.action}</span>
                         <span className="text-xs text-muted-foreground">{event.details}</span>
                         <span className="text-[10px] text-muted-foreground/60">
                           {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })} por {user?.name || 'Sistema'}
                         </span>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
