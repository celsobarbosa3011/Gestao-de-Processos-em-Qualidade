import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Star,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  BarChart3,
  ClipboardList,
  Activity,
  Search,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type ManifestacaoTipo = "Reclamação" | "Elogio" | "Sugestão" | "Solicitação";
type ManifestacaoStatus = "Aberta" | "Em análise" | "Resolvida";

interface Manifestacao {
  id: string;
  tipo: ManifestacaoTipo;
  categoria: string;
  descricao: string;
  data: string;
  status: ManifestacaoStatus;
  prazo: string;
}

interface NpsMesData {
  mes: string;
  nps: number;
}

interface NpsBreakdown {
  name: string;
  value: number;
  color: string;
}

interface SetorNps {
  setor: string;
  nps: number;
}

interface Pesquisa {
  id: string;
  titulo: string;
  descricao: string;
  respostas: number;
  meta: number;
  status: "Ativa" | "Encerrada" | "Pausada";
  percentual: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockNpsMensal: NpsMesData[] = [
  { mes: "Jan", nps: 65 },
  { mes: "Fev", nps: 68 },
  { mes: "Mar", nps: 71 },
  { mes: "Abr", nps: 69 },
  { mes: "Mai", nps: 74 },
  { mes: "Jun", nps: 72 },
];

const mockNpsBreakdown: NpsBreakdown[] = [
  { name: "Promotores", value: 62, color: "#10b981" },
  { name: "Neutros", value: 24, color: "#f59e0b" },
  { name: "Detratores", value: 14, color: "#ef4444" },
];

const mockSetorNps: SetorNps[] = [
  { setor: "Centro Cirúrgico", nps: 83 },
  { setor: "UTI", nps: 81 },
  { setor: "Ambulatório", nps: 79 },
  { setor: "Internação", nps: 75 },
  { setor: "Pronto-socorro", nps: 58 },
];

const mockManifestacoes: Manifestacao[] = [
  {
    id: "MAN-001",
    tipo: "Reclamação",
    categoria: "Tempo de espera",
    descricao: "Aguardei mais de 3 horas no pronto-socorro sem atendimento.",
    data: "20/06/2026",
    status: "Em análise",
    prazo: "25/06/2026",
  },
  {
    id: "MAN-002",
    tipo: "Elogio",
    categoria: "Atendimento",
    descricao: "Equipe da UTI foi excepcional no cuidado com meu familiar.",
    data: "19/06/2026",
    status: "Resolvida",
    prazo: "26/06/2026",
  },
  {
    id: "MAN-003",
    tipo: "Sugestão",
    categoria: "Infraestrutura",
    descricao: "Sugiro ampliar o estacionamento para acompanhantes.",
    data: "18/06/2026",
    status: "Aberta",
    prazo: "28/06/2026",
  },
  {
    id: "MAN-004",
    tipo: "Reclamação",
    categoria: "Comunicação",
    descricao: "Não recebi informações sobre o procedimento antes da cirurgia.",
    data: "17/06/2026",
    status: "Em análise",
    prazo: "24/06/2026",
  },
  {
    id: "MAN-005",
    tipo: "Elogio",
    categoria: "Atendimento",
    descricao: "Enfermeira do ambulatório foi muito atenciosa e profissional.",
    data: "16/06/2026",
    status: "Resolvida",
    prazo: "23/06/2026",
  },
  {
    id: "MAN-006",
    tipo: "Sugestão",
    categoria: "Processo",
    descricao: "Seria útil ter agendamento online para exames de rotina.",
    data: "15/06/2026",
    status: "Aberta",
    prazo: "30/06/2026",
  },
];

const mockPesquisas: Pesquisa[] = [
  {
    id: "PES-001",
    titulo: "Pesquisa Pós-alta",
    descricao: "Aplicada após a saída do paciente internado",
    respostas: 148,
    meta: 200,
    status: "Ativa",
    percentual: 74,
  },
  {
    id: "PES-002",
    titulo: "Satisfação Ambulatório",
    descricao: "Avaliação das consultas ambulatoriais",
    respostas: 312,
    meta: 400,
    status: "Ativa",
    percentual: 78,
  },
  {
    id: "PES-003",
    titulo: "Avaliação Urgência",
    descricao: "Pesquisa de satisfação no pronto-socorro",
    respostas: 97,
    meta: 150,
    status: "Ativa",
    percentual: 65,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function tipoConfig(tipo: ManifestacaoTipo): {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
} {
  const map: Record<ManifestacaoTipo, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    Reclamação: {
      label: "Reclamação",
      color: "text-red-700",
      bg: "bg-red-100",
      icon: <ThumbsDown className="w-3 h-3" />,
    },
    Elogio: {
      label: "Elogio",
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      icon: <ThumbsUp className="w-3 h-3" />,
    },
    Sugestão: {
      label: "Sugestão",
      color: "text-blue-700",
      bg: "bg-blue-100",
      icon: <MessageSquare className="w-3 h-3" />,
    },
    Solicitação: {
      label: "Solicitação",
      color: "text-amber-700",
      bg: "bg-amber-100",
      icon: <ClipboardList className="w-3 h-3" />,
    },
  };
  return map[tipo];
}

function statusConfig(status: ManifestacaoStatus): {
  label: string;
  color: string;
  bg: string;
} {
  const map: Record<ManifestacaoStatus, { label: string; color: string; bg: string }> = {
    Aberta: { label: "Aberta", color: "text-red-700", bg: "bg-red-100" },
    "Em análise": { label: "Em análise", color: "text-amber-700", bg: "bg-amber-100" },
    Resolvida: { label: "Resolvida", color: "text-emerald-700", bg: "bg-emerald-100" },
  };
  return map[status];
}

function pesquisaStatusConfig(status: Pesquisa["status"]): {
  label: string;
  color: string;
  bg: string;
} {
  const map: Record<Pesquisa["status"], { label: string; color: string; bg: string }> = {
    Ativa: { label: "Ativa", color: "text-emerald-700", bg: "bg-emerald-100" },
    Encerrada: { label: "Encerrada", color: "text-gray-600", bg: "bg-gray-100" },
    Pausada: { label: "Pausada", color: "text-amber-700", bg: "bg-amber-100" },
  };
  return map[status];
}

function npsClassify(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "Excelente", color: "text-emerald-600" };
  if (score >= 50) return { label: "Bom", color: "text-blue-600" };
  if (score >= 0) return { label: "Regular", color: "text-amber-600" };
  return { label: "Crítico", color: "text-red-600" };
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyOuvidoria() {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
      <MessageSquare className="w-8 h-8 opacity-30" />
      <p className="text-sm">Cadastre manifestações para visualizar análises de satisfação.</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OuvidoriaPage() {
  const { isAdmin } = useTenant();
  const [activeTab, setActiveTab] = useState("painel-nps");

  // Mock data visível apenas para admin
  const displayNpsMensal = isAdmin ? mockNpsMensal : [];
  const displayNpsBreakdown = isAdmin ? mockNpsBreakdown : [];
  const displaySetorNps = isAdmin ? mockSetorNps : [];
  const displayManifestacoes = isAdmin ? mockManifestacoes : [];
  const displayPesquisas = isAdmin ? mockPesquisas : [];

  // KPIs
  const npsScore = isAdmin ? 72 : null;
  const satisfacaoGeral = isAdmin ? 4.3 : null;
  const reclamacoesAbertas = isAdmin ? 8 : 0;
  const tempoMedioResolucao = isAdmin ? 3.2 : null;

  const npsClass = npsScore !== null ? npsClassify(npsScore) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ouvidoria &amp; Satisfação</h1>
          <p className="text-sm text-muted-foreground">
            NPS hospitalar, manifestações e pesquisa de satisfação do paciente
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* NPS Score */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  NPS Score
                </p>
                {npsScore !== null ? (
                  <>
                    <p className="text-3xl font-bold text-slate-800">{npsScore}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${npsClass?.color}`}>
                      {npsClass?.label}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-slate-300">—</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-pink-500" />
              </div>
            </div>
            {npsScore !== null && (
              <div className="mt-3">
                <Progress value={npsScore} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Satisfação Geral */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Satisfação Geral
                </p>
                {satisfacaoGeral !== null ? (
                  <>
                    <p className="text-3xl font-bold text-slate-800">{satisfacaoGeral}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">de 5.0 pontos</p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-slate-300">—</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            {satisfacaoGeral !== null && (
              <div className="mt-3">
                <Progress value={(satisfacaoGeral / 5) * 100} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reclamações Abertas */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Reclamações Abertas
                </p>
                <p className={`text-3xl font-bold ${reclamacoesAbertas > 0 ? "text-red-600" : "text-slate-300"}`}>
                  {reclamacoesAbertas}
                </p>
                {isAdmin && (
                  <p className="text-xs text-muted-foreground mt-0.5">pendentes de resolução</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tempo Médio de Resolução */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Tempo Médio Resolução
                </p>
                {tempoMedioResolucao !== null ? (
                  <>
                    <p className="text-3xl font-bold text-slate-800">{tempoMedioResolucao}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">dias (meta: &lt; 5 dias)</p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-slate-300">—</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            {tempoMedioResolucao !== null && (
              <div className="mt-3">
                <Progress value={(tempoMedioResolucao / 5) * 100} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 h-10">
          <TabsTrigger value="painel-nps" className="text-xs font-medium">
            Painel NPS
          </TabsTrigger>
          <TabsTrigger value="manifestacoes" className="text-xs font-medium">
            Manifestações
          </TabsTrigger>
          <TabsTrigger value="por-setor" className="text-xs font-medium">
            Por Setor
          </TabsTrigger>
          <TabsTrigger value="pesquisas" className="text-xs font-medium">
            Pesquisas
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Painel NPS ─────────────────────────────────────────────── */}
        <TabsContent value="painel-nps" className="space-y-4">
          {displayNpsMensal.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <EmptyOuvidoria />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Linha NPS mensal */}
              <Card className="border-0 shadow-sm xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-500" />
                    Evolução do NPS — Jan a Jun 2026
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={displayNpsMensal} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[50, 85]}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`NPS ${value}`, "Score"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="nps"
                        stroke="#ec4899"
                        strokeWidth={2.5}
                        dot={{ fill: "#ec4899", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pizza Promotores/Neutros/Detratores */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-pink-500" />
                    Distribuição de Respostas
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={displayNpsBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {displayNpsBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                        formatter={(value: number) => [`${value}%`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-2 mt-2">
                    {displayNpsBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Manifestações ──────────────────────────────────────────── */}
        <TabsContent value="manifestacoes">
          {displayManifestacoes.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <EmptyOuvidoria />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-pink-500" />
                    Registro de Manifestações
                  </CardTitle>
                  <Badge className="bg-pink-100 text-pink-700 text-xs font-medium">
                    {displayManifestacoes.length} registros
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50/70">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          ID
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Tipo
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Categoria
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Descrição
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Data
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Prazo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayManifestacoes.map((m, idx) => {
                        const tc = tipoConfig(m.tipo);
                        const sc = statusConfig(m.status);
                        return (
                          <tr
                            key={m.id}
                            className={`border-b last:border-0 transition-colors hover:bg-slate-50/60 ${
                              idx % 2 === 0 ? "" : "bg-slate-50/30"
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.id}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.color}`}
                              >
                                {tc.icon}
                                {tc.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{m.categoria}</td>
                            <td className="px-4 py-3 text-slate-700 text-xs max-w-xs truncate" title={m.descricao}>
                              {m.descricao}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{m.data}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}
                              >
                                {m.status === "Resolvida" && <CheckCircle2 className="w-3 h-3" />}
                                {m.status === "Em análise" && <AlertTriangle className="w-3 h-3" />}
                                {m.status === "Aberta" && <AlertCircle className="w-3 h-3" />}
                                {sc.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{m.prazo}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Por Setor ──────────────────────────────────────────────── */}
        <TabsContent value="por-setor">
          {displaySetorNps.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <EmptyOuvidoria />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-pink-500" />
                  NPS por Setor Hospitalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={displaySetorNps}
                    layout="vertical"
                    margin={{ top: 4, right: 32, left: 16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="setor"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`NPS ${value}`, "Score"]}
                    />
                    <Bar dataKey="nps" radius={[0, 6, 6, 0]} fill="#ec4899">
                      {displaySetorNps.map((entry, index) => {
                        const fill =
                          entry.nps >= 75
                            ? "#10b981"
                            : entry.nps >= 60
                            ? "#3b82f6"
                            : "#f59e0b";
                        return <Cell key={`cell-${index}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Legenda de referência */}
                <div className="flex items-center gap-6 mt-4 text-xs text-slate-500 justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    Excelente (&ge;75)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    Bom (60–74)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    Regular (&lt;60)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Pesquisas ──────────────────────────────────────────────── */}
        <TabsContent value="pesquisas">
          {displayPesquisas.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <EmptyOuvidoria />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayPesquisas.map((pesquisa) => {
                const ps = pesquisaStatusConfig(pesquisa.status);
                return (
                  <Card key={pesquisa.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                            <Search className="w-4 h-4 text-pink-500" />
                          </div>
                          <CardTitle className="text-sm font-semibold leading-tight">
                            {pesquisa.titulo}
                          </CardTitle>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ps.bg} ${ps.color} whitespace-nowrap flex-shrink-0`}
                        >
                          {ps.label}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs text-muted-foreground">{pesquisa.descricao}</p>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-500">Taxa de resposta</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {pesquisa.percentual}%
                          </span>
                        </div>
                        <Progress value={pesquisa.percentual} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {pesquisa.respostas} de {pesquisa.meta} respostas
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-mono">{pesquisa.id}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50 h-7 px-2"
                        >
                          Ver detalhes
                        </Button>
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
  );
}
