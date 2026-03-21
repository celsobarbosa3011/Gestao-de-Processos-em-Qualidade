import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GitBranch, Layers, ArrowRight, Link2, Network, Workflow,
  ChevronRight, Construction, LayoutDashboard
} from "lucide-react";

const features = [
  {
    icon: <Layers className="w-6 h-6 text-blue-500" />,
    title: "SIPOC Interativo",
    description: "Modelagem visual de Suppliers, Inputs, Process, Outputs e Customers com rastreabilidade completa.",
    status: "V2",
  },
  {
    icon: <Network className="w-6 h-6 text-indigo-500" />,
    title: "Mapa de Macroprocessos",
    description: "Hierarquia de processos institucionais organizados por nível estratégico, tático e operacional.",
    status: "V2",
  },
  {
    icon: <Workflow className="w-6 h-6 text-blue-600" />,
    title: "Fluxo Bizagi / BPMN",
    description: "Editor nativo de fluxogramas compatível com notação BPMN 2.0 para modelagem assistencial e administrativa.",
    status: "V2",
  },
  {
    icon: <Link2 className="w-6 h-6 text-indigo-600" />,
    title: "Vínculos Cruzados",
    description: "Rastreabilidade entre processos, requisitos ONA, riscos e indicadores de desempenho.",
    status: "V2",
  },
  {
    icon: <GitBranch className="w-6 h-6 text-blue-500" />,
    title: "Versionamento de Processos",
    description: "Histórico imutável de versões com comparativo de mudanças e aprovação por fluxo digital.",
    status: "V3",
  },
  {
    icon: <ArrowRight className="w-6 h-6 text-indigo-400" />,
    title: "Simulação de Fluxo",
    description: "Simulação de gargalos e tempos de ciclo baseada em dados históricos dos processos mapeados.",
    status: "V3",
  },
];

const roadmap = [
  { version: "V1 (Atual)", item: "Kanban de processos em curso", done: true },
  { version: "V2", item: "SIPOC + Mapa de macroprocessos + Editor BPMN", done: false },
  { version: "V2", item: "Vínculos ONA / Risco / Indicador", done: false },
  { version: "V3", item: "Simulação de fluxo e análise de gargalos", done: false },
];

export default function ProcessosPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Workflow className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 6 — Processos</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300">SIPOC + Bizagi</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Mapeamento, modelagem e governança de processos institucionais com notação BPMN, SIPOC interativo e vínculos cruzados com ONA, Riscos e Indicadores.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/kanban")}
          className="bg-blue-600 hover:bg-blue-700 text-white self-start md:self-auto"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Ver Kanban
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-blue-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia da Interface — Módulo em Construção</span>
        </div>
        <p className="text-slate-500 text-sm">
          As funcionalidades abaixo estão planejadas para as versões V2 e V3. A versão atual oferece o Kanban de gestão de processos em andamento. Clique em <strong>"Ver Kanban"</strong> para acessar o que já está disponível.
        </p>
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Funcionalidades Planejadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Card key={i} className="border border-slate-200 bg-white/80 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-blue-600 border-blue-300" : "text-purple-600 border-purple-300"
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

      {/* SIPOC Preview Mockup */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Preview — SIPOC Visual</h2>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm overflow-x-auto">
          <div className="flex gap-3 min-w-[700px]">
            {["Fornecedores", "Entradas", "Processo", "Saídas", "Clientes"].map((col, i) => (
              <div key={i} className={cn(
                "flex-1 rounded-xl p-3 border",
                i === 2
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              )}>
                <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", i === 2 ? "text-blue-100" : "text-slate-400")}>{col}</p>
                {[1, 2, 3].map((j) => (
                  <div key={j} className={cn(
                    "text-xs rounded-lg p-2 mb-1",
                    i === 2 ? "bg-blue-500 text-blue-100" : "bg-white border border-slate-200 text-slate-500"
                  )}>
                    {i === 2 ? `Etapa ${j}` : `Item ${j}`}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Roadmap</h2>
        <div className="space-y-3">
          {roadmap.map((r, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className={cn(
                "w-3 h-3 rounded-full flex-shrink-0",
                r.done ? "bg-green-500" : "bg-slate-300"
              )} />
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
