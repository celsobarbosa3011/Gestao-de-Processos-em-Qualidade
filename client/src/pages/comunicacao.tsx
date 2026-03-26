import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  MessageSquare, Plus, Search, ChevronRight, Bell,
  CheckCircle2, Clock, Users, Building2, Pin, Download,
  Megaphone, AlertCircle, Eye, Star, Calendar, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type MsgType = "Comunicado" | "Alerta" | "Informativo" | "Urgente";
type MsgStatus = "Publicado" | "Rascunho" | "Arquivado";

interface Message {
  id: number;
  type: MsgType;
  status: MsgStatus;
  title: string;
  body: string;
  author: string;
  authorRole: string;
  targetUnit: string;
  publishedAt: string;
  isPinned: boolean;
  readCount: number;
  totalTarget: number;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  type: string;
  status: "Agendada" | "Realizada" | "Cancelada";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const messages: Message[] = [
  {
    id: 1, type: "Urgente", status: "Publicado",
    title: "Alerta ANVISA — Recolhimento de Lote de Medicamento",
    body: "A ANVISA emitiu alerta de recolhimento do lote X789 do medicamento Amoxicilina 500mg. Verificar estoques na Farmácia Central e unidades satélites. Isolar e encaminhar ao Setor Farmácia imediatamente.",
    author: "Farm. Pedro Almeida", authorRole: "Farmacêutico-Chefe",
    targetUnit: "Todas as unidades", publishedAt: "2026-03-20",
    isPinned: true, readCount: 145, totalTarget: 180,
  },
  {
    id: 2, type: "Comunicado", status: "Publicado",
    title: "Visita de Avaliação ONA 2026 — Data Confirmada",
    body: "Informamos que a visita de avaliação do organismo acreditador ONA está confirmada para o período de 15 a 17 de abril de 2026. Todas as coordenações devem preparar seus setores e documentação conforme checklist distribuído pela Qualidade.",
    author: "Dir. Qualidade — Maria Luiza", authorRole: "Diretora de Qualidade",
    targetUnit: "Todas as unidades", publishedAt: "2026-03-18",
    isPinned: true, readCount: 162, totalTarget: 180,
  },
  {
    id: 3, type: "Alerta", status: "Publicado",
    title: "Manutenção Programada do Sistema de Prontuário — 22/03",
    body: "O sistema de prontuário eletrônico ficará indisponível no dia 22/03/2026 das 01h00 às 05h00 para manutenção preventiva. Durante este período, utilizar o protocolo de contingência manual.",
    author: "TI — Marcos Santos", authorRole: "Analista de TI",
    targetUnit: "Todas as unidades", publishedAt: "2026-03-17",
    isPinned: false, readCount: 98, totalTarget: 180,
  },
  {
    id: 4, type: "Informativo", status: "Publicado",
    title: "Novo Protocolo de Sepse — Versão 2.1 Aprovada",
    body: "O Protocolo de Sepse (PROT-002) foi atualizado para a versão 2.1, incorporando as diretrizes da Surviving Sepsis Campaign 2024. O treinamento de atualização está agendado para 05/04. Consulte o novo protocolo no portal de documentos.",
    author: "Dr. Carlos Menezes", authorRole: "Médico Intensivista",
    targetUnit: "UTI + PS", publishedAt: "2026-03-15",
    isPinned: false, readCount: 52, totalTarget: 65,
  },
  {
    id: 5, type: "Comunicado", status: "Publicado",
    title: "Resultado da Pesquisa de Clima Organizacional 2026",
    body: "Publicamos os resultados da Pesquisa de Clima Organizacional 2026. O índice geral de satisfação foi de 76%, com destaque positivo para 'Relacionamento com equipe' (89%) e oportunidade de melhoria em 'Reconhecimento' (61%).",
    author: "RH — Ana Cardoso", authorRole: "Gestora de RH",
    targetUnit: "Todas as unidades", publishedAt: "2026-03-10",
    isPinned: false, readCount: 130, totalTarget: 180,
  },
  {
    id: 6, type: "Informativo", status: "Publicado",
    title: "Campanha de Vacinação contra Influenza — Início 01/04",
    body: "A campanha de vacinação contra influenza para colaboradores inicia em 01/04/2026. A vacinação ocorre na Sala de Vacinas (térreo) de segunda a sexta, das 08h às 17h. Apresente o crachá funcional.",
    author: "SCIH — Enf. Patrícia", authorRole: "Coordenadora SCIH",
    targetUnit: "Todos os colaboradores", publishedAt: "2026-03-08",
    isPinned: false, readCount: 155, totalTarget: 250,
  },
];

const meetings: Meeting[] = [
  {
    id: 1, title: "Reunião de Liderança — Preparação ONA",
    date: "2026-03-25", time: "14h00", location: "Auditório Principal",
    organizer: "Dir. Qualidade", type: "Estratégica", status: "Agendada",
  },
  {
    id: 2, title: "Comitê de Gestão Mensal — Mar/26",
    date: "2026-03-28", time: "09h00", location: "Sala de Reuniões A",
    organizer: "Direção Geral", type: "Gestão", status: "Agendada",
  },
  {
    id: 3, title: "NSP — Reunião Ordinária Mar/26",
    date: "2026-03-28", time: "14h00", location: "Sala 3",
    organizer: "NSP", type: "Comissão", status: "Agendada",
  },
  {
    id: 4, title: "SCIH — Reunião Extraordinária",
    date: "2026-03-27", time: "10h00", location: "Auditório",
    organizer: "SCIH", type: "Comissão", status: "Agendada",
  },
  {
    id: 5, title: "Comitê de Qualidade — Fev/26",
    date: "2026-02-28", time: "14h00", location: "Sala de Reuniões B",
    organizer: "Dir. Qualidade", type: "Qualidade", status: "Realizada",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeMeta(t: MsgType) {
  switch (t) {
    case "Urgente":     return { cls: "bg-rose-100 text-rose-700 border-rose-200",     icon: <AlertCircle className="w-3.5 h-3.5" /> };
    case "Alerta":      return { cls: "bg-amber-100 text-amber-700 border-amber-200",   icon: <Bell className="w-3.5 h-3.5" /> };
    case "Comunicado":  return { cls: "bg-sky-100 text-sky-700 border-sky-200",         icon: <Megaphone className="w-3.5 h-3.5" /> };
    case "Informativo": return { cls: "bg-slate-100 text-slate-600 border-slate-200",  icon: <FileText className="w-3.5 h-3.5" /> };
  }
}

function meetingStatusMeta(s: Meeting["status"]) {
  switch (s) {
    case "Agendada":  return "bg-sky-100 text-sky-700 border-sky-200";
    case "Realizada": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Cancelada": return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function readPct(m: Message) {
  return Math.round((m.readCount / m.totalTarget) * 100);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Comunicacao() {
  const { isAdmin } = useTenant();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showNovoForm, setShowNovoForm] = useState(false);

  const displayMessages: typeof messages = [];
  const displayMeetings: typeof meetings = [];

  const filtered = displayMessages.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || m.type === filterType;
    return matchSearch && matchType;
  });

  const pinned = displayMessages.filter((m) => m.isPinned);
  const urgentes = displayMessages.filter((m) => m.type === "Urgente").length;
  const totalPublished = displayMessages.filter((m) => m.status === "Publicado").length;
  const upcomingMeetings = displayMeetings.filter((m) => m.status === "Agendada").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate("/")}>Início</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Comunicação Interna</span>
            <Badge className="ml-2 bg-sky-100 text-sky-700 border border-sky-200 text-xs px-2 py-0.5">Módulo 18</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-sky-500" />
                Comunicação Interna
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Comunicados institucionais, alertas e agenda de reuniões
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2 text-sm" onClick={() => setShowNovoForm(true)}>
                <Plus className="w-4 h-4" />
                Novo Comunicado
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Novo Comunicado Inline Form ── */}
      {showNovoForm && (
        <div className="max-w-screen-xl mx-auto px-6 pt-5">
          <Card className="bg-white border border-sky-200 shadow-sm">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-500" />
                Novo Comunicado
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Título</label>
                  <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Ex: Comunicado sobre segurança do paciente" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
                  <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white">
                    <option>Comunicado</option>
                    <option>Alerta</option>
                    <option>Informativo</option>
                    <option>Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Público-alvo</label>
                  <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Ex: Todas as unidades" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Mensagem</label>
                  <textarea rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none" placeholder="Conteúdo do comunicado..." />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 text-xs" onClick={() => setShowNovoForm(false)}>
                  Cancelar
                </Button>
                <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs" onClick={() => { toast.success("Criado com sucesso!"); setShowNovoForm(false); }}>
                  Publicar Comunicado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Comunicados Ativos", value: totalPublished, icon: <Megaphone className="w-5 h-5 text-sky-500" />, bg: "bg-sky-50", text: "text-sky-700" },
            { label: "Urgentes", value: urgentes, icon: <AlertCircle className="w-5 h-5 text-rose-500" />, bg: "bg-rose-50", text: "text-rose-700" },
            { label: "Fixados", value: pinned.length, icon: <Pin className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50", text: "text-amber-700" },
            { label: "Reuniões Agendadas", value: upcomingMeetings, icon: <Calendar className="w-5 h-5 text-violet-500" />, bg: "bg-violet-50", text: "text-violet-700" },
          ].map((k) => (
            <Card key={k.label} className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", k.bg)}>{k.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className={cn("text-2xl font-bold", k.text)}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="mural">
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto mb-5">
            <TabsTrigger value="mural" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Mural de Comunicados
            </TabsTrigger>
            <TabsTrigger value="agenda" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2">
              Agenda de Reuniões
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — Mural de Comunicados
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="mural" className="space-y-4">
            {/* Pinned */}
            {pinned.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  <Pin className="w-3.5 h-3.5" />
                  Fixados
                </div>
                {pinned.map((m) => {
                  const tm = typeMeta(m.type);
                  const pct = readPct(m);
                  return (
                    <Card key={m.id} className={cn(
                      "bg-white border shadow-sm",
                      m.type === "Urgente" ? "border-rose-300 ring-1 ring-rose-100" : "border-amber-200"
                    )}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", typeMeta(m.type).cls)}>
                            {tm.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <Badge className={cn("text-xs border px-2 py-0.5", tm.cls)}>{m.type}</Badge>
                              <Pin className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-slate-400">{new Date(m.publishedAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 text-sm mb-1">{m.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{m.body}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">{m.author} · {m.authorRole} · {m.targetUnit}</span>
                              <span className="text-xs font-semibold text-sky-600">{m.readCount}/{m.totalTarget} leram ({pct}%)</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Filters + All messages */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar comunicado..."
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 w-56"
                />
              </div>
              {["all", "Urgente", "Alerta", "Comunicado", "Informativo"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    filterType === t
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                  )}
                >
                  {t === "all" ? "Todos" : t}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.filter((m) => !m.isPinned).map((m) => {
                const tm = typeMeta(m.type);
                const pct = readPct(m);
                return (
                  <Card key={m.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", tm.cls)}>
                          {tm.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <Badge className={cn("text-xs border px-2 py-0.5", tm.cls)}>{m.type}</Badge>
                            <span className="text-xs text-slate-400">{new Date(m.publishedAt).toLocaleDateString("pt-BR")}</span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-400">{m.targetUnit}</span>
                          </div>
                          <h3 className="font-semibold text-slate-800 text-sm mb-1">{m.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{m.body}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{m.author} · {m.authorRole}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">{m.readCount}/{m.totalTarget} leram ({pct}%)</span>
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-sky-600 gap-1" onClick={() => toast.info("Funcionalidade disponível em breve")}>
                                <Eye className="w-3 h-3" />
                                Ver
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — Agenda de Reuniões
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="agenda" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700">Próximas reuniões</h2>
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white gap-1.5 text-xs" onClick={() => toast.info("Funcionalidade disponível em breve")}>
                <Plus className="w-3.5 h-3.5" />
                Agendar reunião
              </Button>
            </div>

            <div className="space-y-3">
              {displayMeetings.map((m) => {
                const sm = meetingStatusMeta(m.status);
                return (
                  <Card key={m.id} className={cn(
                    "bg-white border shadow-sm",
                    m.status === "Agendada" ? "border-slate-200" : "border-slate-100 opacity-70"
                  )}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 text-center bg-sky-50 rounded-lg p-2 border border-sky-100 w-14">
                            <p className="text-xs font-bold text-sky-700">
                              {new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(". ", "\n")}
                            </p>
                            <p className="text-xs text-sky-500 font-semibold">{m.time}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm mb-1">{m.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {m.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {m.organizer}
                              </span>
                              <Badge className={cn("text-xs border px-2 py-0.5", sm)}>{m.status}</Badge>
                              <Badge className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5">{m.type}</Badge>
                            </div>
                          </div>
                        </div>
                        {m.status === "Agendada" && (
                          <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 gap-1.5 text-xs flex-shrink-0" onClick={() => toast.success("Operação realizada com sucesso!")}>
                            <Calendar className="w-3.5 h-3.5" />
                            Salvar
                          </Button>
                        )}
                        {m.status === "Realizada" && (
                          <Button size="sm" variant="ghost" className="text-sky-600 gap-1.5 text-xs flex-shrink-0" onClick={() => toast.info("Funcionalidade disponível em breve")}>
                            <FileText className="w-3.5 h-3.5" />
                            Ata
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
