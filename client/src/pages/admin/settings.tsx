import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, AlertOctagon } from "lucide-react";
import { useState } from "react";

export default function AdminSettingsPage() {
  const { alertSettings, updateSettings } = useStore();
  const { toast } = useToast();
  
  const [values, setValues] = useState(alertSettings);

  const handleSave = () => {
    updateSettings(values);
    toast({
      title: "Configurações salvas",
      description: "Os parâmetros de alerta foram atualizados com sucesso.",
    });
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
    </div>
  );
}
