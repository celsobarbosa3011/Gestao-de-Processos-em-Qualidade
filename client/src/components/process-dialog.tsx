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
import { Checkbox } from "@/components/ui/checkbox";
import type { Process } from "@shared/schema";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, MessageSquare, Send, CheckSquare, Paperclip, Tag, Plus, X, Upload, FileText, Image, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { useProfiles } from "@/hooks/use-profiles";
import { useProcessComments, useCreateComment } from "@/hooks/use-comments";
import { useProcessEvents } from "@/hooks/use-events";
import { useProcessChecklists, useCreateChecklist, useUpdateChecklist, useDeleteChecklist, useProcessAttachments, useUploadAttachment, useDeleteAttachment, useAllLabels, useProcessLabels, useAddLabelToProcess, useRemoveLabelFromProcess, useCreateLabel } from "@/hooks/use-process-extras";
import { toast } from "sonner";

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
  const { data: checklists = [] } = useProcessChecklists(process?.id || null);
  const { data: attachments = [] } = useProcessAttachments(process?.id || null);
  const { data: allLabels = [] } = useAllLabels();
  const { data: processLabels = [] } = useProcessLabels(process?.id || null);
  
  const createComment = useCreateComment();
  const createChecklist = useCreateChecklist();
  const updateChecklist = useUpdateChecklist();
  const deleteChecklist = useDeleteChecklist();
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const addLabel = useAddLabelToProcess();
  const removeLabel = useRemoveLabelFromProcess();
  const createLabel = useCreateLabel();
  
  const [commentText, setCommentText] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6B7280");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!process) return null;

  const responsible = profiles.find(u => u.id === process.responsibleId);
  const completedChecklists = checklists.filter(c => c.completed).length;

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await createComment.mutateAsync({
      processId: process.id,
      text: commentText
    });
    setCommentText("");
  };

  const handleAddChecklist = async () => {
    if (!newChecklistText.trim()) return;
    await createChecklist.mutateAsync({
      processId: process.id,
      text: newChecklistText
    });
    setNewChecklistText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await uploadAttachment.mutateAsync({ processId: process.id, file });
      toast.success("Anexo enviado com sucesso");
    } catch (error) {
      toast.error("Erro ao enviar anexo");
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddLabel = async (labelId: number) => {
    await addLabel.mutateAsync({ processId: process.id, labelId });
  };

  const handleRemoveLabel = async (labelId: number) => {
    await removeLabel.mutateAsync({ processId: process.id, labelId });
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    await createLabel.mutateAsync({ name: newLabelName, color: newLabelColor });
    setNewLabelName("");
    setNewLabelColor("#6B7280");
  };

  const availableLabels = allLabels.filter(
    label => !processLabels.some(pl => pl.id === label.id)
  );

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
            {processLabels.map(label => (
              <Badge 
                key={label.id} 
                style={{ backgroundColor: label.color, color: '#fff' }}
                className="text-xs"
              >
                {label.name}
              </Badge>
            ))}
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
              <TabsList className="w-full justify-start h-10 bg-transparent p-0 border-b rounded-none overflow-x-auto">
                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3">
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="checklist" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3" data-testid="tab-checklist">
                  <CheckSquare className="w-3.5 h-3.5 mr-1" />
                  {completedChecklists}/{checklists.length}
                </TabsTrigger>
                <TabsTrigger value="attachments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3" data-testid="tab-attachments">
                  <Paperclip className="w-3.5 h-3.5 mr-1" />
                  {attachments.length}
                </TabsTrigger>
                <TabsTrigger value="labels" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3" data-testid="tab-labels">
                  <Tag className="w-3.5 h-3.5 mr-1" />
                  {processLabels.length}
                </TabsTrigger>
                <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3" data-testid="tab-comments">
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  {comments.length}
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3" data-testid="tab-history">
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

            <TabsContent value="checklist" className="flex-1 flex flex-col mt-0 overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-2">
                  {checklists.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum item na checklist.
                    </div>
                  )}
                  {checklists.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group" data-testid={`checklist-${item.id}`}>
                      <Checkbox 
                        checked={item.completed} 
                        onCheckedChange={(checked) => updateChecklist.mutate({ id: item.id, completed: !!checked, processId: process.id })}
                        data-testid={`checkbox-${item.id}`}
                      />
                      <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.text}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteChecklist.mutate({ id: item.id, processId: process.id })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input 
                    data-testid="input-checklist"
                    placeholder="Adicionar item..." 
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                  />
                  <Button 
                    data-testid="button-add-checklist"
                    size="icon" 
                    onClick={handleAddChecklist}
                    disabled={createChecklist.isPending}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="flex-1 flex flex-col mt-0 overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-2">
                  {attachments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhum anexo.
                    </div>
                  )}
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 group" data-testid={`attachment-${attachment.id}`}>
                      {getFileIcon(attachment.fileName)}
                      <div className="flex-1 min-w-0">
                        <a 
                          href={attachment.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline truncate block"
                        >
                          {attachment.fileName}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(attachment.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => deleteAttachment.mutate({ id: attachment.id, processId: process.id })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  data-testid="button-upload-attachment"
                  variant="outline" 
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAttachment.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadAttachment.isPending ? 'Enviando...' : 'Enviar Anexo'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="labels" className="flex-1 flex flex-col mt-0 overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Etiquetas do Processo</h4>
                    <div className="flex flex-wrap gap-2">
                      {processLabels.length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhuma etiqueta.</span>
                      )}
                      {processLabels.map(label => (
                        <Badge 
                          key={label.id} 
                          style={{ backgroundColor: label.color, color: '#fff' }}
                          className="text-xs cursor-pointer hover:opacity-80"
                          onClick={() => handleRemoveLabel(label.id)}
                        >
                          {label.name}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Adicionar Etiqueta</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableLabels.length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhuma etiqueta disponível.</span>
                      )}
                      {availableLabels.map(label => (
                        <Badge 
                          key={label.id} 
                          style={{ backgroundColor: label.color, color: '#fff' }}
                          className="text-xs cursor-pointer hover:opacity-80"
                          onClick={() => handleAddLabel(label.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input 
                    data-testid="input-label-name"
                    placeholder="Nova etiqueta..." 
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    className="flex-1"
                  />
                  <input 
                    type="color" 
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Button 
                    data-testid="button-create-label"
                    size="icon" 
                    onClick={handleCreateLabel}
                    disabled={createLabel.isPending}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
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
