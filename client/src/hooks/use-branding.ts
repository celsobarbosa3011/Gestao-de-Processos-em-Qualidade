import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrandingConfig, updateBrandingConfig } from "@/lib/api";
import type { BrandingConfig } from "@shared/schema";
import { useToast } from "./use-toast";
import { useEffect, useCallback } from "react";

const DEFAULT_PRIMARY_COLOR = "#0F766E";
const DEFAULT_ACCENT_COLOR = "#14B8A6";

export function useBrandingConfig() {
  const query = useQuery({
    queryKey: ["branding"],
    queryFn: getBrandingConfig,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const root = document.documentElement;
    
    const primaryColor = query.data?.primaryColor || DEFAULT_PRIMARY_COLOR;
    const accentColor = query.data?.accentColor || DEFAULT_ACCENT_COLOR;
    
    if (isValidHex(primaryColor)) {
      const hsl = hexToHSL(primaryColor);
      root.style.setProperty('--primary', hsl);
    }
    
    if (isValidHex(accentColor)) {
      const hsl = hexToHSL(accentColor);
      root.style.setProperty('--accent', hsl);
    }

    if (query.data?.appName) {
      document.title = query.data.appName;
    }
  }, [query.data]);

  return query;
}

export function useUpdateBrandingConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (config: Partial<BrandingConfig> & { userId: string }) => updateBrandingConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast({
        title: "Marca atualizada",
        description: "As configurações de marca foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Não foi possível atualizar as configurações.";
      toast({
        variant: "destructive",
        title: "Erro ao atualizar marca",
        description: message.includes("403") ? "Acesso de administrador necessário." : message,
      });
    },
  });
}

export function usePreviewColors() {
  return useCallback((primaryColor?: string, accentColor?: string) => {
    const root = document.documentElement;
    
    if (primaryColor && isValidHex(primaryColor)) {
      root.style.setProperty('--primary', hexToHSL(primaryColor));
    }
    
    if (accentColor && isValidHex(accentColor)) {
      root.style.setProperty('--accent', hexToHSL(accentColor));
    }
  }, []);
}

function isValidHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
