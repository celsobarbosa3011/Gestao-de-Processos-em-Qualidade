import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { printReport } from "@/lib/print-pdf";
import { getDiagnosticCycles } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
  Building2,
  Plus,
  FileText,
  Download,
  ArrowLeft,
  ArrowRight,
  Filter,
  TrendingUp,
  Award,
  Eye,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type CycleStatus = "Rascunho" | "Em Andamento" | "Concluído";
type AdherenceStatus = "Aderente" | "Parcialmente Aderente" | "Não Aderente" | "Não Aplicável" | null;
type UnitStatus = "Apto" | "Atenção" | "Crítico";
type ONALevel = "N1" | "N2" | "N3";

interface DiagnosticCycle {
  id: number;
  name: string;
  dateRange: string;
  unit: string;
  status: CycleStatus;
  progress: number;
  total: number;
  adherent: number;
  partial: number;
  nonAdherent: number;
}

interface Chapter {
  id: number;
  title: string;
  total: number;
  done: number;
}

interface Requirement {
  id: string;
  code: string;
  description: string;
  level: ONALevel;
  chapter: number;
}

interface RequirementAnswer {
  [requirementId: string]: {
    status: AdherenceStatus;
    comment: string;
  };
}

interface UnitScore {
  id: number;
  name: string;
  score: number;
  n1: number;
  n2: number;
  n3: number;
  status: UnitStatus;
}

interface CycleComparisonEntry {
  unit: string;
  "Ciclo 2023": number;
  "Ciclo 2024": number;
  "Ciclo 2025": number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockCycles: DiagnosticCycle[] = [
  {
    id: 1,
    name: "Ciclo de Diagnóstico 2025 — Acreditação ONA N2",
    dateRange: "01/01/2025 – 31/03/2025",
    unit: "Hospital Central",
    status: "Em Andamento",
    progress: 68,
    total: 66,
    adherent: 28,
    partial: 17,
    nonAdherent: 7,
  },
  {
    id: 2,
    name: "Ciclo de Diagnóstico 2024 — Revisão Anual",
    dateRange: "01/02/2024 – 30/04/2024",
    unit: "UPA Norte",
    status: "Concluído",
    progress: 100,
    total: 66,
    adherent: 44,
    partial: 14,
    nonAdherent: 8,
  },
  {
    id: 3,
    name: "Ciclo Piloto 2023 — Diagnóstico Inicial",
    dateRange: "15/06/2023 – 15/09/2023",
    unit: "Clínica Sul",
    status: "Concluído",
    progress: 100,
    total: 66,
    adherent: 32,
    partial: 20,
    nonAdherent: 14,
  },
];

const mockChapters: Chapter[] = [
  { id: 1, title: "Liderança e Governança", total: 12, done: 9 },
  { id: 2, title: "Gestão de Pessoas", total: 8, done: 5 },
  { id: 3, title: "Atenção ao Paciente", total: 15, done: 12 },
  { id: 4, title: "Diagnóstico e Terapêutica", total: 10, done: 6 },
  { id: 5, title: "Segurança do Paciente", total: 12, done: 8 },
  { id: 6, title: "Gestão de Risco", total: 9, done: 4 },
];

const mockRequirements: Requirement[] = [
  {
    id: "req-1-1",
    code: "1.1.1",
    description:
      "A liderança da organização define e comunica formalmente a missão, a visão e os valores institucionais, garantindo que sejam compreendidos e praticados por todos os colaboradores.",
    level: "N1",
    chapter: 1,
  },
  {
    id: "req-1-2",
    code: "1.2.1",
    description:
      "Existe um modelo de governança institucional com papéis, responsabilidades e fluxos de decisão claramente definidos e documentados, com revisão periódica.",
    level: "N1",
    chapter: 1,
  },
  {
    id: "req-1-3",
    code: "1.3.2",
    description:
      "O planejamento estratégico institucional é elaborado com participação multiprofissional, possui metas mensuráveis e é monitorado por meio de indicadores de desempenho.",
    level: "N2",
    chapter: 1,
  },
  {
    id: "req-1-4",
    code: "1.4.1",
    description:
      "A alta liderança realiza rodadas de visita estratégica às áreas assistenciais e administrativas, com registro e encaminhamento formal das não conformidades identificadas.",
    level: "N2",
    chapter: 1,
  },
  {
    id: "req-1-5",
    code: "1.5.3",
    description:
      "Existe um Comitê de Qualidade ativo com reuniões periódicas documentadas, integrado aos demais comitês institucionais e com participação da liderança executiva.",
    level: "N3",
    chapter: 1,
  },
  {
    id: "req-2-1",
    code: "2.1.1",
    description:
      "A organização possui política de dimensionamento de pessoal baseada em critérios técnicos e assistenciais, revisada anualmente conforme demanda e complexidade dos serviços.",
    level: "N1",
    chapter: 2,
  },
  {
    id: "req-2-2",
    code: "2.2.3",
    description:
      "Todos os colaboradores passam por processo formal de integração institucional com conteúdo padronizado, incluindo biossegurança, segurança do paciente e direitos do paciente.",
    level: "N1",
    chapter: 2,
  },
  {
    id: "req-3-1",
    code: "3.1.2",
    description:
      "O processo de acolhimento e classificação de risco é realizado por profissional habilitado, com uso de protocolo validado (ex.: Manchester ou equivalente) e registro em prontuário.",
    level: "N2",
    chapter: 3,
  },
];

const mockUnitScores: UnitScore[] = [
  { id: 1, name: "Hospital Central", score: 82, n1: 94, n2: 78, n3: 61, status: "Apto" },
  { id: 2, name: "UPA Norte", score: 74, n1: 88, n2: 70, n3: 52, status: "Atenção" },
  { id: 3, name: "Clínica Sul", score: 58, n1: 72, n2: 53, n3: 31, status: "Crítico" },
  { id: 4, name: "Centro Obstétrico", score: 79, n1: 91, n2: 74, n3: 58, status: "Apto" },
  { id: 5, name: "Pronto-Socorro", score: 65, n1: 80, n2: 60, n3: 40, status: "Atenção" },
  { id: 6, name: "UTI Adulto", score: 88, n1: 97, n2: 85, n3: 72, status: "Apto" },
];

const mockComparisonData: CycleComparisonEntry[] = [
  { unit: "H. Central", "Ciclo 2023": 65, "Ciclo 2024": 74, "Ciclo 2025": 82 },
  { unit: "UPA Norte", "Ciclo 2023": 58, "Ciclo 2024": 68, "Ciclo 2025": 74 },
  { unit: "Clínica Sul", "Ciclo 2023": 42, "Ciclo 2024": 51, "Ciclo 2025": 58 },
  { unit: "C. Obstétrico", "Ciclo 2023": 60, "Ciclo 2024": 71, "Ciclo 2025": 79 },
  { unit: "PS", "Ciclo 2023": 48, "Ciclo 2024": 57, "Ciclo 2025": 65 },
  { unit: "UTI Adulto", "Ciclo 2023": 72, "Ciclo 2024": 80, "Ciclo 2025": 88 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chapterPercent(c: Chapter) {
  return Math.round((c.done / c.total) * 100);
}

function cycleStatusMeta(status: CycleStatus) {
  switch (status) {
    case "Concluído":
      return { variant: "default" as const, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "Em Andamento":
      return { variant: "default" as const, cls: "bg-sky-100 text-sky-700 border-sky-200" };
    default:
      return { variant: "default" as const, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

function unitStatusMeta(status: UnitStatus) {
  switch (status) {
    case "Apto":
      return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    case "Atenção":
      return { cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    case "Crítico":
      return { cls: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" };
  }
}

function levelMeta(level: ONALevel) {
  switch (level) {
    case "N1":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "N2":
      return "bg-violet-100 text-violet-700 border-violet-200";
    case "N3":
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function adherenceIcon(status: AdherenceStatus) {
  switch (status) {
    case "Aderente":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case "Parcialmente Aderente":
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case "Não Aderente":
      return <XCircle className="w-4 h-4 text-rose-500" />;
    case "Não Aplicável":
      return <MinusCircle className="w-4 h-4 text-slate-400" />;
    default:
      return null;
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 65) return "text-amber-600";
  return "text-rose-600";
}

function progressBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-rose-500";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const AdherenceRadio = ({
  value,
  selected,
  onChange,
}: {
  value: AdherenceStatus;
  selected: AdherenceStatus;
  onChange: (v: AdherenceStatus) => void;
}) => {
  const configs: { value: AdherenceStatus; label: string; activeClass: string; ringClass: string }[] = [
    {
      value: "Aderente",
      label: "Aderente",
      activeClass: "bg-emerald-500 border-emerald-500 text-white",
      ringClass: "ring-emerald-300",
    },
    {
      value: "Parcialmente Aderente",
      label: "Parcial",
      activeClass: "bg-amber-500 border-amber-500 text-white",
      ringClass: "ring-amber-300",
    },
    {
      value: "Não Aderente",
      label: "Não Aderente",
      activeClass: "bg-rose-500 border-rose-500 text-white",
      ringClass: "ring-rose-300",
    },
    {
      value: "Não Aplicável",
      label: "N/A",
      activeClass: "bg-slate-400 border-slate-400 text-white",
      ringClass: "ring-slate-300",
    },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {configs.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 focus:outline-none focus:ring-2",
            selected === c.value
              ? cn(c.activeClass, "ring-2", c.ringClass)
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Diagnostico() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("ciclos");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [answers, setAnswers] = useState<RequirementAnswer>({});
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [showNovoForm, setShowNovoForm] = useState(false);

  const { data: dbCycles } = useQuery({
    queryKey: ["diagnostic-cycles"],
    queryFn: getDiagnosticCycles,
    staleTime: 30_000,
  });

  const statusMap: Record<string, CycleStatus> = {
    draft: "Rascunho", in_progress: "Em Andamento", completed: "Concluído",
  };

  const displayCycles: DiagnosticCycle[] = (dbCycles && dbCycles.length > 0)
    ? dbCycles.map(c => ({
        id: c.id,
        name: c.name,
        dateRange: c.startDate
          ? `${new Date(c.startDate).toLocaleDateString("pt-BR")} — ${c.endDate ? new Date(c.endDate).toLocaleDateString("pt-BR") : "Em aberto"}`
          : "Data não definida",
        unit: c.unitId ? `Unidade ${c.unitId}` : "Todas as unidades",
        status: statusMap[c.status] ?? "Rascunho",
        progress: 0, total: 0, adherent: 0, partial: 0, nonAdherent: 0,
      }))
    : mockCycles;

  const visibleRequirements = mockRequirements.filter(
    (r) => r.chapter === selectedChapter
  );

  function updateAnswer(
    reqId: string,
    field: "status" | "comment",
    value: AdherenceStatus | string
  ) {
    setAnswers((prev) => ({
      ...prev,
      [reqId]: {
        status: prev[reqId]?.status ?? null,
        comment: prev[reqId]?.comment ?? "",
        [field]: value,
      },
    }));
  }

  const totalAnswered = Object.values(answers).filter((a) => a.status !== null).length;
  const totalReqs = mockRequirements.length;
  const overallProgress = Math.round((totalAnswered / totalReqs) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span
              className="hover:text-slate-700 cursor-pointer"
              onClick={() => navigate("/")}
            >
              Início
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Diagnóstico Institucional</span>
            <span className="ml-2">
              <Badge className="bg-sky-100 text-sky-700 border border-sky-200 text-xs font-medium px-2 py-0.5">
                Módulo 2
              </Badge>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-sky-500" />
                Diagnóstico Institucional
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Avaliação estruturada dos requisitos ONA · Gestão de ciclos diagnósticos e scores por unidade
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
                onClick={() => toast.info("Selecione o item na lista para ver os detalhes")}
              >
                <FileText className="w-4 h-4" />
                Ver Relatório
              </Button>
              <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2" onClick={() => setShowNovoForm(v => !v)}>
                <Plus className="w-4 h-4" />
                Novo Ciclo
              </Button>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
              <span>3 ciclos registrados</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>6 unidades avaliadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
              <span>66 requisitos ONA mapeados</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto flex-wrap">
            <TabsTrigger
              value="ciclos"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Ciclos de Diagnóstico
            </TabsTrigger>
            <TabsTrigger
              value="formulario"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Formulário de Avaliação
            </TabsTrigger>
            <TabsTrigger
              value="score"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Score por Unidade
            </TabsTrigger>
            <TabsTrigger
              value="comparacao"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Comparação entre Ciclos
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Ciclos de Diagnóstico
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="ciclos" className="mt-6 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  placeholder="Buscar ciclo..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 text-slate-700"
                />
              </div>
              <Button
                variant="outline"
                className="border-slate-200 text-slate-600 gap-2 text-sm"
                onClick={() => toast.info("Filtros de ciclo em breve disponíveis")}
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
            </div>

            {displayCycles.map((cycle) => {
              const meta = cycleStatusMeta(cycle.status);
              return (
                <Card
                  key={cycle.id}
                  className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Left */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-slate-800 text-base truncate">
                            {cycle.name}
                          </h3>
                          <Badge
                            className={cn(
                              "text-xs font-medium border px-2 py-0.5",
                              meta.cls
                            )}
                          >
                            {cycle.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {cycle.unit}
                          </span>
                          <span>·</span>
                          <span>{cycle.dateRange}</span>
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-slate-500 font-medium">
                              Progresso da avaliação
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {cycle.progress}%
                            </span>
                          </div>
                          <Progress value={cycle.progress} className="h-2 bg-slate-100" />
                        </div>

                        {/* Counts */}
                        <div className="flex gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            Total: <span className="font-semibold">{cycle.total}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Aderentes: <span className="font-semibold text-emerald-700">{cycle.adherent}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            Parciais: <span className="font-semibold text-amber-700">{cycle.partial}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Não aderentes: <span className="font-semibold text-rose-700">{cycle.nonAdherent}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {cycle.status !== "Concluído" && (
                          <Button
                            className="bg-sky-600 hover:bg-sky-700 text-white gap-2 text-sm"
                            onClick={() => setActiveTab("formulario")}
                          >
                            <ArrowRight className="w-4 h-4" />
                            Continuar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="border-slate-200 text-slate-600 gap-2 text-sm"
                          onClick={() => toast.info("Abrindo relatório do ciclo de diagnóstico...")}
                        >
                          <Eye className="w-4 h-4" />
                          Ver Relatório
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Formulário de Avaliação
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="formulario" className="mt-6">
            {/* Overall progress bar */}
            <Card className="bg-white border border-slate-200 shadow-sm mb-4">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    Progresso geral da avaliação
                  </span>
                  <span className="text-sm font-bold text-sky-700">
                    {totalAnswered}/{totalReqs} requisitos · {overallProgress}%
                  </span>
                </div>
                <Progress value={overallProgress} className="h-2.5 bg-slate-100" />
              </CardContent>
            </Card>

            <div className="flex gap-5">
              {/* ── Sidebar: Chapters ── */}
              <div className="w-64 flex-shrink-0 space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Capítulos
                </p>
                {mockChapters.map((ch) => {
                  const pct = chapterPercent(ch);
                  const isActive = selectedChapter === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapter(ch.id)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150 border",
                        isActive
                          ? "bg-sky-50 border-sky-200 shadow-sm"
                          : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isActive ? "text-sky-700" : "text-slate-600"
                          )}
                        >
                          Cap. {ch.id}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            pct >= 80
                              ? "text-emerald-600"
                              : pct >= 50
                              ? "text-amber-600"
                              : "text-rose-600"
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-snug",
                          isActive ? "text-sky-800 font-medium" : "text-slate-500"
                        )}
                      >
                        {ch.title}
                      </p>
                      <div className="mt-2">
                        <Progress
                          value={pct}
                          className={cn("h-1", isActive ? "bg-sky-100" : "bg-slate-100")}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── Main: Requirements ── */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Chapter header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {mockChapters.find((c) => c.id === selectedChapter)?.title}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {mockChapters.find((c) => c.id === selectedChapter)?.total} requisitos neste capítulo
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-slate-600 gap-1"
                      disabled={selectedChapter === 1}
                      onClick={() => setSelectedChapter((p) => Math.max(1, p - 1))}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-slate-600 gap-1"
                      disabled={selectedChapter === mockChapters.length}
                      onClick={() =>
                        setSelectedChapter((p) => Math.min(mockChapters.length, p + 1))
                      }
                    >
                      Próximo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {visibleRequirements.length === 0 && (
                  <Card className="bg-white border border-slate-200">
                    <CardContent className="py-12 text-center text-slate-400 text-sm">
                      Nenhum requisito disponível para este capítulo no modo demo.
                    </CardContent>
                  </Card>
                )}

                {visibleRequirements.map((req, idx) => {
                  const ans = answers[req.id];
                  const answered = ans?.status != null;
                  return (
                    <Card
                      key={req.id}
                      className={cn(
                        "bg-white border shadow-sm transition-all",
                        answered ? "border-slate-200" : "border-slate-200"
                      )}
                    >
                      <CardContent className="p-5">
                        {/* Header row */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                              {req.code}
                            </span>
                            <Badge
                              className={cn(
                                "text-xs font-semibold border px-2 py-0.5",
                                levelMeta(req.level)
                              )}
                            >
                              {req.level}
                            </Badge>
                          </div>
                          <div className="flex-1" />
                          {answered && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              {adherenceIcon(ans.status)}
                              <span>{ans.status}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-700 leading-relaxed mb-4">
                          {req.description}
                        </p>

                        {/* Status selector */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Classificação de aderência
                          </p>
                          <AdherenceRadio
                            value={ans?.status ?? null}
                            selected={ans?.status ?? null}
                            onChange={(v) => updateAnswer(req.id, "status", v!)}
                          />
                        </div>

                        {/* Comment */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                            Comentário técnico / Evidências
                          </p>
                          <Textarea
                            placeholder="Descreva as evidências encontradas, observações ou justificativas para a classificação..."
                            className="text-sm resize-none h-20 border-slate-200 focus:ring-sky-300 bg-slate-50"
                            value={ans?.comment ?? ""}
                            onChange={(e) =>
                              updateAnswer(req.id, "comment", e.target.value)
                            }
                          />
                        </div>

                        {/* Attachment */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-200 text-slate-500 gap-2 text-xs"
                          onClick={() => toast.info("Selecione um arquivo para anexar como evidência")}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Anexar evidência
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Bottom actions */}
                <div className="flex justify-end gap-3 pt-2 pb-8">
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-600 gap-2"
                    onClick={() => toast.success("Progresso salvo com sucesso!")}
                  >
                    <FileText className="w-4 h-4" />
                    Salvar progresso
                  </Button>
                  <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2" onClick={() => { toast.success("Relatório de diagnóstico gerado!"); printReport({ title: "Relatório de Diagnóstico Institucional", subtitle: "Avaliação de maturidade organizacional — ONA 2026", module: "Diagnóstico Institucional", kpis: [{ label: "Score ONA", value: "76%", color: "#0ea5e9" }, { label: "Requisitos OK", value: "183", color: "#10b981" }, { label: "Em ajuste", value: "42", color: "#f59e0b" }, { label: "Críticos", value: "8", color: "#dc2626" }], columns: [{ label: "Setor", key: "setor" }, { label: "Score", key: "score" }, { label: "Conformes", key: "conf" }, { label: "Não Conformes", key: "nc" }, { label: "Status", key: "status" }], rows: [{ setor: "Gestão Organizacional", score: "82%", conf: "37", nc: "8", status: "✓ Acima da meta" }, { setor: "Atenção ao Paciente", score: "74%", conf: "50", nc: "18", status: "⚠ Abaixo da meta" }, { setor: "Diagnóstico e Terapêutica", score: "68%", conf: "35", nc: "17", status: "⚠ Abaixo da meta" }, { setor: "Apoio Técnico e Logístico", score: "79%", conf: "61", nc: "16", status: "✓ Dentro da meta" }] }); }}>
                    <Award className="w-4 h-4" />
                    Gerar relatório
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — Score por Unidade
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="score" className="mt-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Unidades Aptas</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {mockUnitScores.filter((u) => u.status === "Apto").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Em Atenção</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {mockUnitScores.filter((u) => u.status === "Atenção").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status Crítico</p>
                    <p className="text-2xl font-bold text-rose-700">
                      {mockUnitScores.filter((u) => u.status === "Crítico").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockUnitScores.map((unit) => {
                const statusMeta = unitStatusMeta(unit.status);
                const isSelected = selectedUnit === unit.id;
                return (
                  <Card
                    key={unit.id}
                    onClick={() =>
                      setSelectedUnit(isSelected ? null : unit.id)
                    }
                    className={cn(
                      "bg-white border shadow-sm cursor-pointer hover:shadow-md transition-all",
                      isSelected
                        ? "border-sky-400 ring-2 ring-sky-200"
                        : "border-slate-200"
                    )}
                  >
                    <CardHeader className="pb-2 pt-5 px-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-sky-600" />
                          </div>
                          <CardTitle className="text-sm font-semibold text-slate-700 leading-tight">
                            {unit.name}
                          </CardTitle>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs font-medium border px-2 py-0.5 flex items-center gap-1",
                            statusMeta.cls
                          )}
                        >
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full", statusMeta.dot)}
                          />
                          {unit.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      {/* Big score */}
                      <div className="flex items-end gap-1 mb-4">
                        <span
                          className={cn(
                            "text-5xl font-extrabold leading-none",
                            scoreColor(unit.score)
                          )}
                        >
                          {unit.score}
                        </span>
                        <span className="text-lg font-semibold text-slate-400 mb-1">%</span>
                        <span className="ml-auto text-xs text-slate-400">Score geral</span>
                      </div>

                      {/* ONA level bars */}
                      <div className="space-y-2.5">
                        {(
                          [
                            { key: "n1", label: "N1 – Acreditado", val: unit.n1, color: "bg-sky-500" },
                            { key: "n2", label: "N2 – Pleno", val: unit.n2, color: "bg-violet-500" },
                            { key: "n3", label: "N3 – Excelência", val: unit.n3, color: "bg-amber-500" },
                          ] as const
                        ).map((bar) => (
                          <div key={bar.key}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-slate-500">{bar.label}</span>
                              <span className="text-xs font-semibold text-slate-700">
                                {bar.val}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", bar.color)}
                                style={{ width: `${bar.val}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {isSelected && (
                        <Button
                          size="sm"
                          className="mt-4 w-full bg-sky-600 hover:bg-sky-700 text-white gap-2 text-xs"
                          onClick={() => toast.info("Abrindo detalhamento completo da unidade...")}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver detalhamento completo
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4 — Comparação entre Ciclos
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="comparacao" className="mt-6">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-sky-500" />
                      Evolução do Score por Unidade
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Comparação entre os ciclos de diagnóstico 2023, 2024 e 2025
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 gap-2 text-xs"
                    onClick={() => printReport({ title: "Comparação de Ciclos Diagnósticos", subtitle: "Evolução histórica 2023–2026", module: "Diagnóstico / Comparação", columns: [{ label: "Ciclo", key: "ciclo" }, { label: "Score ONA", key: "score" }, { label: "Conformes", key: "conf" }, { label: "Não Conformes", key: "nc" }, { label: "Variação", key: "var" }], rows: [{ ciclo: "2023", score: "61%", conf: "142", nc: "91", var: "—" }, { ciclo: "2024", score: "68%", conf: "163", nc: "70", var: "+7 p.p." }, { ciclo: "2025", score: "72%", conf: "175", nc: "58", var: "+4 p.p." }, { ciclo: "2026", score: "76%", conf: "183", nc: "50", var: "+4 p.p." }] })}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pt-5 pb-6">
                {/* Legend */}
                <div className="flex gap-5 mb-4 flex-wrap">
                  {[
                    { label: "Ciclo 2023", color: "bg-slate-400" },
                    { label: "Ciclo 2024", color: "bg-sky-400" },
                    { label: "Ciclo 2025", color: "bg-sky-600" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={cn("w-3 h-3 rounded", l.color)} />
                      {l.label}
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={340}>
                  <BarChart
                    data={mockComparisonData}
                    margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                    barCategoryGap="28%"
                    barGap={3}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="unit"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / .07)",
                      }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                    <Bar
                      dataKey="Ciclo 2023"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="Ciclo 2024"
                      fill="#7dd3fc"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="Ciclo 2025"
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Variation table */}
                <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Unidade
                        </th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          2023
                        </th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          2024
                        </th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          2025
                        </th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Variação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mockComparisonData.map((row) => {
                        const delta = row["Ciclo 2025"] - row["Ciclo 2023"];
                        return (
                          <tr key={row.unit} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              {row.unit}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-500">
                              {row["Ciclo 2023"]}%
                            </td>
                            <td className="px-4 py-3 text-center text-slate-500">
                              {row["Ciclo 2024"]}%
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-sky-700">
                              {row["Ciclo 2025"]}%
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={cn(
                                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                                  delta > 0
                                    ? "bg-emerald-100 text-emerald-700"
                                    : delta < 0
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-500"
                                )}
                              >
                                {delta > 0 ? "+" : ""}
                                {delta}pp
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
        </Tabs>
      </div>
    </div>
  );
}
