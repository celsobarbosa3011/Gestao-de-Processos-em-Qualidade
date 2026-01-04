import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreVertical, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Priority } from "@shared/schema";

const prioritySchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  level: z.number().min(0, "Nível deve ser positivo"),
  color: z.string().default('#6B7280'),
  order: z.number().default(0),
  active: z.boolean().default(true),
});

type PriorityFormData = z.infer<typeof prioritySchema>;

async function getPriorities(): Promise<Priority[]> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("/api/priorities", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch priorities");
  return res.json();
}

async function createPriority(data: PriorityFormData): Promise<Priority> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch("/api/priorities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create priority");
  }
  return res.json();
}

async function updatePriority(id: number, data: Partial<PriorityFormData>): Promise<Priority> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api/priorities/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update priority");
  return res.json();
}

async function deletePriority(id: number): Promise<void> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`/api/priorities/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to delete priority");
}

export default function AdminPrioritiesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const queryClient = useQueryClient();

  const { data: priorities = [], isLoading } = useQuery({
    queryKey: ['/api/priorities'],
    queryFn: getPriorities,
  });

  const createMutation = useMutation({
    mutationFn: createPriority,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/priorities'] });
      toast.success("Prioridade criada com sucesso");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PriorityFormData> }) => updatePriority(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/priorities'] });
      toast.success("Prioridade atualizada");
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar prioridade");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePriority,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/priorities'] });
      toast.success("Prioridade removida");
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao remover prioridade");
    },
  });

  const form = useForm<PriorityFormData>({
    resolver: zodResolver(prioritySchema),
    defaultValues: {
      name: "",
      level: 0,
      color: "#6B7280",
      order: 0,
      active: true,
    },
  });

  const editForm = useForm<PriorityFormData>({
    resolver: zodResolver(prioritySchema),
    defaultValues: {
      name: "",
      level: 0,
      color: "#6B7280",
      order: 0,
      active: true,
    },
  });

  const onSubmit = (data: PriorityFormData) => {
    createMutation.mutate(data);
  };

  const onEdit = (data: PriorityFormData) => {
    if (!selectedPriority) return;
    updateMutation.mutate({ id: selectedPriority.id, data });
  };

  const openEditDialog = (priority: Priority) => {
    setSelectedPriority(priority);
    editForm.reset({
      name: priority.name,
      level: priority.level,
      color: priority.color || "#6B7280",
      order: priority.order,
      active: priority.active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (priority: Priority) => {
    setSelectedPriority(priority);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prioridades</h1>
          <p className="text-muted-foreground mt-1">Gerencie os níveis de prioridade disponíveis no sistema.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-priority">
            <Plus className="w-4 h-4 mr-2" />
            Nova Prioridade
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Prioridade</DialogTitle>
              <DialogDescription>Adicione um novo nível de prioridade ao sistema.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Alta" data-testid="input-priority-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1-10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Maior = mais urgente</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input type="color" className="w-12 h-10 p-1" {...field} />
                          <Input value={field.value} onChange={field.onChange} placeholder="#6B7280" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>Ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">Esta prioridade estará disponível para seleção</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-priority">
                    {createMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    Nenhuma prioridade cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                priorities.map((priority) => (
                  <TableRow key={priority.id} data-testid={`row-priority-${priority.id}`}>
                    <TableCell>
                      <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: priority.color || '#6B7280' }} />
                    </TableCell>
                    <TableCell className="font-medium">{priority.name}</TableCell>
                    <TableCell>{priority.level}</TableCell>
                    <TableCell>{priority.order}</TableCell>
                    <TableCell>
                      <Badge variant={priority.active ? "default" : "secondary"}>
                        {priority.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-menu-${priority.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(priority)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(priority)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Prioridade</DialogTitle>
            <DialogDescription>Atualize as informações da prioridade.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                        <Input value={field.value} onChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Ativo</FormLabel>
                      <p className="text-sm text-muted-foreground">Esta prioridade estará disponível para seleção</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a prioridade "{selectedPriority?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPriority && deleteMutation.mutate(selectedPriority.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
