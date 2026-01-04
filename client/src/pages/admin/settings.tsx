import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertTriangle, Clock, AlertOctagon, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { useWipLimits, useUpdateWipLimit } from "@/hooks/use-wip-limits";
import { useAlertSettings, useUpdateAlertSettings } from "@/hooks/use-alert-settings";

const COLUMNS = [
  { id: 'new', title: 'Novos' },
  { id: 'analysis', title: 'Em Análise' },
  { id: 'pending', title: 'Pendentes' },
  { id: 'approved', title: 'Aprovados' },
  { id: 'rejected', title: 'Rejeitados' },
];

export default function AdminSettingsPage() {
  const { currentUser } = useStore();
  const { data: alertSettings } = useAlertSettings();
  const updateAlertSettingsMutation = useUpdateAlertSettings();
  const { data: wipLimits = [] } = useWipLimits();
  const updateWipLimit = useUpdateWipLimit();
  
  const [values, setValues] = useState({ warningDays: 5, criticalDays: 2, stalledDays: 15 });
  const [wipValues, setWipValues] = useState<Record<string, { maxItems: number; enabled: boolean }>>({});
  
  useEffect(() => {
    if (alertSettings) {
      setValues({
        warningDays: alertSettings.warningDays,
        criticalDays: alertSettings.criticalDays,
        stalledDays: alertSettings.stalledDays,
      });
    }
  }, [alertSettings]);
  
  useEffect(() => {
    if (wipLimits.length === 0) return;
    
    const initial: Record<string, { maxItems: number; enabled: boolean }> = {};
    COLUMNS.forEach(col => {
      const limit = wipLimits.find(l => l.columnId === col.id);
      initial[col.id] = { maxItems: limit?.maxItems ?? 10, enabled: limit?.enabled ?? false };
    });
    
    setWipValues(prev => {
      const prevKeys = Object.keys(prev);
      if (prevKeys.length === 0) return initial;
      
      const hasChanged = COLUMNS.some(col => {
        const prevVal = prev[col.id];
        const newVal = initial[col.id];
        return !prevVal || prevVal.maxItems !== newVal.maxItems || prevVal.enabled !== newVal.enabled;
      });
      
      return hasChanged ? initial : prev;
    });
  }, [wipLimits]);

  const handleSave = () => {
    updateAlertSettingsMutation.mutate(values);
  };

  const handleSaveWipLimits = async () => {
    try {
      for (const [columnId, wipValue] of Object.entries(wipValues)) {
        await updateWipLimit.mutateAsync({ 
          columnId, 
          updates: { maxItems: wipValue.maxItems, enabled: wipValue.enabled } 
        });
      }
      toast.success("Limites WIP salvos");
    } catch (error) {
      toast.error("Não foi possível salvar os limites WIP");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">Defina os parâmetros globais de alertas e prazos.</p>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Parâmetros de Alertas (SLAs)
          </CardTitle>
          <CardDescription>
            Configure os dias e tempos para disparar alertas visuais nos cartões do Kanban.
            Estes valores afetam como as cores de prioridade mudam conforme o prazo se aproxima.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="warning">Alerta de Atenção (Amarelo)</Label>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-md text-yellow-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <Input 
                  id="warning" 
                  type="number" 
                  value={values.warningDays}
                  onChange={(e) => setValues({...values, warningDays: parseInt(e.target.value)})}
                  className="max-w-[120px]" 
                />
                <span className="text-sm text-muted-foreground">dias antes do prazo</span>
              </div>
              <p className="text-xs text-muted-foreground pl-12">
                Cartões ficarão amarelos quando faltar este número de dias.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="critical">Alerta Crítico (Vermelho)</Label>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-md text-red-700">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <Input 
                  id="critical" 
                  type="number" 
                  value={values.criticalDays}
                  onChange={(e) => setValues({...values, criticalDays: parseInt(e.target.value)})}
                  className="max-w-[120px]" 
                />
                <span className="text-sm text-muted-foreground">dias antes do prazo</span>
              </div>
              <p className="text-xs text-muted-foreground pl-12">
                Cartões ficarão vermelhos quando faltar este número de dias.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="stalled">Processos Estagnados</Label>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-md text-slate-700">
                  <Clock className="w-5 h-5" />
                </div>
                <Input 
                  id="stalled" 
                  type="number" 
                  value={values.stalledDays}
                  onChange={(e) => setValues({...values, stalledDays: parseInt(e.target.value)})}
                  className="max-w-[120px]" 
                />
                <span className="text-sm text-muted-foreground">dias sem movimentação</span>
              </div>
              <p className="text-xs text-muted-foreground pl-12">
                Processos sem atualização há mais de X dias serão destacados nos relatórios.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-end">
          <Button onClick={handleSave} className="min-w-[140px]">
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Limites WIP (Work In Progress)
          </CardTitle>
          <CardDescription>
            Defina limites máximos de itens por coluna no Kanban. Quando o limite é atingido,
            novos cards não poderão ser movidos para essa coluna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {COLUMNS.map(column => (
            <div key={column.id} className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
              <div className="flex-1">
                <Label className="font-medium">{column.title}</Label>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`wip-${column.id}`} className="text-sm text-muted-foreground">
                    Máx:
                  </Label>
                  <Input 
                    id={`wip-${column.id}`}
                    type="number" 
                    min={1}
                    max={100}
                    value={wipValues[column.id]?.maxItems || 10}
                    onChange={(e) => setWipValues(prev => ({
                      ...prev,
                      [column.id]: { ...prev[column.id], maxItems: parseInt(e.target.value) || 10 }
                    }))}
                    className="w-20" 
                    data-testid={`input-wip-${column.id}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`wip-enabled-${column.id}`}
                    checked={wipValues[column.id]?.enabled || false}
                    onCheckedChange={(checked) => setWipValues(prev => ({
                      ...prev,
                      [column.id]: { ...prev[column.id], enabled: checked }
                    }))}
                    data-testid={`switch-wip-${column.id}`}
                  />
                  <Label htmlFor={`wip-enabled-${column.id}`} className="text-sm">
                    {wipValues[column.id]?.enabled ? 'Ativo' : 'Inativo'}
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="bg-muted/20 border-t px-6 py-4 flex justify-end">
          <Button 
            onClick={handleSaveWipLimits} 
            className="min-w-[140px]"
            disabled={updateWipLimit.isPending}
            data-testid="button-save-wip"
          >
            {updateWipLimit.isPending ? 'Salvando...' : 'Salvar Limites WIP'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
