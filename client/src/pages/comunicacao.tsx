import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Megaphone, Calendar, CheckCheck, Bell,
  MessageSquare, Newspaper, Construction, ChevronRight,
  Users, Eye, Pin
} from "lucide-react";

const features = [
  {
    icon: <Newspaper className="w-6 h-6 text-cyan-500" />,
    title: "Mural Institucional",
    description: "Mural digital para publicação de comunicados, avisos, notícias e informativos institucionais com destaque e categorias.",
    status: "V2",
  },
  {
    icon: <Megaphone className="w-6 h-6 text-sky-500" />,
    title: "Campanhas com Prazo",
    description: "Criação de campanhas de comunicação com data de início e fim, público-alvo específico e acompanhamento de alcance.",
    status: "V2",
  },
  {
    icon: <CheckCheck className="w-6 h-6 text-cyan-600" />,
    title: "Confirmação de Leitura",
    description: "Avisos críticos com confirmação de leitura obrigatória — relatório de quem leu e quem ainda não visualizou.",
    status: "V2",
  },
  {
    icon: <Bell className="w-6 h-6 text-sky-600" />,
    title: "Avisos Automáticos",
    description: "Geração automática de comunicados a partir de eventos do sistema (nova norma publicada, prazo de revisão, etc.).",
    status: "V2",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-cyan-400" />,
    title: "Canais Segmentados",
    description: "Comunicação direcionada por unidade, cargo ou grupo — evita sobrecarga de informação para quem não é o público.",
    status: "V3",
  },
  {
    icon: <Calendar className="w-6 h-6 text-sky-400" />,
    title: "Agenda Institucional Integrada",
    description: "Calendário de eventos, treinamentos, reuniões e campanhas com visão integrada e inscrição online.",
    status: "V3",
  },
];

const announcements = [
  {
    title: "Implantação do QHealth One — Fase 2",
    categoria: "Sistema",
    autor: "Diretoria de Qualidade",
    data: "18/03/2026",
    destaque: true,
    leituras: 47,
    total: 80,
    confirmacao: true,
    cor: "border-l-blue-500",
    bgCor: "bg-blue-50",
  },
  {
    title: "Campanha de Vacinação — Influenza 2026",
    categoria: "Saúde do Colaborador",
    autor: "Medicina do Trabalho",
    data: "15/03/2026",
    destaque: false,
    leituras: 112,
    total: 210,
    confirmacao: false,
    cor: "border-l-green-500",
    bgCor: "bg-green-50",
  },
  {
    title: "Atualização da Política de Gestão de Resíduos",
    categoria: "Normativa",
    autor: "SESMT",
    data: "10/03/2026",
    destaque: false,
    leituras: 33,
    total: 55,
    confirmacao: true,
    cor: "border-l-amber-500",
    bgCor: "bg-amber-50",
  },
  {
    title: "Semana de Segurança do Paciente — Programação",
    categoria: "Evento",
    autor: "Núcleo de Qualidade",
    data: "05/03/2026",
    destaque: true,
    leituras: 89,
    total: 89,
    confirmacao: false,
    cor: "border-l-rose-500",
    bgCor: "bg-rose-50",
  },
];

const roadmap = [
  { version: "V1 (Atual)", item: "Central de notificações de processos e eventos do sistema", done: true },
  { version: "V2", item: "Mural institucional com campanhas e confirmação de leitura", done: false },
  { version: "V2", item: "Avisos automáticos gerados por eventos do sistema", done: false },
  { version: "V3", item: "Canais segmentados e agenda institucional integrada", done: false },
];

export default function ComunicacaoPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-sky-50 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">Módulo 18 — Comunicação Interna</h1>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <Construction className="w-3 h-3 mr-1" /> Em desenvolvimento
              </Badge>
              <Badge variant="outline" className="text-cyan-700 border-cyan-300">V2</Badge>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Mural institucional, campanhas com prazo, confirmação de leitura obrigatória e avisos automáticos gerados pelos eventos do sistema.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 self-start md:self-auto"
          disabled
        >
          Em breve
        </Button>
      </div>

      {/* Preview Banner */}
      <div className="rounded-2xl border border-cyan-200 bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Construction className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-slate-700">Prévia do Mural — Módulo em Construção (V2)</span>
        </div>
        <p className="text-slate-500 text-sm">
          O Módulo de Comunicação Interna estará disponível na versão 2. A seguir, uma prévia do mural e dos comunicados institucionais.
        </p>
      </div>

      {/* Announcements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700">Mural Institucional — {announcements.length} comunicados</h2>
          <Button size="sm" disabled className="opacity-50 cursor-not-allowed bg-cyan-600 text-white">
            + Novo Comunicado
          </Button>
        </div>
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <div key={i} className={cn(
              "rounded-xl border-l-4 border border-slate-200 bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow",
              a.cor
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {a.destaque && (
                      <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <p className="font-semibold text-slate-800 text-sm">{a.title}</p>
                    {a.confirmacao && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Confirmação obrigatória</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <Badge variant="outline" className="text-xs text-cyan-600 border-cyan-200 bg-cyan-50">{a.categoria}</Badge>
                    <span>{a.autor}</span>
                    <span>{a.data}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Eye className="w-3 h-3" />
                    <span className="font-medium">{a.leituras}/{a.total}</span>
                  </div>
                  <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all"
                      style={{ width: `${(a.leituras / a.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{Math.round((a.leituras / a.total) * 100)}% leram</span>
                </div>
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
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100">
                    {f.icon}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-xs font-semibold",
                    f.status === "V2" ? "text-cyan-600 border-cyan-300" : "text-purple-600 border-purple-300"
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
