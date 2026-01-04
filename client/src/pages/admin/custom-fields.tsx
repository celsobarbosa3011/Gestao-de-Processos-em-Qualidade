import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomFields, createCustomField, updateCustomField, deleteCustomField } from "@/lib/api";
import type { CustomField, InsertCustomField } from "@shared/schema";
import { Redirect } from "wouter";

const fieldTypes = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Seleção" },
  { value: "checkbox", label: "Checkbox" },
];

const getTypeLabel = (type: string) => {
  return fieldTypes.find(t => t.value === type)?.label || type;
};

export default function AdminCustomFieldsPage() {
  const { currentUser } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    options: string;
    required: boolean;
    showOnCard: boolean;
    order: number;
  }>({
    name: "",
    type: "text",
    options: "",
    required: false,
    showOnCard: false,
    order: 0,
  });
  const queryClient = useQueryClient();

  if (currentUser?.role !== 'admin') {
    return <Redirect to="/kanban" />;
  }

  const { data: customFields = [], isLoading } = useQuery({
    queryKey: ['customFields'],
    queryFn: getCustomFields,
  });

  const createMutation = useMutation({
    mutationFn: createCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success("Campo personalizado criado com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível criar o campo personalizado");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertCustomField> }) => 
      updateCustomField(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      setIsDialogOpen(false);
      setSelectedField(null);
      resetForm();
      toast.success("Campo personalizado atualizado com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível atualizar o campo personalizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      setIsDeleteDialogOpen(false);
      setSelectedField(null);
      toast.success("Campo personalizado excluído com sucesso");
    },
    onError: () => {
      toast.error("Não foi possível excluir o campo personalizado");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "text",
      options: "",
      required: false,
      showOnCard: false,
      order: 0,
    });
  };

  const openCreateDialog = () => {
    setSelectedField(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (field: CustomField) => {
    setSelectedField(field);
    setFormData({
      name: field.name,
      type: field.type,
      options: field.options?.join(", ") || "",
      required: field.required,
      showOnCard: field.showOnCard,
      order: field.order,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (field: CustomField) => {
    setSelectedField(field);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fieldData: InsertCustomField = {
      name: formData.name,
      type: formData.type,
      options: formData.type === "select" && formData.options 
        ? formData.options.split(",").map(o => o.trim()).filter(Boolean) 
        : null,
      required: formData.required,
      showOnCard: formData.showOnCard,
      order: formData.order,
    };

    if (selectedField) {
      updateMutation.mutate({ id: selectedField.id, updates: fieldData });
    } else {
      createMutation.mutate(fieldData);
    }
  };

  const confirmDelete = () => {
    if (selectedField) {
      deleteMutation.mutate(selectedField.id);
    }
  };

  const sortedFields = [...customFields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6" data-testid="admin-custom-fields-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campos Personalizados</h1>
          <p className="text-muted-foreground mt-1">
            Configure campos adicionais para os processos.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2 shadow-sm" 
              onClick={openCreateDialog}
              data-testid="button-add-custom-field"
            >
              <Plus className="w-4 h-4" />
              Adicionar Campo
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-custom-field">
            <DialogHeader>
              <DialogTitle>
                {selectedField ? "Editar Campo Personalizado" : "Novo Campo Personalizado"}
              </DialogTitle>
              <DialogDescription>
                {selectedField 
                  ? "Edite as informações do campo personalizado." 
                  : "Preencha as informações para criar um novo campo."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Número do Contrato"
                  required
                  data-testid="input-field-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-field-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem 
                        key={type.value} 
                        value={type.value}
                        data-testid={`option-type-${type.value}`}
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "select" && (
                <div className="space-y-2">
                  <Label htmlFor="options">Opções (separadas por vírgula)</Label>
                  <Input
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Ex: Opção 1, Opção 2, Opção 3"
                    data-testid="input-field-options"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, required: checked === true })
                  }
                  data-testid="checkbox-required"
                />
                <Label htmlFor="required" className="cursor-pointer">
                  Obrigatório
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOnCard"
                  checked={formData.showOnCard}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, showOnCard: checked === true })
                  }
                  data-testid="checkbox-show-on-card"
                />
                <Label htmlFor="showOnCard" className="cursor-pointer">
                  Exibir no Card
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  min={0}
                  data-testid="input-field-order"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-field"
                >
                  {selectedField ? "Salvar Alterações" : "Criar Campo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Obrigatório</TableHead>
                <TableHead>Exibir no Card</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : sortedFields.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={6} 
                    className="text-center py-8 text-muted-foreground"
                    data-testid="text-no-custom-fields"
                  >
                    Nenhum campo personalizado cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedFields.map((field) => (
                  <TableRow key={field.id} data-testid={`row-custom-field-${field.id}`}>
                    <TableCell className="font-medium" data-testid={`text-field-name-${field.id}`}>
                      {field.name}
                    </TableCell>
                    <TableCell data-testid={`text-field-type-${field.id}`}>
                      <Badge variant="outline">{getTypeLabel(field.type)}</Badge>
                    </TableCell>
                    <TableCell data-testid={`text-field-required-${field.id}`}>
                      {field.required ? (
                        <Badge variant="default">Sim</Badge>
                      ) : (
                        <Badge variant="secondary">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-field-show-on-card-${field.id}`}>
                      {field.showOnCard ? (
                        <Badge variant="default">Sim</Badge>
                      ) : (
                        <Badge variant="secondary">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-field-order-${field.id}`}>
                      {field.order}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(field)}
                          data-testid={`button-edit-field-${field.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(field)}
                          data-testid={`button-delete-field-${field.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o campo "{selectedField?.name}"? 
              Esta ação não pode ser desfeita e todos os valores associados serão perdidos.
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
