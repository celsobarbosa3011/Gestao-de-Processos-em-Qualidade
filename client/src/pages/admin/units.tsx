import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical, Pencil, Trash2, Building2, Loader2, MapPin, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUnits, createUnit, updateUnit, deleteUnit } from "@/lib/api";
import type { Unit } from "@shared/schema";

const unitSchema = z.object({
  cnpj: z.string().min(14, "CNPJ inválido"),
  razaoSocial: z.string().min(2, "Razão social é obrigatória"),
  nomeFantasia: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
});

type UnitFormData = z.infer<typeof unitSchema>;

export default function AdminUnitsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const queryClient = useQueryClient();

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getAllUnits,
  });

  const createMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Unit> }) => updateUnit(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      cnpj: "",
      razaoSocial: "",
      nomeFantasia: "",
      cep: "",
      address: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      phone: "",
      website: "",
      contactName: "",
      contactPhone: "",
      email: "",
    },
  });

  const editForm = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      cnpj: "",
      razaoSocial: "",
      nomeFantasia: "",
      cep: "",
      address: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      phone: "",
      website: "",
      contactName: "",
      contactPhone: "",
      email: "",
    },
  });

  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
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

  const searchCnpj = async (cnpj: string, formInstance: typeof form) => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return;

    setIsSearchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      const data = await response.json();
      
      if (data.message) {
        toast.error("CNPJ não encontrado");
        return;
      }

      formInstance.setValue('razaoSocial', data.razao_social || '');
      formInstance.setValue('nomeFantasia', data.nome_fantasia || '');
      formInstance.setValue('address', data.logradouro || '');
      formInstance.setValue('number', data.numero || '');
      formInstance.setValue('neighborhood', data.bairro || '');
      formInstance.setValue('city', data.municipio || '');
      formInstance.setValue('state', data.uf || '');
      formInstance.setValue('cep', data.cep ? formatCep(data.cep) : '');
      formInstance.setValue('phone', data.ddd_telefone_1 ? formatPhone(data.ddd_telefone_1) : '');
      toast.success("Dados preenchidos automaticamente");
    } catch (error) {
      toast.error("Erro ao buscar CNPJ");
    } finally {
      setIsSearchingCnpj(false);
    }
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

  const onSubmit = (values: UnitFormData) => {
    createMutation.mutate({
      ...values,
      nomeFantasia: values.nomeFantasia || null,
      cep: values.cep || null,
      address: values.address || null,
      number: values.number || null,
      neighborhood: values.neighborhood || null,
      city: values.city || null,
      state: values.state || null,
      phone: values.phone || null,
      website: values.website || null,
      contactName: values.contactName || null,
      contactPhone: values.contactPhone || null,
      email: values.email || null,
      status: 'active',
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast.success("Unidade cadastrada com sucesso");
      },
      onError: (error: any) => {
        toast.error(error.message || "Não foi possível criar a unidade");
      }
    });
  };

  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    editForm.reset({
      cnpj: unit.cnpj,
      razaoSocial: unit.razaoSocial,
      nomeFantasia: unit.nomeFantasia || "",
      cep: unit.cep || "",
      address: unit.address || "",
      number: unit.number || "",
      neighborhood: unit.neighborhood || "",
      city: unit.city || "",
      state: unit.state || "",
      phone: unit.phone || "",
      website: unit.website || "",
      contactName: unit.contactName || "",
      contactPhone: unit.contactPhone || "",
      email: unit.email || "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (values: UnitFormData) => {
    if (!selectedUnit) return;
    updateMutation.mutate({ id: selectedUnit.id, updates: values }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedUnit(null);
        toast.success("Unidade atualizada com sucesso");
      },
      onError: () => {
        toast.error("Não foi possível atualizar a unidade");
      }
    });
  };

  const openDeleteDialog = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUnit) return;
    deleteMutation.mutate(selectedUnit.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedUnit(null);
        toast.success("Unidade excluída com sucesso");
      },
      onError: () => {
        toast.error("Não foi possível excluir a unidade");
      }
    });
  };

  const renderUnitForm = (formInstance: typeof form, onFormSubmit: (values: UnitFormData) => void, isEdit: boolean = false) => (
    <Form {...formInstance}>
      <form onSubmit={formInstance.handleSubmit(onFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={formInstance.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>CNPJ *</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    data-testid="input-cnpj"
                    placeholder="00.000.000/0000-00" 
                    onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                    onBlur={(e) => searchCnpj(e.target.value, formInstance)}
                    maxLength={18}
                    disabled={isEdit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="razaoSocial"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Razão Social *</FormLabel>
                <FormControl>
                  <Input data-testid="input-razao-social" placeholder="Razão social da empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="nomeFantasia"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nome Fantasia</FormLabel>
                <FormControl>
                  <Input data-testid="input-nome-fantasia" placeholder="Nome comercial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input data-testid="input-number" placeholder="Nº" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Endereço Comercial</FormLabel>
                <FormControl>
                  <Input data-testid="input-address" placeholder="Rua, Avenida..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="grid grid-cols-2 gap-4">
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="input-phone"
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

          <FormField
            control={formInstance.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Página de Internet</FormLabel>
                <FormControl>
                  <Input data-testid="input-website" placeholder="www.empresa.com.br" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contato</FormLabel>
                <FormControl>
                  <Input data-testid="input-contact-name" placeholder="Nome do contato" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formInstance.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone do Contato</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="input-contact-phone"
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
            name="email"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input data-testid="input-email" type="email" placeholder="contato@empresa.com.br" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="pt-4 sticky bottom-0 bg-background">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEdit ? "Atualizar Unidade" : "Salvar Unidade"
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
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Unidades</h1>
          <p className="text-muted-foreground mt-1">Cadastro e gerenciamento de unidades de saúde.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm" data-testid="button-add-unit">
              <Plus className="w-4 h-4" />
              Adicionar Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Unidade</DialogTitle>
              <DialogDescription>Preencha o CNPJ para buscar os dados automaticamente.</DialogDescription>
            </DialogHeader>
            {renderUnitForm(form, onSubmit)}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px]">Unidade</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Building2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    Nenhuma unidade cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                units.map((unit) => (
                  <TableRow key={unit.id} data-testid={`row-unit-${unit.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{unit.nomeFantasia || unit.razaoSocial}</span>
                          <span className="text-xs text-muted-foreground">{unit.razaoSocial}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{unit.cnpj}</TableCell>
                    <TableCell>{unit.city || '-'} {unit.state ? `/ ${unit.state}` : ''}</TableCell>
                    <TableCell>{unit.contactName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                        Ativo
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
                          <DropdownMenuItem onClick={() => openEditDialog(unit)} data-testid={`menu-edit-${unit.id}`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(unit)} className="text-destructive" data-testid={`menu-delete-${unit.id}`}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
            <DialogDescription>Atualize as informações da unidade.</DialogDescription>
          </DialogHeader>
          {renderUnitForm(editForm, onEditSubmit, true)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Unidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a unidade "{selectedUnit?.nomeFantasia || selectedUnit?.razaoSocial}"? Esta ação não pode ser desfeita.
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
    </div>
  );
}
