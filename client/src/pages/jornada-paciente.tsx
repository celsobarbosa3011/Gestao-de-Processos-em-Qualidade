import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  UserCheck, AlertOctagon, ArrowRightLeft, Gauge, BookOpen,
  Map, Construction, ChevronRight, Clock, Users
} from "lucide-react";

const features = [
  {
    icon: <Map className="w-6 h-6 text-teal-500" />,
    title: "Mapa Swimlane Visual",
    description: "Visualização da jornada do paciente em raias por setor, com etapas, tempos e responsáveis claramente identificados.",
    status: "V2",
  },
  {
    icon: <AlertOctagon className="w-6 h-6 text-red-500" />,
    title: "Rupturas Críticas Identificadas",
    description: "Detecção automática de rupturas na jornada — falhas de comunicação, atrasos e ausência de protocolos.",
    status: "V2",
  },
  {
    icon: <ArrowRightLeft className="w-6 h-6 text-teal-600" />,
    title: "Handoffs entre Setores",
    description: "Mapeamento de todos os pontos de transferência entre unidades com identificação de riscos de transição.",
    status: "V2",
  },
  {
    icon: <Gauge className="w-6 h-6 text-emerald-600" />,
    title: "Gargalos com Frequência",
    description: "Análise de frequência e impacto de gargalos com priorização por volume e criticidade assistencial.",
    status: "V2",
  },
  {
    icon: <BookOpen className="w-6 h-6 text-teal-400" />,
    title: "Vínculo com Protocolos e Riscos",
    description: "Cada etapa da jornada vinculada a protocolos clínicos e riscos mapeados para rastreabilidade total.",
    status: "V2",
  },
  {
    icon: <UserCheck className="w-6 h-6 text-emerald-500" />,
    title: "Voz do Paciente",
    description: "Integração com pesquisas de experiência do paciente por etapa da jornada com análise de sentimento.",
    status: "V3",
  },
];

const swimlaneSteps = [
  { sector: "Recepção", steps: ["Chegada", "Triagem", "Registro"], color: "bg-teal-100 border-teal-300 text-teal-700" },
  { sector: "Pronto Atendimento", steps: ["Avaliação Médica", "Exames", "Reavaliação"], color: "bg-emerald-100 border-emerald-300 text-emerald-700" },
  { sector: "Internação", steps: ["Admissão", "Evolução", "Plano Terapêutico"], color: "bg-blue-100 border-blue-300 text-blue-700" },
  { sector: "Alta", steps: ["Orientações", "Prescrição", "Relatório"], color: "bg-violet-100 border-violet-300 text-violet-700" },
];

const gargalos = [
  { etapa: "Aguardo de leito (PA → Internação)", frequencia: 87, impacto: "Alto", tempo: "4h 32min" },
  { etapa: "Resultado de exames laboratoriais", frequencia: 64, impacto: "Médio", tempo: "1h 18min" },
  { etapa: "Assinatura médica para alta", frequencia: 41, impacto: "Médio", tempo: "2h 05min" },
  { etapa: "Dispensação farmacêutica", frequencia: 29, impacto: "Baixo", tempo: "38min" },
];

const roadmap = [
  { version: "V1 (Atual)", item: "Processos no Kanban com etapas configuráveis", done: true },
  { version: "V2", item: "Mapa Swimlane visual com handoffs e gargalos", done: false },
  { version: "V2", item: "Rupturas críticas e vínculo com protocolos/riscos", done: false },
  { version: "V3", item: "Voz do paciente integrada por etapa da jornada", done: false },
];

export default function JornadaPacientePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 11 — Jornada do Paciente</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-teal-700 border-teal-300">V2</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Mapeamento visual da jornada do paciente em swimlane, identificação de rupturas críticas, handoffs entre setores e gargalos com análise de frequência e impacto.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/timeline")}
          variant="outline"
          className="border-teal-300 text-teal-700 hover:bg-teal-50 self-start md:self-auto"
        >
          Ver Timeline
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-teal-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia da Interface — Módulo em Construção (V2)</span>
        </div>
        <p className="text-slate-500 text-sm">
          O Módulo de Jornada do Paciente estará disponível na versão 2. A seguir, uma prévia das funcionalidades e dados que serão apresentados.
        </p>
      </div>

      {/* Swimlane Preview */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Preview — Mapa Swimlane</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm space-y-3">
          {swimlaneSteps.map((lane, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-36 flex-shrink-0">
                <span className={cn("text-xs font-semibold px-2 py-1 rounded-lg border", lane.color)}>{lane.sector}</span>
              </div>
              <div className="flex gap-2 flex-1 flex-wrap">
                {lane.steps.map((step, j) => (
                  <div key={j} className="flex items-center gap-1">
                    <div className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", lane.color)}>
                      {step}
                    </div>
                    {j < lane.steps.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                ))}
                {i < swimlaneSteps.length - 1 && (
                  <Badge className="ml-auto bg-red-100 text-red-600 text-xs border-red-200 self-center">
                    Handoff
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gargalos Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Preview — Gargalos Identificados</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">
            <span className="col-span-2">Etapa / Gargalo</span>
            <span>Frequência</span>
            <span>Tempo Médio</span>
          </div>
          {gargalos.map((g, i) => (
            <div key={i} className={cn(
              "grid grid-cols-4 px-4 py-3 text-sm items-center border-b border-slate-100 last:border-0",
              i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            )}>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-slate-700 font-medium">{g.etapa}</span>
                <Badge className={cn(
                  "text-xs ml-1",
                  g.impacto === "Alto" ? "bg-red-100 text-red-700" :
                  g.impacto === "Médio" ? "bg-amber-100 text-amber-700" :
                  "bg-green-100 text-green-700"
                )}>{g.impacto}</Badge>
              </div>
              <span className="text-slate-600 font-bold">{g.frequencia}x/mês</span>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{g.tempo}</span>
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
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-teal-600 border-teal-300" : "text-purple-600 border-purple-300"
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
