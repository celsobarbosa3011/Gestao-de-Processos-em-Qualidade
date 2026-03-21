import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  HeartPulse, TrendingUp, AlertTriangle, ClipboardList,
  Activity, BarChart3, Construction, ChevronRight
} from "lucide-react";

const features = [
  {
    icon: <BarChart3 className="w-6 h-6 text-rose-500" />,
    title: "Painel Clínico Executivo",
    description: "Dashboard consolidado com indicadores de mortalidade, reinternação, infecção relacionada à assistência e segurança do paciente.",
    status: "V2",
  },
  {
    icon: <HeartPulse className="w-6 h-6 text-pink-500" />,
    title: "Desfechos por Linha de Cuidado",
    description: "Acompanhamento de desfechos clínicos estratificados por patologia, unidade e período com benchmarking setorial.",
    status: "V2",
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-rose-600" />,
    title: "Indicadores Clínicos com Série Histórica",
    description: "Gráficos de tendência com limites de controle estatístico (UCL/LCL) e detecção automática de desvios.",
    status: "V2",
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    title: "Desvios Assistenciais com Geração de Ação",
    description: "Identificação de desvios e geração automática de Plano de Ação vinculado ao indicador e à unidade responsável.",
    status: "V2",
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-pink-600" />,
    title: "Comissões Clínicas Integradas",
    description: "Gestão de CCIHs, CMEs e outras comissões com pautas, atas e indicadores próprios.",
    status: "V3",
  },
  {
    icon: <Activity className="w-6 h-6 text-rose-400" />,
    title: "Alertas Automáticos de Desvio",
    description: "Notificações em tempo real para gestores quando indicadores ultrapassam limites estabelecidos.",
    status: "V3",
  },
];

const mockIndicators = [
  { name: "Taxa de Mortalidade Geral", value: "3,2%", meta: "≤ 4,0%", status: "ok", unit: "Geral" },
  { name: "Taxa de Reinternação 30 dias", value: "8,7%", meta: "≤ 8,0%", status: "warn", unit: "Clínica Médica" },
  { name: "Densidade de IRAS (ICSAC)", value: "1,8 /1000 cvc-d", meta: "≤ 2,5", status: "ok", unit: "UTI Adulto" },
  { name: "Taxa de Úlcera por Pressão", value: "1,1%", meta: "≤ 1,5%", status: "ok", unit: "Oncologia" },
  { name: "Tempo Porta-Balão (IAM)", value: "74 min", meta: "≤ 90 min", status: "ok", unit: "Hemodinâmica" },
];

const roadmap = [
  { version: "V1 (Atual)", item: "Indicadores de qualidade no Dashboard principal", done: true },
  { version: "V2", item: "Painel clínico executivo com desfechos e benchmarking", done: false },
  { version: "V2", item: "Desvios assistenciais com geração de ação automática", done: false },
  { version: "V3", item: "Comissões clínicas integradas e alertas em tempo real", done: false },
];

export default function GovernancaClinicaPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 8 — Governança Clínica</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-rose-700 border-rose-300">V2</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Painel executivo de desfechos clínicos, indicadores assistenciais com série histórica e detecção automática de desvios com geração de planos de ação.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          className="border-rose-300 text-rose-700 hover:bg-rose-50 self-start md:self-auto"
        >
          Ver Dashboard
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-rose-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia da Interface — Módulo em Construção (V2)</span>
        </div>
        <p className="text-slate-500 text-sm">
          Este módulo estará disponível na versão 2 do QHealth One. A prévia abaixo demonstra os indicadores e funcionalidades que serão entregues.
        </p>
      </div>

      {/* Mock Indicators Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Preview — Painel de Indicadores Clínicos</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm overflow-hidden">
          <div className="grid grid-cols-5 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">
            <span className="col-span-2">Indicador</span>
            <span>Resultado</span>
            <span>Meta</span>
            <span>Status</span>
          </div>
          {mockIndicators.map((ind, i) => (
            <div key={i} className={cn(
              "grid grid-cols-5 px-4 py-3 text-sm items-center border-b border-slate-100 last:border-0",
              i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            )}>
              <div className="col-span-2">
                <p className="font-medium text-slate-700">{ind.name}</p>
                <p className="text-xs text-slate-400">{ind.unit}</p>
              </div>
              <span className={cn("font-bold text-base", ind.status === "ok" ? "text-green-600" : "text-amber-600")}>{ind.value}</span>
              <span className="text-slate-500 text-xs">{ind.meta}</span>
              <Badge className={cn(
                "w-fit text-xs",
                ind.status === "ok"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              )}>
                {ind.status === "ok" ? "Dentro da meta" : "Atenção"}
              </Badge>
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
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-rose-600 border-rose-300" : "text-purple-600 border-purple-300"
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
