import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const { data: branding } = useBrandingConfig();
  const [isLoading, setIsLoading] = useState(false);

  const appName = branding?.appName || 'MediFlow';
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
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.name}!`,
      });
      setLocation("/kanban");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: "Credenciais inválidas.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="flex flex-col space-y-2 text-center">
            {branding?.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={appName}
                className="mx-auto h-12 w-12 rounded-lg object-contain mb-4"
              />
            ) : (
              <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Acesse o {appName}</h1>
            <p className="text-sm text-muted-foreground">
              {tagline}
            </p>
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Entre com suas credenciais para acessar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-email"
                            placeholder="admin@mediflow.com" 
                            {...field} 
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
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-password"
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    data-testid="button-login"
                    type="submit" 
                    className="w-full h-10 text-base"
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
      <div 
        className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground relative overflow-hidden"
        style={{ backgroundColor: branding?.primaryColor || '#0F766E' }}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-lg font-bold">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={appName} className="w-6 h-6 rounded object-contain" />
            ) : (
              <Stethoscope className="w-6 h-6" />
            )}
            {appName} System
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <blockquote className="space-y-2">
            <p className="text-2xl font-medium leading-snug">
              "A organização e agilidade que o {appName} trouxe para nossa unidade permitiu focar no que realmente importa: o atendimento ao paciente."
            </p>
            <footer className="text-sm opacity-80 mt-4">
              — Dra. Helena Costa, Diretora Administrativa
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
