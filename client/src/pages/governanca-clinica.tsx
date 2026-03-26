import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "sonner";
import { printReport } from "@/lib/print-pdf";
import { getIndicators } from "@/lib/api";
import {
  HeartPulse, TrendingUp, AlertTriangle, ChevronRight,
  Activity, BarChart3, Building2, Users, AlertCircle,
  CheckCircle2, Download, Filter, Star, Eye, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine
} from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const clinicalIndicators = [
  {
    id: 1, code: "IGC-001", name: "Taxa de Mortalidade Institucional",
    value: 4.2, unit: "%", target: 5.0, benchmark: 3.8,
    trend: "down", status: "ok",
    category: "Desfecho",
    description: "Óbitos / Total de saídas × 100",
    lastUpdate: "Mar/26",
    history: [4.8, 4.6, 4.5, 4.3, 4.2, 4.2],
  },
  {
    id: 2, code: "IGC-002", name: "Taxa de Reinternação em 30 dias",
    value: 8.7, unit: "%", target: 8.0, benchmark: 7.5,
    trend: "up", status: "alert",
    category: "Desfecho",
    description: "Reinternações ≤30 dias / Total de altas × 100",
    lastUpdate: "Mar/26",
    history: [7.9, 8.1, 8.3, 8.5, 8.6, 8.7],
  },
  {
    id: 3, code: "IGC-003", name: "Densidade de IPCS — UTI",
    value: 1.8, unit: "/1.000 CVC-dia", target: 2.0, benchmark: 1.5,
    trend: "stable", status: "ok",
    category: "Segurança",
    description: "Infecções Primárias da Corrente Sanguínea / 1.000 dias de CVC",
    lastUpdate: "Mar/26",
    history: [2.1, 2.0, 1.9, 1.8, 1.9, 1.8],
  },
  {
    id: 4, code: "IGC-004", name: "Taxa de Infecção do Sítio Cirúrgico",
    value: 2.1, unit: "%", target: 2.5, benchmark: 1.8,
    trend: "stable", status: "ok",
    category: "Segurança",
    description: "ISC / Total de procedimentos cirúrgicos × 100",
    lastUpdate: "Mar/26",
    history: [2.4, 2.3, 2.2, 2.1, 2.2, 2.1],
  },
  {
    id: 5, code: "IGC-005", name: "Queda de Paciente com Dano",
    value: 0.8, unit: "/1.000 paciente-dia", target: 1.0, benchmark: 0.6,
    trend: "up", status: "alert",
    category: "Segurança",
    description: "Quedas com dano / 1.000 pacientes-dia",
    lastUpdate: "Mar/26",
    history: [0.5, 0.6, 0.7, 0.7, 0.8, 0.8],
  },
  {
    id: 6, code: "IGC-006", name: "Tempo Médio de Permanência — UTI",
    value: 6.4, unit: "dias", target: 7.0, benchmark: 5.8,
    trend: "stable", status: "ok",
    category: "Processo",
    description: "Soma dos dias de internação UTI / Total de saídas UTI",
    lastUpdate: "Mar/26",
    history: [6.8, 6.7, 6.5, 6.5, 6.4, 6.4],
  },
];

const monthLabels = ["Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26"];

const mortalityTrend = monthLabels.map((month, i) => ({
  month,
  mortalidade: clinicalIndicators[0].history[i],
  meta: 5.0,
}));

const reinternacaoTrend = monthLabels.map((month, i) => ({
  month,
  reinternacao: clinicalIndicators[1].history[i],
  meta: 8.0,
}));

const unitRanking = [
  { unit: "UTI Adulto",       score: 91, desfecho: 95, seguranca: 90, processo: 88 },
  { unit: "Centro Obstétrico", score: 88, desfecho: 90, seguranca: 88, processo: 86 },
  { unit: "Pronto-Socorro",    score: 82, desfecho: 80, seguranca: 85, processo: 81 },
  { unit: "Internação",        score: 78, desfecho: 78, seguranca: 80, processo: 76 },
  { unit: "Centro Cirúrgico",  score: 76, desfecho: 75, seguranca: 78, processo: 75 },
];

const alerts = [
  { id: 1, indicator: "IGC-002 — Reinternação 30 dias", message: "Acima da meta por 3 meses consecutivos", severity: "alta", unit: "Internação" },
  { id: 2, indicator: "IGC-005 — Queda com dano", message: "Tendência de alta — 4 eventos em Mar/26", severity: "media", unit: "PS + Internação" },
  { id: 3, indicator: "IGC-003 — IPCS UTI", message: "Acima do benchmark nacional (1.5)", severity: "baixa", unit: "UTI Adulto" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function indicatorStatus(ind: typeof clinicalIndicators[0]) {
  if (ind.status === "alert") return { cls: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" };
  if (ind.status === "critical") return { cls: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" };
  return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
}

function severityMeta(s: string) {
  if (s === "alta") return "bg-rose-100 text-rose-700 border-rose-200";
  if (s === "media") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

function scoreBg(score: number) {
  if (score >= 85) return "text-emerald-700";
  if (score >= 75) return "text-amber-700";
  return "text-rose-700";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GovernancaClinical() {
  const { isAdmin } = useTenant();
  const [, navigate] = useLocation();
  const [filterCat, setFilterCat] = useState("all");

  // Load clinical indicators from DB (safety + operational layers)
  const { data: dbIndicators } = useQuery({
    queryKey: ["indicators", "clinical"],
    queryFn: () => getIndicators("safety"),
    staleTime: 60_000,
  });

  // Use DB indicators if available, mapped to local format; else fallback to mock
  const displayIndicators = (dbIndicators && dbIndicators.length > 0)
    ? dbIndicators.map(ind => ({
        id: ind.id,
        code: ind.code || `IGC-${ind.id.toString().padStart(3, "0")}`,
        name: ind.name,
        value: 0,
        unit: ind.unit,
        target: parseFloat(ind.target || "0"),
        benchmark: 0,
        trend: "stable" as const,
        status: "ok" as const,
        category: ind.category || "Operacional",
        description: ind.description || ind.formula || "",
        lastUpdate: "—",
        history: [0, 0, 0, 0, 0, 0],
      }))
    : (isAdmin ? clinicalIndicators : []);

  const displayAlerts = isAdmin ? alerts : [];
  const displayUnitRanking = isAdmin ? unitRanking : [];

  const filtered = displayIndicators.filter(
    (i) => filterCat === "all" || i.category === filterCat
  );

  const alertCount = displayIndicators.filter((i) => i.status === "alert").length;
  const okCount = displayIndicators.filter((i) => i.status === "ok").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate("/")}>Início</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Governança Clínica</span>
            <Badge className="ml-2 bg-rose-100 text-rose-700 border border-rose-200 text-xs px-2 py-0.5">Módulo 8</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <HeartPulse className="w-7 h-7 text-rose-500" />
                Governança Clínica
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Painel de indicadores clínicos · Desfechos, segurança e processo por unidade
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" className="border-slate-200 text-slate-600 gap-2 text-sm" onClick={() => printReport({ title: "Relatório de Governança Clínica", subtitle: "Indicadores clínicos · Desfechos, segurança e processo por unidade", module: "Governança Clínica", kpis: [{ label: "Taxa Mortalidade", value: "1.8%", color: "#dc2626" }, { label: "Reinternação 30d", value: "3.2%", color: "#f59e0b" }, { label: "Infecção IACS", value: "1.2%", color: "#0ea5e9" }, { label: "Satisfação", value: "92%", color: "#10b981" }], columns: [{ label: "Indicador Clínico", key: "ind" }, { label: "Unidade", key: "unidade" }, { label: "Resultado", key: "result" }, { label: "Meta", key: "meta" }, { label: "Status", key: "status" }], rows: [{ ind: "Taxa de mortalidade hospitalar", unidade: "Geral", result: "1.8%", meta: "≤ 2.5%", status: "✓ Meta atingida" }, { ind: "Taxa de infecção associada à assistência", unidade: "UTI", result: "2.1%", meta: "≤ 2.0%", status: "⚠ Acima da meta" }, { ind: "Cirurgias seguras com checklist", unidade: "CC", result: "94%", meta: "100%", status: "⚠ Monitorar" }, { ind: "Reinternação em 30 dias", unidade: "Clínica Médica", result: "3.2%", meta: "≤ 4%", status: "✓ Meta atingida" }, { ind: "Satisfação do paciente", unidade: "Geral", result: "92%", meta: "≥ 90%", status: "✓ Meta atingida" }] })}>
                <Download className="w-4 h-4" />
                Relatório
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Indicadores OK", value: okCount, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Em Alerta", value: alertCount, icon: <AlertCircle className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50", text: "text-amber-700" },
            { label: "Alertas Abertos", value: displayAlerts.length, icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, bg: "bg-rose-50", text: "text-rose-700" },
            { label: "Unidades Avaliadas", value: displayUnitRanking.length, icon: <Building2 className="w-5 h-5 text-sky-500" />, bg: "bg-sky-50", text: "text-sky-700" },
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

        {/* ── Alerts Banner ── */}
        {displayAlerts.length > 0 && (
          <Card className="bg-amber-50 border border-amber-200 shadow-sm mb-5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">{displayAlerts.length} alertas ativos de governança clínica</span>
              </div>
              <div className="space-y-2">
                {displayAlerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-amber-100">
                    <Badge className={cn("text-xs border flex-shrink-0 mt-0.5", severityMeta(a.severity))}>
                      {a.severity === "alta" ? "Alta" : a.severity === "media" ? "Média" : "Baixa"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{a.indicator}</p>
                      <p className="text-xs text-slate-500">{a.message} · {a.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="indicadores">
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto mb-5">
            <TabsTrigger value="indicadores" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Indicadores Clínicos
            </TabsTrigger>
            <TabsTrigger value="tendencias" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Tendências
            </TabsTrigger>
            <TabsTrigger value="unidades" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Score por Unidade
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Indicadores Clínicos
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="indicadores" className="space-y-4">
            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />Categoria:
              </div>
              {["all", "Desfecho", "Segurança", "Processo"].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    filterCat === c
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-rose-300"
                  )}
                >
                  {c === "all" ? "Todos" : c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ind) => {
                const sm = indicatorStatus(ind);
                const pctOfTarget = Math.min(100, Math.round((ind.value / ind.target) * 100));
                const isGood = ind.status === "ok";
                return (
                  <Card key={ind.id} className={cn(
                    "bg-white border shadow-sm",
                    ind.status === "alert" ? "border-amber-200" : "border-slate-200"
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs font-mono text-slate-400 mb-0.5">{ind.code}</p>
                          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{ind.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{ind.category} · {ind.lastUpdate}</p>
                        </div>
                        <Badge className={cn("text-xs border flex-shrink-0 ml-2", sm.cls)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full mr-1", sm.dot)} />
                          {ind.status === "ok" ? "OK" : "Alerta"}
                        </Badge>
                      </div>

                      <div className="flex items-end gap-2 mb-3">
                        <span className={cn("text-3xl font-extrabold", isGood ? "text-emerald-700" : "text-amber-700")}>
                          {ind.value}
                        </span>
                        <span className="text-sm text-slate-400 mb-1">{ind.unit}</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Meta: {ind.target} {ind.unit}</span>
                          <span>Benchmark: {ind.benchmark} {ind.unit}</span>
                        </div>
                      </div>

                      {/* Mini trend */}
                      <div className="mt-3 h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={ind.history.map((v, i) => ({ v, i }))}>
                            <Line type="monotone" dataKey="v" stroke={isGood ? "#10b981" : "#f59e0b"} strokeWidth={1.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">{ind.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Tendências
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="tendencias" className="space-y-5">
            {!isAdmin ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                <Activity className="w-8 h-8 opacity-30" />
                <p className="text-sm">Tendências disponíveis após registro de indicadores clínicos.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500" />
                    Taxa de Mortalidade (%)
                  </CardTitle>
                  <p className="text-xs text-slate-400">Meta: ≤ 5,0% · Benchmark: 3,8%</p>
                </CardHeader>
                <CardContent className="px-4 pb-5 pt-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={mortalityTrend} margin={{ top: 4, right: 16, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[3, 6]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`${v}%`, ""]} />
                      <ReferenceLine y={5.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Meta", position: "right", fontSize: 10, fill: "#f59e0b" }} />
                      <Line type="monotone" dataKey="mortalidade" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: "#f43f5e" }} name="Mortalidade" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Taxa de Reinternação em 30 dias (%)
                  </CardTitle>
                  <p className="text-xs text-slate-400">Meta: ≤ 8,0% · Benchmark: 7,5%</p>
                </CardHeader>
                <CardContent className="px-4 pb-5 pt-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={reinternacaoTrend} margin={{ top: 4, right: 16, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[7, 10]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [`${v}%`, ""]} />
                      <ReferenceLine y={8.0} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Meta", position: "right", fontSize: 10, fill: "#f59e0b" }} />
                      <Line type="monotone" dataKey="reinternacao" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: "#f97316" }} name="Reinternação" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — Score por Unidade
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="unidades" className="space-y-5">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="px-6 pt-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-500" />
                  Score Consolidado de Governança por Unidade
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-4 pb-5">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={displayUnitRanking} margin={{ top: 4, right: 16, left: -15, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="unit" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
                    <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Meta 80", position: "right", fontSize: 10, fill: "#10b981" }} />
                    <Bar dataKey="desfecho" name="Desfecho" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="seguranca" name="Segurança" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="processo" name="Processo" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayUnitRanking.map((u) => (
                <Card key={u.unit} className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{u.unit}</span>
                      </div>
                      <span className={cn("text-2xl font-extrabold", scoreBg(u.score))}>{u.score}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Desfecho", value: u.desfecho, color: "bg-rose-500" },
                        { label: "Segurança", value: u.seguranca, color: "bg-orange-500" },
                        { label: "Processo", value: u.processo, color: "bg-violet-500" },
                      ].map((bar) => (
                        <div key={bar.label}>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{bar.label}</span>
                            <span className="font-semibold">{bar.value}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={cn("h-full rounded-full", bar.color)} style={{ width: `${bar.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
