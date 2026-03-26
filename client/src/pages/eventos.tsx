import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { printNSPForm } from "@/lib/print-pdf";
import { getSafetyEvents, createSafetyEvent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Download,
  Activity,
  Shield,
  XCircle,
  FileText,
  Users,
  Zap,
  TrendingDown,
  TrendingUp,
  Target,
  BarChart3,
  ClipboardList,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventCategory = "Sentinel" | "Adverso" | "Quasi-erro";
type EventSeverity = "Morte evitável" | "Infecção grave" | "Grave" | "Moderado" | "Baixo";
type EventStatus =
  | "Análise de causa"
  | "Relatório enviado"
  | "Resolvido"
  | "Em análise"
  | "CAPA gerada"
  | "Concluído";

interface SafetyEvent {
  code: string;
  date: string;
  category: EventCategory;
  severity: EventSeverity;
  unit: string;
  status: EventStatus;
  notivisaDeadline: string | null;
  deadlineExpired?: boolean;
}

interface CAPAItem {
  esCode: string;
  cause: string;
  corrective: string;
  preventive: string;
  responsible: string;
  deadline: string;
  status: "Em andamento" | "Concluída" | "Atrasada";
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const EVENTS: SafetyEvent[] = [
  { code: "ES-2026-08", date: "15/03/26", category: "Sentinel",   severity: "Morte evitável", unit: "CC",   status: "Análise de causa",  notivisaDeadline: "17/03", deadlineExpired: true },
  { code: "EA-2026-12", date: "10/03/26", category: "Adverso",    severity: "Moderado",       unit: "UTI",  status: "Relatório enviado", notivisaDeadline: null },
  { code: "QE-2026-07", date: "08/03/26", category: "Quasi-erro", severity: "Baixo",          unit: "Farm", status: "Resolvido",          notivisaDeadline: null },
  { code: "EA-2026-11", date: "05/03/26", category: "Adverso",    severity: "Grave",          unit: "PS",   status: "Em análise",         notivisaDeadline: null },
  { code: "ES-2026-07", date: "01/03/26", category: "Sentinel",   severity: "Infecção grave", unit: "CME",  status: "CAPA gerada",        notivisaDeadline: null },
  { code: "QE-2026-06", date: "28/02/26", category: "Quasi-erro", severity: "Baixo",          unit: "Lab",  status: "Resolvido",          notivisaDeadline: null },
  { code: "EA-2026-10", date: "25/02/26", category: "Adverso",    severity: "Moderado",       unit: "UTI",  status: "Concluído",          notivisaDeadline: null },
  { code: "QE-2026-05", date: "20/02/26", category: "Quasi-erro", severity: "Baixo",          unit: "Amb",  status: "Resolvido",          notivisaDeadline: null },
];

const CAPA_ITEMS: CAPAItem[] = [
  {
    esCode: "ES-2026-08",
    cause: "Falha de comunicação na passagem de plantão e ausência de checklist pré-operatório",
    corrective: "Suspensão imediata do profissional. Auditoria completa do prontuário e BO instaurado.",
    preventive: "Implantação do checklist cirúrgico OMS obrigatório. Treinamento da equipe do CC.",
    responsible: "Dir. Médico + Coord. CC",
    deadline: "31/03/2026",
    status: "Em andamento",
  },
  {
    esCode: "ES-2026-07",
    cause: "Falha no processo de esterilização por ausência de indicadores biológicos no pacote",
    corrective: "Rastreamento e reprocessamento de todos os materiais do lote. Comunicação ao SCIH.",
    preventive: "Revisão do POP de esterilização. Calibração dos equipamentos CME. Indicadores 100%.",
    responsible: "Coord. CME + SCIH",
    deadline: "15/04/2026",
    status: "Em andamento",
  },
  {
    esCode: "EA-2026-11",
    cause: "Medicamento de alta vigilância sem dupla checagem aplicado em dose incorreta",
    corrective: "Notificação ao Notivisa. Acompanhamento intensivo do paciente.",
    preventive: "Implantação de dupla checagem obrigatória para medicamentos de alta vigilância.",
    responsible: "Farm. Chefe + Coord. PS",
    deadline: "10/04/2026",
    status: "Atrasada",
  },
];

const PIE_DATA = [
  { name: "Quasi-erros",      value: 7, color: "#94a3b8" },
  { name: "Eventos Adversos", value: 4, color: "#f97316" },
  { name: "Sentinela",        value: 1, color: "#ef4444" },
];

const BAR_DATA = [
  { unit: "UTI",  sentinel: 0, adverso: 2, quasiErro: 0 },
  { unit: "CC",   sentinel: 1, adverso: 0, quasiErro: 0 },
  { unit: "PS",   sentinel: 0, adverso: 1, quasiErro: 0 },
  { unit: "Farm", sentinel: 0, adverso: 0, quasiErro: 1 },
  { unit: "CME",  sentinel: 1, adverso: 0, quasiErro: 0 },
  { unit: "Lab",  sentinel: 0, adverso: 0, quasiErro: 1 },
  { unit: "Amb",  sentinel: 0, adverso: 0, quasiErro: 1 },
];

const TREND_DATA = [
  { mes: "Out/25", dias: 12 },
  { mes: "Nov/25", dias: 9  },
  { mes: "Dez/25", dias: 14 },
  { mes: "Jan/26", dias: 7  },
  { mes: "Fev/26", dias: 10 },
  { mes: "Mar/26", dias: 5  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: EventCategory }) {
  const map: Record<EventCategory, string> = {
    Sentinel:   "bg-red-100 text-red-700 border border-red-300",
    Adverso:    "bg-orange-100 text-orange-700 border border-orange-300",
    "Quasi-erro":"bg-slate-100 text-slate-600 border border-slate-300",
  };
  const icons: Record<EventCategory, React.ReactNode> = {
    Sentinel:    <AlertOctagon className="w-3 h-3" />,
    Adverso:     <AlertTriangle className="w-3 h-3" />,
    "Quasi-erro":<Activity className="w-3 h-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", map[category])}>
      {icons[category]} {category}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: EventSeverity }) {
  const map: Record<EventSeverity, string> = {
    "Morte evitável": "bg-red-200 text-red-800 font-bold",
    "Infecção grave": "bg-red-100 text-red-700",
    Grave:            "bg-orange-100 text-orange-700",
    Moderado:         "bg-amber-100 text-amber-700",
    Baixo:            "bg-slate-100 text-slate-600",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs", map[severity])}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, string> = {
    "Análise de causa":  "bg-blue-100 text-blue-700",
    "Relatório enviado": "bg-indigo-100 text-indigo-700",
    Resolvido:           "bg-emerald-100 text-emerald-700",
    "Em análise":        "bg-amber-100 text-amber-700",
    "CAPA gerada":       "bg-purple-100 text-purple-700",
    Concluído:           "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", map[status])}>
      {status}
    </span>
  );
}

function KpiCard({
  label, value, sub, color, blink = false,
}: {
  label: string; value: string | number; sub?: string; color: string; blink?: boolean;
}) {
  return (
    <Card className={cn("border-l-4", color)}>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold mt-0.5", blink && "animate-pulse text-red-600")}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Ishikawa Diagram ─────────────────────────────────────────────────────────

const ISHIKAWA_CATEGORIES = [
  { label: "Pessoa",         color: "bg-blue-500",   factors: ["Treinamento insuficiente", "Comunicação falha entre equipes"] },
  { label: "Método",         color: "bg-amber-500",  factors: ["Checklist pré-op não realizado", "Protocolo não seguido"] },
  { label: "Máquina",        color: "bg-orange-500", factors: ["Equipamento sem calibração", "Monitor sem manutenção preventiva"] },
  { label: "Material",       color: "bg-red-500",    factors: ["EPI inadequado no estoque", "Material fora do prazo de validade"] },
  { label: "Medição",        color: "bg-purple-500", factors: ["Monitoramento ausente", "Indicador não aferido"] },
  { label: "Meio ambiente",  color: "bg-slate-500",  factors: ["Iluminação inadequada no CC", "Ruído elevado dificultando comunicação"] },
];

function IshikawaDiagram() {
  return (
    <div className="space-y-3">
      {/* Fish head — effect */}
      <div className="flex justify-end">
        <div className="bg-red-600 text-white rounded-lg px-5 py-3 text-sm font-bold shadow-md max-w-xs text-center">
          EFEITO:<br />Morte evitável no intraoperatório<br />(ES-2026-08)
        </div>
      </div>

      {/* Backbone + ribs */}
      <div className="relative border-t-4 border-slate-400 mx-8 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
          {ISHIKAWA_CATEGORIES.map(cat => (
            <div key={cat.label} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className={cn("px-3 py-2 text-white text-xs font-bold uppercase tracking-wide flex items-center gap-2", cat.color)}>
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                {cat.label}
              </div>
              <ul className="px-3 py-2 space-y-1">
                {cat.factors.map(f => (
                  <li key={f} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-slate-400 shrink-0 mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ChevronRight used inside IshikawaDiagram

// ─── Formulário NSP — Notificação de Evento / NC / Quebra de Contrato ─────────

const TIPOS_INCIDENTE_ESQUERDA = [
  "Processos",
  "Contextualização",
  "Documentação",
  "Infecção Ass. aos Cuidados à Saúde",
  "Dados medicamentosos",
  "Intercorrências (queda, febre, alergia, envenenamento, etc)",
  "Hemovigilância",
];

const TIPOS_INCIDENTE_DIREITA = [
  "Equipamentos",
  "Dispositivo Equip. Médico",
  "Medicamentos (dose errada, med. errado, paciente errado, etc)",
  "Identificação do paciente",
  "Estrutura predial",
  "Outros",
];

interface PlanoAcaoRow { acao: string; responsavel: string; prazo: string; status: string; }

function NovaNotificacaoDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [tipoNotificacao, setTipoNotificacao] = useState<"Evento" | "Não conformidade" | "Quebra de Contrato" | "">("");
  const [registradoPor, setRegistradoPor] = useState("");
  const [setorNotificante, setSetorNotificante] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState("");
  const [horaOcorrencia, setHoraOcorrencia] = useState("");
  const [setorNotificado, setSetorNotificado] = useState("");
  const [dataNotificacao, setDataNotificacao] = useState("");
  const [horaNotificacao, setHoraNotificacao] = useState("");
  const [dadosPaciente, setDadosPaciente] = useState("");
  const [numeradorNSP, setNumeradorNSP] = useState("");
  const [prazo, setPrazo] = useState("");
  const [devolucao, setDevolucao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [houveDano, setHouveDano] = useState<"Sim" | "Não" | "">("");
  const [descricaoDano, setDescricaoDano] = useState("");
  const [acoesImediatas, setAcoesImediatas] = useState("");
  const [dataAnalise, setDataAnalise] = useState("");
  const [localAnalise, setLocalAnalise] = useState("");
  const [horarioAnalise, setHorarioAnalise] = useState("");
  const [impactado, setImpactado] = useState<"Paciente" | "Acompanhante" | "Colaborador" | "">("");
  const [tiposIncidente, setTiposIncidente] = useState<string[]>([]);
  const [porques, setPorques] = useState(["", "", "", "", ""]);
  const [dano, setDano] = useState("");
  const [planos, setPlanos] = useState<PlanoAcaoRow[]>([
    { acao: "", responsavel: "", prazo: "", status: "" },
    { acao: "", responsavel: "", prazo: "", status: "" },
    { acao: "", responsavel: "", prazo: "", status: "" },
  ]);

  const toggleIncidente = (item: string) =>
    setTiposIncidente(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  const updatePorque = (i: number, val: string) => {
    const next = [...porques]; next[i] = val; setPorques(next);
  };

  const updatePlano = (i: number, field: keyof PlanoAcaoRow, val: string) => {
    const next = [...planos]; next[i] = { ...next[i], [field]: val }; setPlanos(next);
  };

  const mutation = useMutation({
    mutationFn: createSafetyEvent,
    onSuccess: () => {
      toast.success("Notificação registrada com sucesso!");
      onSuccess?.();
      onClose();
    },
    onError: () => toast.error("Erro ao registrar notificação. Tente novamente."),
  });

  const handleSubmit = () => {
    if (!descricao) { toast.error("Preencha a descrição do evento."); return; }
    if (!dataOcorrencia) { toast.error("Informe a data de ocorrência."); return; }
    const categoryMap: Record<string, string> = {
      "Evento": "adverse_event", "Não conformidade": "near_miss", "Quebra de Contrato": "near_miss",
    };
    const severityMap = houveDano === "Sim" ? "moderate" : "low";
    mutation.mutate({
      title: `${tipoNotificacao || "Evento"} — ${setorNotificante || "Setor não informado"}`,
      description: descricao,
      category: categoryMap[tipoNotificacao] || "adverse_event",
      severity: severityMap,
      occurrenceDate: new Date(dataOcorrencia + (horaOcorrencia ? "T" + horaOcorrencia : "T00:00")),
      notivisaRequired: (tipoNotificacao === "Evento") && houveDano === "Sim",
      rdc63Category: tipoNotificacao || undefined,
      rootCause: [...porques.filter(Boolean), dano].filter(Boolean).join(" → ") || undefined,
      causeAnalysis: acoesImediatas || undefined,
      anonymousPatient: !dadosPaciente,
    } as any);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-slate-50 sticky top-0 z-10">
          <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            NOTIFICAÇÃO DE EVENTO / NÃO CONFORMIDADE / QUEBRA DE CONTRATO
            <span className="ml-auto text-xs font-normal text-slate-400">FOR SN-003</span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Row 1 — NSP / Prazo / Devolução */}
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Numerador NSP</Label><Input value={numeradorNSP} onChange={e => setNumeradorNSP(e.target.value)} placeholder="NSP-2026-XXX" className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Prazo</Label><Input value={prazo} onChange={e => setPrazo(e.target.value)} type="date" className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Devolução</Label><Input value={devolucao} onChange={e => setDevolucao(e.target.value)} type="date" className="h-8 text-xs mt-1" /></div>
          </div>

          {/* Row 2 — Paciente + Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 min-h-[80px]">
              <p className="text-xs font-semibold text-slate-500 mb-1">ETIQUETA COM OS DADOS DO PACIENTE</p>
              <Textarea value={dadosPaciente} onChange={e => setDadosPaciente(e.target.value)} placeholder="Nome, prontuário, data de nascimento..." className="text-xs resize-none min-h-[56px] border-none p-0 shadow-none" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-700">TIPO DE NOTIFICAÇÃO</p>
              {(["Evento", "Não conformidade", "Quebra de Contrato"] as const).map(t => (
                <label key={t} className="flex items-center gap-2 text-xs cursor-pointer py-1">
                  <input type="radio" name="tipoNotificacao" value={t} checked={tipoNotificacao === t} onChange={() => setTipoNotificacao(t)} className="accent-red-600" />
                  <span className={tipoNotificacao === t ? "font-semibold text-red-700" : "text-slate-600"}>{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Motivo da abertura */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b pb-1">MOTIVO DA ABERTURA</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">Registrado por (Opcional)</Label><Input value={registradoPor} onChange={e => setRegistradoPor(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Setor Notificante</Label><Input value={setorNotificante} onChange={e => setSetorNotificante(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Data Ocorrência</Label><Input type="date" value={dataOcorrencia} onChange={e => setDataOcorrencia(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Hora Ocorrência</Label><Input type="time" value={horaOcorrencia} onChange={e => setHoraOcorrencia(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Setor Notificado</Label><Input value={setorNotificado} onChange={e => setSetorNotificado(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Data Notificação</Label><Input type="date" value={dataNotificacao} onChange={e => setDataNotificacao(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Hora Notificação</Label><Input type="time" value={horaNotificacao} onChange={e => setHoraNotificacao(e.target.value)} className="h-8 text-xs mt-1" /></div>
            </div>

            <div>
              <Label className="text-xs">Descrição do Evento / Não Conformidade / Quebra de Contrato</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva detalhadamente o ocorrido..." className="mt-1 text-xs min-h-[80px] resize-none" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">Houve consequência(s) / DANO(S) ao paciente ou profissional?</p>
              <div className="flex gap-4">
                {(["Sim", "Não"] as const).map(v => (
                  <label key={v} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="radio" name="houveDano" value={v} checked={houveDano === v} onChange={() => setHouveDano(v)} className="accent-red-600" />
                    <span>{v}</span>
                  </label>
                ))}
                {houveDano === "Sim" && <span className="text-xs text-red-600 font-semibold">— Descreva Abaixo:</span>}
              </div>
              {houveDano === "Sim" && (
                <Textarea value={descricaoDano} onChange={e => setDescricaoDano(e.target.value)} placeholder="Descreva as consequências/danos..." className="text-xs min-h-[60px] resize-none" />
              )}
            </div>

            <div>
              <Label className="text-xs">Quais ações foram tomadas imediatamente após a detecção do evento (ação de disposição)?</Label>
              <Textarea value={acoesImediatas} onChange={e => setAcoesImediatas(e.target.value)} placeholder="Descreva as ações imediatas tomadas..." className="mt-1 text-xs min-h-[60px] resize-none" />
            </div>
          </div>

          {/* Análise de Não Conformidades */}
          <div className="space-y-3 bg-slate-50 rounded-lg p-4 border">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide text-center">ANÁLISE DE NÃO CONFORMIDADES E EVENTOS</p>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Data</Label><Input type="date" value={dataAnalise} onChange={e => setDataAnalise(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Local</Label><Input value={localAnalise} onChange={e => setLocalAnalise(e.target.value)} className="h-8 text-xs mt-1" /></div>
              <div><Label className="text-xs">Horário</Label><Input type="time" value={horarioAnalise} onChange={e => setHorarioAnalise(e.target.value)} className="h-8 text-xs mt-1" /></div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-600">Impactado</p>
              <div className="flex gap-4">
                {(["Paciente", "Acompanhante", "Colaborador"] as const).map(v => (
                  <label key={v} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="radio" name="impactado" value={v} checked={impactado === v} onChange={() => setImpactado(v)} className="accent-blue-600" />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">ANÁLISE DO EVENTO — TIPO DE INCIDENTE</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <div className="space-y-1">
                  {TIPOS_INCIDENTE_ESQUERDA.map(item => (
                    <label key={item} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5">
                      <input type="checkbox" checked={tiposIncidente.includes(item)} onChange={() => toggleIncidente(item)} className="accent-blue-600 mt-0.5 shrink-0" />
                      <span className={tiposIncidente.includes(item) ? "font-semibold text-blue-700" : "text-slate-600"}>{item}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1">
                  {TIPOS_INCIDENTE_DIREITA.map(item => (
                    <label key={item} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5">
                      <input type="checkbox" checked={tiposIncidente.includes(item)} onChange={() => toggleIncidente(item)} className="accent-blue-600 mt-0.5 shrink-0" />
                      <span className={tiposIncidente.includes(item) ? "font-semibold text-blue-700" : "text-slate-600"}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Análise de Causa Raiz — 5 Porquês */}
          <div className="space-y-3 border rounded-lg p-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide text-center">ANÁLISE DE CAUSA RAIZ — FERRAMENTA 5 PORQUÊS</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                {[0, 2, 4].map(i => (
                  <div key={i}>
                    <Label className="text-xs font-semibold text-slate-500">Por quê? {i + 1}</Label>
                    <Textarea value={porques[i]} onChange={e => updatePorque(i, e.target.value)} placeholder={`Causa ${i + 1}...`} className="mt-1 text-xs min-h-[48px] resize-none" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[1, 3].map(i => (
                  <div key={i}>
                    <Label className="text-xs font-semibold text-slate-500">Por quê? {i + 1}</Label>
                    <Textarea value={porques[i]} onChange={e => updatePorque(i, e.target.value)} placeholder={`Causa ${i + 1}...`} className="mt-1 text-xs min-h-[48px] resize-none" />
                  </div>
                ))}
                <div>
                  <Label className="text-xs font-semibold text-red-600">Dano (causa raiz identificada)</Label>
                  <Textarea value={dano} onChange={e => setDano(e.target.value)} placeholder="Descreva a causa raiz..." className="mt-1 text-xs min-h-[48px] resize-none border-red-200 focus:border-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Plano de Ação */}
          <div className="space-y-2 border rounded-lg p-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide text-center mb-2">AÇÕES PARA MELHORIAS — PLANO DE AÇÃO</p>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b pb-1">
              <span>Plano de Ação</span><span>Responsável</span><span>Prazo</span><span>Status</span>
            </div>
            {planos.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <Input value={row.acao} onChange={e => updatePlano(i, "acao", e.target.value)} placeholder="Descreva a ação..." className="h-8 text-xs" />
                <Input value={row.responsavel} onChange={e => updatePlano(i, "responsavel", e.target.value)} placeholder="Responsável" className="h-8 text-xs" />
                <Input type="date" value={row.prazo} onChange={e => updatePlano(i, "prazo", e.target.value)} className="h-8 text-xs" />
                <select value={row.status} onChange={e => updatePlano(i, "status", e.target.value)} className="h-8 text-xs border rounded-md px-2 bg-white">
                  <option value="">Status</option>
                  <option>Pendente</option><option>Em andamento</option><option>Concluído</option><option>Atrasado</option>
                </select>
              </div>
            ))}
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1 mt-1" onClick={() => setPlanos(p => [...p, { acao: "", responsavel: "", prazo: "", status: "" }])}>
              <Plus className="w-3 h-3" /> Adicionar linha
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-slate-50 sticky bottom-0 gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={() => { toast.info("Gerando formulário NSP em PDF..."); printNSPForm({ nspNumber: numeradorNSP, prazo, dadosPaciente, tipoNotificacao: tipoNotificacao || undefined, registradoPor, setorNotificante, dataOcorrencia, horaOcorrencia, setorNotificado, dataNotificacao, horaNotificacao, descricaoEvento: descricao, houveDano: houveDano || undefined, descricaoDano, acoesImediatas, dataAnalise, localAnalise, horarioAnalise, impactado: impactado || undefined, tiposIncidente, porques, dano, planos }); }}>
            <Download className="w-3.5 h-3.5" /> Imprimir / PDF
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1 bg-red-600 hover:bg-red-700 text-white" disabled={mutation.isPending} onClick={handleSubmit}>
            <CheckCircle2 className="w-3.5 h-3.5" /> {mutation.isPending ? "Registrando..." : "Registrar Notificação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Protocolo de Londres ─────────────────────────────────────────────────────

const FATORES_CONTRIBUINTES = [
  {
    categoria: "PACIENTE",
    fatores: ["Complexidade / Gravidade", "Doenças de Base", "Fatores psicossociais"],
  },
  {
    categoria: "TAREFA",
    fatores: [
      "Disponibilidade e uso dos protocolos",
      "Tomada de decisão (tempo e assertividade)",
      "Disponibilidade e clareza no papel de cada membro da equipe",
    ],
  },
  {
    categoria: "INDIVIDUAIS DOS PROFISSIONAIS",
    fatores: ["Conhecimento e Habilidade", "Competência técnica", "Saúde física e mental"],
  },
  {
    categoria: "EQUIPE",
    fatores: [
      "Comunicação, verbal e ou escrita",
      "Estrutura do time (consistência / liderança)",
      "Ajuda da Supervisão / Coordenação / Gerência",
    ],
  },
  {
    categoria: "AMBIENTE DE TRABALHO",
    fatores: ["Equipamentos / Área física", "Apoio da equipe administrativa", "Medicamentos / Materiais", "Ambiente de trabalho"],
  },
  {
    categoria: "ORGANIZACIONAIS E ADMINISTRATIVOS",
    fatores: ["Restrições financeiras", "Estrutura organizacional — Políticas, padrões e objetivos", "Cultura de segurança e prioridades"],
  },
  {
    categoria: "FATORES DO CONTEXTO DA INSTITUIÇÃO",
    fatores: ["Políticas", "Normativas", "Regras"],
  },
];

interface LondresPlanoRow { acao: string; responsavel: string; prazo: string; status: string; }

function ProtocoloLondresDialog({
  open, onClose, eventCode,
}: { open: boolean; onClose: () => void; eventCode?: string }) {
  // — Seção 1: Identificação —
  const [setor, setSetor] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [dataNotificacao, setDataNotificacao] = useState("");

  // — Seção 2: Descrição —
  const [processosEnvolvidos, setProcessosEnvolvidos] = useState("");
  const [grupoTrabalho, setGrupoTrabalho] = useState("");
  const [eventoIdentificado, setEventoIdentificado] = useState("");
  const [relatorioCronologico, setRelatorioCronologico] = useState("");
  const [tipoOcorrencia, setTipoOcorrencia] = useState("");

  // — Seção 3: Classificação do Adverso —
  const [classificacaoAdverso, setClassificacaoAdverso] = useState<"Leve" | "Moderado" | "Grave" | "Óbito" | "">("");

  // — Seção 4: Fatores contribuintes — { categoria: fator: análise }
  const [fatoresAnalise, setFatoresAnalise] = useState<Record<string, Record<string, string>>>({});

  // — Seção 5: Plano de ação —
  const [planos, setPlanos] = useState<LondresPlanoRow[]>([
    { acao: "", responsavel: "", prazo: "", status: "" },
    { acao: "", responsavel: "", prazo: "", status: "" },
    { acao: "", responsavel: "", prazo: "", status: "" },
  ]);

  const setFatorAnalise = (categoria: string, fator: string, valor: string) => {
    setFatoresAnalise(prev => ({
      ...prev,
      [categoria]: { ...(prev[categoria] ?? {}), [fator]: valor },
    }));
  };

  const updatePlano = (i: number, field: keyof LondresPlanoRow, val: string) => {
    const next = [...planos]; next[i] = { ...next[i], [field]: val }; setPlanos(next);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Protocolo de Londres — ${eventCode ?? ""}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 20px; }
        h1 { font-size: 13px; text-align: center; font-weight: bold; margin-bottom: 4px; }
        h2 { font-size: 11px; font-weight: bold; background: #eee; padding: 3px 6px; margin: 10px 0 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        td, th { border: 1px solid #999; padding: 4px 6px; vertical-align: top; font-size: 10px; }
        th { background: #ddd; font-weight: bold; text-align: left; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { margin-bottom: 6px; }
        .label { font-weight: bold; font-size: 10px; color: #444; }
        .value { border: 1px solid #ccc; min-height: 20px; padding: 2px 4px; font-size: 10px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h1>ANÁLISE DE EVENTOS COM DANOS GRAVES E/OU ÓBITO<br>(PROTOCOLO DE LONDRES)</h1>
      <p style="text-align:center;font-size:10px;">Evento: ${eventCode ?? "—"} | Impresso em: ${new Date().toLocaleString("pt-BR")}</p>
      <table>
        <tr><th>Setor</th><td>${setor}</td><th>Data do Evento</th><td>${dataEvento}</td></tr>
        <tr><th>Data da Notificação</th><td>${dataNotificacao}</td><th>Classificação</th><td>${classificacaoAdverso}</td></tr>
      </table>
      <h2>Processos Envolvidos</h2><div class="value">${processosEnvolvidos}</div>
      <h2>Grupo de Trabalho</h2><div class="value">${grupoTrabalho}</div>
      <h2>Evento Identificado</h2><div class="value">${eventoIdentificado}</div>
      <h2>Relatório Cronológico</h2><div class="value">${relatorioCronologico}</div>
      <h2>Tipo de Ocorrência / Evento</h2><div class="value">${tipoOcorrencia}</div>
      <h2>Fatores Contribuintes</h2>
      <table><thead><tr><th>Categoria</th><th>Fator</th><th>Análise</th></tr></thead><tbody>
      ${FATORES_CONTRIBUINTES.map(cat => cat.fatores.map(f =>
        `<tr><td>${cat.categoria}</td><td>${f}</td><td>${fatoresAnalise[cat.categoria]?.[f] ?? ""}</td></tr>`
      ).join("")).join("")}
      </tbody></table>
      <h2>Ações Planejadas</h2>
      <table><thead><tr><th>Plano de Ação</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead><tbody>
      ${planos.map(p => `<tr><td>${p.acao}</td><td>${p.responsavel}</td><td>${p.prazo}</td><td>${p.status}</td></tr>`).join("")}
      </tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-red-50 sticky top-0 z-10">
          <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            ANÁLISE DE EVENTOS COM DANOS GRAVES E/OU ÓBITO — PROTOCOLO DE LONDRES
            {eventCode && <span className="ml-2 text-xs font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded">{eventCode}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">

          {/* ── SEÇÃO 1: Identificação ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">SETOR</Label>
                <Input value={setor} onChange={e => setSetor(e.target.value)} className="h-8 text-xs mt-1" placeholder="Ex.: UTI, Centro Cirúrgico..." />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">DATA DO EVENTO</Label>
                <Input type="date" value={dataEvento} onChange={e => setDataEvento(e.target.value)} className="h-8 text-xs mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">DATA DA NOTIFICAÇÃO</Label>
                <Input type="date" value={dataNotificacao} onChange={e => setDataNotificacao(e.target.value)} className="h-8 text-xs mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">ETIQUETA (Dados do Paciente)</Label>
              <Textarea
                value={etiqueta}
                onChange={e => setEtiqueta(e.target.value)}
                placeholder="Nome, prontuário, data de nascimento, leito..."
                className="mt-1 text-xs min-h-[108px] resize-none border-dashed border-2 border-slate-300"
              />
            </div>
          </div>

          {/* ── SEÇÃO 2: Descrição ── */}
          <div className="space-y-3 border rounded-lg p-4 bg-slate-50">
            <div>
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">PROCESSOS ENVOLVIDOS</Label>
              <p className="text-[10px] text-slate-500 mb-1">Processos de trabalho / Ferramentas / Protocolos</p>
              <Textarea value={processosEnvolvidos} onChange={e => setProcessosEnvolvidos(e.target.value)} className="text-xs min-h-[56px] resize-none bg-white" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">GRUPO DE TRABALHO</Label>
              <p className="text-[10px] text-slate-500 mb-1">Quais equipes estavam envolvidas no atendimento ao paciente</p>
              <Textarea value={grupoTrabalho} onChange={e => setGrupoTrabalho(e.target.value)} className="text-xs min-h-[56px] resize-none bg-white" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">EVENTO IDENTIFICADO</Label>
              <p className="text-[10px] text-slate-500 mb-1">O que aconteceu?</p>
              <Textarea value={eventoIdentificado} onChange={e => setEventoIdentificado(e.target.value)} className="text-xs min-h-[80px] resize-none bg-white" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">RELATÓRIO CRONOLÓGICO</Label>
              <p className="text-[10px] text-slate-500 mb-1">História do Paciente da admissão até o momento do desfecho do atendimento</p>
              <Textarea value={relatorioCronologico} onChange={e => setRelatorioCronologico(e.target.value)} className="text-xs min-h-[100px] resize-none bg-white" />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">TIPO DE OCORRÊNCIA / EVENTO</Label>
              <Textarea value={tipoOcorrencia} onChange={e => setTipoOcorrencia(e.target.value)} className="text-xs min-h-[56px] resize-none bg-white mt-1" placeholder="Descreva o tipo de ocorrência..." />
            </div>
          </div>

          {/* ── SEÇÃO 3: Classificação ADVERSO ── */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">EVENTO ADVERSO — Classificação</p>
              <div className="flex gap-2">
                {(["Leve", "Moderado", "Grave", "Óbito"] as const).map(cls => (
                  <button
                    key={cls}
                    onClick={() => setClassificacaoAdverso(cls)}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-semibold border transition-all",
                      classificacaoAdverso === cls
                        ? cls === "Óbito" ? "bg-red-700 border-red-700 text-white"
                          : cls === "Grave" ? "bg-red-500 border-red-500 text-white"
                          : cls === "Moderado" ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-amber-400 border-amber-400 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                    )}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* ── SEÇÃO 4: Fatores Contribuintes ── */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide text-center bg-slate-100 py-1.5 rounded mb-3">
                ANÁLISE DO EVENTO: FATORES RELACIONADOS AO CUIDADO (FATORES CONTRIBUINTES)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold w-1/3">Categoria / Fator</th>
                      <th className="border border-slate-300 px-3 py-2 text-left font-bold">Análise / Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FATORES_CONTRIBUINTES.map(cat => (
                      cat.fatores.map((fator, fi) => (
                        <tr key={`${cat.categoria}-${fi}`} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-3 py-1.5 align-top">
                            {fi === 0 && (
                              <span className="font-bold text-slate-700 uppercase text-[10px] block mb-0.5">{cat.categoria}</span>
                            )}
                            <span className="text-slate-600 text-[11px]">{fator}</span>
                          </td>
                          <td className="border border-slate-300 px-1 py-1">
                            <Textarea
                              value={fatoresAnalise[cat.categoria]?.[fator] ?? ""}
                              onChange={e => setFatorAnalise(cat.categoria, fator, e.target.value)}
                              className="min-h-[36px] text-xs resize-none border-none shadow-none p-1 focus:ring-0"
                              placeholder="Descreva a análise deste fator..."
                            />
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── SEÇÃO 5: Ações Planejadas ── */}
          <div className="space-y-2 border rounded-lg p-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide text-center mb-2">AÇÕES PLANEJADAS</p>
            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b pb-1">
              <span>Plano de Ação</span><span>Responsável</span><span>Prazo</span><span>Status</span>
            </div>
            {planos.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <Input value={row.acao} onChange={e => updatePlano(i, "acao", e.target.value)} placeholder="Descreva a ação..." className="h-8 text-xs" />
                <Input value={row.responsavel} onChange={e => updatePlano(i, "responsavel", e.target.value)} placeholder="Responsável" className="h-8 text-xs" />
                <Input type="date" value={row.prazo} onChange={e => updatePlano(i, "prazo", e.target.value)} className="h-8 text-xs" />
                <select value={row.status} onChange={e => updatePlano(i, "status", e.target.value)} className="h-8 text-xs border rounded-md px-2 bg-white">
                  <option value="">Status</option>
                  <option>Pendente</option><option>Em andamento</option><option>Concluído</option><option>Atrasado</option>
                </select>
              </div>
            ))}
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1 mt-1" onClick={() => setPlanos(p => [...p, { acao: "", responsavel: "", prazo: "", status: "" }])}>
              <Plus className="w-3 h-3" /> Adicionar linha
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-slate-50 sticky bottom-0 gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>Fechar</Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={handlePrint}>
            <Download className="w-3.5 h-3.5" /> Imprimir / PDF
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { toast.success("Protocolo de Londres registrado com sucesso!"); onClose(); }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Salvar Análise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── TAB 1: Fila de Notificações ──────────────────────────────────────────────

function FilaNotificacoes() {
  const [showDialog, setShowDialog] = useState(false);
  const [showLondres, setShowLondres] = useState(false);
  const [selectedEventCode, setSelectedEventCode] = useState<string | undefined>(undefined);
  const qc = useQueryClient();
  const { data: dbEvents } = useQuery({
    queryKey: ["safety-events"],
    queryFn: () => getSafetyEvents(),
    staleTime: 30_000,
  });

  const mapDbToDisplay = (ev: any): SafetyEvent => {
    const catMap: Record<string, EventCategory> = { sentinel: "Sentinel", adverse_event: "Adverso", near_miss: "Quasi-erro" };
    const sevMap: Record<string, EventSeverity> = { death: "Morte evitável", severe: "Infecção grave", moderate: "Moderado", low: "Baixo" };
    const stMap: Record<string, EventStatus> = { reported: "Em análise", analyzing: "Análise de causa", action_plan: "CAPA gerada", closed: "Concluído" };
    const d = new Date(ev.occurrenceDate);
    return {
      code: ev.code || `EVT-${ev.id}`,
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      category: catMap[ev.category] ?? "Adverso",
      severity: sevMap[ev.severity] ?? "Baixo",
      unit: ev.unitId ? String(ev.unitId) : "—",
      status: stMap[ev.status] ?? "Em análise",
      notivisaDeadline: ev.notivisaRequired && ev.regulatoryDeadline
        ? new Date(ev.regulatoryDeadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
        : null,
      deadlineExpired: ev.notivisaRequired && ev.regulatoryDeadline
        ? new Date(ev.regulatoryDeadline) < new Date()
        : false,
    };
  };

  const { isAdmin } = useTenant();
  const events: SafetyEvent[] = (dbEvents && dbEvents.length > 0)
    ? dbEvents.map(mapDbToDisplay)
    : [];

  return (
    <div className="space-y-4">
      <NovaNotificacaoDialog open={showDialog} onClose={() => setShowDialog(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ["safety-events"] })} />
      <ProtocoloLondresDialog open={showLondres} onClose={() => setShowLondres(false)} eventCode={selectedEventCode} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Fila de notificações do período — RDC 63 / Notivisa</p>
        <Button size="sm" className="h-8 gap-1 bg-red-600 hover:bg-red-700 text-white text-xs" onClick={() => setShowDialog(true)}>
          <Plus className="w-3.5 h-3.5" /> Notificar Evento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                  <th className="px-4 py-3 text-left font-semibold">Severidade</th>
                  <th className="px-4 py-3 text-center font-semibold">Unidade</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Prazo Notivisa</th>
                  <th className="px-4 py-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map(ev => (
                  <tr
                    key={ev.code}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      ev.category === "Sentinel" && "bg-red-50/60",
                      ev.deadlineExpired && "bg-red-100/70"
                    )}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700 text-xs">{ev.code}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{ev.date}</td>
                    <td className="px-4 py-3"><CategoryBadge category={ev.category} /></td>
                    <td className="px-4 py-3"><SeverityBadge severity={ev.severity} /></td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-slate-600">{ev.unit}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={ev.status} /></td>
                    <td className="px-4 py-3 text-center text-xs">
                      {ev.notivisaDeadline ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded",
                          ev.deadlineExpired ? "bg-red-200 text-red-800 animate-pulse" : "bg-amber-100 text-amber-700"
                        )}>
                          <Clock className="w-3 h-3" />
                          {ev.notivisaDeadline}
                          {ev.deadlineExpired && " ⚠️ VENCIDO"}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-slate-600 hover:text-blue-600" onClick={() => toast.info("Abrindo detalhes do evento...")}>
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </Button>
                        {ev.category === "Sentinel" && (
                          <Button size="sm" className="h-7 px-2 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setSelectedEventCode(ev.code); setShowLondres(true); }}>
                            <Activity className="w-3.5 h-3.5" /> Analisar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB 2: Análise de Causa Raiz ─────────────────────────────────────────────

function AnaliseCausaRaiz() {
  const [conclusion, setConclusion] = useState("");
  const { isAdmin } = useTenant();

  const event = null;

  if (!event) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <AlertOctagon className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">Nenhum evento registrado. Registre um evento para iniciar a análise de causa raiz.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Event summary */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-4 px-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-red-700">{event.code}</span>
                  <CategoryBadge category={event.category} />
                  <SeverityBadge severity={event.severity} />
                </div>
                <p className="font-semibold text-slate-800">Evento Sentinela — {event.severity}</p>
                <p className="text-xs text-slate-500 mt-0.5">Unidade: {event.unit} · Data: {event.date} · Status: <strong>{event.status}</strong></p>
              </div>
            </div>
            <div className="md:ml-auto flex items-center gap-2">
              <Badge className="bg-red-600 text-white animate-pulse text-xs">PRIORIDADE MÁXIMA</Badge>
              {event.deadlineExpired && (
                <Badge variant="outline" className="border-red-400 text-red-600 text-xs animate-pulse">
                  <Clock className="w-3 h-3 mr-1" /> Notivisa vencido
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ishikawa */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-500" />
            Diagrama de Ishikawa — Análise de Causa Raiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IshikawaDiagram />
        </CardContent>
      </Card>

      {/* Root cause conclusion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Conclusão da Análise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Descreva a(s) causa(s) raiz identificadas, os fatores contribuintes e o contexto do evento..."
            value={conclusion}
            onChange={e => setConclusion(e.target.value)}
            className="min-h-[120px] text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={() => toast.success("CAPA gerada com sucesso! Verifique Gestão Operacional.")}>
              <ClipboardList className="w-3.5 h-3.5" /> Gerar CAPA
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => toast.info("Gerando relatório Notivisa...")}>
              <FileText className="w-3.5 h-3.5" /> Relatório Notivisa
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => toast.info("Exportando PDF...")}>
              <Download className="w-3.5 h-3.5" /> Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB 3: Dashboard Regulatório ─────────────────────────────────────────────

const RDC63_CHECKLIST = [
  { item: "Política de segurança do paciente implantada",             ok: true  },
  { item: "NSP (Núcleo de Segurança do Paciente) constituído",        ok: true  },
  { item: "Plano de segurança do paciente elaborado",                 ok: true  },
  { item: "Sistema de notificação de incidentes operacional",         ok: true  },
  { item: "Relatório anual de segurança do paciente enviado à ANVISA",ok: false },
  { item: "Protocolos básicos implantados (cirurgia segura, queda, LPP, etc.)", ok: true },
  { item: "Indicadores de segurança monitorados mensalmente",         ok: true  },
  { item: "Capacitação da equipe em segurança do paciente",           ok: false },
];

function DashboardRegulatorio() {
  const { isAdmin } = useTenant();
  const notivisaRate = 67;

  const displayPieData: typeof PIE_DATA = [];
  const displayBarData: typeof BAR_DATA = [];
  const displayTrendData: typeof TREND_DATA = [];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Notivisa — Conformidade" value="—" sub="" color="border-l-amber-500" />
        <KpiCard label="Prazo médio de resolução" value="—" sub="" color="border-l-blue-500" />
        <KpiCard label="Taxa de sub-notificação" value="—" sub="" color="border-l-orange-500" />
        <KpiCard label="RDC 63 — Itens atendidos" value="—" color="border-l-emerald-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie chart */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" /> Eventos por Categoria — Mar/2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={displayPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {displayPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" /> Distribuição por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={displayBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="unit" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="sentinel"  name="Sentinela"   fill="#ef4444" radius={[3,3,0,0]} />
                <Bar dataKey="adverso"   name="Adverso"     fill="#f97316" radius={[3,3,0,0]} />
                <Bar dataKey="quasiErro" name="Quasi-erro"  fill="#94a3b8" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-500" /> Tendência de Prazo de Resolução (dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={displayTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 20]} />
              <Tooltip />
              <Line type="monotone" dataKey="dias" name="Dias" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Notivisa compliance */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">Notivisa — Taxa de Notificação no Prazo</span>
            <span className={cn("text-sm font-bold", notivisaRate >= 80 ? "text-emerald-600" : "text-red-600")}>{notivisaRate}%</span>
          </div>
          <Progress value={notivisaRate} className="h-3 [&>div]:bg-amber-500" />
          <p className="text-xs text-slate-400 mt-1">Meta regulatória: 100% — Prazo: 72h para eventos sentinela / 10 dias para eventos adversos</p>
        </CardContent>
      </Card>

      {/* RDC 63 checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> Checklist RDC 63 — ANVISA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {RDC63_CHECKLIST.map(item => (
              <li key={item.item} className="flex items-center gap-3 text-sm">
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span className={cn(item.ok ? "text-slate-700" : "text-red-700 font-medium")}>{item.item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB 4: CAPA ──────────────────────────────────────────────────────────────

function CAPATab() {
  const { isAdmin } = useTenant();
  const displayCapaItems: typeof CAPA_ITEMS = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Ações Corretivas e Preventivas vinculadas a eventos de segurança</p>
        <Button size="sm" className="h-8 gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={() => toast.info("Nova CAPA criada e vinculada a evento de segurança")}>
          <Plus className="w-3.5 h-3.5" /> Nova CAPA
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Em andamento" value={displayCapaItems.filter(c => c.status === "Em andamento").length} color="border-l-blue-500" />
        <KpiCard label="Atrasadas"    value={displayCapaItems.filter(c => c.status === "Atrasada").length}     color="border-l-red-500" />
        <KpiCard label="Concluídas"   value={displayCapaItems.filter(c => c.status === "Concluída").length}    color="border-l-emerald-500" />
      </div>

      {/* CAPA Cards */}
      <div className="space-y-4">
        {displayCapaItems.map(item => (
          <Card
            key={item.esCode}
            className={cn(
              "border-l-4",
              item.status === "Atrasada"    && "border-l-red-500",
              item.status === "Em andamento"&& "border-l-blue-500",
              item.status === "Concluída"   && "border-l-emerald-500"
            )}
          >
            <CardContent className="py-4 px-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">{item.esCode}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    item.status === "Atrasada"     && "bg-red-100 text-red-700",
                    item.status === "Em andamento" && "bg-blue-100 text-blue-700",
                    item.status === "Concluída"    && "bg-emerald-100 text-emerald-700"
                  )}>
                    {item.status}
                    {item.status === "Atrasada" && " ⚠️"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{item.responsible}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{item.deadline}</span>
                </div>
              </div>

              {/* Body grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Causa Raiz Identificada</p>
                  <p className="text-sm text-slate-700">{item.cause}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Ação Corretiva
                  </p>
                  <p className="text-sm text-slate-700">{item.corrective}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Ação Preventiva
                  </p>
                  <p className="text-sm text-slate-700">{item.preventive}</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progresso de implementação</span>
                  <span>
                    {item.status === "Concluída" ? "100%" : item.status === "Atrasada" ? "40%" : "65%"}
                  </span>
                </div>
                <Progress
                  value={item.status === "Concluída" ? 100 : item.status === "Atrasada" ? 40 : 65}
                  className={cn(
                    "h-2",
                    item.status === "Concluída"    && "[&>div]:bg-emerald-500",
                    item.status === "Atrasada"     && "[&>div]:bg-red-500",
                    item.status === "Em andamento" && "[&>div]:bg-blue-500"
                  )}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => toast.info("Abrindo detalhes...")}>
                  <Eye className="w-3.5 h-3.5" /> Detalhes
                </Button>
                {item.status !== "Concluída" && (
                  <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.success("Ação marcada como concluída!")}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Marcar concluída
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={() => toast.success("Atualizado com sucesso!")}>
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Eventos() {
  const { isAdmin } = useTenant();

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <AlertOctagon className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notificação de Eventos de Segurança</h1>
            <p className="text-xs text-slate-500">Módulo 20 — RDC 63 ANVISA + Notivisa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Shield className="w-3 h-3 text-indigo-500" /> RDC 63/2011
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 text-red-600 border-red-300">
            <AlertOctagon className="w-3 h-3" /> 0 Sentinela ativo
          </Badge>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total este mês"       value={0}  sub="Mar/2026"         color="border-l-blue-500" />
        <KpiCard label="Quasi-erros"          value={0}   sub="sem dano"         color="border-l-slate-400" />
        <KpiCard label="Eventos adversos"     value={0}   sub="com dano"         color="border-l-orange-500" />
        <KpiCard label="Eventos sentinela"    value={0}   sub="análise urgente"  color="border-l-red-600" blink />
        <KpiCard label="Notivisa pendentes"   value={0}   sub="envio obrigatório" color="border-l-amber-500" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fila" className="space-y-4">
        <TabsList className="h-10">
          <TabsTrigger value="fila"         className="text-xs gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Fila de Notificações</TabsTrigger>
          <TabsTrigger value="causa"        className="text-xs gap-1.5"><Target className="w-3.5 h-3.5" /> Análise de Causa Raiz</TabsTrigger>
          <TabsTrigger value="dashboard"    className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Dashboard Regulatório</TabsTrigger>
          <TabsTrigger value="capa"         className="text-xs gap-1.5"><Shield className="w-3.5 h-3.5" /> CAPA</TabsTrigger>
        </TabsList>

        <TabsContent value="fila">
          <FilaNotificacoes />
        </TabsContent>
        <TabsContent value="causa">
          <AnaliseCausaRaiz />
        </TabsContent>
        <TabsContent value="dashboard">
          <DashboardRegulatorio />
        </TabsContent>
        <TabsContent value="capa">
          <CAPATab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
