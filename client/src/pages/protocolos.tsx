import { useState } from "react";
import { useLocation } from "wouter";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getManagedProtocols, createManagedProtocol } from "@/lib/api";
import { printReport } from "@/lib/print-pdf";
import {
  BookMarked, BarChart2, Plus, Search, Filter, Download,
  ChevronRight, CheckCircle2, AlertCircle, Clock, Eye,
  FileText, Users, Building2, TrendingUp, AlertTriangle,
  ClipboardCheck, Edit, Star, Activity, Shield, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProtocolStatus = "Ativo" | "Em revisão" | "Suspenso" | "Rascunho";
type ProtocolCategory = "Segurança" | "Clínico" | "Administrativo" | "Diagnóstico";

interface Protocol {
  id: number;
  code: string;
  name: string;
  category: ProtocolCategory;
  status: ProtocolStatus;
  version: string;
  approvedDate: string;
  nextReview: string;
  responsible: string;
  units: string[];
  adherence: number;
  adherenceTrend: "up" | "down" | "stable";
  isCore: boolean;
  description: string;
  alerts: string[];
}

interface AdherenceUnit {
  unit: string;
  adherence: number;
  applications: number;
}

interface AdherenceTrend {
  month: string;
  [key: string]: number | string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const protocols: Protocol[] = [
  {
    id: 1, code: "PROT-001", name: "Protocolo de Identificação do Paciente",
    category: "Segurança", status: "Ativo", version: "3.2", approvedDate: "2026-01-10",
    nextReview: "2027-01-10", responsible: "Enf. Carla Santos", isCore: true,
    units: ["UTI", "CC", "PS", "Internação", "Centro Obstétrico"],
    adherence: 78, adherenceTrend: "up",
    description: "Garante a identificação correta de todos os pacientes em todas as etapas da assistência, com uso de pulseira de identificação dupla e checagem ativa.",
    alerts: ["Aderência abaixo de 80% na UTI Norte"],
  },
  {
    id: 2, code: "PROT-002", name: "Protocolo de Sepse",
    category: "Clínico", status: "Ativo", version: "2.1", approvedDate: "2025-09-15",
    nextReview: "2026-09-15", responsible: "Dr. Carlos Menezes", isCore: true,
    units: ["UTI", "PS", "Internação"],
    adherence: 87, adherenceTrend: "up",
    description: "Protocolo baseado na Surviving Sepsis Campaign 2021 com bundles de 1h e 3h para detecção precoce e tratamento da sepse e choque séptico.",
    alerts: [],
  },
  {
    id: 3, code: "PROT-003", name: "Protocolo de AVC Isquêmico",
    category: "Clínico", status: "Ativo", version: "1.3", approvedDate: "2025-06-20",
    nextReview: "2026-06-20", responsible: "Dr. Ricardo Almeida", isCore: false,
    units: ["PS", "UTI", "Radiologia"],
    adherence: 73, adherenceTrend: "down",
    description: "Protocolo de ativação de código AVC para redução do tempo porta-agulha com protocolo trombolítico e critérios de trombectomia mecânica.",
    alerts: ["Aderência abaixo da meta em Clínica Médica", "Tempo porta-agulha acima de 60 min em 3 casos"],
  },
  {
    id: 4, code: "PROT-004", name: "Protocolo de Higiene das Mãos",
    category: "Segurança", status: "Ativo", version: "4.0", approvedDate: "2026-02-01",
    nextReview: "2027-02-01", responsible: "SCIH", isCore: true,
    units: ["UTI", "CC", "PS", "Internação", "CME", "Farmácia"],
    adherence: 82, adherenceTrend: "stable",
    description: "Protocolo dos 5 momentos da higiene das mãos da OMS com monitoramento por auditoria periódica e metas por unidade.",
    alerts: [],
  },
  {
    id: 5, code: "PROT-005", name: "Protocolo de Contenção Mecânica",
    category: "Segurança", status: "Ativo", version: "2.0", approvedDate: "2025-11-30",
    nextReview: "2026-11-30", responsible: "Enf. Ana Paula", isCore: true,
    units: ["UTI", "PS", "Internação Psiquiátrica"],
    adherence: 94, adherenceTrend: "up",
    description: "Protocolo institucional para uso de contenção mecânica com critérios claros de indicação, avaliação periódica e registro em prontuário.",
    alerts: [],
  },
  {
    id: 6, code: "PROT-006", name: "Protocolo de Prevenção de Suicídio",
    category: "Segurança", status: "Ativo", version: "1.1", approvedDate: "2025-08-10",
    nextReview: "2026-08-10", responsible: "Psiq. Maria Helena", isCore: false,
    units: ["PS", "Internação", "Psiquiatria"],
    adherence: 79, adherenceTrend: "stable",
    description: "Avaliação de risco com escala Columbia-Suicide Severity Rating Scale (C-SSRS) e fluxo de intervenção por nível de risco.",
    alerts: [],
  },
  {
    id: 7, code: "PROT-007", name: "Protocolo de Cirurgia Segura",
    category: "Segurança", status: "Em revisão", version: "2.3 (rev.)", approvedDate: "2025-03-01",
    nextReview: "2026-03-01", responsible: "Coord. CC", isCore: true,
    units: ["CC"],
    adherence: 68, adherenceTrend: "down",
    description: "Checklist da OMS para cirurgia segura em 3 etapas: Sign In, Time Out e Sign Out, com registro digital em todas as cirurgias.",
    alerts: ["Protocolo em revisão — versão 2.4 em aprovação", "Aderência abaixo de 70% no CC3"],
  },
  {
    id: 8, code: "PROT-008", name: "Protocolo de Dor Torácica / IAM",
    category: "Clínico", status: "Ativo", version: "1.5", approvedDate: "2025-10-20",
    nextReview: "2026-10-20", responsible: "Dr. Paulo Cardoso", isCore: false,
    units: ["PS", "UTI Coronariana"],
    adherence: 91, adherenceTrend: "up",
    description: "Código IAM com eletrocardiógrafo em menos de 10 min, ativação de hemodinâmica e tempo de reperfusão porta-balão inferior a 90 min.",
    alerts: [],
  },
  {
    id: 9, code: "PROT-009", name: "Protocolo de Prevenção de IRAS",
    category: "Segurança", status: "Ativo", version: "3.1", approvedDate: "2026-01-15",
    nextReview: "2027-01-15", responsible: "SCIH", isCore: true,
    units: ["UTI", "CC", "Hemodinâmica"],
    adherence: 85, adherenceTrend: "stable",
    description: "Bundles de prevenção de IPCS, PAV, ITU relacionada a cateter e ISC com monitoramento mensal e relatório para SCIH.",
    alerts: [],
  },
  {
    id: 10, code: "PROT-010", name: "Protocolo de TEV (Tromboembolismo Venoso)",
    category: "Clínico", status: "Em revisão", version: "1.8 (rev.)", approvedDate: "2025-07-01",
    nextReview: "2026-07-01", responsible: "Dr. Marcos Vieira", isCore: false,
    units: ["Internação", "CC", "UTI"],
    adherence: 68, adherenceTrend: "down",
    description: "Profilaxia de TEV com estratificação de risco (Caprini/Padua), protocolos de anticoagulação e tromboprofilaxia mecânica.",
    alerts: ["Protocolo em revisão — versão 2.0 em aprovação"],
  },
];

const adherenceByUnit: AdherenceUnit[] = [
  { unit: "UTI", adherence: 88, applications: 1240 },
  { unit: "CC", adherence: 76, applications: 890 },
  { unit: "PS", adherence: 83, applications: 2100 },
  { unit: "Internação", adherence: 79, applications: 3400 },
  { unit: "C. Obstétrico", adherence: 91, applications: 560 },
  { unit: "Psiquiatria", adherence: 85, applications: 320 },
];

const trendData: AdherenceTrend[] = [
  { month: "Out/25", "PROT-001": 68, "PROT-002": 80, "PROT-004": 79 },
  { month: "Nov/25", "PROT-001": 71, "PROT-002": 83, "PROT-004": 80 },
  { month: "Dez/25", "PROT-001": 73, "PROT-002": 84, "PROT-004": 81 },
  { month: "Jan/26", "PROT-001": 75, "PROT-002": 85, "PROT-004": 82 },
  { month: "Fev/26", "PROT-001": 76, "PROT-002": 86, "PROT-004": 82 },
  { month: "Mar/26", "PROT-001": 78, "PROT-002": 87, "PROT-004": 82 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusMeta(status: ProtocolStatus) {
  switch (status) {
    case "Ativo": return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "Em revisão": return { cls: "bg-amber-100 text-amber-700 border-amber-200" };
    case "Suspenso": return { cls: "bg-rose-100 text-rose-700 border-rose-200" };
    case "Rascunho": return { cls: "bg-slate-100 text-slate-600 border-slate-200" };
  }
}

function categoryMeta(cat: ProtocolCategory) {
  switch (cat) {
    case "Segurança": return { cls: "bg-red-50 text-red-700 border-red-200", icon: <Shield className="w-3 h-3" /> };
    case "Clínico": return { cls: "bg-sky-50 text-sky-700 border-sky-200", icon: <Activity className="w-3 h-3" /> };
    case "Administrativo": return { cls: "bg-slate-50 text-slate-600 border-slate-200", icon: <FileText className="w-3 h-3" /> };
    case "Diagnóstico": return { cls: "bg-violet-50 text-violet-700 border-violet-200", icon: <BarChart2 className="w-3 h-3" /> };
  }
}

function adherenceColor(v: number) {
  if (v >= 85) return "text-emerald-600";
  if (v >= 70) return "text-amber-600";
  return "text-rose-600";
}

function adherenceBarColor(v: number) {
  if (v >= 85) return "bg-emerald-500";
  if (v >= 70) return "bg-amber-500";
  return "bg-rose-500";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Protocolos() {
  const [, navigate] = useLocation();
  const { isAdmin } = useTenant();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState("sepse");
  const queryClient = useQueryClient();

  const { data: dbProtocols } = useQuery({
    queryKey: ["managed-protocols"],
    queryFn: getManagedProtocols,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createManagedProtocol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-protocols"] });
      toast.success("Protocolo cadastrado com sucesso!");
      setShowNovoForm(false);
      setNovoNome("");
    },
    onError: () => toast.error("Erro ao cadastrar protocolo."),
  });

  // Mapear dados do BD com fallback no mock
  const baseProtocols: Protocol[] = (dbProtocols && dbProtocols.length > 0)
    ? dbProtocols.map(p => ({
        id: p.id,
        code: p.code || `PROT-${String(p.id).padStart(3, "0")}`,
        name: p.name,
        category: "Clínico" as ProtocolCategory,
        status: (p.status === "active" ? "Ativo" : p.status === "review" ? "Em revisão" : p.status === "draft" ? "Rascunho" : "Suspenso") as ProtocolStatus,
        version: p.version,
        approvedDate: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "—",
        nextReview: p.reviewDate ? new Date(p.reviewDate).toISOString().split("T")[0] : "—",
        responsible: "—",
        units: ["Todas"],
        adherence: p.adherenceTarget ?? 90,
        adherenceTrend: "stable" as const,
        isCore: true,
        description: p.description || p.name,
        alerts: [],
      }))
    : [];

  const filtered = baseProtocols.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchStatus && matchCat;
  });

  const totalActive = baseProtocols.filter((p) => p.status === "Ativo").length;
  const avgAdherence = baseProtocols.length > 0
    ? Math.round(baseProtocols.reduce((s, p) => s + p.adherence, 0) / baseProtocols.length)
    : 0;
  const withAlerts = baseProtocols.filter((p) => p.alerts.length > 0).length;
  const coreCount = baseProtocols.filter((p) => p.isCore).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate("/")}>Início</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Protocolos Gerenciados</span>
            <Badge className="ml-2 bg-violet-100 text-violet-700 border border-violet-200 text-xs px-2 py-0.5">Módulo 12</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <BookMarked className="w-7 h-7 text-violet-500" />
                Protocolos Gerenciados
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Gestão de protocolos clínicos e de segurança · Monitoramento de aderência por unidade
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" className="border-slate-200 text-slate-600 gap-2 text-sm" onClick={() => printReport({ title: "Relatório de Protocolos Gerenciados", subtitle: "Aderência e status dos protocolos clínicos e de segurança", module: "Protocolos Gerenciados", columns: [{ label: "Protocolo", key: "nome" }, { label: "Categoria", key: "cat" }, { label: "Versão", key: "versao" }, { label: "Aderência", key: "ader" }, { label: "Status", key: "status" }], rows: [{ nome: "Cirurgia Segura — Checklist OMS", cat: "Segurança do Paciente", versao: "v3.1", ader: "94%", status: "✓ Vigente" }, { nome: "Sepse — Identificação e Tratamento Precoce", cat: "Protocolo Clínico", versao: "v2.4", ader: "87%", status: "✓ Vigente" }, { nome: "Higienização das Mãos — OMS 5 Momentos", cat: "SCIH / Prevenção", versao: "v5.0", ader: "81%", status: "✓ Vigente" }, { nome: "Prevenção de Quedas — Estratificação de Risco", cat: "Segurança do Paciente", versao: "v2.2", ader: "78%", status: "⚠ Revisão" }, { nome: "Identificação do Paciente — Pulseira", cat: "Segurança do Paciente", versao: "v4.0", ader: "98%", status: "✓ Vigente" }, { nome: "Medicamentos de Alta Vigilância — Dupla Checagem", cat: "Farmácia", versao: "v2.1", ader: "91%", status: "✓ Vigente" }] })}>
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 text-sm" onClick={() => setShowNovoForm(v => !v)}>
                <Plus className="w-4 h-4" />
                Novo Protocolo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* ── Novo Protocolo Form ── */}
        {showNovoForm && (
          <Card className="bg-white border border-violet-200 shadow-sm mb-5">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">Novo Protocolo</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Título</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Nome do protocolo" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300">
                    <option>Segurança</option>
                    <option>Clínico</option>
                    <option>Administrativo</option>
                    <option>Diagnóstico</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Responsável</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Nome do responsável" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 text-xs" onClick={() => setShowNovoForm(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
                  disabled={createMutation.isPending}
                  onClick={() => {
                    if (!novoNome.trim()) { toast.error("Informe o nome do protocolo."); return; }
                    createMutation.mutate({ name: novoNome, type: novoTipo, status: "active", version: "1.0", adherenceTarget: 90 } as any);
                  }}
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Protocolos Ativos", value: totalActive, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Aderência Média", value: `${avgAdherence}%`, icon: <TrendingUp className="w-5 h-5 text-sky-500" />, bg: "bg-sky-50", text: "text-sky-700" },
            { label: "Com Alertas", value: withAlerts, icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50", text: "text-amber-700" },
            { label: "Protocolos CORE", value: coreCount, icon: <Star className="w-5 h-5 text-violet-500" />, bg: "bg-violet-50", text: "text-violet-700" },
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

        {/* ── Tabs ── */}
        <Tabs defaultValue="lista">
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto mb-5">
            <TabsTrigger value="lista" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Lista de Protocolos
            </TabsTrigger>
            <TabsTrigger value="aderencia" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Aderência por Unidade
            </TabsTrigger>
            <TabsTrigger value="tendencia" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Tendência
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Lista de Protocolos
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="lista">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar protocolo..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 w-60"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </div>
              {["all", "Ativo", "Em revisão", "Suspenso"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    filterStatus === s
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                  )}
                >
                  {s === "all" ? "Todos" : s}
                </button>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
                Categoria:
              </div>
              {["all", "Segurança", "Clínico"].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    filterCat === c
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                  )}
                >
                  {c === "all" ? "Todas" : c}
                </button>
              ))}
            </div>

            <div className="flex gap-5">
              {/* ── Protocol List ── */}
              <div className="flex-1 min-w-0 space-y-3">
                {filtered.map((p) => {
                  const sm = statusMeta(p.status);
                  const cm = categoryMeta(p.category);
                  const isSelected = selectedProtocol?.id === p.id;
                  return (
                    <Card
                      key={p.id}
                      onClick={() => setSelectedProtocol(isSelected ? null : p)}
                      className={cn(
                        "bg-white border shadow-sm cursor-pointer hover:shadow-md transition-all",
                        isSelected ? "border-violet-400 ring-2 ring-violet-100" : "border-slate-200"
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          {/* Left */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                                {p.code}
                              </span>
                              <Badge className={cn("text-xs border px-2 py-0.5", sm.cls)}>{p.status}</Badge>
                              <Badge className={cn("text-xs border px-2 py-0.5 flex items-center gap-1", cm.cls)}>
                                {cm.icon}{p.category}
                              </Badge>
                              {p.isCore && (
                                <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-200 px-2 py-0.5 flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5" />
                                  CORE
                                </Badge>
                              )}
                            </div>

                            <h3 className="font-semibold text-slate-800 text-sm mb-1">{p.name}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{p.description}</p>

                            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {p.responsible}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {p.units.length} unidades
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                v{p.version}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Revisão: {new Date(p.nextReview).toLocaleDateString("pt-BR")}
                              </span>
                            </div>

                            {p.alerts.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {p.alerts.map((a, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                    {a}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right — Adherence */}
                          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 flex-shrink-0 md:w-28">
                            <div className="text-center">
                              <p className={cn("text-3xl font-extrabold leading-none", adherenceColor(p.adherence))}>
                                {p.adherence}%
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">aderência</p>
                            </div>
                            <div className="w-24">
                              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", adherenceBarColor(p.adherence))}
                                  style={{ width: `${p.adherence}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {p.adherenceTrend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                              {p.adherenceTrend === "down" && <TrendingUp className="w-3.5 h-3.5 text-rose-500 rotate-180" />}
                              {p.adherenceTrend === "stable" && <Activity className="w-3.5 h-3.5 text-slate-400" />}
                              <span className="text-xs text-slate-400">
                                {p.adherenceTrend === "up" ? "Subindo" : p.adherenceTrend === "down" ? "Caindo" : "Estável"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filtered.length === 0 && (
                  <Card className="bg-white border border-slate-200">
                    <CardContent className="py-12 text-center text-slate-400 text-sm">
                      Nenhum protocolo encontrado com os filtros aplicados.
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* ── Detail Panel ── */}
              {selectedProtocol && (
                <div className="w-72 flex-shrink-0">
                  <Card className="bg-white border border-violet-200 shadow-sm sticky top-4">
                    <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-mono text-slate-400 mb-0.5">{selectedProtocol.code}</p>
                          <CardTitle className="text-sm font-bold text-slate-800 leading-snug">
                            {selectedProtocol.name}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-3xl font-extrabold", adherenceColor(selectedProtocol.adherence))}>
                          {selectedProtocol.adherence}%
                        </span>
                        <span className="text-xs text-slate-400">aderência geral</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {[
                          { label: "Versão", value: selectedProtocol.version },
                          { label: "Status", value: selectedProtocol.status },
                          { label: "Aprovado", value: new Date(selectedProtocol.approvedDate).toLocaleDateString("pt-BR") },
                          { label: "Revisão", value: new Date(selectedProtocol.nextReview).toLocaleDateString("pt-BR") },
                          { label: "Responsável", value: selectedProtocol.responsible },
                          { label: "Unidades", value: `${selectedProtocol.units.length} unidades` },
                        ].map((f) => (
                          <div key={f.label}>
                            <p className="text-slate-400 font-medium">{f.label}</p>
                            <p className="text-slate-700 font-semibold">{f.value}</p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Unidades aplicando</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedProtocol.units.map((u) => (
                            <Badge key={u} className="text-xs bg-slate-50 text-slate-600 border border-slate-200">{u}</Badge>
                          ))}
                        </div>
                      </div>

                      {selectedProtocol.alerts.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Alertas</p>
                          {selectedProtocol.alerts.map((a, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {a}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2 text-xs" onClick={() => toast.info("Abrindo...")}>
                          <Eye className="w-3.5 h-3.5" />
                          Ver protocolo completo
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.success("Operação realizada com sucesso!")}>
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          Registrar aplicação
                        </Button>
                        <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.info("Abrindo editor...")}>
                          <Edit className="w-3.5 h-3.5" />
                          Editar / Revisar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Aderência por Unidade
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="aderencia" className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Unidades ≥ 85%</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {adherenceByUnit.filter((u) => u.adherence >= 85).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Entre 70–84%</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {adherenceByUnit.filter((u) => u.adherence >= 70 && u.adherence < 85).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Abaixo de 70%</p>
                    <p className="text-2xl font-bold text-rose-700">
                      {adherenceByUnit.filter((u) => u.adherence < 70).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart + Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-2 px-5 pt-5 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-violet-500" />
                    Aderência por Unidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pt-4 pb-5">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={adherenceByUnit}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="unit" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={72} />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(v: number) => [`${v}%`, "Aderência"]}
                      />
                      <Bar dataKey="adherence" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {adherenceByUnit.map((u, i) => (
                          <rect key={i} fill={u.adherence >= 85 ? "#10b981" : u.adherence >= 70 ? "#f59e0b" : "#f43f5e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-2 px-5 pt-5 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800">Detalhamento por Unidade</CardTitle>
                </CardHeader>
                <div className="divide-y divide-slate-100">
                  {adherenceByUnit.map((u) => (
                    <div key={u.unit} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{u.unit}</span>
                          <span className={cn("text-sm font-bold", adherenceColor(u.adherence))}>{u.adherence}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={cn("h-full rounded-full", adherenceBarColor(u.adherence))} style={{ width: `${u.adherence}%` }} />
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 flex-shrink-0">
                        {u.applications.toLocaleString("pt-BR")} aplic.
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — Tendência
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="tendencia">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-violet-500" />
                      Evolução de Aderência — Principais Protocolos
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-0.5">Últimos 6 meses</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 gap-2 text-xs" onClick={() => toast.info("Exportando...")}>
                    <Download className="w-3.5 h-3.5" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pt-5 pb-6">
                <div className="flex gap-4 mb-4 flex-wrap">
                  {[
                    { code: "PROT-001", name: "Identificação", color: "#7c3aed" },
                    { code: "PROT-002", name: "Sepse", color: "#0ea5e9" },
                    { code: "PROT-004", name: "Higiene Mãos", color: "#10b981" },
                  ].map((l) => (
                    <div key={l.code} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-3 h-3 rounded" style={{ background: l.color }} />
                      {l.code} — {l.name}
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: number) => [`${v}%`, ""]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="PROT-001" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} name="PROT-001 — Identificação" />
                    <Line type="monotone" dataKey="PROT-002" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} name="PROT-002 — Sepse" />
                    <Line type="monotone" dataKey="PROT-004" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="PROT-004 — Higiene Mãos" />
                  </LineChart>
                </ResponsiveContainer>

                {/* Improvement notes */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { protocol: "PROT-001 — Identificação", delta: "+10pp", period: "Out/25 → Mar/26", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                    { protocol: "PROT-002 — Sepse", delta: "+7pp", period: "Out/25 → Mar/26", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                    { protocol: "PROT-004 — Higiene Mãos", delta: "+3pp", period: "Out/25 → Mar/26", color: "text-sky-600", bg: "bg-sky-50 border-sky-200" },
                  ].map((n) => (
                    <div key={n.protocol} className={cn("rounded-lg border p-3", n.bg)}>
                      <p className="text-xs font-semibold text-slate-700">{n.protocol}</p>
                      <p className={cn("text-2xl font-extrabold", n.color)}>{n.delta}</p>
                      <p className="text-xs text-slate-500">{n.period}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
