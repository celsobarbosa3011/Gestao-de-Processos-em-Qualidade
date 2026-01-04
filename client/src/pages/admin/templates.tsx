import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, PlayCircle, CheckSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate, createProcess } from "@/lib/api";
import type { ProcessTemplate } from "@shared/schema";
import { Redirect, useLocation } from "wouter";

const priorityOptions = [
  { value: "low", label: "Baixa", color: "bg-gray-500" },
  { value: "medium", label: "Média", color: "bg-yellow-500" },
  { value: "high", label: "Alta", color: "bg-orange-500" },
  { value: "critical", label: "Crítica", color: "bg-red-500" },
];

const getPriorityConfig = (priority: string) => {
  return priorityOptions.find(p => p.value === priority) || priorityOptions[1];
};

export default function AdminTemplatesPage() {
  const { currentUser } = useStore();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    priority: "medium",
    defaultChecklist: "",
  });
  const queryClient = useQueryClient();

  if (currentUser?.role !== 'admin') {
    return <Redirect to="/kanban" />;
  }

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: getAllTemplates,
  });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Template criado com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível criar o template");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Omit<ProcessTemplate, 'id' | 'createdAt' | 'createdBy'>> }) => 
      updateTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsDialogOpen(false);
      setSelectedTemplate(null);
      resetForm();
      toast.success("Template atualizado com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível atualizar o template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
      toast.success("Template excluído com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível excluir o template");
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: (template: ProcessTemplate) => createProcess({
      title: template.name,
      description: template.description || "",
      type: template.type,
      priority: template.priority,
      unit: currentUser?.unit || "Geral",
      status: "new",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast.success("Processo criado a partir do template");
      setLocation("/kanban");
    },
    onError: () => {
      toast.error("Não foi possível criar o processo");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      priority: "medium",
      defaultChecklist: "",
    });
  };

  const openCreateDialog = () => {
    setSelectedTemplate(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: ProcessTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      type: template.type,
      priority: template.priority,
      defaultChecklist: template.defaultChecklist?.join("\n") || "",
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (template: ProcessTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const checklistItems = formData.defaultChecklist
      .split("\n")
      .map(item => item.trim())
      .filter(Boolean);

    const templateData = {
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      priority: formData.priority,
      defaultChecklist: checklistItems.length > 0 ? checklistItems : null,
    };

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, updates: templateData });
    } else {
      createMutation.mutate(templateData);
    }
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
      deleteMutation.mutate(selectedTemplate.id);
    }
  };

  const handleUseTemplate = (template: ProcessTemplate) => {
    useTemplateMutation.mutate(template);
  };

  return (
    <div className="space-y-6" data-testid="admin-templates-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates de Processo</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie templates para criar novos processos rapidamente.
          </p>
        </div>
        <Button 
          className="gap-2 shadow-sm" 
          onClick={openCreateDialog}
          data-testid="button-add-template"
        >
          <Plus className="w-4 h-4" />
          Novo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum template cadastrado.</p>
            <Button onClick={openCreateDialog} data-testid="button-add-template-empty">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => {
            const priorityConfig = getPriorityConfig(template.priority);
            return (
              <Card key={template.id} className="shadow-sm" data-testid={`card-template-${template.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg" data-testid={`text-template-name-${template.id}`}>
                        {template.name}
                      </CardTitle>
                      {template.description && (
                        <CardDescription data-testid={`text-template-description-${template.id}`}>
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge 
                      className={`${priorityConfig.color} text-white`}
                      data-testid={`badge-priority-${template.id}`}
                    >
                      {priorityConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" data-testid={`badge-type-${template.id}`}>
                      {template.type}
                    </Badge>
                  </div>
                  
                  {template.defaultChecklist && template.defaultChecklist.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CheckSquare className="w-4 h-4" />
                        <span>Checklist padrão ({template.defaultChecklist.length} itens)</span>
                      </div>
                      <ul className="text-sm space-y-1 pl-5 list-disc text-muted-foreground" data-testid={`list-checklist-${template.id}`}>
                        {template.defaultChecklist.slice(0, 3).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                        {template.defaultChecklist.length > 3 && (
                          <li className="text-xs">+{template.defaultChecklist.length - 3} mais...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1 flex-1"
                      onClick={() => handleUseTemplate(template)}
                      disabled={useTemplateMutation.isPending}
                      data-testid={`button-use-template-${template.id}`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Usar Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                      data-testid={`button-edit-template-${template.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(template)}
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-template">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate 
                ? "Edite as informações do template de processo." 
                : "Preencha as informações para criar um novo template."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Solicitação de Compra"
                required
                data-testid="input-template-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo deste template..."
                rows={3}
                data-testid="input-template-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Ex: Compra, Licença, Documentação"
                required
                data-testid="input-template-type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger data-testid="select-template-priority">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      data-testid={`option-priority-${option.value}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultChecklist">Checklist Padrão</Label>
              <Textarea
                id="defaultChecklist"
                value={formData.defaultChecklist}
                onChange={(e) => setFormData({ ...formData, defaultChecklist: e.target.value })}
                placeholder="Digite um item por linha..."
                rows={4}
                data-testid="input-template-checklist"
              />
              <p className="text-xs text-muted-foreground">
                Um item por linha. Esses itens serão adicionados automaticamente ao criar um processo.
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-template"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-template"
              >
                {selectedTemplate ? "Salvar Alterações" : "Criar Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-template">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{selectedTemplate?.name}"? 
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
