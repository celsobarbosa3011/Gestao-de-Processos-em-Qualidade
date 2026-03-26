import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  User,
  Target,
  ClipboardList,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dimensao {
  id: string;
  nome: string;
  nomeAbrev: string;
  score: number;
  benchmark: number;
  tendencia: "melhora" | "estavel" | "piora";
  categoria: "forte" | "oportunidade" | "critica";
}

interface EvolucaoItem {
  pesquisa: string;
  score: number;
  meta: number;
}

interface EvolucaoDimensao {
  nome: string;
  jun24: number;
  dez24: number;
  jun25: number;
  mar26: number;
}

interface PlanoAcao {
  id: number;
  dimensao: string;
  acao: string;
  responsavel: string;
  prazo: string;
  progresso: number;
  status: "em_andamento" | "concluido" | "atrasado" | "pendente";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockDimensoes: Dimensao[] = [
  {
    id: "d1",
    nome: "Trabalho em Equipe na Unidade",
    nomeAbrev: "Trabalho em Equipe",
    score: 82,
    benchmark: 75,
    tendencia: "melhora",
    categoria: "forte",
  },
  {
    id: "d2",
    nome: "Expectativas e Ações do Supervisor",
    nomeAbrev: "Expectativas Supervisor",
    score: 78,
    benchmark: 70,
    tendencia: "estavel",
    categoria: "forte",
  },
  {
    id: "d3",
    nome: "Aprendizado Organizacional",
    nomeAbrev: "Aprendizado Org.",
    score: 71,
    benchmark: 68,
    tendencia: "melhora",
    categoria: "forte",
  },
  {
    id: "d4",
    nome: "Apoio da Gestão para Segurança",
    nomeAbrev: "Apoio da Gestão",
    score: 69,
    benchmark: 72,
    tendencia: "estavel",
    categoria: "oportunidade",
  },
  {
    id: "d5",
    nome: "Percepção Geral de Segurança",
    nomeAbrev: "Percepção Segurança",
    score: 65,
    benchmark: 71,
    tendencia: "estavel",
    categoria: "oportunidade",
  },
  {
    id: "d6",
    nome: "Frequência de Eventos Notificados",
    nomeAbrev: "Freq. Notificações",
    score: 58,
    benchmark: 65,
    tendencia: "piora",
    categoria: "critica",
  },
  {
    id: "d7",
    nome: "Comunicação e Retorno sobre Erros",
    nomeAbrev: "Comunicação Erros",
    score: 72,
    benchmark: 68,
    tendencia: "melhora",
    categoria: "forte",
  },
  {
    id: "d8",
    nome: "Abertura da Comunicação",
    nomeAbrev: "Abertura Comunic.",
    score: 67,
    benchmark: 70,
    tendencia: "estavel",
    categoria: "oportunidade",
  },
  {
    id: "d9",
    nome: "Staffing",
    nomeAbrev: "Staffing",
    score: 54,
    benchmark: 60,
    tendencia: "piora",
    categoria: "critica",
  },
];

const mockEvolucao: EvolucaoItem[] = [
  { pesquisa: "Jun/24", score: 68, meta: 75 },
  { pesquisa: "Dez/24", score: 70, meta: 75 },
  { pesquisa: "Jun/25", score: 72, meta: 75 },
  { pesquisa: "Mar/26", score: 74, meta: 75 },
];

const mockEvolucaoDimensoes: EvolucaoDimensao[] = [
  { nome: "Trabalho em Equipe",     jun24: 76, dez24: 78, jun25: 80, mar26: 82 },
  { nome: "Expect. Supervisor",     jun24: 72, dez24: 74, jun25: 77, mar26: 78 },
  { nome: "Aprendizado Org.",       jun24: 65, dez24: 67, jun25: 69, mar26: 71 },
  { nome: "Apoio da Gestão",        jun24: 71, dez24: 70, jun25: 70, mar26: 69 },
  { nome: "Percep. Segurança",      jun24: 66, dez24: 66, jun25: 65, mar26: 65 },
  { nome: "Freq. Notificações",     jun24: 63, dez24: 61, jun25: 59, mar26: 58 },
  { nome: "Comunic. Erros",         jun24: 67, dez24: 69, jun25: 71, mar26: 72 },
  { nome: "Abertura Comunic.",      jun24: 68, dez24: 68, jun25: 67, mar26: 67 },
  { nome: "Staffing",               jun24: 59, dez24: 57, jun25: 55, mar26: 54 },
];

const mockPlanos: PlanoAcao[] = [
  {
    id: 1,
    dimensao: "Frequência de Eventos Notificados",
    acao: "Implementar programa de notificação voluntária de incidentes com cultura justa e feedback sistematizado",
    responsavel: "Núcleo de Segurança do Paciente",
    prazo: "Jun/2026",
    progresso: 35,
    status: "em_andamento",
  },
  {
    id: 2,
    dimensao: "Percepção Geral de Segurança",
    acao: "Implantação de rounds de segurança semanais com liderança clínica e assistencial",
    responsavel: "Diretoria Assistencial",
    prazo: "Mai/2026",
    progresso: 60,
    status: "em_andamento",
  },
  {
    id: 3,
    dimensao: "Staffing",
    acao: "Desenvolver programa de gestão de RH com dimensionamento baseado em carga de trabalho e indicadores de segurança",
    responsavel: "Gestão de Pessoas",
    prazo: "Ago/2026",
    progresso: 15,
    status: "pendente",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoriaMeta(cat: Dimensao["categoria"]) {
  if (cat === "forte")
    return {
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
      label: "Forte",
    };
  if (cat === "oportunidade")
    return {
      cls: "bg-amber-100 text-amber-700 border-amber-200",
      label: "Oportunidade",
    };
  return {
    cls: "bg-rose-100 text-rose-700 border-rose-200",
    label: "Crítica",
  };
}

function tendenciaIcon(t: Dimensao["tendencia"]) {
  if (t === "melhora") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  if (t === "piora") return <TrendingDown className="w-4 h-4 text-rose-600" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function scoreColor(score: number, benchmark: number) {
  if (score >= benchmark) return "text-emerald-700";
  if (score >= benchmark - 8) return "text-amber-700";
  return "text-rose-700";
}

function progressColor(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function statusPlanoMeta(status: PlanoAcao["status"]) {
  if (status === "concluido")
    return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Concluído" };
  if (status === "atrasado")
    return { cls: "bg-rose-100 text-rose-700 border-rose-200", label: "Atrasado" };
  if (status === "em_andamento")
    return { cls: "bg-sky-100 text-sky-700 border-sky-200", label: "Em andamento" };
  return { cls: "bg-slate-100 text-slate-600 border-slate-200", label: "Pendente" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  icon,
  sub,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="border border-border/60">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color === "text-purple-600" ? "bg-purple-500/10" : color === "text-emerald-700" ? "bg-emerald-500/10" : color === "text-sky-600" ? "bg-sky-500/10" : "bg-amber-500/10")}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CulturaSeguranca() {
  const { isAdmin } = useTenant();
  const [activeTab, setActiveTab] = useState("resultado");

  // Mock data only visible for admin
  const displayDimensoes = isAdmin ? mockDimensoes : [];
  const displayEvolucao = isAdmin ? mockEvolucao : [];
  const displayEvolucaoDim = isAdmin ? mockEvolucaoDimensoes : [];
  const displayPlanos = isAdmin ? mockPlanos : [];

  // Computed
  const scoreGeral = isAdmin ? 74 : null;
  const participacao = isAdmin ? 68 : null;
  const dimensoesFortes = isAdmin ? displayDimensoes.filter((d) => d.categoria === "forte").length : null;
  const totalDimensoes = mockDimensoes.length;
  const ultimaPesquisa = isAdmin ? "Mar/2026" : null;

  // Radar data
  const radarData = displayDimensoes.map((d) => ({
    dimensao: d.nomeAbrev,
    score: d.score,
    benchmark: d.benchmark,
  }));

  // Ordered for "Por Dimensão" tab: críticas → oportunidades → fortes
  const dimensoesOrdenadas = [
    ...displayDimensoes.filter((d) => d.categoria === "critica"),
    ...displayDimensoes.filter((d) => d.categoria === "oportunidade"),
    ...displayDimensoes.filter((d) => d.categoria === "forte"),
  ];

  // Empty state for non-admin
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cultura de Segurança</h1>
            <p className="text-sm text-muted-foreground">
              Avaliação HSOPSC — maturidade da cultura de segurança do paciente
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Pesquisa de Cultura de Segurança</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            Realize a pesquisa de cultura de segurança para visualizar os resultados.
          </p>
          <Button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white">
            Iniciar Pesquisa HSOPSC
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cultura de Segurança</h1>
          <p className="text-sm text-muted-foreground">
            Avaliação HSOPSC — maturidade da cultura de segurança do paciente
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
            ONA Nível 3
          </Badge>
          <Badge variant="outline" className="text-xs border-sky-200 text-sky-700 bg-sky-50">
            Joint Commission
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Score Geral Cultura"
          value={scoreGeral !== null ? `${scoreGeral}%` : "—"}
          icon={<ShieldCheck className="w-4 h-4 text-purple-600" />}
          sub="Meta: 80%"
          color="text-purple-600"
        />
        <KpiCard
          title="Participação na Pesquisa"
          value={participacao !== null ? `${participacao}%` : "—"}
          icon={<Users className="w-4 h-4 text-sky-600" />}
          sub="Meta: 75%"
          color="text-sky-600"
        />
        <KpiCard
          title="Dimensões Fortes"
          value={
            dimensoesFortes !== null ? `${dimensoesFortes} de ${totalDimensoes}` : "—"
          }
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          sub="Score ≥ benchmark"
          color="text-emerald-700"
        />
        <KpiCard
          title="Última Pesquisa"
          value={ultimaPesquisa ?? "—"}
          icon={<Calendar className="w-4 h-4 text-amber-600" />}
          sub="Periodicidade: semestral"
          color="text-amber-600"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="resultado">Resultado Geral</TabsTrigger>
          <TabsTrigger value="dimensoes">Por Dimensão</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="planos">Planos de Ação</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Resultado Geral ─────────────────────────────────────────── */}
        <TabsContent value="resultado" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RadarChart */}
            <Card className="lg:col-span-2 border border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Radar das 9 Dimensões HSOPSC
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Score institucional vs. benchmark nacional
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="dimensao"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Radar
                      name="Score Institucional"
                      dataKey="score"
                      stroke="#7c3aed"
                      fill="#7c3aed"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Benchmark Nacional"
                      dataKey="benchmark"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.10}
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="flex flex-col gap-4">
              {/* Fortes */}
              <Card className="border border-emerald-200 bg-emerald-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Dimensões Fortes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-1">
                  {displayDimensoes
                    .filter((d) => d.categoria === "forte")
                    .map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-medium truncate max-w-[70%]">{d.nomeAbrev}</span>
                        <span className="font-bold text-emerald-700">{d.score}%</span>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Oportunidades */}
              <Card className="border border-amber-200 bg-amber-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-1">
                  {displayDimensoes
                    .filter((d) => d.categoria === "oportunidade")
                    .map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-medium truncate max-w-[70%]">{d.nomeAbrev}</span>
                        <span className="font-bold text-amber-700">{d.score}%</span>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Críticas */}
              <Card className="border border-rose-200 bg-rose-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-rose-700">
                    <XCircle className="w-4 h-4" />
                    Críticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-1">
                  {displayDimensoes
                    .filter((d) => d.categoria === "critica")
                    .map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs">
                        <span className="text-rose-800 font-medium truncate max-w-[70%]">{d.nomeAbrev}</span>
                        <span className="font-bold text-rose-700">{d.score}%</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: Por Dimensão ───────────────────────────────────────────── */}
        <TabsContent value="dimensoes" className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Ordenado por prioridade: dimensões críticas, oportunidades e fortes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dimensoesOrdenadas.map((d) => {
              const cat = categoriaMeta(d.categoria);
              return (
                <Card
                  key={d.id}
                  className={cn(
                    "border",
                    d.categoria === "critica"
                      ? "border-rose-200"
                      : d.categoria === "oportunidade"
                      ? "border-amber-200"
                      : "border-emerald-200"
                  )}
                >
                  <CardContent className="pt-5 pb-5 space-y-3">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug flex-1">{d.nome}</p>
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", cat.cls)}
                      >
                        {cat.label}
                      </Badge>
                    </div>

                    {/* Score */}
                    <div className="flex items-end gap-2">
                      <span className={cn("text-3xl font-bold", scoreColor(d.score, d.benchmark))}>
                        {d.score}%
                      </span>
                      <div className="flex items-center gap-1 mb-1">
                        {tendenciaIcon(d.tendencia)}
                        <span className="text-xs text-muted-foreground capitalize">{d.tendencia}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", progressColor(d.score))}
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Benchmark */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Benchmark nacional</span>
                      <span
                        className={cn(
                          "font-semibold",
                          d.score >= d.benchmark ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {d.score >= d.benchmark ? "+" : ""}{d.score - d.benchmark}pp vs. {d.benchmark}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── TAB 3: Evolução ───────────────────────────────────────────────── */}
        <TabsContent value="evolucao" className="space-y-6">
          {/* LineChart */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Evolução do Score Geral</CardTitle>
              <p className="text-xs text-muted-foreground">
                Score geral da cultura de segurança ao longo das pesquisas semestrais
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={displayEvolucao} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="pesquisa" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    domain={[60, 85]}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`]}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine y={75} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: "Meta 75%", fill: "#7c3aed", fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score Geral"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ fill: "#7c3aed", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Comparison table */}
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparativo por Dimensão — Histórico de Pesquisas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-2 pr-4 font-semibold text-muted-foreground text-xs">Dimensão</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground text-xs">Jun/24</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground text-xs">Dez/24</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground text-xs">Jun/25</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground text-xs">Mar/26</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground text-xs">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayEvolucaoDim.map((row, i) => {
                      const variacao = row.mar26 - row.jun24;
                      return (
                        <tr
                          key={i}
                          className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 pr-4 font-medium text-xs">{row.nome}</td>
                          <td className="text-center py-2 px-3 text-xs text-muted-foreground">{row.jun24}%</td>
                          <td className="text-center py-2 px-3 text-xs text-muted-foreground">{row.dez24}%</td>
                          <td className="text-center py-2 px-3 text-xs text-muted-foreground">{row.jun25}%</td>
                          <td className={cn("text-center py-2 px-3 text-xs font-semibold", scoreColor(row.mar26, row.jun24))}>
                            {row.mar26}%
                          </td>
                          <td className="text-center py-2 px-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 text-xs font-semibold",
                                variacao > 0 ? "text-emerald-600" : variacao < 0 ? "text-rose-600" : "text-slate-500"
                              )}
                            >
                              {variacao > 0 ? <TrendingUp className="w-3 h-3" /> : variacao < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                              {variacao > 0 ? "+" : ""}{variacao}pp
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Planos de Ação ─────────────────────────────────────────── */}
        <TabsContent value="planos" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Planos derivados das dimensões críticas e de oportunidade
            </p>
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              Novo Plano
            </Button>
          </div>

          <div className="space-y-4">
            {displayPlanos.map((plano) => {
              const st = statusPlanoMeta(plano.status);
              return (
                <Card key={plano.id} className="border border-border/60 hover:shadow-sm transition-shadow">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col gap-3">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
                              {plano.dimensao}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", st.cls)}>
                              {st.label}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold leading-snug">{plano.acao}</p>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {plano.responsavel}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Prazo: {plano.prazo}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          {plano.progresso}% concluído
                        </span>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progresso</span>
                          <span className="font-medium">{plano.progresso}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              plano.progresso >= 70
                                ? "bg-emerald-500"
                                : plano.progresso >= 40
                                ? "bg-amber-500"
                                : "bg-sky-500"
                            )}
                            style={{ width: `${plano.progresso}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {displayPlanos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum plano de ação cadastrado.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
