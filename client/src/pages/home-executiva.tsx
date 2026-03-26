import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQHealthDashboard } from "@/lib/api";
import { useTenant } from "@/hooks/use-tenant";
import {
  ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, Building2, BarChart3, Users, FileText, Zap, Award, Target,
  ArrowRight, ChevronRight, Eye, Bot, Activity, Stethoscope,
  CircleDot, AlertCircle, CheckSquare, Calendar, Pill, Star,
  MoreHorizontal, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from "recharts";

// ============================================================
// MOCK DATA — substitua por queries reais
// ============================================================

const onaScoreData = {
  level1: 84,
  level2: 71,
  level3: 58,
  overall: 71,
  trend: +3.2,
};

const semaphoreStatus = {
  label: "Atenção",
  color: "yellow",
  description: "71% de prontidão — Foco nos gaps do Nível 2",
};

const kpiCards = [
  {
    title: "Score ONA Global",
    value: "71%",
    trend: +3.2,
    icon: <Award className="w-5 h-5" />,
    color: "sky",
    sub: "Meta: 80% | Nível 2",
    path: "/acreditacao-ona",
  },
  {
    title: "Planos em Atraso",
    value: "18",
    trend: -4,
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "red",
    sub: "↓ 4 vs mês anterior",
    path: "/gestao-operacional",
  },
  {
    title: "Riscos Críticos",
    value: "7",
    trend: -1,
    icon: <AlertCircle className="w-5 h-5" />,
    color: "orange",
    sub: "GUT ≥ 75 sem mitigação",
    path: "/riscos",
  },
  {
    title: "Eventos Adversos",
    value: "12",
    trend: -3,
    icon: <Activity className="w-5 h-5" />,
    color: "purple",
    sub: "Este mês | 2 sentinelas",
    path: "/eventos",
  },
  {
    title: "Documentos Vencidos",
    value: "23",
    trend: -8,
    icon: <FileText className="w-5 h-5" />,
    color: "amber",
    sub: "Requerem revisão urgente",
    path: "/documentos",
  },
  {
    title: "Indicadores no Alvo",
    value: "68%",
    trend: +5,
    icon: <BarChart3 className="w-5 h-5" />,
    color: "emerald",
    sub: "34 de 50 indicadores",
    path: "/indicadores",
  },
];

const unitRanking = [
  { name: "UTI Adulto", score: 88, trend: "+2", status: "green" },
  { name: "Centro Cirúrgico", score: 82, trend: "+5", status: "green" },
  { name: "Laboratório", score: 78, trend: "+1", status: "yellow" },
  { name: "Pronto-Socorro", score: 67, trend: "-2", status: "yellow" },
  { name: "Imagem", score: 61, trend: "+4", status: "yellow" },
  { name: "Hemodiálise", score: 54, trend: "-5", status: "red" },
];

const topRisks = [
  { id: 1, title: "Falha no processo de identificação do paciente", unit: "PS + UTI", gut: 100, category: "Assistencial" },
  { id: 2, title: "Não conformidade no descarte de resíduos infectantes", unit: "CME", gut: 90, category: "Regulatório" },
  { id: 3, title: "Ausência de checklist de cirurgia segura em 30% dos procedimentos", unit: "CC", gut: 80, category: "Assistencial" },
  { id: 4, title: "Protocolo de sepse com aderência abaixo de 60%", unit: "PS", gut: 75, category: "Clínico" },
  { id: 5, title: "Documentação do CFM desatualizada para medicina intensiva", unit: "UTI", gut: 72, category: "Regulatório" },
];

const topActions = [
  { id: 1, title: "Implantar pulseira de identificação dupla na UTI", unit: "UTI", days: -5, responsible: "Enf. Carla" },
  { id: 2, title: "Atualizar POP de higienização das mãos", unit: "Geral", days: -12, responsible: "Qual. Dr. José" },
  { id: 3, title: "Treinar equipe do PS no protocolo de sepse", unit: "PS", days: -3, responsible: "Enf. Ana" },
  { id: 4, title: "Revisar regimento do NSP", unit: "NSP", days: -8, responsible: "Dr. Marcos" },
  { id: 5, title: "Notificação ANVISA de evento sentinela #ES-2026-08", unit: "CC", days: -1, responsible: "Qual. Maria" },
];

const commissionAgenda = [
  { name: "NSP", date: "25/03", type: "Ordinária", status: "scheduled" },
  { name: "SCIH", date: "27/03", type: "Extraordinária", status: "scheduled" },
  { name: "Prontuários", date: "28/03", type: "Ordinária", status: "scheduled" },
  { name: "Óbitos e Biópsias", date: "01/04", type: "Ordinária", status: "scheduled" },
];

const onaLevelProgress = [
  { level: "Nível 1", progress: 84, total: 48, done: 40, color: "#0ea5e9" },
  { level: "Nível 2", progress: 71, total: 36, done: 26, color: "#8b5cf6" },
  { level: "Nível 3", progress: 58, total: 24, done: 14, color: "#f59e0b" },
];

const indicatorTrend = [
  { month: "Out", ona: 65, safety: 72, quality: 68 },
  { month: "Nov", ona: 66, safety: 75, quality: 70 },
  { month: "Dez", ona: 68, safety: 74, quality: 71 },
  { month: "Jan", ona: 70, safety: 76, quality: 73 },
  { month: "Fev", ona: 69, safety: 77, quality: 74 },
  { month: "Mar", ona: 71, safety: 79, quality: 75 },
];

const radarData = [
  { subject: "Liderança", value: 78 },
  { subject: "Assistencial", value: 65 },
  { subject: "Diagnóstico", value: 82 },
  { subject: "Segurança", value: 71 },
  { subject: "Processos", value: 68 },
  { subject: "Qualidade", value: 74 },
];

// ============================================================
// COMPONENTS
// ============================================================

const SemaphoreIndicator = ({ status }: { status: "green" | "yellow" | "red" }) => {
  const colors = {
    green: "bg-emerald-500 shadow-emerald-500/40",
    yellow: "bg-amber-500 shadow-amber-500/40",
    red: "bg-red-500 shadow-red-500/40",
  };
  return (
    <div className={cn("w-3 h-3 rounded-full shadow-lg", colors[status])} />
  );
};

const TrendBadge = ({ value }: { value: number }) => (
  <span className={cn(
    "inline-flex items-center gap-0.5 text-xs font-semibold",
    value > 0 ? "text-emerald-500" : value < 0 ? "text-red-500" : "text-slate-400"
  )}>
    {value > 0 ? <TrendingUp className="w-3 h-3" /> : value < 0 ? <TrendingDown className="w-3 h-3" /> : null}
    {Math.abs(value)}{typeof value === "number" && !Number.isInteger(value * 10) ? "%" : ""}
  </span>
);

const colorMap: Record<string, string> = {
  sky: "from-sky-500 to-sky-600",
  red: "from-red-500 to-rose-600",
  orange: "from-orange-500 to-amber-600",
  purple: "from-violet-500 to-purple-600",
  amber: "from-amber-500 to-orange-600",
  emerald: "from-emerald-500 to-teal-600",
};

const bgColorMap: Record<string, string> = {
  sky: "bg-sky-50 dark:bg-sky-950/30",
  red: "bg-red-50 dark:bg-red-950/30",
  orange: "bg-orange-50 dark:bg-orange-950/30",
  purple: "bg-violet-50 dark:bg-violet-950/30",
  amber: "bg-amber-50 dark:bg-amber-950/30",
  emerald: "bg-emerald-50 dark:bg-emerald-950/30",
};

const textColorMap: Record<string, string> = {
  sky: "text-sky-600 dark:text-sky-400",
  red: "text-red-600 dark:text-red-400",
  orange: "text-orange-600 dark:text-orange-400",
  purple: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

const gutColor = (gut: number) => {
  if (gut >= 90) return "text-red-600 bg-red-50 border-red-200";
  if (gut >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-amber-600 bg-amber-50 border-amber-200";
};

// ============================================================
// MAIN PAGE
// ============================================================

export default function HomeExecutiva() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"executive" | "operational">("executive");
  const { isAdmin, companyName, validatedData } = useTenant();

  const { data: dashData } = useQuery({
    queryKey: ["qhealth-dashboard"],
    queryFn: getQHealthDashboard,
    staleTime: 60_000,
  });

  // LGPD: fallback com mock apenas para admin; novos clientes começam com zeros reais
  const fallback = (mockVal: string) => dashData ? undefined : (isAdmin ? mockVal : "0");

  // Build live KPI values using validated data when available (non-admin with assessment)
  const validatedOnaScore = validatedData?.scores;
  const validatedRiscoCount = validatedData?.riscos.length ?? 0;
  const validatedCapaCount = validatedData?.capas.length ?? 0;
  const validatedPoliticaCount = validatedData?.politicas.length ?? 0;
  const validatedIndOnTarget = validatedData
    ? validatedData.indicadores.filter(i => i.value >= i.target).length
    : 0;
  const validatedIndTotal = validatedData?.indicadores.length ?? 0;

  const liveKpiCards = [
    {
      title: "Score ONA Global",
      value: dashData ? `${dashData.onaScore.overall}%` : (validatedOnaScore ? `${validatedOnaScore.overall}%` : (isAdmin ? "71%" : "0%")),
      trend: +3.2,
      icon: <Award className="w-5 h-5" />,
      color: "sky",
      sub: dashData
        ? `N1:${dashData.onaScore.level1}% N2:${dashData.onaScore.level2}% N3:${dashData.onaScore.level3}%`
        : (validatedOnaScore
          ? `N1:${validatedOnaScore.n1}% N2:${validatedOnaScore.n2}% N3:${validatedOnaScore.n3}%`
          : "Preencha a Avaliação Inicial para calcular"),
      path: "/acreditacao-ona",
    },
    {
      title: "Total Planos de Ação",
      value: dashData ? String(dashData.actionPlans) : (isAdmin ? "18" : (validatedData ? String(validatedCapaCount) : "0")),
      trend: -4,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "red",
      sub: "Planos cadastrados no sistema",
      path: "/gestao-operacional",
    },
    {
      title: "Riscos Cadastrados",
      value: dashData ? String(dashData.risks) : (isAdmin ? "7" : (validatedData ? String(validatedRiscoCount) : "0")),
      trend: -1,
      icon: <AlertCircle className="w-5 h-5" />,
      color: "orange",
      sub: "Total na matriz de riscos",
      path: "/riscos",
    },
    {
      title: "Eventos de Segurança",
      value: dashData ? String(dashData.safetyEvents) : (isAdmin ? "12" : "0"),
      trend: -3,
      icon: <Activity className="w-5 h-5" />,
      color: "purple",
      sub: "Notificações NSP registradas",
      path: "/eventos",
    },
    {
      title: "Documentos Cadastrados",
      value: dashData ? String(dashData.documents) : (isAdmin ? "23" : (validatedData ? String(validatedPoliticaCount) : "0")),
      trend: +2,
      icon: <FileText className="w-5 h-5" />,
      color: "amber",
      sub: "POPs, protocolos e políticas",
      path: "/documentos",
    },
    {
      title: "Indicadores no Alvo",
      value: isAdmin ? "68%" : (validatedData && validatedIndTotal > 0 ? `${Math.round((validatedIndOnTarget / validatedIndTotal) * 100)}%` : "0%"),
      trend: +5,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "emerald",
      sub: isAdmin ? "34 de 50 indicadores" : (validatedData ? `${validatedIndOnTarget} de ${validatedIndTotal} indicadores` : "Cadastre indicadores para medir"),
      path: "/indicadores",
    },
  ];

  const liveOnaScore = dashData
    ? { ...onaScoreData, level1: dashData.onaScore.level1, level2: dashData.onaScore.level2, level3: dashData.onaScore.level3, overall: dashData.onaScore.overall }
    : (validatedOnaScore
      ? { level1: validatedOnaScore.n1, level2: validatedOnaScore.n2, level3: validatedOnaScore.n3, overall: validatedOnaScore.overall, trend: 0 }
      : (isAdmin ? onaScoreData : { level1: 0, level2: 0, level3: 0, overall: 0, trend: 0 }));

  // LGPD: mock data only visible to admin
  const displayUnitRanking = isAdmin ? unitRanking : [];
  const displayTopRisks = isAdmin ? topRisks : [];
  const displayTopActions = isAdmin ? topActions : [];
  const displayCommissionAgenda = isAdmin ? commissionAgenda : [];
  const displayOnaLevelProgress = isAdmin ? onaLevelProgress : [];
  const displayIndicatorTrend = isAdmin ? indicatorTrend : [];
  const displayRadarData = isAdmin ? radarData : (validatedData?.radarData ?? []);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Home Executiva</h1>
            <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-xs font-semibold">
              QHealth One 2026
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Visão 360° institucional — Hospital Geral • Atualizado agora
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="executive" className="text-xs h-7">Diretoria</TabsTrigger>
              <TabsTrigger value="operational" className="text-xs h-7">Qualidade</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            onClick={() => navigate("/ia-copilot")}
            className="h-8 gap-1.5 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white text-xs border-0"
          >
            <Bot className="w-3.5 h-3.5" />
            Resumo IA
          </Button>
        </div>
      </div>

      {/* Semáforo + Score ONA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Semáforo geral */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-emerald-500/5" />
          <CardContent className="pt-6 pb-5 relative z-10">
            <div className="text-center">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Status Institucional</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-500/30" />
                <div className="w-6 h-6 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 ring-2 ring-amber-400/30" />
                <div className="w-4 h-4 rounded-full bg-red-500/30 border border-red-500/30" />
              </div>
              <p className="text-2xl font-bold text-amber-400 mb-1">ATENÇÃO</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                71% de prontidão<br />Foco: gaps do Nível 2
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ONA Levels */}
        <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-500" />
                Score de Prontidão ONA 2026 — Por Nível
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/acreditacao-ona")}
                className="text-xs h-7 gap-1"
              >
                Ver detalhe <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-4">
              {displayOnaLevelProgress.map((l) => (
                <div key={l.level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{l.level}</span>
                    <span className="text-lg font-bold" style={{ color: l.color }}>{l.progress}%</span>
                  </div>
                  <Progress value={l.progress} className="h-2.5" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{l.done} aderentes</span>
                    <span>{l.total} requisitos</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {liveKpiCards.map((kpi) => (
          <Card
            key={kpi.title}
            className={cn(
              "cursor-pointer border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group",
              "border-slate-200 dark:border-slate-800"
            )}
            onClick={() => navigate(kpi.path)}
          >
            <CardContent className="p-4">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center mb-3",
                `bg-gradient-to-br ${colorMap[kpi.color]}`
              )}>
                <span className="text-white">{kpi.icon}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 leading-tight">{kpi.title}</p>
              <p className={cn("text-2xl font-bold", textColorMap[kpi.color])}>{kpi.value}</p>
              <div className="flex items-center justify-between mt-1.5">
                <TrendBadge value={kpi.trend} />
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Ranking de Unidades */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-500" />
                Ranking de Unidades
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/unidades-negocio")} className="text-xs h-7 gap-1">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2.5">
              {displayUnitRanking.map((unit, i) => (
                <div key={unit.name} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-4 flex-shrink-0">#{i + 1}</span>
                  <SemaphoreIndicator status={unit.status as any} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{unit.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-bold",
                          unit.status === "green" ? "text-emerald-600" :
                          unit.status === "yellow" ? "text-amber-600" : "text-red-600"
                        )}>{unit.score}%</span>
                        <span className={cn(
                          "text-[10px] font-medium",
                          unit.trend.startsWith("+") ? "text-emerald-500" : "text-red-500"
                        )}>{unit.trend}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          unit.status === "green" ? "bg-emerald-400" :
                          unit.status === "yellow" ? "bg-amber-400" : "bg-red-400"
                        )}
                        style={{ width: `${unit.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Riscos Críticos */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Top 5 Riscos Críticos
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/riscos")} className="text-xs h-7 gap-1">
                Heatmap <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2.5">
              {displayTopRisks.map((risk) => (
                <div key={risk.id} className="flex items-start gap-2.5 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 mt-0.5", gutColor(risk.gut))}>
                    {risk.gut}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">{risk.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{risk.unit}</Badge>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-orange-200 text-orange-600">{risk.category}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Planos Vencidos */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                Planos Vencidos
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/gestao-operacional")} className="text-xs h-7 gap-1">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2.5">
              {displayTopActions.map((action) => (
                <div key={action.id} className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">{action.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{action.unit}</Badge>
                        <span className="text-[10px] text-red-500 font-semibold">{Math.abs(action.days)} dias vencido</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{action.responsible}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Tendência de Score ONA */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-500" />
              Evolução dos Indicadores — 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={displayIndicatorTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradOna" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSafety" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 85]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Area type="monotone" dataKey="ona" stroke="#0ea5e9" strokeWidth={2} fill="url(#gradOna)" name="Score ONA" />
                <Area type="monotone" dataKey="safety" stroke="#10b981" strokeWidth={2} fill="url(#gradSafety)" name="Segurança" />
                <Area type="monotone" dataKey="quality" stroke="#8b5cf6" strokeWidth={2} fill="none" strokeDasharray="4 2" name="Qualidade" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 px-2">
              {[
                { label: "Score ONA", color: "#0ea5e9" },
                { label: "Segurança", color: "#10b981" },
                { label: "Qualidade", color: "#8b5cf6" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[11px] text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar de Maturidade */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-500" />
              Radar de Maturidade Institucional
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={displayRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <Radar name="Maturidade" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Comissões + IA Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Agenda de Comissões */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Agenda de Comissões
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/comissoes")} className="text-xs h-7 gap-1">
                Ver agenda <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2.5">
              {displayCommissionAgenda.map((c) => (
                <div key={c.name} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 border border-emerald-100 dark:border-emerald-800">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.name}</p>
                    <p className="text-[11px] text-slate-500">{c.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.date}</p>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-emerald-200 text-emerald-600">
                      Agendada
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* IA ONA Copilot Summary */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-emerald-500/5" />
          <CardHeader className="pb-3 pt-4 px-5 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                IA ONA Copilot — Resumo Executivo
              </CardTitle>
              <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px]">IA Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 relative z-10">
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
                <p className="text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Análise desta semana</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAdmin
                    ? <>O hospital está em trajetória positiva (+3.2% no Score ONA). Os principais gaps estão nos critérios de <span className="text-sky-300 font-medium">Identificação do Paciente</span> e <span className="text-amber-300 font-medium">Protocolos de Segurança no CC</span>. Prioridade imediata: atualizar 3 POPs vencidos do NSP antes da próxima visita simulada.</>
                    : "Cadastre os dados da sua instituição para receber análises e recomendações personalizadas do IA ONA Copilot."
                  }
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Requisitos com gap", value: isAdmin ? "28" : (validatedData ? String(validatedData.gaps.length) : "0"), color: "text-red-400" },
                  { label: "Evidências sugeridas", value: isAdmin ? "14" : (validatedData ? String(validatedData.politicas.length) : "0"), color: "text-sky-400" },
                  { label: "Score previsto (90d)", value: isAdmin ? "76%" : (validatedData ? `${Math.min(100, validatedData.scores.overall + 8)}%` : "—"), color: "text-emerald-400" },
                ].map(item => (
                  <div key={item.label} className="text-center rounded-lg bg-slate-800/40 p-2.5">
                    <p className={cn("text-xl font-bold", item.color)}>{item.value}</p>
                    <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate("/ia-copilot")}
                className="w-full h-8 text-xs bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 border-0"
              >
                <Bot className="w-3.5 h-3.5 mr-1.5" />
                Abrir IA ONA Copilot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
