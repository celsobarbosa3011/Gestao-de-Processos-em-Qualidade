import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { AlertCircle, CheckCircle2, Clock, FileText, Download, AlertTriangle, Settings, Plus, X, RotateCcw, GripVertical, Eye, EyeOff, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays, format } from "date-fns";
import { useProcesses } from "@/hooks/use-processes";
import { useAlertSettings } from "@/hooks/use-alert-settings";
import { useAllEvents } from "@/hooks/use-events";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCumulativeFlowData, getDashboardWidgets, updateDashboardWidget, reorderDashboardWidgets, resetDashboardWidgets, createDashboardWidget, deleteDashboardWidget } from "@/lib/api";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { DashboardWidget, Process, ProcessEvent } from "@shared/schema";

const WIDGET_TYPES = [
  { value: 'process_count', label: 'Total de Processos', description: 'Número total de processos' },
  { value: 'status_chart', label: 'Por Status', description: 'Distribuição por status' },
  { value: 'priority_chart', label: 'Por Prioridade', description: 'Distribuição por prioridade' },
  { value: 'deadline_alerts', label: 'Alertas de Prazo', description: 'Processos em atraso' },
  { value: 'recent_processes', label: 'Processos Recentes', description: 'Últimos processos criados' },
  { value: 'activity_feed', label: 'Atividade Recente', description: 'Últimas movimentações' },
  { value: 'unit_breakdown', label: 'Por Unidade', description: 'Distribuição por unidade' },
  { value: 'cumulative_flow', label: 'Fluxo Cumulativo', description: 'Evolução ao longo do tempo' },
  { value: 'stalled_processes', label: 'Processos Estagnados', description: 'Sem movimentação' },
  { value: 'completed_count', label: 'Concluídos', description: 'Processos finalizados' },
  { value: 'avg_time', label: 'Tempo Médio', description: 'Tempo médio de resolução' },
];

const CFD_STATUS_COLORS: Record<string, string> = {
  new: "#6b7280",
  analysis: "#3b82f6",
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
};

const CFD_STATUS_LABELS: Record<string, string> = {
  new: "Novos",
  analysis: "Em Análise",
  pending: "Pendentes",
  approved: "Aprovados",
  rejected: "Rejeitados",
};

const COLORS = ['#0F766E', '#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4'];

interface WidgetRendererProps {
  widget: DashboardWidget;
  processes: Process[];
  events: ProcessEvent[];
  alertSettings: { stalledDays: number } | undefined;
  cfdChartData: Record<string, number>[];
  isCfdLoading: boolean;
}

function WidgetRenderer({ widget, processes, events, alertSettings, cfdChartData, isCfdLoading }: WidgetRendererProps) {
  const totalProcesses = processes.length;
  const delayedProcesses = processes.filter(p => p.deadline && new Date(p.deadline) < new Date());
  const completedProcesses = processes.filter(p => p.status === 'approved');
  const stalledDays = alertSettings?.stalledDays || 15;
  
  const stalledProcesses = processes.filter(p => {
    if (['approved', 'rejected'].includes(p.status)) return false;
    const processEvents = events.filter(e => e.processId === p.id);
    const lastUpdate = processEvents.length > 0 
      ? new Date(processEvents[processEvents.length - 1].timestamp) 
      : new Date(p.createdAt);
    return differenceInDays(new Date(), lastUpdate) >= stalledDays;
  });

  const statusData = [
    { name: 'Novos', value: processes.filter(p => p.status === 'new').length },
    { name: 'Em Análise', value: processes.filter(p => p.status === 'analysis').length },
    { name: 'Pendentes', value: processes.filter(p => p.status === 'pending').length },
    { name: 'Aprovados', value: processes.filter(p => p.status === 'approved').length },
    { name: 'Rejeitados', value: processes.filter(p => p.status === 'rejected').length },
  ];

  const priorityData = [
    { name: 'Alta', value: processes.filter(p => p.priority === 'high').length, color: '#ef4444' },
    { name: 'Média', value: processes.filter(p => p.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Baixa', value: processes.filter(p => p.priority === 'low').length, color: '#22c55e' },
  ];

  const unitDataMap = processes.reduce((acc, curr) => {
    acc[curr.unit] = (acc[curr.unit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const unitData = Object.keys(unitDataMap).map(key => ({
    name: key,
    value: unitDataMap[key]
  }));

  const recentProcesses = [...processes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  switch (widget.widgetType) {
    case 'process_count':
      return (
        <Card className="shadow-sm border-l-4 border-l-primary h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="widget-process-count">{totalProcesses}</div>
            <p className="text-xs text-muted-foreground">Em todas as unidades</p>
          </CardContent>
        </Card>
      );

    case 'deadline_alerts':
      return (
        <Card className="shadow-sm border-l-4 border-l-destructive h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="widget-delayed-count">{delayedProcesses.length}</div>
            <p className="text-xs text-muted-foreground">Requer atenção imediata</p>
          </CardContent>
        </Card>
      );

    case 'completed_count':
      return (
        <Card className="shadow-sm border-l-4 border-l-emerald-600 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="widget-completed-count">{completedProcesses.length}</div>
            <p className="text-xs text-muted-foreground">Processos finalizados</p>
          </CardContent>
        </Card>
      );

    case 'avg_time':
      return (
        <Card className="shadow-sm border-l-4 border-l-blue-500 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 dias</div>
            <p className="text-xs text-muted-foreground">Tempo médio de resolução</p>
          </CardContent>
        </Card>
      );

    case 'status_chart':
      return (
        <Card className="shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-base">{widget.title}</CardTitle>
            <CardDescription className="text-xs">Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );

    case 'priority_chart':
      return (
        <Card className="shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-base">{widget.title}</CardTitle>
            <CardDescription className="text-xs">Distribuição por prioridade</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );

    case 'unit_breakdown':
      return (
        <Card className="shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-base">{widget.title}</CardTitle>
            <CardDescription className="text-xs">Origem das solicitações</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {unitData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );

    case 'recent_processes':
      return (
        <Card className="shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-base">{widget.title}</CardTitle>
            <CardDescription className="text-xs">Últimos processos criados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProcesses.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">Nenhum processo encontrado.</div>
            ) : (
              <div className="space-y-2">
                {recentProcesses.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg" data-testid={`widget-recent-process-${p.id}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground">#{p.id} • {p.unit}</div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {format(new Date(p.createdAt), 'dd/MM')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'activity_feed':
      return (
        <Card className="shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-base">{widget.title}</CardTitle>
            <CardDescription className="text-xs">Últimas movimentações</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade encontrada.</div>
            ) : (
              <div className="space-y-2">
                {recentEvents.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg" data-testid={`widget-activity-${e.id}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{e.description}</div>
                      <div className="text-xs text-muted-foreground">Processo #{e.processId}</div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {format(new Date(e.timestamp), 'dd/MM HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'stalled_processes':
      return (
        <Card className="shadow-sm border-yellow-500/20 h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 text-base">
              <AlertTriangle className="w-4 h-4" />
              {widget.title}
            </CardTitle>
            <CardDescription className="text-xs">Sem movimentação há mais de {stalledDays} dias</CardDescription>
          </CardHeader>
          <CardContent>
            {stalledProcesses.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">Nenhum processo estagnado.</div>
            ) : (
              <div className="space-y-2">
                {stalledProcesses.slice(0, 5).map(p => {
                  const processEvents = events.filter(e => e.processId === p.id);
                  const lastUpdate = processEvents.length > 0 
                    ? new Date(processEvents[processEvents.length - 1].timestamp) 
                    : new Date(p.createdAt);
                  const daysStopped = differenceInDays(new Date(), lastUpdate);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-100" data-testid={`widget-stalled-${p.id}`}>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground">#{p.id} • {p.unit}</div>
                      </div>
                      <div className="text-xs font-bold text-yellow-700 ml-2 whitespace-nowrap">
                        {daysStopped} dias
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'cumulative_flow':
      return (
        <Card className="shadow-sm h-full" data-testid="widget-cumulative-flow">
          <CardHeader>
            <CardTitle className="text-base">{widget.title}</CardTitle>
            <CardDescription className="text-xs">Evolução do fluxo ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {isCfdLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cfdChartData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => {
                        try {
                          return format(new Date(value), 'dd/MM');
                        } catch {
                          return value;
                        }
                      }}
                    />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => [value, CFD_STATUS_LABELS[name] || name]}
                    />
                    {Object.keys(CFD_STATUS_COLORS).map((status) => (
                      <Area 
                        key={status}
                        type="monotone" 
                        dataKey={status} 
                        stackId="1" 
                        stroke={CFD_STATUS_COLORS[status]} 
                        fill={CFD_STATUS_COLORS[status]} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card className="shadow-sm h-full">
          <CardContent className="flex items-center justify-center h-full">
            <span className="text-muted-foreground">Widget não reconhecido</span>
          </CardContent>
        </Card>
      );
  }
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: processes = [], isLoading } = useProcesses();
  const { data: alertSettings } = useAlertSettings();
  const { data: events = [] } = useAllEvents();
  const { data: cfdRawData = [], isLoading: isCfdLoading } = useQuery({
    queryKey: ["/api/analytics/cumulative-flow"],
    queryFn: getCumulativeFlowData,
  });
  const { data: widgets = [], isLoading: isWidgetsLoading } = useQuery({
    queryKey: ["/api/dashboard/widgets"],
    queryFn: getDashboardWidgets,
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState('');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');

  const cfdData = cfdRawData.reduce((acc: Record<string, Record<string, number>>, item) => {
    if (!acc[item.date]) {
      acc[item.date] = { date: item.date as unknown as number };
    }
    acc[item.date][item.status] = item.count;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const cfdChartData = Object.values(cfdData).sort((a, b) => 
    new Date(a.date as unknown as string).getTime() - new Date(b.date as unknown as string).getTime()
  );

  const updateWidgetMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<DashboardWidget> }) => 
      updateDashboardWidget(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/widgets"] });
    },
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: deleteDashboardWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/widgets"] });
      toast.success("Widget removido");
    },
  });

  const createWidgetMutation = useMutation({
    mutationFn: createDashboardWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/widgets"] });
      setAddWidgetOpen(false);
      setNewWidgetType('');
      setNewWidgetTitle('');
      toast.success("Widget adicionado");
    },
  });

  const resetWidgetsMutation = useMutation({
    mutationFn: resetDashboardWidgets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/widgets"] });
      toast.success("Dashboard restaurado");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderDashboardWidgets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/widgets"] });
    },
  });

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const positions = items.map((item, index) => ({
      id: item.id,
      position: index,
    }));
    
    reorderMutation.mutate(positions);
  }, [widgets, reorderMutation]);

  const handleAddWidget = () => {
    if (!newWidgetType) return;
    
    const widgetInfo = WIDGET_TYPES.find(w => w.value === newWidgetType);
    createWidgetMutation.mutate({
      widgetType: newWidgetType,
      title: newWidgetTitle || widgetInfo?.label || 'Widget',
      position: widgets.length,
      width: ['recent_processes', 'activity_feed', 'cumulative_flow'].includes(newWidgetType) ? 2 : 1,
      height: 1,
      visible: true,
    });
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Título", "Unidade", "Status", "Prioridade", "Criado em", "Prazo", "Responsável"];
    const rows = processes.map(p => [
      p.id,
      p.title,
      p.unit,
      p.status,
      p.priority,
      new Date(p.createdAt).toLocaleDateString(),
      p.deadline ? new Date(p.deadline).toLocaleDateString() : "-",
      p.responsibleId || "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mediflow_processos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visibleWidgets = useMemo(() => 
    widgets.filter(w => w.visible).sort((a, b) => a.position - b.position),
    [widgets]
  );

  if (isLoading || isWidgetsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1">Carregando dados...</p>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Visão geral dos indicadores de desempenho da unidade.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={isCustomizing ? "default" : "outline"} 
            onClick={() => setIsCustomizing(!isCustomizing)} 
            className="gap-2" 
            data-testid="button-customize"
          >
            <LayoutGrid className="w-4 h-4" />
            {isCustomizing ? "Concluir" : "Personalizar"}
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2" data-testid="button-export">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {isCustomizing && (
        <Card className="border-dashed border-2 border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="w-4 h-4" />
                <span>Modo de personalização ativo. Arraste os widgets para reorganizar.</span>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAddWidgetOpen(true)}
                  className="gap-1"
                  data-testid="button-add-widget"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Widget
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => resetWidgetsMutation.mutate()}
                  className="gap-1"
                  data-testid="button-reset-widgets"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar Padrão
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-widgets" isDropDisabled={!isCustomizing}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            >
              {visibleWidgets.map((widget, index) => {
                const colSpan = widget.width === 2 ? 'sm:col-span-2' : '';
                
                return (
                  <Draggable
                    key={widget.id}
                    draggableId={String(widget.id)}
                    index={index}
                    isDragDisabled={!isCustomizing}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${colSpan} relative ${snapshot.isDragging ? 'z-50 opacity-90' : ''}`}
                        data-testid={`widget-container-${widget.id}`}
                      >
                        {isCustomizing && (
                          <div className="absolute top-2 right-2 z-10 flex gap-1">
                            <div
                              {...provided.dragHandleProps}
                              className="p-1.5 bg-background/80 rounded-md cursor-grab hover:bg-muted"
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-background/80 hover:bg-muted"
                              onClick={() => updateWidgetMutation.mutate({
                                id: widget.id,
                                updates: { visible: !widget.visible }
                              })}
                              data-testid={`widget-toggle-${widget.id}`}
                            >
                              {widget.visible ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => deleteWidgetMutation.mutate(widget.id)}
                              data-testid={`widget-delete-${widget.id}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <WidgetRenderer
                          widget={widget}
                          processes={processes}
                          events={events}
                          alertSettings={alertSettings}
                          cfdChartData={cfdChartData}
                          isCfdLoading={isCfdLoading}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {visibleWidgets.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutGrid className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum widget visível</h3>
            <p className="text-sm text-muted-foreground mb-4">Adicione widgets para personalizar seu dashboard.</p>
            <Button onClick={() => setAddWidgetOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Widget
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Widget</DialogTitle>
            <DialogDescription>
              Escolha o tipo de widget que deseja adicionar ao dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Widget</Label>
              <Select value={newWidgetType} onValueChange={setNewWidgetType}>
                <SelectTrigger data-testid="select-widget-type">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título Personalizado (opcional)</Label>
              <Input
                value={newWidgetTitle}
                onChange={(e) => setNewWidgetTitle(e.target.value)}
                placeholder="Deixe em branco para usar o padrão"
                data-testid="input-widget-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWidgetOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddWidget} 
              disabled={!newWidgetType || createWidgetMutation.isPending}
              data-testid="button-confirm-add-widget"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
