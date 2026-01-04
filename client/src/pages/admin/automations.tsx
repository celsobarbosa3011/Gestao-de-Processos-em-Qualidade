import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Zap, Play, Pause } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAutomations, createAutomation, updateAutomation, deleteAutomation } from "@/lib/api";
import type { Automation, InsertAutomation } from "@shared/schema";
import { Redirect } from "wouter";

const triggerTypes = [
  { value: "status_change", label: "Mudança de Status" },
  { value: "deadline_approaching", label: "Prazo Aproximando" },
  { value: "new_process", label: "Novo Processo" },
  { value: "field_update", label: "Atualização de Campo" },
];

const actionTypes = [
  { value: "change_status", label: "Alterar Status" },
  { value: "assign_user", label: "Atribuir Usuário" },
  { value: "add_label", label: "Adicionar Etiqueta" },
  { value: "send_notification", label: "Enviar Notificação" },
  { value: "add_checklist", label: "Adicionar Checklist" },
];

const getTriggerLabel = (trigger: string) => {
  return triggerTypes.find(t => t.value === trigger)?.label || trigger;
};

const getActionLabel = (action: string) => {
  return actionTypes.find(a => a.value === action)?.label || action;
};

const triggerConfigExamples: Record<string, string> = {
  status_change: '{\n  "fromStatus": "new",\n  "toStatus": "analysis"\n}',
  deadline_approaching: '{\n  "daysBefore": 3\n}',
  new_process: '{\n  "type": "compra",\n  "priority": "high"\n}',
  field_update: '{\n  "fieldName": "responsibleId"\n}',
};

const actionConfigExamples: Record<string, string> = {
  change_status: '{\n  "newStatus": "pending"\n}',
  assign_user: '{\n  "userId": "user-id-here"\n}',
  add_label: '{\n  "labelId": 1\n}',
  send_notification: '{\n  "title": "Lembrete",\n  "message": "Processo requer atenção"\n}',
  add_checklist: '{\n  "items": ["Item 1", "Item 2"]\n}',
};

export default function AdminAutomationsPage() {
  const { currentUser } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    trigger: string;
    triggerConfig: string;
    action: string;
    actionConfig: string;
    enabled: boolean;
  }>({
    name: "",
    description: "",
    trigger: "status_change",
    triggerConfig: "",
    action: "change_status",
    actionConfig: "",
    enabled: true,
  });
  const queryClient = useQueryClient();

  if (currentUser?.role !== 'admin') {
    return <Redirect to="/kanban" />;
  }

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: getAutomations,
  });

  const createMutation = useMutation({
    mutationFn: createAutomation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Automação criada com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível criar a automação");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertAutomation> }) => 
      updateAutomation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setIsDialogOpen(false);
      setSelectedAutomation(null);
      resetForm();
      toast.success("Automação atualizada com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível atualizar a automação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAutomation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setIsDeleteDialogOpen(false);
      setSelectedAutomation(null);
      toast.success("Automação excluída com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível excluir a automação");
    },
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => 
      updateAutomation(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success("Status da automação atualizado");
    },
    onError: () => {
      toast.error("Não foi possível atualizar o status");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger: "status_change",
      triggerConfig: "",
      action: "change_status",
      actionConfig: "",
      enabled: true,
    });
  };

  const openCreateDialog = () => {
    setSelectedAutomation(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (automation: Automation) => {
    setSelectedAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description || "",
      trigger: automation.trigger,
      triggerConfig: automation.triggerConfig || "",
      action: automation.action,
      actionConfig: automation.actionConfig || "",
      enabled: automation.enabled,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (automation: Automation) => {
    setSelectedAutomation(automation);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const automationData: InsertAutomation = {
      name: formData.name,
      description: formData.description || null,
      trigger: formData.trigger,
      triggerConfig: formData.triggerConfig || null,
      action: formData.action,
      actionConfig: formData.actionConfig || null,
      enabled: formData.enabled,
    };

    if (selectedAutomation) {
      updateMutation.mutate({ id: selectedAutomation.id, updates: automationData });
    } else {
      createMutation.mutate(automationData);
    }
  };

  const confirmDelete = () => {
    if (selectedAutomation) {
      deleteMutation.mutate(selectedAutomation.id);
    }
  };

  const handleToggleEnabled = (automation: Automation) => {
    toggleEnabledMutation.mutate({ id: automation.id, enabled: !automation.enabled });
  };

  return (
    <div className="space-y-6" data-testid="admin-automations-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
          <p className="text-muted-foreground mt-1">
            Configure automações para executar ações automaticamente.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2 shadow-sm" 
              onClick={openCreateDialog}
              data-testid="button-add-automation"
            >
              <Plus className="w-4 h-4" />
              Adicionar Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-automation">
            <DialogHeader>
              <DialogTitle>
                {selectedAutomation ? "Editar Automação" : "Nova Automação"}
              </DialogTitle>
              <DialogDescription>
                {selectedAutomation 
                  ? "Edite as informações da automação." 
                  : "Preencha as informações para criar uma nova automação."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Notificar prazo próximo"
                  required
                  data-testid="input-automation-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o que esta automação faz..."
                  rows={2}
                  data-testid="textarea-automation-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Gatilho</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value) => setFormData({ ...formData, trigger: value })}
                >
                  <SelectTrigger data-testid="select-automation-trigger">
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((type) => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        data-testid={`option-trigger-${type.value}`}
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="triggerConfig">Configuração do Gatilho (JSON)</Label>
                <Textarea
                  id="triggerConfig"
                  value={formData.triggerConfig}
                  onChange={(e) => setFormData({ ...formData, triggerConfig: e.target.value })}
                  placeholder={triggerConfigExamples[formData.trigger] || "{}"}
                  rows={4}
                  className="font-mono text-sm"
                  data-testid="textarea-trigger-config"
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: <code className="bg-muted px-1 rounded">{triggerConfigExamples[formData.trigger]?.split('\n')[1]?.trim() || '{}'}</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Ação</Label>
                <Select
                  value={formData.action}
                  onValueChange={(value) => setFormData({ ...formData, action: value })}
                >
                  <SelectTrigger data-testid="select-automation-action">
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((type) => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        data-testid={`option-action-${type.value}`}
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionConfig">Configuração da Ação (JSON)</Label>
                <Textarea
                  id="actionConfig"
                  value={formData.actionConfig}
                  onChange={(e) => setFormData({ ...formData, actionConfig: e.target.value })}
                  placeholder={actionConfigExamples[formData.action] || "{}"}
                  rows={4}
                  className="font-mono text-sm"
                  data-testid="textarea-action-config"
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: <code className="bg-muted px-1 rounded">{actionConfigExamples[formData.action]?.split('\n')[1]?.trim() || '{}'}</code>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  data-testid="switch-automation-enabled"
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                  Ativada
                </Label>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-automation"
                >
                  {selectedAutomation ? "Salvar Alterações" : "Criar Automação"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : automations.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma automação configurada</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Crie automações para executar ações automaticamente com base em gatilhos.
            </p>
            <Button onClick={openCreateDialog} data-testid="button-add-automation-empty">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {automations.map((automation) => (
            <Card 
              key={automation.id} 
              className={`shadow-sm transition-opacity ${!automation.enabled ? 'opacity-60' : ''}`}
              data-testid={`card-automation-${automation.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate" data-testid={`text-automation-name-${automation.id}`}>
                      {automation.name}
                    </CardTitle>
                    {automation.description && (
                      <CardDescription className="mt-1 line-clamp-2" data-testid={`text-automation-description-${automation.id}`}>
                        {automation.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge 
                    variant={automation.enabled ? "default" : "secondary"}
                    data-testid={`badge-automation-status-${automation.id}`}
                  >
                    {automation.enabled ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" data-testid={`badge-trigger-${automation.id}`}>
                      Gatilho: {getTriggerLabel(automation.trigger)}
                    </Badge>
                    <Badge variant="outline" data-testid={`badge-action-${automation.id}`}>
                      Ação: {getActionLabel(automation.action)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation.enabled}
                        onCheckedChange={() => handleToggleEnabled(automation)}
                        disabled={toggleEnabledMutation.isPending}
                        data-testid={`switch-toggle-${automation.id}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {automation.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(automation)}
                        data-testid={`button-edit-automation-${automation.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(automation)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-automation-${automation.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-automation">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Automação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a automação "{selectedAutomation?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
