import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { updateProfile, changePassword, getAllUnits } from "@/lib/api";
import type { Unit } from "@shared/schema";

const baseProfileSchema = z.object({
  name: z.string().min(2, "Nome completo é obrigatório"),
  motherName: z.string().min(2, "Nome da mãe é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  unit: z.string().min(1, "Selecione uma unidade"),
  cep: z.string().min(8, "CEP inválido").max(9, "CEP inválido"),
  address: z.string().min(2, "Endereço é obrigatório"),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  phone: z.string().min(10, "Celular é obrigatório"),
  secondaryPhone: z.string().optional(),
});

const profileWithPasswordSchema = baseProfileSchema.extend({
  currentPassword: z.string().min(1, "Senha provisória é obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type BaseProfileData = z.infer<typeof baseProfileSchema>;
type ProfileWithPasswordData = z.infer<typeof profileWithPasswordSchema>;

export default function ProfileCompletionPage() {
  const [, setLocation] = useLocation();
  const { currentUser, setCurrentUser, setAuthToken } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const needsPasswordChange = currentUser?.mustChangePassword === true;

  useEffect(() => {
    async function loadUnits() {
      try {
        const data = await getAllUnits();
        setUnits(data.filter(u => u.status === 'active'));
      } catch (error) {
        console.error('Failed to load units:', error);
      } finally {
        setIsLoadingUnits(false);
      }
    }
    loadUnits();
  }, []);

  const form = useForm<ProfileWithPasswordData>({
    resolver: zodResolver(needsPasswordChange ? profileWithPasswordSchema : baseProfileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      motherName: currentUser?.motherName || "",
      cpf: currentUser?.cpf || "",
      unit: currentUser?.unit === 'Pendente' ? "" : currentUser?.unit || "",
      cep: currentUser?.cep || "",
      address: currentUser?.address || "",
      neighborhood: currentUser?.neighborhood || "",
      city: currentUser?.city || "",
      state: currentUser?.state || "",
      phone: currentUser?.phone || "",
      secondaryPhone: currentUser?.secondaryPhone || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const searchCep = async (cep: string) => {
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

      form.setValue('address', data.logradouro || '');
      form.setValue('neighborhood', data.bairro || '');
      form.setValue('city', data.localidade || '');
      form.setValue('state', data.uf || '');
      toast.success("Endereço preenchido automaticamente");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
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
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  async function onSubmit(values: ProfileWithPasswordData) {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // If user needs to change password, do it first
      if (needsPasswordChange && values.currentPassword && values.newPassword) {
        const passwordResult = await changePassword(values.currentPassword, values.newPassword);
        if (passwordResult.token) {
          setAuthToken(passwordResult.token);
        }
      }

      // Update profile data
      const updatedProfile = await updateProfile(currentUser.id, {
        name: values.name,
        motherName: values.motherName,
        cpf: values.cpf,
        unit: values.unit,
        cep: values.cep,
        address: values.address,
        neighborhood: values.neighborhood,
        city: values.city,
        state: values.state,
        phone: values.phone,
        secondaryPhone: values.secondaryPhone || null,
        profileCompleted: true,
      });

      setCurrentUser({ 
        ...currentUser, 
        ...updatedProfile, 
        profileCompleted: true,
        mustChangePassword: false 
      });
      toast.success("Cadastro concluído com sucesso!");
      setLocation("/kanban");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cadastro");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete seu Cadastro</CardTitle>
          <CardDescription>
            Preencha todas as informações para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="motherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Mãe *</FormLabel>
                      <FormControl>
                        <Input data-testid="input-mother-name" placeholder="Nome completo da mãe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
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
                  control={form.control}
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
                          {isLoadingUnits ? (
                            <SelectItem value="loading" disabled>Carregando...</SelectItem>
                          ) : units.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhuma unidade disponível</SelectItem>
                          ) : (
                            units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.razaoSocial}>
                                {unit.nomeFantasia || unit.razaoSocial}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field}
                            data-testid="input-cep"
                            placeholder="00000-000" 
                            onChange={(e) => field.onChange(formatCep(e.target.value))}
                            onBlur={(e) => searchCep(e.target.value)}
                            maxLength={9}
                          />
                          {isSearchingCep && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Input data-testid="input-state" placeholder="UF" {...field} maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço *</FormLabel>
                      <FormControl>
                        <Input data-testid="input-address" placeholder="Rua, Avenida..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input data-testid="input-neighborhood" placeholder="Bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input data-testid="input-city" placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular *</FormLabel>
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
                  control={form.control}
                  name="secondaryPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular para Recado</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-secondary-phone"
                          placeholder="(00) 00000-0000 (opcional)" 
                          {...field}
                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {needsPasswordChange && (
                  <>
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <h3 className="font-medium text-lg mb-3">Alterar Senha</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Você está usando uma senha provisória. Por favor, defina uma nova senha.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Senha Provisória (recebida por email) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              data-testid="input-current-password"
                              type="password"
                              placeholder="Digite a senha provisória" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field}
                                data-testid="input-new-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 8 caracteres"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Nova Senha *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field}
                                data-testid="input-confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Repita a nova senha"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              <Button 
                data-testid="button-submit-profile"
                type="submit" 
                className="w-full h-12 text-base rounded-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar e Acessar o Sistema"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
