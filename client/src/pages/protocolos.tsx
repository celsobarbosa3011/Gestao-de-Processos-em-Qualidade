import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookMarked, BarChart2, Workflow, GraduationCap,
  ShieldCheck, Construction, ChevronRight, TrendingUp, AlertCircle
} from "lucide-react";

const features = [
  {
    icon: <BookMarked className="w-6 h-6 text-violet-500" />,
    title: "6 Protocolos Pré-configurados",
    description: "Sepse, AVC Isquêmico, Dor Torácica, TEV, Contenção Mecânica e Prevenção de Suicídio com fluxos assistenciais completos.",
    status: "V2",
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-purple-500" />,
    title: "Indicadores de Aderência por Unidade",
    description: "Monitoramento em tempo real da aderência a cada protocolo, estratificado por unidade e período.",
    status: "V2",
  },
  {
    icon: <Workflow className="w-6 h-6 text-violet-600" />,
    title: "Fluxo Assistencial Integrado",
    description: "Cada protocolo possui fluxograma clínico integrado, com alertas de desvio e registro de aplicação.",
    status: "V2",
  },
  {
    icon: <GraduationCap className="w-6 h-6 text-purple-400" />,
    title: "Treinamento Vinculado",
    description: "Capacitação automática vinculada ao protocolo com pré e pós-teste e certificação por conclusão.",
    status: "V2",
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-violet-400" />,
    title: "Checklist de Aplicação",
    description: "Checklists digitais por protocolo com assinatura do responsável e rastreabilidade por paciente.",
    status: "V3",
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
    title: "Relatório Automático para Comissões",
    description: "Geração automática de relatórios de aderência para apresentação em comissões clínicas.",
    status: "V3",
  },
];

const protocols = [
  {
    name: "Sepse",
    code: "PROT-001",
    aderencia: 87,
    unidades: 6,
    status: "ativo",
    cor: "from-red-500 to-rose-600",
    iconColor: "text-red-500",
    alert: null,
  },
  {
    name: "AVC Isquêmico",
    code: "PROT-002",
    aderencia: 73,
    unidades: 4,
    status: "ativo",
    cor: "from-orange-500 to-amber-600",
    iconColor: "text-orange-500",
    alert: "Aderência abaixo da meta em Clínica Médica",
  },
  {
    name: "Dor Torácica / IAM",
    code: "PROT-003",
    aderencia: 91,
    unidades: 3,
    status: "ativo",
    cor: "from-pink-500 to-rose-500",
    iconColor: "text-pink-500",
    alert: null,
  },
  {
    name: "Tromboembolismo Venoso (TEV)",
    code: "PROT-004",
    aderencia: 68,
    unidades: 5,
    status: "revisão",
    cor: "from-purple-500 to-violet-600",
    iconColor: "text-purple-500",
    alert: "Protocolo em revisão — versão 2.1 em aprovação",
  },
  {
    name: "Contenção Mecânica",
    code: "PROT-005",
    aderencia: 94,
    unidades: 7,
    status: "ativo",
    cor: "from-blue-500 to-indigo-600",
    iconColor: "text-blue-500",
    alert: null,
  },
  {
    name: "Prevenção de Suicídio",
    code: "PROT-006",
    aderencia: 79,
    unidades: 4,
    status: "ativo",
    cor: "from-teal-500 to-emerald-600",
    iconColor: "text-teal-500",
    alert: null,
  },
];

const roadmap = [
  { version: "V1 (Atual)", item: "Base de processos e tipos de processos configuráveis", done: true },
  { version: "V2", item: "6 protocolos clínicos pré-configurados com fluxos e aderência", done: false },
  { version: "V2", item: "Indicadores de aderência por unidade e treinamento vinculado", done: false },
  { version: "V3", item: "Checklists de aplicação e relatórios automáticos para comissões", done: false },
];

export default function ProtocolosPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <BookMarked className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 12 — Protocolos Gerenciados</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-violet-700 border-violet-300">V2</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Gestão de protocolos clínicos institucionais com 6 protocolos pré-configurados, monitoramento de aderência por unidade, fluxo assistencial integrado e capacitação vinculada.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/kanban")}
          variant="outline"
          className="border-violet-300 text-violet-700 hover:bg-violet-50 self-start md:self-auto"
        >
          Ver Kanban
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-violet-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia da Interface — Módulo em Construção (V2)</span>
        </div>
        <p className="text-slate-500 text-sm">
          Os 6 protocolos abaixo já estão estruturados com seus dados, fluxos e indicadores. O módulo completo estará disponível na versão 2 do QHealth One.
        </p>
      </div>

      {/* Protocol Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Protocolos Clínicos — 6 Pré-configurados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((p, i) => (
            <Card key={i} className="border border-slate-200 bg-white/90 hover:shadow-lg transition-shadow overflow-hidden">
              <div className={cn("h-1.5 w-full bg-gradient-to-r", p.cor)} />
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-mono">{p.code}</p>
                    <CardTitle className="text-sm font-bold text-slate-800 mt-0.5">{p.name}</CardTitle>
                  </div>
                  <Badge className={cn(
                    "text-xs flex-shrink-0",
                    p.status === "ativo" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                  )}>
                    {p.status === "ativo" ? "Ativo" : "Em revisão"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Adherence Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">Aderência</span>
                    <span className={cn(
                      "text-sm font-bold",
                      p.aderencia >= 85 ? "text-green-600" : p.aderencia >= 70 ? "text-amber-600" : "text-red-600"
                    )}>{p.aderencia}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        p.aderencia >= 85 ? "bg-green-500" : p.aderencia >= 70 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${p.aderencia}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">{p.unidades} unidades aplicando</p>
                {p.alert && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{p.alert}</span>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-violet-600 border-violet-300" : "text-purple-600 border-purple-300"
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
