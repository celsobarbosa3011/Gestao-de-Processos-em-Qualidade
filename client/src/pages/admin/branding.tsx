import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useBrandingConfig, useUpdateBrandingConfig, usePreviewColors } from "@/hooks/use-branding";
import { Palette, Type, Globe, Upload, X, Image } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const brandingSchema = z.object({
  appName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)"),
  primaryForeground: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal").optional().or(z.literal('')),
  footerText: z.string().optional(),
  supportEmail: z.string().email("Email inválido").optional().or(z.literal('')),
  customDomain: z.string().optional(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function BrandingPage() {
  const { data: branding, isLoading } = useBrandingConfig();
  const updateBranding = useUpdateBrandingConfig();
  const previewColors = usePreviewColors();
  const { currentUser } = useStore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      appName: "MediFlow",
      tagline: "",
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "#0F766E",
      primaryForeground: "#FFFFFF",
      accentColor: "#14B8A6",
      footerText: "",
      supportEmail: "",
      customDomain: "",
    },
  });

  useEffect(() => {
    if (branding) {
      form.reset({
        appName: branding.appName || "MediFlow",
        tagline: branding.tagline || "",
        logoUrl: branding.logoUrl || "",
        faviconUrl: branding.faviconUrl || "",
        primaryColor: branding.primaryColor || "#0F766E",
        primaryForeground: branding.primaryForeground || "#FFFFFF",
        accentColor: branding.accentColor || "#14B8A6",
        footerText: branding.footerText || "",
        supportEmail: branding.supportEmail || "",
        customDomain: branding.customDomain || "",
      });
    }
  }, [branding, form]);

  const watchedPrimaryColor = form.watch("primaryColor");
  const watchedAccentColor = form.watch("accentColor");
  const watchedLogoUrl = form.watch("logoUrl");

  useEffect(() => {
    if (watchedPrimaryColor) {
      previewColors(watchedPrimaryColor, watchedAccentColor || undefined);
    }
  }, [watchedPrimaryColor, watchedAccentColor, previewColors]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const data = await response.json();
      form.setValue('logoUrl', data.url);
      toast({
        title: "Logo enviado",
        description: "A imagem foi carregada com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    form.setValue('logoUrl', '');
  };

  const onSubmit = async (values: BrandingFormValues) => {
    if (!currentUser) return;
    
    await updateBranding.mutateAsync({
      ...values,
      logoUrl: values.logoUrl || undefined,
      faviconUrl: values.faviconUrl || undefined,
      accentColor: values.accentColor || undefined,
      supportEmail: values.supportEmail || undefined,
      customDomain: values.customDomain || undefined,
      userId: currentUser.id,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marca / White Label</h1>
          <p className="text-muted-foreground mt-1">Carregando configurações...</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const watchedPrimaryForeground = form.watch("primaryForeground");
  const watchedAppName = form.watch("appName");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marca / White Label</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Personalize a aparência do sistema para sua marca.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Identidade Visual */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Type className="w-4 h-4 sm:w-5 sm:h-5" />
                  Identidade
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Nome e logotipo do sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Sistema</FormLabel>
                      <FormControl>
                        <Input data-testid="input-app-name" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Exibido no menu e cabeçalho</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slogan (Opcional)</FormLabel>
                      <FormControl>
                        <Input data-testid="input-tagline" placeholder="Gestão Administrativa..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logo Upload */}
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo do Sistema</FormLabel>
                      <div className="space-y-3">
                        {watchedLogoUrl ? (
                          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
                            <img 
                              src={watchedLogoUrl} 
                              alt="Logo atual" 
                              className="w-16 h-16 object-contain rounded-lg bg-white p-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{watchedLogoUrl}</p>
                              <p className="text-xs text-muted-foreground">Logo atual</p>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={handleRemoveLogo}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full">
                            <label 
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Image className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                  <span className="font-semibold">Clique para enviar</span> ou arraste
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, SVG (máx. 5MB)</p>
                              </div>
                              <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                data-testid="input-logo-upload"
                              />
                            </label>
                          </div>
                        )}
                        
                        {!watchedLogoUrl && (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="gap-2"
                            >
                              <Upload className="w-4 h-4" />
                              {isUploading ? "Enviando..." : "Fazer Upload"}
                            </Button>
                          </div>
                        )}
                        
                        {watchedLogoUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {isUploading ? "Enviando..." : "Trocar Logo"}
                          </Button>
                        )}
                        
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto do Rodapé</FormLabel>
                      <FormControl>
                        <Input data-testid="input-footer" placeholder="© 2025 Sua Empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Cores */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                  Cores
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Esquema de cores do sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Primária</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input data-testid="input-primary-color" type="color" className="w-14 h-10 p-1 cursor-pointer" {...field} />
                        </FormControl>
                        <Input 
                          value={field.value} 
                          onChange={field.onChange}
                          className="flex-1 font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                      <FormDescription className="text-xs">Cor principal de botões e destaques</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryForeground"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor do Texto sobre Primária</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input data-testid="input-primary-foreground" type="color" className="w-14 h-10 p-1 cursor-pointer" {...field} />
                        </FormControl>
                        <Input 
                          value={field.value} 
                          onChange={field.onChange}
                          className="flex-1 font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor de Destaque (Opcional)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input data-testid="input-accent-color" type="color" className="w-14 h-10 p-1 cursor-pointer" value={field.value || "#14B8A6"} onChange={field.onChange} />
                        </FormControl>
                        <Input 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          className="flex-1 font-mono uppercase"
                          maxLength={7}
                          placeholder="#14B8A6"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preview */}
                <div className="pt-4 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização</Label>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    {watchedLogoUrl ? (
                      <img src={watchedLogoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: watchedPrimaryColor, color: watchedPrimaryForeground }}
                      >
                        {watchedAppName?.charAt(0) || 'M'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{watchedAppName || 'MediFlow'}</p>
                      <p className="text-xs text-muted-foreground">Pré-visualização do cabeçalho</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button 
                      type="button" 
                      size="sm"
                      style={{ backgroundColor: watchedPrimaryColor, color: watchedPrimaryForeground }}
                    >
                      Botão Primário
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      style={{ borderColor: watchedPrimaryColor, color: watchedPrimaryColor }}
                    >
                      Botão Secundário
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato e Domínio */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  Contato e Domínio
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configurações de suporte e domínio personalizado</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Suporte</FormLabel>
                        <FormControl>
                          <Input data-testid="input-support-email" type="email" placeholder="suporte@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domínio Personalizado</FormLabel>
                        <FormControl>
                          <Input data-testid="input-custom-domain" placeholder="app.suaempresa.com" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Requer configuração DNS adicional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button 
              data-testid="button-save-branding"
              type="submit" 
              disabled={updateBranding.isPending}
              className="min-w-32"
            >
              {updateBranding.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
