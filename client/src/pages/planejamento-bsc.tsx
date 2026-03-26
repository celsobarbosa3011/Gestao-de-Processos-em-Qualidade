import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBscObjectives, createBscObjective } from "@/lib/api";
import { printReport } from "@/lib/print-pdf";
import {
  Target, ChevronRight, TrendingUp, Users, DollarSign,
  Lightbulb, CheckCircle2, AlertCircle, Clock, Download,
  BarChart3, Building2, Star, Plus, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Perspective = "Financeira" | "Clientes/Pacientes" | "Processos Internos" | "Aprendizado & Crescimento";
type ObjectiveStatus = "No prazo" | "Em atraso" | "Concluído" | "Em risco";

interface StrategicObjective {
  id: number;
  perspective: Perspective;
  code: string;
  objective: string;
  indicator: string;
  target: string;
  current: string;
  progress: number;
  status: ObjectiveStatus;
  responsible: string;
  deadline: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const objectives: StrategicObjective[] = [
  // Financeira
  {
    id: 1, perspective: "Financeira", code: "OBJ-F01",
    objective: "Atingir receita líquida de R$ 45M em 2026",
    indicator: "Receita líquida anual",
    target: "R$ 45M", current: "R$ 38,2M (8 meses)",
    progress: 85, status: "No prazo",
    responsible: "CFO — Dir. Financeiro", deadline: "2026-12-31",
  },
  {
    id: 2, perspective: "Financeira", code: "OBJ-F02",
    objective: "Reduzir glosas para menos de 3% do faturamento",
    indicator: "Taxa de glosa (%)",
    target: "≤ 3,0%", current: "4,2%",
    progress: 58, status: "Em risco",
    responsible: "Faturamento", deadline: "2026-12-31",
  },
  {
    id: 3, perspective: "Financeira", code: "OBJ-F03",
    objective: "Manter EBITDA ≥ 18%",
    indicator: "Margem EBITDA",
    target: "≥ 18%", current: "16,8%",
    progress: 70, status: "Em atraso",
    responsible: "CFO", deadline: "2026-12-31",
  },
  // Clientes/Pacientes
  {
    id: 4, perspective: "Clientes/Pacientes", code: "OBJ-C01",
    objective: "Atingir NPS ≥ 72 pontos",
    indicator: "Net Promoter Score",
    target: "≥ 72", current: "68",
    progress: 80, status: "No prazo",
    responsible: "Dir. Qualidade", deadline: "2026-12-31",
  },
  {
    id: 5, perspective: "Clientes/Pacientes", code: "OBJ-C02",
    objective: "Obter Acreditação ONA N2 até abril/2026",
    indicator: "Certificado ONA",
    target: "N2 Acreditado", current: "Em preparação",
    progress: 78, status: "No prazo",
    responsible: "Dir. Qualidade", deadline: "2026-04-30",
  },
  {
    id: 6, perspective: "Clientes/Pacientes", code: "OBJ-C03",
    objective: "Reduzir tempo médio de espera na triagem para < 20 min",
    indicator: "Tempo médio de triagem (min)",
    target: "< 20 min", current: "27 min",
    progress: 45, status: "Em atraso",
    responsible: "Coord. PS", deadline: "2026-06-30",
  },
  // Processos Internos
  {
    id: 7, perspective: "Processos Internos", code: "OBJ-P01",
    objective: "Atingir aderência ≥ 85% aos protocolos clínicos CORE",
    indicator: "Aderência protocolos CORE (%)",
    target: "≥ 85%", current: "82%",
    progress: 88, status: "No prazo",
    responsible: "Dir. Qualidade", deadline: "2026-12-31",
  },
  {
    id: 8, perspective: "Processos Internos", code: "OBJ-P02",
    objective: "Reduzir taxa de IRAS — UTI para < 2,0/1.000 CVC-dia",
    indicator: "Densidade de IPCS — UTI",
    target: "< 2,0", current: "1,8",
    progress: 90, status: "Concluído",
    responsible: "SCIH", deadline: "2026-06-30",
  },
  {
    id: 9, perspective: "Processos Internos", code: "OBJ-P03",
    objective: "Implementar gestão por processos em 100% das áreas críticas",
    indicator: "Processos mapeados (%)",
    target: "100%", current: "72%",
    progress: 72, status: "Em atraso",
    responsible: "Dir. Qualidade", deadline: "2026-09-30",
  },
  // Aprendizado & Crescimento
  {
    id: 10, perspective: "Aprendizado & Crescimento", code: "OBJ-A01",
    objective: "Atingir 100% de cobertura em treinamentos obrigatórios",
    indicator: "Cobertura de treinamentos ONA (%)",
    target: "100%", current: "83%",
    progress: 83, status: "No prazo",
    responsible: "RH + Qualidade", deadline: "2026-12-31",
  },
  {
    id: 11, perspective: "Aprendizado & Crescimento", code: "OBJ-A02",
    objective: "Atingir índice de satisfação de colaboradores ≥ 80%",
    indicator: "Pesquisa de clima (%)",
    target: "≥ 80%", current: "76%",
    progress: 76, status: "Em atraso",
    responsible: "RH", deadline: "2026-12-31",
  },
  {
    id: 12, perspective: "Aprendizado & Crescimento", code: "OBJ-A03",
    objective: "Implantar sistema de ideias de melhoria com ≥ 50 ideias/ano",
    indicator: "Ideias de melhoria registradas",
    target: "≥ 50 ideias", current: "31 ideias",
    progress: 62, status: "No prazo",
    responsible: "Dir. Qualidade", deadline: "2026-12-31",
  },
];

const perspectiveMeta: Record<Perspective, { color: string; icon: React.ReactNode; bg: string; accent: string }> = {
  "Financeira":              { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", accent: "bg-emerald-500", icon: <DollarSign className="w-5 h-5 text-emerald-600" /> },
  "Clientes/Pacientes":      { color: "text-sky-700",     bg: "bg-sky-50 border-sky-200",         accent: "bg-sky-500",     icon: <Users className="w-5 h-5 text-sky-600" /> },
  "Processos Internos":      { color: "text-violet-700",  bg: "bg-violet-50 border-violet-200",   accent: "bg-violet-500",  icon: <BarChart3 className="w-5 h-5 text-violet-600" /> },
  "Aprendizado & Crescimento":{ color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",     accent: "bg-amber-500",   icon: <Lightbulb className="w-5 h-5 text-amber-600" /> },
};

const statusMeta = (s: ObjectiveStatus) => {
  switch (s) {
    case "No prazo":   return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Concluído":  return "bg-sky-100 text-sky-700 border-sky-200";
    case "Em atraso":  return "bg-amber-100 text-amber-700 border-amber-200";
    case "Em risco":   return "bg-rose-100 text-rose-700 border-rose-200";
  }
};

const radarData = [
  { perspective: "Financeira",  score: 71 },
  { perspective: "Clientes",    score: 68 },
  { perspective: "Processos",   score: 83 },
  { perspective: "Aprendizado", score: 74 },
];

const PERSPECTIVES: Perspective[] = [
  "Financeira", "Clientes/Pacientes", "Processos Internos", "Aprendizado & Crescimento"
];

// ─── Main Component ───────────────────────────────────────────────────────────

const PERSPECTIVE_LABELS: Record<string, Perspective> = {
  financial: "Financeira",
  customers: "Clientes/Pacientes",
  processes: "Processos Internos",
  learning: "Aprendizado & Crescimento",
};

export default function PlanejamentoBSC() {
  const { isAdmin } = useTenant();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [filterPerspective, setFilterPerspective] = useState<"all" | Perspective>("all");
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoObjetivo, setNovoObjetivo] = useState("");
  const [novaPerspectiva, setNovaPerspectiva] = useState("Financeira");
  const [novaMeta, setNovaMeta] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");

  // ── DB integration ───────────────────────────────────────────────────────
  const { data: dbObjectives } = useQuery({
    queryKey: ["bsc-objectives"],
    queryFn: () => getBscObjectives(),
    staleTime: 120_000,
  });

  const createMutation = useMutation({
    mutationFn: createBscObjective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bsc-objectives"] });
      toast.success("Objetivo estratégico criado com sucesso!");
      setShowNovoForm(false);
      setNovoObjetivo(""); setNovaMeta(""); setNovoPrazo("");
    },
    onError: () => toast.error("Erro ao criar objetivo"),
  });

  // Merge DB objectives with mock enrichment
  const baseObjectives: StrategicObjective[] = (dbObjectives && dbObjectives.length > 0)
    ? dbObjectives.map((o, i) => {
        const mock = objectives[i % objectives.length];
        const statusMap: Record<string, ObjectiveStatus> = {
          "on_track": "No prazo", "at_risk": "Em risco", "delayed": "Em atraso", "completed": "Concluído",
        };
        const perspective = PERSPECTIVE_LABELS[(o as any).perspectiveCode] ?? mock.perspective;
        return {
          id: o.id,
          perspective,
          code: `OBJ-${String(o.id).padStart(3, "0")}`,
          objective: o.title,
          indicator: mock.indicator,
          target: o.target ?? mock.target,
          current: o.currentValue ?? mock.current,
          progress: o.currentValue && o.target
            ? Math.min(100, Math.round((Number(o.currentValue.replace(/[^0-9.]/g, "")) / Number(o.target.replace(/[^0-9.]/g, ""))) * 100))
            : mock.progress,
          status: statusMap[o.status ?? ""] ?? mock.status,
          responsible: o.responsible ?? mock.responsible,
          deadline: o.deadline ?? mock.deadline,
        };
      })
    : [];

  const filtered = baseObjectives.filter(
    (o) => filterPerspective === "all" || o.perspective === filterPerspective
  );

  const onPrazo = baseObjectives.filter((o) => o.status === "No prazo").length;
  const emAtraso = baseObjectives.filter((o) => o.status === "Em atraso").length;
  const emRisco = baseObjectives.filter((o) => o.status === "Em risco").length;
  const concluido = baseObjectives.filter((o) => o.status === "Concluído").length;
  const avgProgress = baseObjectives.length > 0 ? Math.round(baseObjectives.reduce((s, o) => s + o.progress, 0) / baseObjectives.length) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate("/")}>Início</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Planejamento BSC</span>
            <Badge className="ml-2 bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5">Módulo 13</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Target className="w-7 h-7 text-emerald-600" />
                Planejamento Estratégico — BSC
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Balanced Scorecard · 4 perspectivas · {objectives.length} objetivos estratégicos · Ciclo 2026
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" className="border-slate-200 text-slate-600 gap-2 text-sm" onClick={() => printReport({ title: "Planejamento Estratégico — BSC 2026", subtitle: "Balanced Scorecard · 4 perspectivas · Ciclo 2026", module: "Planejamento BSC", kpis: [{ label: "Objetivos", value: "12", color: "#0f172a" }, { label: "No Prazo", value: "8", color: "#10b981" }, { label: "Em Risco", value: "3", color: "#f59e0b" }, { label: "Atrasados", value: "1", color: "#dc2626" }], columns: [{ label: "Perspectiva", key: "persp" }, { label: "Objetivo Estratégico", key: "objetivo" }, { label: "Meta", key: "meta" }, { label: "Resultado", key: "result" }, { label: "Status", key: "status" }], rows: [{ persp: "Financeira", objetivo: "Reduzir custo médio por AIH", meta: "-8%", result: "-5.2%", status: "⚠ Em risco" }, { persp: "Clientes", objetivo: "Aumentar satisfação do paciente", meta: "≥ 90%", result: "92%", status: "✓ Meta atingida" }, { persp: "Processos", objetivo: "Reduzir tempo de espera PS", meta: "≤ 30 min", result: "38 min", status: "⚠ Em risco" }, { persp: "Aprendizado", objetivo: "Atingir 100% treinamentos ONA", meta: "100%", result: "87%", status: "⚠ Em risco" }, { persp: "Financeira", objetivo: "Ampliar faturamento SUS convênios", meta: "+12%", result: "+14%", status: "✓ Meta atingida" }] })}>
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm" onClick={() => setShowNovoForm(v => !v)}>
                <Plus className="w-4 h-4" />
                Novo Objetivo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* Novo Objetivo Form */}
        {showNovoForm && (
          <Card className="border border-emerald-200 bg-emerald-50 shadow-sm mb-6">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-emerald-800">Novo Objetivo Estratégico</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Objetivo</label>
                  <input value={novoObjetivo} onChange={e => setNovoObjetivo(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Descreva o objetivo estratégico" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Perspectiva</label>
                  <select value={novaPerspectiva} onChange={e => setNovaPerspectiva(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                    <option>Financeira</option>
                    <option>Clientes/Pacientes</option>
                    <option>Processos Internos</option>
                    <option>Aprendizado &amp; Crescimento</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Meta</label>
                  <input value={novaMeta} onChange={e => setNovaMeta(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Ex.: ≥ 80%" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Prazo</label>
                  <input type="date" value={novoPrazo} onChange={e => setNovoPrazo(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowNovoForm(false)}>Cancelar</Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={createMutation.isPending}
                  onClick={() => {
                    if (!novoObjetivo.trim()) return toast.error("Informe o objetivo");
                    createMutation.mutate({ title: novoObjetivo.trim(), target: novaMeta, deadline: novoPrazo || "2026-12-31", perspectiveId: 1 } as any);
                  }}
                >
                  {createMutation.isPending ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "No Prazo", value: onPrazo, text: "text-emerald-700", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
            { label: "Em Atraso", value: emAtraso, text: "text-amber-700", bg: "bg-amber-50", icon: <Clock className="w-5 h-5 text-amber-500" /> },
            { label: "Em Risco", value: emRisco, text: "text-rose-700", bg: "bg-rose-50", icon: <AlertCircle className="w-5 h-5 text-rose-500" /> },
            { label: "Concluídos", value: concluido, text: "text-sky-700", bg: "bg-sky-50", icon: <Star className="w-5 h-5 text-sky-500" /> },
            { label: "Avanço Médio", value: `${avgProgress}%`, text: "text-emerald-700", bg: "bg-emerald-50", icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
          ].map((k) => (
            <Card key={k.label} className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", k.bg)}>{k.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className={cn("text-xl font-bold", k.text)}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="mapa">
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto mb-5">
            <TabsTrigger value="mapa" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Mapa Estratégico
            </TabsTrigger>
            <TabsTrigger value="objetivos" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Objetivos & Indicadores
            </TabsTrigger>
            <TabsTrigger value="radar" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Painel de Controle
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Mapa Estratégico
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="mapa" className="space-y-4">
            {PERSPECTIVES.map((perspective) => {
              const meta = perspectiveMeta[perspective];
              const pObjs = baseObjectives.filter((o) => o.perspective === perspective);
              const avgPct = pObjs.length > 0 ? Math.round(pObjs.reduce((s, o) => s + o.progress, 0) / pObjs.length) : 0;
              return (
                <Card key={perspective} className={cn("border shadow-sm", meta.bg)}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {meta.icon}
                        <CardTitle className={cn("text-sm font-bold", meta.color)}>{perspective}</CardTitle>
                        <Badge className={cn("text-xs border", meta.bg, meta.color)}>{pObjs.length} objetivos</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-lg font-extrabold", meta.color)}>{avgPct}%</span>
                        <span className="text-xs text-slate-400">avanço</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mt-2">
                      <div className={cn("h-full rounded-full", meta.accent)} style={{ width: `${avgPct}%` }} />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pObjs.map((obj) => (
                        <div key={obj.id} className="bg-white rounded-lg border border-white/80 p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-mono text-slate-400">{obj.code}</span>
                            <Badge className={cn("text-xs border px-1.5 py-0.5 flex-shrink-0", statusMeta(obj.status))}>
                              {obj.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-slate-700 leading-snug mb-2">{obj.objective}</p>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">{obj.current} / {obj.target}</span>
                            <span className={cn("text-xs font-bold", meta.color)}>{obj.progress}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className={cn("h-full rounded-full", meta.accent)} style={{ width: `${obj.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Objetivos & Indicadores
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="objetivos" className="space-y-4">
            {/* Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {["all", ...PERSPECTIVES].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPerspective(p as "all" | Perspective)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    filterPerspective === p
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                  )}
                >
                  {p === "all" ? "Todos" : p}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="w-20">Código</span>
                <span>Objetivo</span>
                <span className="px-4 text-center">Atual / Meta</span>
                <span className="px-4 text-center">Status</span>
                <span className="px-4 text-center">Prazo</span>
                <span className="px-4 text-center w-20">Avanço</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map((obj) => {
                  const meta = perspectiveMeta[obj.perspective];
                  return (
                    <div key={obj.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                      <div className="w-20 flex items-center">
                        <span className="text-xs font-mono text-slate-400">{obj.code}</span>
                      </div>
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-slate-700 truncate">{obj.objective}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {meta.icon}
                          <span className={cn("text-xs", meta.color)}>{obj.perspective}</span>
                          <span className="text-xs text-slate-400">· {obj.responsible}</span>
                        </div>
                      </div>
                      <div className="px-4 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-700">{obj.current}</p>
                          <p className="text-xs text-slate-400">/{obj.target}</p>
                        </div>
                      </div>
                      <div className="px-4 flex items-center justify-center">
                        <Badge className={cn("text-xs border px-2 py-0.5", statusMeta(obj.status))}>
                          {obj.status}
                        </Badge>
                      </div>
                      <div className="px-4 flex items-center justify-center">
                        <span className="text-xs text-slate-500">
                          {new Date(obj.deadline).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}
                        </span>
                      </div>
                      <div className="px-4 flex items-center justify-center w-20">
                        <div className="w-full">
                          <div className="flex justify-between mb-0.5">
                            <span className={cn("text-xs font-bold", meta.color)}>{obj.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={cn("h-full rounded-full", meta.accent)} style={{ width: `${obj.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — Painel de Controle (Radar)
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="radar">
            {!isAdmin ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                <Target className="w-8 h-8 opacity-30" />
                <p className="text-sm">Painel de controle disponível após cadastro de objetivos estratégicos.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Radar das 4 Perspectivas BSC
                  </CardTitle>
                  <p className="text-xs text-slate-400">Score médio de avanço por perspectiva</p>
                </CardHeader>
                <CardContent className="px-4 pt-4 pb-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="perspective" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Radar name="BSC" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Score por Perspectiva
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-4 pb-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={radarData} margin={{ top: 4, right: 16, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="perspective" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`${v}%`, "Avanço"]} />
                      <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Summary by perspective */}
              {PERSPECTIVES.map((perspective) => {
                const meta = perspectiveMeta[perspective];
                const pObjs = baseObjectives.filter((o) => o.perspective === perspective);
                const avgPct = pObjs.length > 0 ? Math.round(pObjs.reduce((s, o) => s + o.progress, 0) / pObjs.length) : 0;
                const ok = pObjs.filter((o) => o.status === "No prazo" || o.status === "Concluído").length;
                return (
                  <Card key={perspective} className={cn("border shadow-sm", meta.bg)}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        {meta.icon}
                        <span className={cn("text-sm font-bold", meta.color)}>{perspective}</span>
                      </div>
                      <div className="flex items-end gap-2 mb-2">
                        <span className={cn("text-3xl font-extrabold", meta.color)}>{avgPct}%</span>
                        <span className="text-xs text-slate-400 mb-1">avanço médio</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/60 overflow-hidden mb-3">
                        <div className={cn("h-full rounded-full", meta.accent)} style={{ width: `${avgPct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{pObjs.length} objetivos</span>
                        <span>{ok} no prazo/concluídos</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
