import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, CheckCircle2, Clock, Activity, FileText, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays } from "date-fns";

export default function DashboardPage() {
  const { processes, alertSettings } = useStore();

  const totalProcesses = processes.length;
  const delayedProcesses = processes.filter(p => p.deadline && new Date(p.deadline) < new Date());
  const completedProcesses = processes.filter(p => p.status === 'approved');
  
  // Stalled processes logic
  const stalledProcesses = processes.filter(p => {
    if (['approved', 'rejected'].includes(p.status)) return false;
    const lastUpdate = p.history.length > 0 
      ? new Date(p.history[p.history.length - 1].timestamp) 
      : new Date(p.createdAt);
    return differenceInDays(new Date(), lastUpdate) >= alertSettings.stalledDays;
  });

  // Chart Data Preparation
  const statusData = [
    { name: 'Novos', value: processes.filter(p => p.status === 'new').length },
    { name: 'Em Análise', value: processes.filter(p => p.status === 'analysis').length },
    { name: 'Pendentes', value: processes.filter(p => p.status === 'pending').length },
    { name: 'Aprovados', value: processes.filter(p => p.status === 'approved').length },
    { name: 'Rejeitados', value: processes.filter(p => p.status === 'rejected').length },
  ];

  const unitDataMap = processes.reduce((acc, curr) => {
    acc[curr.unit] = (acc[curr.unit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const unitData = Object.keys(unitDataMap).map(key => ({
    name: key,
    value: unitDataMap[key]
  }));

  const COLORS = ['#0F766E', '#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4'];

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1">Visão geral dos indicadores de desempenho da unidade.</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcesses}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{delayedProcesses.length}</div>
            <p className="text-xs text-muted-foreground">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProcesses.length}</div>
            <p className="text-xs text-muted-foreground">
              Processos finalizados este mês
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 dias</div>
            <p className="text-xs text-muted-foreground">
              -0.5 dias que a média
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         {/* Delayed Processes List */}
         <Card className="shadow-sm border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Processos em Atraso
              </CardTitle>
              <CardDescription>Lista de processos que já ultrapassaram o prazo limite.</CardDescription>
            </CardHeader>
            <CardContent>
              {delayedProcesses.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhum processo atrasado.</div>
              ) : (
                <div className="space-y-3">
                  {delayedProcesses.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                      <div>
                        <div className="font-medium text-sm">{p.title}</div>
                        <div className="text-xs text-muted-foreground">{p.id} • {p.unit}</div>
                      </div>
                      <div className="text-xs font-bold text-destructive">
                        {p.deadline ? new Date(p.deadline).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  ))}
                  {delayedProcesses.length > 5 && (
                    <div className="text-xs text-center text-muted-foreground pt-2">
                      + {delayedProcesses.length - 5} outros processos
                    </div>
                  )}
                </div>
              )}
            </CardContent>
         </Card>

         {/* Stalled Processes List */}
         <Card className="shadow-sm border-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                Processos Estagnados
              </CardTitle>
              <CardDescription>Sem movimentação há mais de {alertSettings.stalledDays} dias.</CardDescription>
            </CardHeader>
            <CardContent>
              {stalledProcesses.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">Nenhum processo estagnado.</div>
              ) : (
                <div className="space-y-3">
                  {stalledProcesses.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div>
                        <div className="font-medium text-sm">{p.title}</div>
                        <div className="text-xs text-muted-foreground">{p.id} • {p.unit}</div>
                      </div>
                      <div className="text-xs font-bold text-yellow-700">
                        {differenceInDays(new Date(), p.history.length > 0 ? new Date(p.history[p.history.length-1].timestamp) : new Date(p.createdAt))} dias parado
                      </div>
                    </div>
                  ))}
                  {stalledProcesses.length > 5 && (
                    <div className="text-xs text-center text-muted-foreground pt-2">
                      + {stalledProcesses.length - 5} outros processos
                    </div>
                  )}
                </div>
              )}
            </CardContent>
         </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Volume por Status</CardTitle>
            <CardDescription>Distribuição atual dos processos no kanban.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Por Unidade</CardTitle>
            <CardDescription>Origem das solicitações.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {unitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
