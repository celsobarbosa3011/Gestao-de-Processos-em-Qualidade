import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTenant } from "@/hooks/use-tenant";
import { printReport } from "@/lib/print-pdf";
import { getCommissions, createCommission } from "@/lib/api";
import {
  Users, Calendar, FileText, Plus, ArrowRight, CheckCircle2,
  AlertCircle, Clock, ChevronRight, MoreHorizontal, Building2,
  ClipboardList, Scale, Pill, Stethoscope, Trash2, Activity,
  Heart, Shield, Eye, Download, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================
// MOCK DATA
// ============================================================

const commissions = [
  {
    id: 1, code: "NSP", name: "Núcleo de Segurança do Paciente", icon: <Shield className="w-5 h-5" />,
    color: "red", regulation: "RDC 36/2013", members: 8, frequency: "Mensal",
    lastMeeting: "2026-02-28", nextMeeting: "2026-03-28", status: "active",
    pendingDeliberations: 4, completedDeliberations: 12,
    description: "Responsável pela promoção e monitoramento da segurança do paciente.",
  },
  {
    id: 2, code: "SCIH", name: "Comissão de Controle de Infecção Hospitalar", icon: <Activity className="w-5 h-5" />,
    color: "emerald", regulation: "Portaria MS 2616/1998", members: 12, frequency: "Mensal",
    lastMeeting: "2026-03-05", nextMeeting: "2026-03-27", status: "active",
    pendingDeliberations: 2, completedDeliberations: 18,
    description: "Controle, prevenção e vigilância das infecções relacionadas à assistência.",
  },
  {
    id: 3, code: "SCIH", name: "Serviço de Controle de Infecção Hospitalar", icon: <Stethoscope className="w-5 h-5" />,
    color: "sky", regulation: "Portaria MS 2616/1998", members: 6, frequency: "Quinzenal",
    lastMeeting: "2026-03-10", nextMeeting: "2026-03-25", status: "active",
    pendingDeliberations: 1, completedDeliberations: 9,
    description: "Operacionalização das ações de controle de infecção.",
  },
  {
    id: 4, code: "CPRON", name: "Comissão de Revisão de Prontuários", icon: <FileText className="w-5 h-5" />,
    color: "violet", regulation: "CFM 1638/2002", members: 7, frequency: "Mensal",
    lastMeeting: "2026-02-20", nextMeeting: "2026-03-28", status: "active",
    pendingDeliberations: 3, completedDeliberations: 8,
    description: "Revisão da qualidade e completude dos prontuários médicos.",
  },
  {
    id: 5, code: "COBIO", name: "Comissão de Óbitos e Biópsias", icon: <ClipboardList className="w-5 h-5" />,
    color: "slate", regulation: "CFM 1931/2009", members: 9, frequency: "Mensal",
    lastMeeting: "2026-03-01", nextMeeting: "2026-04-01", status: "active",
    pendingDeliberations: 0, completedDeliberations: 6,
    description: "Análise dos óbitos institucionais e resultados anatomopatológicos.",
  },
  {
    id: 6, code: "CEM", name: "Comissão de Ética Médica", icon: <Scale className="w-5 h-5" />,
    color: "amber", regulation: "CFM 2217/2018", members: 5, frequency: "Bimestral",
    lastMeeting: "2026-02-10", nextMeeting: "2026-04-10", status: "active",
    pendingDeliberations: 1, completedDeliberations: 4,
    description: "Análise de questões éticas na prática médica institucional.",
  },
  {
    id: 7, code: "CFT", name: "Comissão de Farmácia e Terapêutica", icon: <Pill className="w-5 h-5" />,
    color: "teal", regulation: "RDC 44/2010", members: 8, frequency: "Bimestral",
    lastMeeting: "2026-02-15", nextMeeting: "2026-04-15", status: "active",
    pendingDeliberations: 2, completedDeliberations: 11,
    description: "Gestão da farmacoterapia, padronização e protocolos de uso de medicamentos.",
  },
  {
    id: 8, code: "COHUM", name: "Comissão de Humanização", icon: <Heart className="w-5 h-5" />,
    color: "pink", regulation: "PNH/2004", members: 10, frequency: "Bimestral",
    lastMeeting: "2026-01-30", nextMeeting: "2026-03-30", status: "active",
    pendingDeliberations: 2, completedDeliberations: 5,
    description: "Promoção da humanização no atendimento e na gestão do trabalho.",
  },
  {
    id: 9, code: "CIPA", name: "Comissão Interna de Prevenção de Acidentes", icon: <Shield className="w-5 h-5" />,
    color: "amber", regulation: "NR-5 / CLT", members: 14, frequency: "Mensal",
    lastMeeting: "2026-03-05", nextMeeting: "2026-04-05", status: "active",
    pendingDeliberations: 1, completedDeliberations: 7,
    description: "Prevenção de acidentes e doenças decorrentes do trabalho, preservação da integridade física dos trabalhadores.",
  },
  {
    id: 10, code: "CGRH", name: "Comissão de Gerenciamento de Resíduos de Saúde", icon: <Trash2 className="w-5 h-5" />,
    color: "emerald", regulation: "RDC 222/2018", members: 6, frequency: "Bimestral",
    lastMeeting: "2026-02-20", nextMeeting: "2026-04-20", status: "active",
    pendingDeliberations: 2, completedDeliberations: 4,
    description: "Elaboração e implantação do PGRSS — Plano de Gerenciamento de Resíduos dos Serviços de Saúde.",
  },
  {
    id: 11, code: "CTSI", name: "Comissão Técnica de Segurança das Instalações", icon: <Activity className="w-5 h-5" />,
    color: "sky", regulation: "NBR 13.534 / ABNT", members: 5, frequency: "Trimestral",
    lastMeeting: "2026-01-15", nextMeeting: "2026-04-15", status: "active",
    pendingDeliberations: 0, completedDeliberations: 3,
    description: "Garantia das condições de segurança das instalações elétricas, hidráulicas e de gases medicinais.",
  },
  {
    id: 12, code: "COPAL", name: "Comissão de Cuidados Paliativos", icon: <Heart className="w-5 h-5" />,
    color: "violet", regulation: "CFM 1.805/2006", members: 8, frequency: "Mensal",
    lastMeeting: "2026-02-28", nextMeeting: "2026-03-28", status: "active",
    pendingDeliberations: 1, completedDeliberations: 5,
    description: "Organização da atenção paliativa multidisciplinar ao paciente com doença ameaçadora da vida.",
  },
  {
    id: 13, code: "CEP", name: "Comissão de Ética em Pesquisa", icon: <Star className="w-5 h-5" />,
    color: "slate", regulation: "Res. CNS 466/2012", members: 11, frequency: "Mensal",
    lastMeeting: "2026-03-08", nextMeeting: "2026-04-08", status: "active",
    pendingDeliberations: 3, completedDeliberations: 15,
    description: "Avaliação e acompanhamento ético dos projetos de pesquisa envolvendo seres humanos.",
  },
  {
    id: 14, code: "CTEN", name: "Comissão Técnica de Enfermagem", icon: <Stethoscope className="w-5 h-5" />,
    color: "teal", regulation: "COFEN 543/2017", members: 9, frequency: "Mensal",
    lastMeeting: "2026-03-12", nextMeeting: "2026-04-12", status: "active",
    pendingDeliberations: 2, completedDeliberations: 8,
    description: "Padronização das práticas assistenciais de enfermagem e gestão de dimensionamento de pessoal.",
  },
];

const recentMeetings = [
  { commissionId: 2, name: "SCIH", date: "05/03/2026", type: "Ordinária", attendees: 10, deliberations: 3, status: "completed" },
  { commissionId: 3, name: "SCIH", date: "10/03/2026", type: "Ordinária", attendees: 6, deliberations: 2, status: "completed" },
  { commissionId: 1, name: "NSP", date: "28/02/2026", type: "Ordinária", attendees: 7, deliberations: 4, status: "completed" },
  { commissionId: 5, name: "COBIO", date: "01/03/2026", type: "Ordinária", attendees: 8, deliberations: 0, status: "completed" },
  { commissionId: 4, name: "CPRON", date: "20/02/2026", type: "Ordinária", attendees: 6, deliberations: 3, status: "completed" },
];

const upcomingMeetings = [
  { commissionId: 1, name: "NSP", date: "25/03/2026", type: "Ordinária", location: "Sala 3 — 14h00" },
  { commissionId: 2, name: "SCIH", date: "27/03/2026", type: "Extraordinária", location: "Auditório — 10h00" },
  { commissionId: 4, name: "CPRON", date: "28/03/2026", type: "Ordinária", location: "Sala 1 — 16h00" },
  { commissionId: 5, name: "COBIO", date: "01/04/2026", type: "Ordinária", location: "Sala 2 — 14h30" },
  { commissionId: 6, name: "CEM", date: "10/04/2026", type: "Ordinária", location: "Sala 4 — 17h00" },
];

const deliberations = [
  { id: 1, commission: "NSP", date: "28/02/2026", description: "Implantar protocolo de identificação dupla em todas as unidades", responsible: "Enf. Carla Santos", deadline: "2026-03-30", status: "pending", priority: "high", actionPlanId: 1 },
  { id: 2, commission: "NSP", date: "28/02/2026", description: "Notificação de evento sentinela ES-2026-08 no Notivisa", responsible: "Qual. Maria", deadline: "2026-03-20", status: "overdue", priority: "critical", actionPlanId: 9 },
  { id: 3, commission: "SCIH", date: "05/03/2026", description: "Bundle de higiene das mãos na UTI — aumento para meta de 95%", responsible: "SCIH", deadline: "2026-04-30", status: "in_progress", priority: "high" },
  { id: 4, commission: "SCIH", date: "05/03/2026", description: "Treinamento de precauções de contato para equipe do isolamento", responsible: "SCIH", deadline: "2026-04-15", status: "pending", priority: "medium" },
  { id: 5, commission: "CPRON", date: "20/02/2026", description: "Padronizar folha de admissão com campos obrigatórios completos", responsible: "Coord. Enfermagem", deadline: "2026-04-01", status: "in_progress", priority: "medium" },
  { id: 6, commission: "CFT", date: "15/02/2026", description: "Revisão da lista de medicamentos padronizados — inclusão de novos antibióticos", responsible: "Farm. Pedro", deadline: "2026-05-01", status: "pending", priority: "medium" },
];

const colorMap: Record<string, { badge: string; icon: string; bg: string }> = {
  red: { badge: "bg-red-100 text-red-700 border-red-200", icon: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900" },
  sky: { badge: "bg-sky-100 text-sky-700 border-sky-200", icon: "bg-sky-500", bg: "bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900" },
  violet: { badge: "bg-violet-100 text-violet-700 border-violet-200", icon: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900" },
  slate: { badge: "bg-slate-100 text-slate-700 border-slate-200", icon: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700" },
  amber: { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900" },
  teal: { badge: "bg-teal-100 text-teal-700 border-teal-200", icon: "bg-teal-500", bg: "bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900" },
  pink: { badge: "bg-pink-100 text-pink-700 border-pink-200", icon: "bg-pink-500", bg: "bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900" },
};

const deliberationStatusBadge = (status: string) => {
  if (status === "overdue") return "bg-red-100 text-red-700 border-red-200";
  if (status === "in_progress") return "bg-sky-100 text-sky-700 border-sky-200";
  if (status === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "completed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-600";
};

const deliberationStatusLabel = (status: string) => {
  const map: Record<string, string> = { overdue: "Vencida", in_progress: "Em andamento", pending: "Pendente", completed: "Concluída" };
  return map[status] || status;
};

export default function Comissoes() {
  const [, navigate] = useLocation();
  const { isAdmin } = useTenant();
  const [selectedCommission, setSelectedCommission] = useState<typeof commissions[0] | null>(null);
  const [activeTab, setActiveTab] = useState("lista");
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoForm, setNovoForm] = useState({ name: "", type: "NSP", description: "", meetingFrequency: "Mensal" });
  const qc = useQueryClient();

  const { data: dbCommissions } = useQuery({
    queryKey: ["commissions"],
    queryFn: getCommissions,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createCommission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commissions"] });
      setNovoForm({ name: "", type: "NSP", description: "", meetingFrequency: "Mensal" });
      setShowNovoForm(false);
      toast.success("Comissão criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar comissão."),
  });

  function handleNovoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!novoForm.name.trim()) { toast.error("Informe o nome da comissão."); return; }
    createMutation.mutate({ name: novoForm.name, type: novoForm.type, description: novoForm.description, meetingFrequency: novoForm.meetingFrequency, active: true } as any);
  }

  // Map DB commissions to display format when available, fallback to mock (admin only — LGPD)
  const displayCommissions = (dbCommissions && dbCommissions.length > 0)
    ? dbCommissions.map(c => ({
        id: c.id,
        code: c.code || c.name.slice(0, 4).toUpperCase(),
        name: c.name,
        icon: commissions.find(m => m.code === c.code)?.icon ?? <Shield className="w-5 h-5" />,
        color: commissions.find(m => m.code === c.code)?.color ?? "slate",
        regulation: (c as any).regulation || "—",
        members: (c as any).memberCount || 0,
        frequency: (c as any).meetingFrequency || "—",
        lastMeeting: (c as any).lastMeetingDate || "—",
        nextMeeting: (c as any).nextMeetingDate || "—",
        status: c.status || "active",
        pendingDeliberations: 0,
        completedDeliberations: 0,
        description: c.description || "",
      }))
    : (isAdmin ? commissions : []);

  const displayUpcomingMeetings = isAdmin ? upcomingMeetings : [];
  const displayDeliberations = isAdmin ? deliberations : [];
  const displayRecentMeetings = isAdmin ? recentMeetings : [];

  const totalPending = displayCommissions.reduce((a, c) => a + c.pendingDeliberations, 0);
  const totalCompleted = displayCommissions.reduce((a, c) => a + c.completedDeliberations, 0);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comissões</h1>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
              {displayCommissions.length} comissões ativas
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">Governança institucional com rastreabilidade total por deliberação</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => toast.info("Calendário anual de reuniões — em breve disponível para exportação")}>
            <Calendar className="w-3.5 h-3.5" />
            Agenda Anual
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={() => setShowNovoForm(v => !v)}>
            <Plus className="w-3.5 h-3.5" />
            Nova Comissão
          </Button>
        </div>
      </div>

      {/* Nova Comissão Form */}
      {showNovoForm && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5">
          <p className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Cadastrar Nova Comissão</p>
          <form onSubmit={handleNovoSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">Nome da Comissão *</label>
              <input value={novoForm.name} onChange={e => setNovoForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Ex.: Comissão de Controle de Infecção Hospitalar (CCIH)" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Tipo</label>
              <select value={novoForm.type} onChange={e => setNovoForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                <option value="NSP">NSP — Núcleo de Segurança do Paciente</option>
                <option value="CCIH">CCIH — Controle de Infecção Hospitalar</option>
                <option value="CFT">CFT — Farmácia e Terapêutica</option>
                <option value="CEP">CEP — Ética em Pesquisa</option>
                <option value="CME">CME — Central de Material e Esterilização</option>
                <option value="CIH">CIH — Humanização</option>
                <option value="CIPA">CIPA — Prevenção de Acidentes</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Frequência de Reuniões</label>
              <select value={novoForm.meetingFrequency} onChange={e => setNovoForm(f => ({ ...f, meetingFrequency: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                <option value="Semanal">Semanal</option>
                <option value="Quinzenal">Quinzenal</option>
                <option value="Mensal">Mensal</option>
                <option value="Bimestral">Bimestral</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Semestral">Semestral</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">Descrição / Objetivo</label>
              <input value={novoForm.description} onChange={e => setNovoForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Ex.: Responsável por monitorar e controlar infecções hospitalares..." />
            </div>
            <div className="flex gap-2 sm:col-span-2 justify-end pt-1">
              <button type="button" onClick={() => setShowNovoForm(false)} className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">{createMutation.isPending ? "Salvando..." : "Criar Comissão"}</button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Comissões Ativas", value: displayCommissions.length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
          { label: "Pendentes de Reunião", value: displayUpcomingMeetings.length, color: "text-sky-600", bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800" },
          { label: "Deliberações Abertas", value: totalPending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
          { label: "Deliberações Resolvidas", value: totalCompleted, color: "text-slate-700", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" },
        ].map(k => (
          <Card key={k.label} className={cn("border", k.bg)}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className={cn("text-3xl font-bold", k.color)}>{k.value}</p>
              <p className="text-xs text-slate-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="lista" className="text-xs">Comissões</TabsTrigger>
          <TabsTrigger value="agenda" className="text-xs">Agenda</TabsTrigger>
          <TabsTrigger value="deliberacoes" className="text-xs">
            Deliberações
            {totalPending > 0 && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{totalPending}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="atas" className="text-xs">Atas & Registros</TabsTrigger>
        </TabsList>

        {/* TAB: Lista de Comissões */}
        <TabsContent value="lista" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayCommissions.map((c) => {
              const colors = colorMap[c.color];
              const totalDelibs = c.pendingDeliberations + c.completedDeliberations;
              return (
                <Card
                  key={c.id}
                  className={cn("border cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group", colors.bg)}
                  onClick={() => setSelectedCommission(selectedCommission?.id === c.id ? null : c)}
                >
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0", colors.icon)}>
                        {c.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colors.badge)}>{c.code}</Badge>
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{c.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{c.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1"><Users className="w-3 h-3" />{c.members} membros</div>
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.frequency}</div>
                      <div className="flex items-center gap-1 col-span-2"><Scale className="w-3 h-3" />{c.regulation}</div>
                    </div>

                    {totalDelibs > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Deliberações resolvidas</span>
                          <span className="font-semibold">{c.completedDeliberations}/{totalDelibs}</span>
                        </div>
                        <Progress value={(c.completedDeliberations / totalDelibs) * 100} className="h-1.5" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-500">
                        Próxima: <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {displayUpcomingMeetings.find(m => m.commissionId === c.id)?.date || "—"}
                        </span>
                      </div>
                      {c.pendingDeliberations > 0 && (
                        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                          {c.pendingDeliberations} pendentes
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); toast.info("Atas da comissão em breve disponíveis para consulta"); }}>
                        <Eye className="w-3 h-3" />
                        Atas
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); toast.success("Nova reunião registrada com sucesso!"); }}>
                        <Plus className="w-3 h-3" />
                        Nova Reunião
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB: Agenda */}
        <TabsContent value="agenda" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Próximas Reuniões
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-3">
                  {displayUpcomingMeetings.map((m, i) => {
                    const commission = commissions.find(c => c.commissionId === m.commissionId || c.id === m.commissionId);
                    const colors = commission ? colorMap[commission.color] : colorMap.slate;
                    return (
                      <div key={i} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0", colors.icon)}>
                          {m.name}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {commissions.find(c => c.id === m.commissionId)?.name || m.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{m.location}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.date}</p>
                          <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 h-4", m.type === "Extraordinária" ? "border-orange-200 text-orange-600" : "border-emerald-200 text-emerald-600")}>
                            {m.type}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Últimas Reuniões
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-3">
                  {displayRecentMeetings.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0", colorMap[commissions.find(c => c.id === m.commissionId)?.color || "slate"].icon)}>
                        {m.name}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {commissions.find(c => c.id === m.commissionId)?.name || m.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{m.attendees} presentes • {m.deliberations} deliberações</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.date}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => toast.info("Abrindo ata da reunião...")}>
                            <FileText className="w-3 h-3 mr-1" />
                            Ata
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Deliberações */}
        <TabsContent value="deliberacoes" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-amber-500" />
                  Deliberações em Aberto
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => printReport({ title: "Deliberações da Comissão", subtitle: "Atas e deliberações registradas — QHealth One 2026", module: "Comissões", columns: [{ label: "Data", key: "data" }, { label: "Comissão", key: "comissao" }, { label: "Deliberação", key: "delib" }, { label: "Responsável", key: "resp" }, { label: "Status", key: "status" }], rows: [{ data: "15/03/2026", comissao: "NSP", delib: "Implantação de checklist cirúrgico OMS em todos os CCs", resp: "Dir. Médico", status: "Em andamento" }, { data: "10/03/2026", comissao: "SCIH", delib: "Reforço do protocolo de higienização de mãos — Meta 85%", resp: "Coord. SCIH", status: "Concluído" }, { data: "05/03/2026", comissao: "CFT", delib: "Padronização de 12 novos medicamentos no formulário", resp: "Farm. Chefe", status: "Em andamento" }, { data: "01/03/2026", comissao: "CIPA", delib: "Instalação de sinalização de segurança em todas as alas", resp: "RH / SESMT", status: "Concluído" }] })}>
                  <Download className="w-3 h-3" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                {displayDeliberations.map((d) => (
                  <div key={d.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", colorMap[commissions.find(c => c.code === d.commission)?.color || "slate"].badge)}>
                            {d.commission}
                          </Badge>
                          <span className="text-[10px] text-slate-400">{d.date}</span>
                          {d.priority === "critical" && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-500 text-white">Crítico</Badge>}
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{d.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                          <span>Resp.: <span className="font-semibold text-slate-600 dark:text-slate-400">{d.responsible}</span></span>
                          <span>Prazo: <span className={cn("font-semibold", d.status === "overdue" ? "text-red-600" : "text-slate-600 dark:text-slate-400")}>{d.deadline}</span></span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", deliberationStatusBadge(d.status))}>
                          {deliberationStatusLabel(d.status)}
                        </Badge>
                        {d.actionPlanId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] gap-1 text-sky-600 hover:text-sky-700"
                            onClick={() => navigate("/gestao-operacional")}
                          >
                            <ArrowRight className="w-3 h-3" />
                            Ver plano
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Atas */}
        <TabsContent value="atas" className="mt-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span className="px-2">Comissão</span>
              <span>Reunião</span>
              <span className="px-4 text-center">Data</span>
              <span className="px-4 text-center">Delib.</span>
              <span className="px-4 text-center">Ata</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayRecentMeetings.map((m, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="px-2">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", colorMap[commissions.find(c => c.id === m.commissionId)?.color || "slate"].badge)}>
                      {m.name}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{commissions.find(c => c.id === m.commissionId)?.name}</p>
                    <p className="text-[11px] text-slate-400">{m.type} • {m.attendees} presentes</p>
                  </div>
                  <div className="px-4 flex items-center justify-center">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{m.date}</span>
                  </div>
                  <div className="px-4 flex items-center justify-center">
                    <span className="text-sm font-bold text-amber-600">{m.deliberations}</span>
                  </div>
                  <div className="px-4 flex items-center justify-center">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-sky-600" onClick={() => toast.info("Gerando PDF da ata...")}>
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
