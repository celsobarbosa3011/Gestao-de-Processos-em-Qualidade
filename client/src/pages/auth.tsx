import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { login as apiLogin, registerUser } from "@/lib/api";
import { useBrandingConfig } from "@/hooks/use-branding";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "Senha obrigatória" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(8, { message: "Senha deve ter pelo menos 8 caracteres" }),
  confirmPassword: z.string().min(8, { message: "Confirmação obrigatória" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setCurrentUser, setAuthToken } = useStore();
  const { data: branding, isLoading: brandingLoading } = useBrandingConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const appName = branding?.appName || 'UP - Qualidade em Saúde';
  const tagline = branding?.tagline || 'Gestão administrativa eficiente para unidades de saúde.';

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
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      const password = values.password.trim();
      
      const user = await apiLogin(email, password);
      
      if (user.token) {
        setAuthToken(user.token);
      }
      setCurrentUser(user);
      
      toast.success(`Bem-vindo, ${user.name}!`);
      
      // Redirect based on profile completion status
      if (!user.profileCompleted) {
        setLocation("/complete-profile");
      } else {
        setLocation("/kanban");
      }
    } catch (error: any) {
      toast.error(error.message || "Credenciais inválidas");
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      const password = values.password.trim();
      const confirmPassword = values.confirmPassword.trim();
      
      const user = await registerUser(email, password, confirmPassword);
      
      if (user.token) {
        setAuthToken(user.token);
      }
      setCurrentUser(user);
      
      toast.success("Conta criada! Complete seu cadastro para acessar o sistema.");
      setLocation("/complete-profile");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  }

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Dark themed with image */}
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

      {/* Right side - Login/Register form */}
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isRegisterMode ? "Criar Conta" : "Fazer Login"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRegisterMode 
                ? "Preencha os dados para criar sua conta" 
                : "Entre com suas credenciais para acessar sua conta"}
            </p>
          </div>

          <Card className="border-border shadow-lg">
            <CardContent className="p-4 sm:p-6 pt-6">
              {isRegisterMode ? (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
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
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 8 caracteres"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="toggle-password-visibility"
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
                      {isLoading ? "Criando conta..." : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Criar Conta
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
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
                              data-testid="input-email"
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
                                data-testid="input-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Sua senha"
                                className="pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="toggle-password-visibility"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      data-testid="button-login"
                      type="submit" 
                      className="w-full h-12 text-base rounded-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          Entrar
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 bg-muted/30 p-3 sm:p-4 rounded-b-lg border-t">
              <Button
                variant="ghost"
                className="w-full"
                onClick={toggleMode}
                data-testid="toggle-auth-mode"
              >
                {isRegisterMode ? (
                  <>Já tem conta? <span className="ml-1 font-semibold">Fazer login</span></>
                ) : (
                  <>Não tem conta? <span className="ml-1 font-semibold">Criar conta</span></>
                )}
              </Button>
              
              {!isRegisterMode && (
                <div className="text-xs text-muted-foreground text-center">
                  <p>Credenciais de demonstração:</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center font-mono mt-1">
                    <span 
                      className="cursor-pointer hover:text-primary" 
                      onClick={() => {
                        loginForm.setValue('email', 'admin@mediflow.com');
                        loginForm.setValue('password', 'admin123');
                      }}
                      data-testid="demo-admin"
                    >
                      admin@mediflow.com
                    </span>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
