import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Eye, EyeOff, UserPlus, LogIn, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { login as apiLogin, register as apiRegister } from "@/lib/api";
import { useBrandingConfig } from "@/hooks/use-branding";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "Senha obrigatória" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(1, { message: "Confirmação de senha obrigatória" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setCurrentUser } = useStore();
  const { data: branding } = useBrandingConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const appName = branding?.appName || 'UP - Qualidade em Saúde';

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      const password = values.password.trim();
      
      const user = await apiLogin(email, password);
      setCurrentUser(user);
      toast.success(`Bem-vindo, ${user.name}!`);
      
      if (user.profileCompleted === false) {
        setLocation("/completar-perfil");
      } else {
        setLocation("/kanban");
      }
    } catch (error: any) {
      toast.error(error.message || "Credenciais inválidas");
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      const user = await apiRegister({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      
      setCurrentUser(user);
      toast.success(`Conta criada com sucesso! Complete seu perfil.`);
      setLocation("/completar-perfil");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail.trim()) {
      toast.error("Informe seu e-mail cadastrado.");
      return;
    }
    setForgotLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setForgotLoading(false);
    setShowForgot(false);
    setForgotEmail("");
    toast.success(
      `Se o e-mail "${forgotEmail.trim()}" estiver cadastrado, o administrador do sistema poderá redefinir sua senha em Administração → Usuários & Perfis.`,
      { duration: 8000 }
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div 
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: '#3B4F5C' }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop')" 
          }}
        />
        <div className="flex-1" />
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight mb-4" style={{ color: '#2ECC71' }}>
            Gestão de Qualidade na Saúde
          </h2>
          <p className="text-xl opacity-90">
            Gestão eficiente para unidades de saúde com foco no que realmente importa.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="flex flex-col space-y-2 text-center">
            {branding?.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={appName}
                className="mx-auto h-16 w-auto object-contain mb-4"
              />
            ) : (
              <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
          </div>

          <Card className="border-border shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="gap-2" data-testid="tab-login">
                  <LogIn className="w-4 h-4" />
                  Já tenho conta
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-2" data-testid="tab-register">
                  <UserPlus className="w-4 h-4" />
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <CardContent className="p-4 sm:p-6 pt-6">
                  <div className="text-center mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Fazer Login</h1>
                    <p className="text-sm text-muted-foreground">
                      Entre com suas credenciais para acessar sua conta
                    </p>
                  </div>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                autoComplete="email"
                                data-testid="input-login-email"
                                placeholder="seu@email.com" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field}
                                  autoComplete="current-password"
                                  data-testid="input-login-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Sua senha"
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="toggle-login-password-visibility"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                          onClick={() => setShowForgot(true)}
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                      <Button
                        data-testid="button-login"
                        type="submit"
                        className="w-full h-12 text-base rounded-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 bg-muted/30 p-3 sm:p-4 rounded-b-lg border-t text-xs text-muted-foreground text-center">
                  <p>Conta de demonstração:</p>
                  <div className="flex justify-center font-mono">
                    <span
                      className="cursor-pointer hover:text-primary"
                      onClick={() => {
                        loginForm.setValue('email', 'sarah@mediflow.com');
                        loginForm.setValue('password', 'sarah123');
                      }}
                      data-testid="demo-user"
                    >
                      sarah@mediflow.com
                    </span>
                  </div>
                </CardFooter>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <CardContent className="p-4 sm:p-6 pt-6">
                  <div className="text-center mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Criar Conta</h1>
                    <p className="text-sm text-muted-foreground">
                      Preencha os dados abaixo para criar sua conta
                    </p>
                  </div>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                autoComplete="name"
                                data-testid="input-register-name"
                                placeholder="Seu nome completo" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                autoComplete="email"
                                data-testid="input-register-email"
                                placeholder="seu@email.com" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field}
                                  autoComplete="new-password"
                                  data-testid="input-register-password"
                                  type={showRegisterPassword ? "text" : "password"}
                                  placeholder="Mínimo 6 caracteres"
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                  data-testid="toggle-register-password-visibility"
                                >
                                  {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field}
                                  autoComplete="new-password"
                                  data-testid="input-register-confirm-password"
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Repita a senha"
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  data-testid="toggle-confirm-password-visibility"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        data-testid="button-register"
                        type="submit" 
                        className="w-full h-12 text-base rounded-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Criando conta..." : "Criar Conta"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 bg-muted/30 p-3 sm:p-4 rounded-b-lg border-t text-xs text-muted-foreground text-center">
                  <p>Após criar sua conta, você precisará completar seu perfil com informações adicionais.</p>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>

    {/* Dialog — Esqueci minha senha */}
    <Dialog open={showForgot} onOpenChange={setShowForgot}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle>Recuperar Senha</DialogTitle>
          </div>
          <DialogDescription>
            Informe seu e-mail cadastrado. O administrador do sistema receberá a solicitação e poderá redefinir sua senha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                className="pl-9"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={handleForgotPassword}
            disabled={forgotLoading}
          >
            {forgotLoading ? "Enviando..." : "Solicitar redefinição"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Sem acesso ao e-mail? Contate o administrador diretamente em <span className="font-medium">Administração → Usuários & Perfis</span>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
