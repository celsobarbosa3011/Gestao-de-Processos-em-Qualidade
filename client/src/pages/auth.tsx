import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { login as apiLogin } from "@/lib/api";
import { useBrandingConfig } from "@/hooks/use-branding";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "Senha obrigatória" }),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setCurrentUser } = useStore();
  const { data: branding, isLoading: brandingLoading } = useBrandingConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const appName = branding?.appName || 'UP - Qualidade em Saúde';
  const tagline = branding?.tagline || 'Gestão administrativa eficiente para unidades de saúde.';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@mediflow.com",
      password: "admin123",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const user = await apiLogin(values.email, values.password);
      setCurrentUser(user);
      toast.success(`Bem-vindo, ${user.name}!`);
      setLocation("/kanban");
    } catch (error) {
      toast.error("Credenciais inválidas");
    } finally {
      setIsLoading(false);
    }
  }

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

      {/* Right side - Login form */}
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Fazer Login</h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar sua conta
            </p>
          </div>

          <Card className="border-border shadow-lg">
            <CardContent className="p-4 sm:p-6 pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="email-input">Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            id="email-input"
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
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="password-input">Senha</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              {...field}
                              id="password-input"
                              autoComplete="current-password"
                              data-testid="input-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Sua senha" 
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="toggle-password-visibility"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
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
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 bg-muted/30 p-3 sm:p-4 rounded-b-lg border-t text-xs text-muted-foreground text-center">
              <p>Credenciais de demonstração:</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center font-mono">
                <span 
                  className="cursor-pointer hover:text-primary" 
                  onClick={() => {
                    form.setValue('email', 'admin@mediflow.com');
                    form.setValue('password', 'admin123');
                  }}
                  data-testid="demo-admin"
                >
                  admin@mediflow.com
                </span>
                <span 
                  className="cursor-pointer hover:text-primary" 
                  onClick={() => {
                    form.setValue('email', 'sarah@mediflow.com');
                    form.setValue('password', 'sarah123');
                  }}
                  data-testid="demo-user"
                >
                  sarah@mediflow.com
                </span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
