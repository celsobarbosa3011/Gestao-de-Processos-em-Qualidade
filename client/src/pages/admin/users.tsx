import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MoreVertical, Ban, CheckCircle, Pencil, Trash2, Key, Copy, Loader2, MapPin, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllProfiles, createProfile, updateProfile, deleteProfile, generateProvisionalPassword, getAllUnits } from "@/lib/api";
import type { Profile, Unit } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "user"]),
  unit: z.string().min(1, "Unidade é obrigatória"),
  motherName: z.string().optional(),
  cpf: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function AdminUsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: getAllProfiles,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getAllUnits,
  });

  const createMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Profile> }) => updateProfile(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const searchCep = async (cep: string, formInstance: typeof form) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      formInstance.setValue('address', data.logradouro || '');
      formInstance.setValue('neighborhood', data.bairro || '');
      formInstance.setValue('city', data.localidade || '');
      formInstance.setValue('state', data.uf || '');
      toast.success("Endereço preenchido automaticamente");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      unit: "",
      motherName: "",
      cpf: "",
      cep: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      phone: "",
      secondaryPhone: "",
    },
  });

  const onSubmit = (values: UserFormData) => {
    createMutation.mutate({
      name: values.name,
      email: values.email,
      role: values.role,
      unit: values.unit,
      status: 'active',
      avatar: undefined,
      motherName: values.motherName || undefined,
      cpf: values.cpf || undefined,
      cep: values.cep || undefined,
      address: values.address || undefined,
      neighborhood: values.neighborhood || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      phone: values.phone || undefined,
      secondaryPhone: values.secondaryPhone || undefined,
    }, {
      onSuccess: (data: any) => {
        setIsDialogOpen(false);
        form.reset();
        if (data.emailSent) {
          toast.success(`${values.name} foi adicionado. Credenciais enviadas por email.`);
        } else {
          toast.success(`${values.name} foi adicionado. Email não pôde ser enviado automaticamente.`);
        }
      },
      onError: () => {
        toast.error("Não foi possível criar o usuário");
      }
    });
  };

  const toggleStatus = (user: Profile) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    updateMutation.mutate({ id: user.id, updates: { status: newStatus } }, {
      onSuccess: () => {
        toast.success(`Usuário ${user.name} agora está ${newStatus === 'active' ? 'ativo' : 'suspenso'}`);
      }
    });
  };

  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      unit: "",
      motherName: "",
      cpf: "",
      cep: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      phone: "",
      secondaryPhone: "",
    },
  });

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role as "admin" | "user",
      unit: user.unit,
      motherName: user.motherName || "",
      cpf: user.cpf || "",
      cep: user.cep || "",
      address: user.address || "",
      neighborhood: user.neighborhood || "",
      city: user.city || "",
      state: user.state || "",
      phone: user.phone || "",
      secondaryPhone: user.secondaryPhone || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (user: Profile) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const onEditSubmit = (values: UserFormData) => {
    if (!selectedUser) return;
    updateMutation.mutate({ 
      id: selectedUser.id, 
      updates: {
        name: values.name,
        role: values.role,
        unit: values.unit,
        motherName: values.motherName || null,
        cpf: values.cpf || null,
        cep: values.cep || null,
        address: values.address || null,
        neighborhood: values.neighborhood || null,
        city: values.city || null,
        state: values.state || null,
        phone: values.phone || null,
        secondaryPhone: values.secondaryPhone || null,
      }
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        toast.success(`${values.name} foi atualizado com sucesso`);
      },
      onError: () => {
        toast.error("Não foi possível atualizar o usuário");
      }
    });
  };

  const openDeleteDialog = (user: Profile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUser) return;
    deleteMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        toast.success("Usuário excluído com sucesso");
      },
      onError: () => {
        toast.error("Não foi possível excluir o usuário");
      }
    });
  };

  const handleGeneratePassword = async (user: Profile) => {
    setSelectedUser(user);
    try {
      const result = await generateProvisionalPassword(user.id);
      setGeneratedPassword(result.provisionalPassword);
      setIsPasswordDialogOpen(true);
      if (result.emailSent) {
        toast.success("Senha provisória gerada e enviada por email - expira em 24 horas");
      } else {
        toast.success("Senha provisória gerada - expira em 24 horas. Email não pôde ser enviado.");
      }
    } catch (error: any) {
      toast.error(error.message || "Não foi possível gerar a senha provisória");
    }
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success("Senha copiada para a área de transferência");
    }
  };

  const renderUserForm = (formInstance: typeof form, onFormSubmit: (values: UserFormData) => void, isEdit: boolean = false) => (
    <Form {...formInstance}>
      <form onSubmit={formInstance.handleSubmit(onFormSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Dados Básicos</h4>
              <Separator />
            </div>
            
            <FormField
              control={formInstance.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-name" placeholder="Ex: Maria Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formInstance.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Corporativo *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-email" placeholder="maria@empresa.com" {...field} disabled={isEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formInstance.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formInstance.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.length > 0 ? (
                          units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.nomeFantasia || unit.razaoSocial}>
                              {unit.nomeFantasia || unit.razaoSocial}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="manual" disabled>Nenhuma unidade cadastrada</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="font-medium text-sm text-muted-foreground">Dados Pessoais</h4>
              <Separator />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formInstance.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-cpf"
                        placeholder="000.000.000-00" 
                        {...field}
                        onChange={(e) => field.onChange(formatCpf(e.target.value))}
                        maxLength={14}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formInstance.control}
                name="motherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Mãe</FormLabel>
                    <FormControl>
                      <Input data-testid="input-mother-name" placeholder="Nome completo da mãe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
              <Separator />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formInstance.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        data-testid="input-cep"
                        placeholder="00000-000" 
                        onChange={(e) => field.onChange(formatCep(e.target.value))}
                        onBlur={(e) => searchCep(e.target.value, formInstance)}
                        maxLength={9}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formInstance.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input data-testid="input-state" placeholder="UF" {...field} maxLength={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={formInstance.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input data-testid="input-address" placeholder="Rua, Avenida..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formInstance.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input data-testid="input-neighborhood" placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formInstance.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input data-testid="input-city" placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="font-medium text-sm text-muted-foreground">Contato</h4>
              <Separator />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formInstance.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-phone"
                        placeholder="(00) 00000-0000" 
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formInstance.control}
                name="secondaryPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone Secundário</FormLabel>
                    <FormControl>
                      <Input 
                        data-testid="input-secondary-phone"
                        placeholder="(00) 0000-0000" 
                        {...field}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-user">
            {(createMutation.isPending || updateMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEdit ? "Atualizar Usuário" : "Salvar Usuário"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">Controle de acesso e cadastro de colaboradores.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm" data-testid="button-add-user">
              <Plus className="w-4 h-4" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>Preencha as informações para criar um novo usuário.</DialogDescription>
            </DialogHeader>
            {renderUserForm(form, onSubmit)}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px]">Usuário</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.unit}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-[10px] tracking-wide font-semibold">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{user.phone || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'} className={user.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : ''}>
                      {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openViewDialog(user)} data-testid={`menu-view-${user.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(user)} data-testid={`menu-edit-${user.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGeneratePassword(user)} data-testid={`menu-password-${user.id}`}>
                          <Key className="w-4 h-4 mr-2" />
                          Gerar Senha Provisória
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(user)} data-testid={`menu-status-${user.id}`}>
                          {user.status === 'active' ? (
                            <>
                              <Ban className="w-4 h-4 mr-2" />
                              Suspender Acesso
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Reativar Acesso
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-destructive" data-testid={`menu-delete-${user.id}`}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View User Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser?.avatar ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {selectedUser?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Dados Básicos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Função</p>
                    <p className="font-medium">{selectedUser?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unidade</p>
                    <p className="font-medium">{selectedUser?.unit || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedUser?.status === 'active' ? 'secondary' : 'destructive'} className={selectedUser?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : ''}>
                      {selectedUser?.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Perfil Completo</p>
                    <p className="font-medium">{selectedUser?.profileCompleted ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium">{selectedUser?.cpf || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nome da Mãe</p>
                    <p className="font-medium">{selectedUser?.motherName || '-'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Endereço</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">CEP</p>
                    <p className="font-medium">{selectedUser?.cep || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="font-medium">{selectedUser?.state || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Endereço</p>
                    <p className="font-medium">{selectedUser?.address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bairro</p>
                    <p className="font-medium">{selectedUser?.neighborhood || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade</p>
                    <p className="font-medium">{selectedUser?.city || '-'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Contato</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Celular</p>
                    <p className="font-medium">{selectedUser?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone Secundário</p>
                    <p className="font-medium">{selectedUser?.secondaryPhone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
            <Button onClick={() => { setIsViewDialogOpen(false); if (selectedUser) openEditDialog(selectedUser); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize as informações do usuário.</DialogDescription>
          </DialogHeader>
          {renderUserForm(editForm, onEditSubmit, true)}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Provisional Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
        setIsPasswordDialogOpen(open);
        if (!open) {
          setGeneratedPassword(null);
          setSelectedUser(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Senha Provisória Gerada
            </DialogTitle>
            <DialogDescription>
              Compartilhe esta senha com <strong>{selectedUser?.name}</strong>. A senha expira em 24 horas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <code className="text-xl font-mono font-bold flex-1 text-center" data-testid="text-provisional-password">
                {generatedPassword}
              </code>
              <Button variant="outline" size="icon" onClick={copyPassword} data-testid="button-copy-password">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              O usuário deverá trocar a senha no próximo login.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPasswordDialogOpen(false)} data-testid="button-close-password-dialog">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
