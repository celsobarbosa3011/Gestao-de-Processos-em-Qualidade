import { useState } from "react";
import { useLocation } from "wouter";
import { useTenant } from "@/hooks/use-tenant";
import {
  Wrench, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Calendar, Activity, BarChart3, AlertCircle,
  TrendingUp, Settings, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type EquipStatus = "operacional" | "manutencao" | "calibracao" | "inativo";

interface Equipamento {
  id: number;
  codigo: string;
  nome: string;
  fabricante: string;
  modelo: string;
  setor: string;
  status: EquipStatus;
  ultimaManutencao: string;
  proximaManutencao: string;
  calibracaoVence: string;
  criticidade: "alta" | "media" | "baixa";
}

interface Manutencao {
  id: number;
  equipamento: string;
  tipo: "preventiva" | "corretiva";
  responsavel: string;
  dataPrevista: string;
  status: "pendente" | "em_andamento" | "concluida";
  setor: string;
}

interface Calibracao {
  id: number;
  equipamento: string;
  codigo: string;
  ultimoCertificado: string;
  vencimento: string;
  statusCal: "ok" | "vencida" | "a_vencer";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockEquipamentos: Equipamento[] = [
  {
    id: 1,
    codigo: "EC-001",
    nome: "Monitor Multiparâmetro",
    fabricante: "Philips",
    modelo: "IntelliVue MX450",
    setor: "UTI",
    status: "operacional",
    ultimaManutencao: "15/01/2026",
    proximaManutencao: "15/04/2026",
    calibracaoVence: "20/06/2026",
    criticidade: "alta",
  },
  {
    id: 2,
    codigo: "EC-002",
    nome: "Ventilador Mecânico",
    fabricante: "Dräger",
    modelo: "Evita V800",
    setor: "UTI",
    status: "operacional",
    ultimaManutencao: "10/02/2026",
    proximaManutencao: "10/05/2026",
    calibracaoVence: "10/08/2026",
    criticidade: "alta",
  },
  {
    id: 3,
    codigo: "EC-003",
    nome: "Bomba de Infusão",
    fabricante: "BD",
    modelo: "Alaris GP",
    setor: "UTI",
    status: "manutencao",
    ultimaManutencao: "01/03/2026",
    proximaManutencao: "01/06/2026",
    calibracaoVence: "15/07/2026",
    criticidade: "alta",
  },
  {
    id: 4,
    codigo: "EC-004",
    nome: "Desfibrilador",
    fabricante: "Zoll",
    modelo: "R Series",
    setor: "PS",
    status: "operacional",
    ultimaManutencao: "20/01/2026",
    proximaManutencao: "20/04/2026",
    calibracaoVence: "30/05/2026",
    criticidade: "alta",
  },
  {
    id: 5,
    codigo: "EC-005",
    nome: "Oxímetro de Pulso",
    fabricante: "Masimo",
    modelo: "Radical-7",
    setor: "PS",
    status: "operacional",
    ultimaManutencao: "05/02/2026",
    proximaManutencao: "05/05/2026",
    calibracaoVence: "12/09/2026",
    criticidade: "media",
  },
  {
    id: 6,
    codigo: "EC-006",
    nome: "Bisturi Elétrico",
    fabricante: "Valleylab",
    modelo: "Force FX",
    setor: "Centro Cirúrgico",
    status: "calibracao",
    ultimaManutencao: "10/11/2025",
    proximaManutencao: "10/02/2026",
    calibracaoVence: "10/02/2026",
    criticidade: "alta",
  },
  {
    id: 7,
    codigo: "EC-007",
    nome: "Eletrocardiógrafo",
    fabricante: "GE Healthcare",
    modelo: "MAC 5500 HD",
    setor: "Cardiologia",
    status: "operacional",
    ultimaManutencao: "12/02/2026",
    proximaManutencao: "12/05/2026",
    calibracaoVence: "22/10/2026",
    criticidade: "media",
  },
  {
    id: 8,
    codigo: "EC-008",
    nome: "Autoclave",
    fabricante: "Cristofoli",
    modelo: "UltraClave",
    setor: "CME",
    status: "manutencao",
    ultimaManutencao: "18/03/2026",
    proximaManutencao: "18/06/2026",
    calibracaoVence: "18/09/2026",
    criticidade: "media",
  },
];

const mockManutencoes: Manutencao[] = [
  {
    id: 1,
    equipamento: "Bomba de Infusão (EC-003)",
    tipo: "corretiva",
    responsavel: "Eng. Carlos Mendes",
    dataPrevista: "28/03/2026",
    status: "em_andamento",
    setor: "UTI",
  },
  {
    id: 2,
    equipamento: "Autoclave (EC-008)",
    tipo: "preventiva",
    responsavel: "Eng. Ana Souza",
    dataPrevista: "30/03/2026",
    status: "em_andamento",
    setor: "CME",
  },
  {
    id: 3,
    equipamento: "Desfibrilador (EC-004)",
    tipo: "preventiva",
    responsavel: "Eng. Carlos Mendes",
    dataPrevista: "20/04/2026",
    status: "pendente",
    setor: "PS",
  },
  {
    id: 4,
    equipamento: "Monitor Multiparâmetro (EC-001)",
    tipo: "preventiva",
    responsavel: "Eng. Ana Souza",
    dataPrevista: "15/04/2026",
    status: "pendente",
    setor: "UTI",
  },
  {
    id: 5,
    equipamento: "Ventilador Mecânico (EC-002)",
    tipo: "preventiva",
    responsavel: "Eng. Ricardo Lima",
    dataPrevista: "10/05/2026",
    status: "pendente",
    setor: "UTI",
  },
];

const mockCalibracoes: Calibracao[] = [
  {
    id: 1,
    equipamento: "Bisturi Elétrico",
    codigo: "EC-006",
    ultimoCertificado: "10/02/2025",
    vencimento: "10/02/2026",
    statusCal: "vencida",
  },
  {
    id: 2,
    equipamento: "Desfibrilador",
    codigo: "EC-004",
    ultimoCertificado: "30/05/2025",
    vencimento: "30/05/2026",
    statusCal: "a_vencer",
  },
  {
    id: 3,
    equipamento: "Monitor Multiparâmetro",
    codigo: "EC-001",
    ultimoCertificado: "20/06/2025",
    vencimento: "20/06/2026",
    statusCal: "ok",
  },
  {
    id: 4,
    equipamento: "Ventilador Mecânico",
    codigo: "EC-002",
    ultimoCertificado: "10/08/2025",
    vencimento: "10/08/2026",
    statusCal: "ok",
  },
  {
    id: 5,
    equipamento: "Bomba de Infusão",
    codigo: "EC-003",
    ultimoCertificado: "15/07/2025",
    vencimento: "15/07/2026",
    statusCal: "ok",
  },
  {
    id: 6,
    equipamento: "Oxímetro de Pulso",
    codigo: "EC-005",
    ultimoCertificado: "12/09/2025",
    vencimento: "12/09/2026",
    statusCal: "ok",
  },
  {
    id: 7,
    equipamento: "Eletrocardiógrafo",
    codigo: "EC-007",
    ultimoCertificado: "22/10/2025",
    vencimento: "22/10/2026",
    statusCal: "ok",
  },
  {
    id: 8,
    equipamento: "Autoclave",
    codigo: "EC-008",
    ultimoCertificado: "18/09/2025",
    vencimento: "18/09/2026",
    statusCal: "ok",
  },
];

const manutenoesPorMes = [
  { mes: "Out/25", preventiva: 5, corretiva: 2 },
  { mes: "Nov/25", preventiva: 6, corretiva: 1 },
  { mes: "Dez/25", preventiva: 4, corretiva: 3 },
  { mes: "Jan/26", preventiva: 7, corretiva: 2 },
  { mes: "Fev/26", preventiva: 5, corretiva: 1 },
  { mes: "Mar/26", preventiva: 6, corretiva: 2 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: EquipStatus) {
  switch (status) {
    case "operacional":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "calibracao":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "manutencao":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "inativo":
      return "bg-rose-100 text-rose-700 border-rose-200";
  }
}

function statusLabel(status: EquipStatus) {
  switch (status) {
    case "operacional": return "Operacional";
    case "calibracao":  return "Calibração";
    case "manutencao":  return "Manutenção";
    case "inativo":     return "Inativo";
  }
}

function criticidadeBadge(c: "alta" | "media" | "baixa") {
  if (c === "alta")  return "bg-rose-100 text-rose-700 border-rose-200";
  if (c === "media") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

function manutencaoStatusBadge(s: Manutencao["status"]) {
  if (s === "em_andamento") return "bg-cyan-100 text-cyan-700 border-cyan-200";
  if (s === "concluida")    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function manutencaoStatusLabel(s: Manutencao["status"]) {
  if (s === "em_andamento") return "Em andamento";
  if (s === "concluida")    return "Concluída";
  return "Pendente";
}

function calStatusBadge(s: Calibracao["statusCal"]) {
  if (s === "vencida")  return "bg-rose-100 text-rose-700 border-rose-200";
  if (s === "a_vencer") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function calStatusLabel(s: Calibracao["statusCal"]) {
  if (s === "vencida")  return "Vencida";
  if (s === "a_vencer") return "A vencer em 30 dias";
  return "Dentro do prazo";
}

const PIE_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EngenhariaClinical() {
  const { isAdmin } = useTenant();
  const [, navigate] = useLocation();

  const displayEquipamentos = isAdmin ? mockEquipamentos : [];
  const displayManutencoes   = isAdmin ? mockManutencoes  : [];
  const displayCalibracoes   = isAdmin ? mockCalibracoes  : [];

  // KPI values
  const totalEquipamentos   = isAdmin ? 148   : 0;
  const emManutencao        = isAdmin ? 12    : 0;
  const calibracoesVencidas = isAdmin ? 5     : 0;
  const disponibilidade     = isAdmin ? "91.8%" : "—";

  // Pie data: distribution by status from mock
  const pieData = isAdmin
    ? [
        { name: "Operacional", value: 124 },
        { name: "Manutenção",  value: 12  },
        { name: "Calibração",  value: 8   },
        { name: "Inativo",     value: 4   },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span
              className="hover:text-slate-700 cursor-pointer"
              onClick={() => navigate("/")}
            >
              Início
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Engenharia Clínica</span>
            <Badge className="ml-2 bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs px-2 py-0.5">
              Módulo Biomédico
            </Badge>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Engenharia Clínica
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestão de equipamentos biomédicos, manutenções preventivas e calibrações
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Equipamentos",
              value: totalEquipamentos,
              icon: <Settings className="w-5 h-5 text-cyan-500" />,
              bg: "bg-cyan-50",
              text: "text-cyan-700",
            },
            {
              label: "Em Manutenção",
              value: emManutencao,
              icon: <Wrench className="w-5 h-5 text-orange-500" />,
              bg: "bg-orange-50",
              text: "text-orange-700",
            },
            {
              label: "Calibrações Vencidas",
              value: calibracoesVencidas,
              icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
              bg: "bg-rose-50",
              text: "text-rose-700",
            },
            {
              label: "Disponibilidade Geral",
              value: disponibilidade,
              icon: <Activity className="w-5 h-5 text-emerald-500" />,
              bg: "bg-emerald-50",
              text: "text-emerald-700",
            },
          ].map((k) => (
            <Card key={k.label} className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", k.bg)}>
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

        {/* ── Calibrações Vencidas Banner ── */}
        {isAdmin && calibracoesVencidas > 0 && (
          <Card className="bg-rose-50 border border-rose-200 shadow-sm mb-5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-800">
                  {calibracoesVencidas} calibrações vencidas — ação imediata necessária para conformidade ONA
                </p>
                <p className="text-xs text-rose-600 mt-0.5">
                  Equipamentos com calibração vencida não devem ser utilizados em procedimentos clínicos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="equipamentos">
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto mb-5 flex-wrap">
            <TabsTrigger
              value="equipamentos"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Equipamentos
            </TabsTrigger>
            <TabsTrigger
              value="manutencoes"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Manutenções
            </TabsTrigger>
            <TabsTrigger
              value="calibracoes"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Calibrações
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2"
            >
              Dashboard
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Equipamentos
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="equipamentos">
            {displayEquipamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-400">
                <Wrench className="w-10 h-10 opacity-25" />
                <p className="text-sm">Nenhum equipamento cadastrado.</p>
              </div>
            ) : (
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-500" />
                    Parque de Equipamentos Biomédicos
                  </CardTitle>
                  <p className="text-xs text-slate-400">{displayEquipamentos.length} equipamentos exibidos (amostra)</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Código</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Equipamento</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Fabricante / Modelo</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Setor</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Criticidade</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Próx. Manutenção</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Cal. Vence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayEquipamentos.map((eq, idx) => (
                          <tr
                            key={eq.id}
                            className={cn(
                              "border-b border-slate-50 hover:bg-slate-50 transition-colors",
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                            )}
                          >
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{eq.codigo}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{eq.nome}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {eq.fabricante}<br />
                              <span className="text-slate-400">{eq.modelo}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">{eq.setor}</td>
                            <td className="px-4 py-3">
                              <Badge className={cn("text-xs border", statusBadge(eq.status))}>
                                {statusLabel(eq.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn("text-xs border capitalize", criticidadeBadge(eq.criticidade))}>
                                {eq.criticidade.charAt(0).toUpperCase() + eq.criticidade.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">{eq.proximaManutencao}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                              <span className={cn(eq.status === "calibracao" ? "text-rose-600 font-semibold" : "")}>
                                {eq.calibracaoVence}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Manutenções
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="manutencoes" className="space-y-4">
            {displayManutencoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-400">
                <Wrench className="w-10 h-10 opacity-25" />
                <p className="text-sm">Nenhuma manutenção registrada.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-600 font-medium">
                    Manutenções pendentes e em andamento
                  </p>
                  <Badge className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs">
                    {displayManutencoes.filter((m) => m.status !== "concluida").length} abertas
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayManutencoes.map((m) => (
                    <Card key={m.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              m.tipo === "corretiva" ? "bg-rose-50" : "bg-cyan-50"
                            )}>
                              {m.tipo === "corretiva"
                                ? <Zap className="w-4 h-4 text-rose-500" />
                                : <Settings className="w-4 h-4 text-cyan-500" />
                              }
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 capitalize">{m.tipo}</p>
                              <Badge className={cn(
                                "text-xs border mt-0.5",
                                m.tipo === "corretiva"
                                  ? "bg-rose-100 text-rose-700 border-rose-200"
                                  : "bg-cyan-100 text-cyan-700 border-cyan-200"
                              )}>
                                {m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <Badge className={cn("text-xs border flex-shrink-0", manutencaoStatusBadge(m.status))}>
                            {manutencaoStatusLabel(m.status)}
                          </Badge>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-3">
                          {m.equipamento}
                        </h3>

                        <div className="space-y-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            <span>Setor: <span className="font-medium text-slate-700">{m.setor}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            <span>Responsável: <span className="font-medium text-slate-700">{m.responsavel}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Data prevista: <span className="font-medium text-slate-700">{m.dataPrevista}</span></span>
                          </div>
                        </div>

                        {m.status === "em_andamento" && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Progresso</span>
                              <span>Em execução</span>
                            </div>
                            <Progress value={60} className="h-1.5" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — Calibrações
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="calibracoes">
            {displayCalibracoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-400">
                <Wrench className="w-10 h-10 opacity-25" />
                <p className="text-sm">Nenhuma calibração registrada.</p>
              </div>
            ) : (
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    Rastreabilidade de Calibrações
                  </CardTitle>
                  <p className="text-xs text-slate-400">
                    Conformidade com RDC 509/2021 e requisitos ONA — rastreabilidade metrológica
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Código</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Equipamento</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Último Certificado</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Vencimento</th>
                          <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayCalibracoes.map((cal, idx) => (
                          <tr
                            key={cal.id}
                            className={cn(
                              "border-b border-slate-50 hover:bg-slate-50 transition-colors",
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                              cal.statusCal === "vencida" ? "bg-rose-50/50" : ""
                            )}
                          >
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{cal.codigo}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{cal.equipamento}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{cal.ultimoCertificado}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className={cn(
                                "font-medium",
                                cal.statusCal === "vencida"  ? "text-rose-700" :
                                cal.statusCal === "a_vencer" ? "text-amber-700" :
                                "text-slate-600"
                              )}>
                                {cal.vencimento}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={cn("text-xs border", calStatusBadge(cal.statusCal))}>
                                {calStatusLabel(cal.statusCal)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4 — Dashboard
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="dashboard" className="space-y-5">
            {!isAdmin ? (
              <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-400">
                <Wrench className="w-10 h-10 opacity-25" />
                <p className="text-sm">Dashboard disponível após registro de equipamentos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Pie — Distribuição por status */}
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-500" />
                      Distribuição por Status
                    </CardTitle>
                    <p className="text-xs text-slate-400">148 equipamentos no parque total</p>
                  </CardHeader>
                  <CardContent className="px-4 pb-5 pt-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }: { name: string; percent: number }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {pieData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i] }}
                          />
                          <span className="text-xs text-slate-600">{entry.name}</span>
                          <span className="text-xs font-bold text-slate-800 ml-auto">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bar — Manutenções por mês */}
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-500" />
                      Manutenções por Mês
                    </CardTitle>
                    <p className="text-xs text-slate-400">Preventivas vs. corretivas — últimos 6 meses</p>
                  </CardHeader>
                  <CardContent className="px-4 pb-5 pt-3">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={manutenoesPorMes}
                        margin={{ top: 4, right: 16, left: -15, bottom: 0 }}
                        barGap={3}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="mes"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Legend
                          iconType="square"
                          iconSize={10}
                          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        />
                        <Bar
                          dataKey="preventiva"
                          name="Preventiva"
                          fill="#06b6d4"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="corretiva"
                          name="Corretiva"
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Summary cards */}
                <Card className="bg-white border border-slate-200 shadow-sm lg:col-span-2">
                  <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-500" />
                      Indicadores de Desempenho — Engenharia Clínica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Disponibilidade Geral",      value: 91.8, meta: 95,  color: "bg-cyan-500" },
                        { label: "MTBF (dias)",                value: 87,   meta: 90,  color: "bg-violet-500" },
                        { label: "MTTR (horas)",               value: 4.2,  meta: 6,   color: "bg-emerald-500", inverted: true },
                        { label: "Preventivas / Total (%)",    value: 75,   meta: 80,  color: "bg-amber-500" },
                      ].map((ind) => {
                        const pct = ind.inverted
                          ? Math.min(100, Math.round((ind.meta / ind.value) * 100))
                          : Math.min(100, Math.round((ind.value / ind.meta) * 100));
                        const isOk = ind.inverted ? ind.value <= ind.meta : ind.value >= ind.meta * 0.9;
                        return (
                          <div key={ind.label} className="space-y-2">
                            <div className="flex justify-between items-baseline">
                              <p className="text-xs text-slate-500">{ind.label}</p>
                              <span className={cn(
                                "text-base font-bold",
                                isOk ? "text-emerald-700" : "text-amber-700"
                              )}>
                                {ind.value}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", ind.color)}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400">Meta: {ind.meta}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
