/**
 * EmptyState — componente exibido quando não há dados reais para a empresa.
 * Segue LGPD: dados de demonstração não são exibidos para usuários regulares.
 */

import { cn } from "@/lib/utils";
import { ClipboardList, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
  /** Quando true exibe mensagem sobre conformidade LGPD */
  showLgpdNote?: boolean;
}

export function EmptyState({
  title = "Nenhum dado cadastrado",
  description = "Os dados desta seção serão exibidos conforme você preenche as informações da sua empresa.",
  actionLabel,
  onAction,
  icon,
  className,
  showLgpdNote = false,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        {icon ?? <ClipboardList className="w-8 h-8 text-slate-400" />}
      </div>

      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <Button
          size="sm"
          className="mt-5 gap-1.5"
          onClick={onAction}
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}

      {showLgpdNote && (
        <div className="mt-6 flex items-start gap-2 max-w-sm bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-left">
          <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            <strong>Privacidade LGPD:</strong> Apenas os dados da sua empresa são exibidos.
            Informações de outras organizações são mantidas em sigilo por lei.
          </p>
        </div>
      )}
    </div>
  );
}
