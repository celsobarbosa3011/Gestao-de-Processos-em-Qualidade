import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Target, MapPin, Calendar, Building2,
  TrendingUp, BarChart3, Construction, ChevronRight, Layers
} from "lucide-react";

const features = [
  {
    icon: <MapPin className="w-6 h-6 text-amber-500" />,
    title: "Mapa Estratégico Visual — 4 Perspectivas",
    description: "Mapa estratégico interativo nas perspectivas Financeira, Cliente, Processos Internos e Aprendizado & Crescimento.",
    status: "V2",
  },
  {
    icon: <Target className="w-6 h-6 text-orange-500" />,
    title: "Objetivos Estratégicos",
    description: "Cadastro e acompanhamento de objetivos estratégicos com responsáveis, indicadores e metas anuais.",
    status: "V2",
  },
  {
    icon: <Calendar className="w-6 h-6 text-amber-600" />,
    title: "Iniciativas com Cronograma",
    description: "Gestão de iniciativas estratégicas com cronograma Gantt integrado, marcos e status de execução.",
    status: "V2",
  },
  {
    icon: <Building2 className="w-6 h-6 text-orange-600" />,
    title: "Desdobramento por Unidade",
    description: "Desdobramento do planejamento estratégico por unidade assistencial com scorecards individuais.",
    status: "V2",
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
    title: "Análise de Execução Estratégica",
    description: "Dashboard de execução com semáforo por objetivo e análise de desvio em relação ao planejado.",
    status: "V3",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-orange-400" />,
    title: "Reunião Estratégica Integrada",
    description: "Pauta automatizada para reuniões de acompanhamento estratégico com registro de decisões e ações.",
    status: "V3",
  },
];

const perspectives = [
  {
    name: "Financeira",
    color: "from-green-500 to-emerald-600",
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    objectives: ["Sustentabilidade financeira", "Crescimento de receita", "Controle de custos assistenciais"],
  },
  {
    name: "Cliente / Paciente",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    objectives: ["Satisfação do paciente ≥ 90%", "Redução de tempo de espera", "Fidelização e vínculo"],
  },
  {
    name: "Processos Internos",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    objectives: ["Excelência assistencial", "Segurança do paciente", "Acreditação ONA / JCI"],
  },
  {
    name: "Aprendizado & Crescimento",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 border-violet-200",
    text: "text-violet-700",
    objectives: ["Capacitação contínua", "Cultura de qualidade", "Inovação tecnológica"],
  },
];

const initiatives = [
  { name: "Implementação QHealth One", progresso: 60, prazo: "Dez/2025", status: "Em andamento" },
  { name: "Acreditação ONA Nível 3", progresso: 35, prazo: "Jun/2026", status: "Em andamento" },
  { name: "Programa Lean Healthcare", progresso: 20, prazo: "Mar/2026", status: "Iniciando" },
  { name: "Expansão UTI Adulto", progresso: 80, prazo: "Out/2025", status: "Em andamento" },
];

const roadmap = [
  { version: "V1 (Atual)", item: "Indicadores estratégicos no Dashboard", done: true },
  { version: "V2", item: "Mapa estratégico BSC visual com 4 perspectivas", done: false },
  { version: "V2", item: "Objetivos, iniciativas e desdobramento por unidade", done: false },
  { version: "V3", item: "Análise de execução e reunião estratégica integrada", done: false },
];

export default function PlanejamentoBSCPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 13 — Planejamento Estratégico (BSC)</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-amber-700 border-amber-300">V2</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Mapa estratégico visual nas 4 perspectivas do BSC, gestão de objetivos e iniciativas estratégicas com cronograma e desdobramento por unidade assistencial.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-50 self-start md:self-auto"
        >
          Ver Dashboard
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-amber-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia da Interface — Módulo em Construção (V2)</span>
        </div>
        <p className="text-slate-500 text-sm">
          O Módulo de Planejamento Estratégico estará disponível na versão 2. A seguir, uma prévia do mapa estratégico e das iniciativas que serão gerenciadas.
        </p>
      </div>

      {/* BSC Map Preview */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Preview — Mapa Estratégico BSC</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {perspectives.map((p, i) => (
            <div key={i} className={cn("rounded-2xl border p-4", p.bg)}>
              <div className={cn("flex items-center gap-2 mb-3")}>
                <div className={cn("w-1 h-6 rounded-full bg-gradient-to-b", p.color)} />
                <h3 className={cn("font-bold text-sm", p.text)}>{p.name}</h3>
              </div>
              <div className="space-y-2">
                {p.objectives.map((obj, j) => (
                  <div key={j} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 bg-white/80 border", p.bg.replace("bg-", "border-").split(" ")[1])}>
                    <Target className={cn("w-3 h-3 flex-shrink-0", p.text)} />
                    <span className={cn("text-xs font-medium", p.text)}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Initiatives */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Preview — Iniciativas Estratégicas</h2>
        <div className="space-y-3">
          {initiatives.map((init, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-700 text-sm">{init.name}</p>
                  <p className="text-xs text-slate-400">Prazo: {init.prazo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">{init.status}</Badge>
                  <span className="text-sm font-bold text-slate-700">{init.progresso}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  style={{ width: `${init.progresso}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Funcionalidades Planejadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card key={i} className="border border-slate-200 bg-white/80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-amber-600 border-amber-300" : "text-purple-600 border-purple-300"
                  )}>
                    {f.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-semibold text-slate-800 mt-2">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Roadmap</h2>
        <div className="space-y-3">
          {roadmap.map((r, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className={cn("w-3 h-3 rounded-full flex-shrink-0", r.done ? "bg-green-500" : "bg-slate-300")} />
              <Badge variant="outline" className={cn(
                "text-xs font-semibold flex-shrink-0",
                r.done ? "text-green-700 border-green-300 bg-green-50" : "text-slate-600 border-slate-300"
              )}>
                {r.version}
              </Badge>
              <span className={cn("text-sm", r.done ? "text-slate-700 font-medium" : "text-slate-500")}>{r.item}</span>
              {r.done && <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Disponível</Badge>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
