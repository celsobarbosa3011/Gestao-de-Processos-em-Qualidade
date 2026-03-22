import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  GraduationCap, Plus, Search, Filter, Download, ChevronRight,
  CheckCircle2, AlertCircle, Clock, Users, Building2, Calendar,
  Award, TrendingUp, AlertTriangle, Star, Eye, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type TrainingStatus = "Concluído" | "Em andamento" | "Agendado" | "Vencido";
type TrainingCategory = "Segurança" | "Clínico" | "Gestão" | "Integração" | "Obrigatório";

interface Training {
  id: number;
  code: string;
  title: string;
  category: TrainingCategory;
  status: TrainingStatus;
  instructor: string;
  unit: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  totalParticipants: number;
  completedParticipants: number;
  isONARequired: boolean;
  cargaHoraria: number;
  description: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const trainings: Training[] = [
  {
    id: 1, code: "TRE-001",
    title: "Segurança do Paciente — Módulo Obrigatório",
    category: "Obrigatório", status: "Em andamento",
    instructor: "Qual. Maria Luiza", unit: "Todas as unidades",
    targetAudience: "Toda a equipe assistencial",
    startDate: "2026-03-01", endDate: "2026-03-31",
    totalParticipants: 180, completedParticipants: 124,
    isONARequired: true, cargaHoraria: 4,
    description: "Treinamento obrigatório anual sobre os 6 metas internacionais de segurança do paciente: identificação, comunicação, medicação, cirurgia, IRAS e prevenção de quedas.",
  },
  {
    id: 2, code: "TRE-002",
    title: "Higiene das Mãos — Bundle CCIH",
    category: "Segurança", status: "Concluído",
    instructor: "CCIH — Enf. Patrícia", unit: "UTI + CC",
    targetAudience: "Equipe UTI e Centro Cirúrgico",
    startDate: "2026-02-10", endDate: "2026-02-20",
    totalParticipants: 65, completedParticipants: 65,
    isONARequired: true, cargaHoraria: 2,
    description: "Técnica correta de higiene das mãos com 5 momentos da OMS, uso de ABHR e sabão, e auditoria de aderência.",
  },
  {
    id: 3, code: "TRE-003",
    title: "Protocolo de Sepse — Atualização 2026",
    category: "Clínico", status: "Agendado",
    instructor: "Dr. Carlos Menezes", unit: "PS + UTI",
    targetAudience: "Médicos e Enfermeiros PS e UTI",
    startDate: "2026-04-05", endDate: "2026-04-07",
    totalParticipants: 48, completedParticipants: 0,
    isONARequired: false, cargaHoraria: 6,
    description: "Atualização dos bundles de sepse com critérios SEPSIS-3, diagnóstico laboratorial e manejo inicial da disfunção orgânica.",
  },
  {
    id: 4, code: "TRE-004",
    title: "Integração de Novos Colaboradores",
    category: "Integração", status: "Em andamento",
    instructor: "RH + Qualidade", unit: "Todas",
    targetAudience: "Novos colaboradores Mar/26",
    startDate: "2026-03-10", endDate: "2026-03-14",
    totalParticipants: 22, completedParticipants: 18,
    isONARequired: true, cargaHoraria: 8,
    description: "Integração institucional obrigatória cobrindo missão/visão/valores, biossegurança, segurança do paciente, código de ética e sistemas de qualidade.",
  },
  {
    id: 5, code: "TRE-005",
    title: "BLS/ACLS — Suporte de Vida",
    category: "Clínico", status: "Vencido",
    instructor: "Dr. Paulo Ramos (AHA)", unit: "UTI + CC + PS",
    targetAudience: "Médicos, Enfermeiros e Técnicos",
    startDate: "2025-09-01", endDate: "2025-09-05",
    totalParticipants: 90, completedParticipants: 72,
    isONARequired: true, cargaHoraria: 16,
    description: "Certificação BLS (Basic Life Support) e ACLS (Advanced Cardiovascular Life Support) pela American Heart Association.",
  },
  {
    id: 6, code: "TRE-006",
    title: "Cirurgia Segura — Checklist OMS",
    category: "Segurança", status: "Agendado",
    instructor: "Coord. CC + Qualidade", unit: "Centro Cirúrgico",
    targetAudience: "Equipe completa do CC",
    startDate: "2026-04-15", endDate: "2026-04-15",
    totalParticipants: 35, completedParticipants: 0,
    isONARequired: true, cargaHoraria: 4,
    description: "Treinamento prático no checklist de cirurgia segura da OMS (Sign In, Time Out, Sign Out) e fluxo de preenchimento no sistema.",
  },
  {
    id: 7, code: "TRE-007",
    title: "Gestão de Resíduos (PGRSS)",
    category: "Obrigatório", status: "Concluído",
    instructor: "Eng. Ambiental — Marcos", unit: "Todas",
    targetAudience: "Toda equipe com contato com resíduos",
    startDate: "2026-01-15", endDate: "2026-01-31",
    totalParticipants: 145, completedParticipants: 138,
    isONARequired: true, cargaHoraria: 3,
    description: "Capacitação sobre Plano de Gerenciamento de Resíduos de Serviços de Saúde — classificação, segregação, acondicionamento e descarte adequado.",
  },
  {
    id: 8, code: "TRE-008",
    title: "ONA 2026 — Sensibilização Gerencial",
    category: "Gestão", status: "Concluído",
    instructor: "Dir. Qualidade", unit: "Lideranças",
    targetAudience: "Gerentes, Coordenadores e Diretores",
    startDate: "2026-02-01", endDate: "2026-02-03",
    totalParticipants: 24, completedParticipants: 24,
    isONARequired: false, cargaHoraria: 6,
    description: "Sensibilização da liderança sobre os requisitos do Manual Brasileiro de Acreditação ONA 2026-2029 e o processo de preparação para visita.",
  },
];

const unitCompletion = [
  { unit: "UTI Adulto", pct: 92, total: 45, done: 41 },
  { unit: "Centro Cirúrgico", pct: 78, total: 38, done: 30 },
  { unit: "Pronto-Socorro", pct: 85, total: 62, done: 53 },
  { unit: "Internação", pct: 71, total: 88, done: 63 },
  { unit: "Centro Obstétrico", pct: 94, total: 28, done: 26 },
  { unit: "CME", pct: 88, total: 16, done: 14 },
];

const monthlyChart = [
  { month: "Out/25", concluidos: 18, participantes: 210 },
  { month: "Nov/25", concluidos: 12, participantes: 145 },
  { month: "Dez/25", concluidos: 8, participantes: 90 },
  { month: "Jan/26", concluidos: 22, participantes: 320 },
  { month: "Fev/26", concluidos: 15, participantes: 230 },
  { month: "Mar/26", concluidos: 10, participantes: 165 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusMeta(s: TrainingStatus) {
  switch (s) {
    case "Concluído":     return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    case "Em andamento":  return { cls: "bg-sky-100 text-sky-700 border-sky-200",             dot: "bg-sky-500" };
    case "Agendado":      return { cls: "bg-violet-100 text-violet-700 border-violet-200",    dot: "bg-violet-500" };
    case "Vencido":       return { cls: "bg-rose-100 text-rose-700 border-rose-200",          dot: "bg-rose-500" };
  }
}

function categoryMeta(c: TrainingCategory) {
  switch (c) {
    case "Obrigatório": return "bg-red-50 text-red-700 border-red-200";
    case "Segurança":   return "bg-amber-50 text-amber-700 border-amber-200";
    case "Clínico":     return "bg-sky-50 text-sky-700 border-sky-200";
    case "Gestão":      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Integração":  return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

function completionPct(t: Training) {
  if (t.totalParticipants === 0) return 0;
  return Math.round((t.completedParticipants / t.totalParticipants) * 100);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Treinamentos() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showNovoForm, setShowNovoForm] = useState(false);

  const filtered = trainings.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const concluded = trainings.filter((t) => t.status === "Concluído").length;
  const overdue = trainings.filter((t) => t.status === "Vencido").length;
  const onaRequired = trainings.filter((t) => t.isONARequired).length;
  const totalParticipants = trainings.reduce((s, t) => s + t.completedParticipants, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate("/")}>Início</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Treinamentos</span>
            <Badge className="ml-2 bg-teal-100 text-teal-700 border border-teal-200 text-xs px-2 py-0.5">Módulo 16</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <GraduationCap className="w-7 h-7 text-teal-500" />
                Treinamentos & Capacitações
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Gestão de capacitações obrigatórias e eletivas · Monitoramento por unidade e equipe
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" className="border-slate-200 text-slate-600 gap-2 text-sm" onClick={() => toast.info("Exportando...")}>
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 text-sm" onClick={() => setShowNovoForm(true)}>
                <Plus className="w-4 h-4" />
                Novo Treinamento
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Novo Treinamento Inline Form ── */}
      {showNovoForm && (
        <div className="max-w-screen-xl mx-auto px-6 pt-5">
          <Card className="bg-white border border-teal-200 shadow-sm">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-500" />
                Novo Treinamento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Título</label>
                  <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Ex: Segurança do Paciente" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Categoria</label>
                  <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white">
                    <option>Obrigatório</option>
                    <option>Segurança</option>
                    <option>Clínico</option>
                    <option>Gestão</option>
                    <option>Integração</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Instrutor</label>
                  <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Nome do instrutor" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Carga Horária (h)</label>
                  <input type="number" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Ex: 4" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Data de Início</label>
                  <input type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Data de Término</label>
                  <input type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 text-xs" onClick={() => setShowNovoForm(false)}>
                  Cancelar
                </Button>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs" onClick={() => { toast.success("Criado com sucesso!"); setShowNovoForm(false); }}>
                  Salvar Treinamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Concluídos", value: concluded, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Participantes Formados", value: totalParticipants.toLocaleString("pt-BR"), icon: <Award className="w-5 h-5 text-sky-500" />, bg: "bg-sky-50", text: "text-sky-700" },
            { label: "Com Pendência", value: overdue, icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, bg: "bg-rose-50", text: "text-rose-700" },
            { label: "Exigidos pela ONA", value: onaRequired, icon: <Star className="w-5 h-5 text-teal-500" />, bg: "bg-teal-50", text: "text-teal-700" },
          ].map((k) => (
            <Card key={k.label} className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", k.bg)}>
                  {k.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className={cn("text-2xl font-bold", k.text)}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="lista">
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto mb-5">
            <TabsTrigger value="lista" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Lista de Treinamentos
            </TabsTrigger>
            <TabsTrigger value="unidades" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Por Unidade
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Histórico Mensal
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Lista de Treinamentos
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="lista">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar treinamento..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-300 w-60"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />Status:
              </div>
              {["all", "Em andamento", "Agendado", "Concluído", "Vencido"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    filterStatus === s
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
                  )}
                >
                  {s === "all" ? "Todos" : s}
                </button>
              ))}
            </div>

            <div className="flex gap-5">
              <div className="flex-1 min-w-0 space-y-3">
                {filtered.map((t) => {
                  const sm = statusMeta(t.status);
                  const pct = completionPct(t);
                  const isSelected = selectedTraining?.id === t.id;
                  return (
                    <Card
                      key={t.id}
                      onClick={() => setSelectedTraining(isSelected ? null : t)}
                      className={cn(
                        "bg-white border shadow-sm cursor-pointer hover:shadow-md transition-all",
                        isSelected ? "border-teal-400 ring-2 ring-teal-100" : "border-slate-200",
                        t.status === "Vencido" && "border-l-4 border-l-rose-400"
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                                {t.code}
                              </span>
                              <Badge className={cn("text-xs border px-2 py-0.5 flex items-center gap-1", sm.cls)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", sm.dot)} />
                                {t.status}
                              </Badge>
                              <Badge className={cn("text-xs border px-2 py-0.5", categoryMeta(t.category))}>
                                {t.category}
                              </Badge>
                              {t.isONARequired && (
                                <Badge className="text-xs bg-teal-50 text-teal-700 border-teal-200 px-2 py-0.5 flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5" />
                                  ONA
                                </Badge>
                              )}
                            </div>

                            <h3 className="font-semibold text-slate-800 text-sm mb-1">{t.title}</h3>
                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{t.description}</p>

                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {t.instructor}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {t.unit}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {t.cargaHoraria}h
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(t.startDate).toLocaleDateString("pt-BR")} →{" "}
                                {new Date(t.endDate).toLocaleDateString("pt-BR")}
                              </span>
                            </div>

                            {t.status !== "Agendado" && (
                              <div className="mt-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-slate-500">
                                    {t.completedParticipants}/{t.totalParticipants} participantes
                                  </span>
                                  <span className={cn(
                                    "text-xs font-bold",
                                    pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-rose-600"
                                  )}>{pct}%</span>
                                </div>
                                <Progress value={pct} className="h-1.5 bg-slate-100" />
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex flex-row md:flex-col gap-2">
                            <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 gap-1.5 text-xs h-8" onClick={(e) => { e.stopPropagation(); toast.info("Abrindo detalhes..."); }}>
                              <Eye className="w-3.5 h-3.5" />
                              Detalhes
                            </Button>
                            {t.status === "Em andamento" && (
                              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs h-8" onClick={(e) => { e.stopPropagation(); toast.success("Operação realizada com sucesso!"); }}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Registrar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filtered.length === 0 && (
                  <Card className="bg-white border border-slate-200">
                    <CardContent className="py-12 text-center text-slate-400 text-sm">
                      Nenhum treinamento encontrado.
                    </CardContent>
                  </Card>
                )}
              </div>

              {selectedTraining && (
                <div className="w-72 flex-shrink-0">
                  <Card className="bg-white border border-teal-200 shadow-sm sticky top-4">
                    <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-100">
                      <p className="text-xs font-mono text-slate-400 mb-0.5">{selectedTraining.code}</p>
                      <CardTitle className="text-sm font-bold text-slate-800 leading-snug">
                        {selectedTraining.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-4 space-y-4">
                      {selectedTraining.status !== "Agendado" && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-slate-500">Conclusão</span>
                            <span className="text-sm font-bold text-teal-700">{completionPct(selectedTraining)}%</span>
                          </div>
                          <Progress value={completionPct(selectedTraining)} className="h-2.5 bg-slate-100" />
                          <p className="text-xs text-slate-400 mt-1">
                            {selectedTraining.completedParticipants} de {selectedTraining.totalParticipants} participantes
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {[
                          { label: "Instrutor", value: selectedTraining.instructor },
                          { label: "Unidade", value: selectedTraining.unit },
                          { label: "Carga horária", value: `${selectedTraining.cargaHoraria}h` },
                          { label: "Público-alvo", value: selectedTraining.targetAudience },
                          { label: "Início", value: new Date(selectedTraining.startDate).toLocaleDateString("pt-BR") },
                          { label: "Fim", value: new Date(selectedTraining.endDate).toLocaleDateString("pt-BR") },
                        ].map((f) => (
                          <div key={f.label} className="col-span-2">
                            <p className="text-slate-400 font-medium">{f.label}</p>
                            <p className="text-slate-700 font-semibold text-xs leading-snug">{f.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 text-xs" onClick={() => toast.success("Operação realizada com sucesso!")}>
                          <FileText className="w-3.5 h-3.5" />
                          Lista de presença
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.success("Operação realizada com sucesso!")}>
                          <Award className="w-3.5 h-3.5" />
                          Emitir certificados
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.info("Exportando...")}>
                          <Download className="w-3.5 h-3.5" />
                          Relatório de conclusão
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Por Unidade
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="unidades" className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Unidades ≥ 85%", value: unitCompletion.filter((u) => u.pct >= 85).length, color: "text-emerald-700", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" /> },
                { label: "Entre 70–84%", value: unitCompletion.filter((u) => u.pct >= 70 && u.pct < 85).length, color: "text-amber-700", bg: "bg-amber-50", icon: <AlertCircle className="w-5 h-5 text-amber-600" /> },
                { label: "Abaixo de 70%", value: unitCompletion.filter((u) => u.pct < 70).length, color: "text-rose-700", bg: "bg-rose-50", icon: <AlertTriangle className="w-5 h-5 text-rose-600" /> },
              ].map((k) => (
                <Card key={k.label} className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="py-4 px-5 flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", k.bg)}>{k.icon}</div>
                    <div>
                      <p className="text-xs text-slate-500">{k.label}</p>
                      <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unitCompletion.map((u) => {
                const color = u.pct >= 85 ? "text-emerald-700" : u.pct >= 70 ? "text-amber-700" : "text-rose-700";
                const barColor = u.pct >= 85 ? "bg-emerald-500" : u.pct >= 70 ? "bg-amber-500" : "bg-rose-500";
                return (
                  <Card key={u.unit} className="bg-white border border-slate-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-teal-600" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{u.unit}</span>
                        </div>
                        <span className={cn("text-2xl font-extrabold", color)}>{u.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
                        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${u.pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-400">{u.done} de {u.total} colaboradores concluíram</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — Histórico Mensal
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="historico">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-500" />
                      Treinamentos Realizados — Últimos 6 Meses
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-0.5">Volume de treinamentos e participantes por mês</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.info("Exportando...")}>
                    <Download className="w-3.5 h-3.5" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pt-5 pb-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyChart} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                    <Bar yAxisId="left" dataKey="concluidos" name="Treinamentos" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar yAxisId="right" dataKey="participantes" name="Participantes" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-5 border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mês</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Treinamentos</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Participantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyChart.map((row) => (
                        <tr key={row.month} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-700">{row.month}</td>
                          <td className="px-4 py-2.5 text-center font-semibold text-teal-700">{row.concluidos}</td>
                          <td className="px-4 py-2.5 text-center text-slate-600">{row.participantes}</td>
                        </tr>
                      ))}
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
