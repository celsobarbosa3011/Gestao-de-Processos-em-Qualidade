import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  UserCheck, AlertOctagon, ArrowRightLeft, Clock, Users,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Activity, TrendingUp, TrendingDown, Filter, Eye,
  Stethoscope, ClipboardList, Bed, DoorOpen, HeartPulse
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, ReferenceLine
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "ok" | "alerta" | "critico" | "inativo";
type RuptureLevel = "critico" | "alto" | "medio";
type JourneyType = "eletivo" | "urgencia" | "emergencia";

interface JourneyStep {
  id: string;
  setor: string;
  etapa: string;
  responsavel: string;
  tempoMedioMin: number;
  tempoMetaMin: number;
  status: StepStatus;
  handoffs: string[];
  rupturas: number;
}

interface Rupture {
  id: string;
  etapa: string;
  setor: string;
  descricao: string;
  nivel: RuptureLevel;
  frequencia: number;
  impactoScore: number;
  acaoCorretiva: string;
  status: "aberta" | "em_andamento" | "resolvida";
}

interface JourneyType2 {
  tipo: JourneyType;
  label: string;
  steps: JourneyStep[];
  tempoTotalMedio: number;
  tempoTotalMeta: number;
  satisfacao: number;
  rupturas: number;
}

interface HandoffMetric {
  ponto: string;
  de: string;
  para: string;
  tempoEsperaMed: number;
  tempoEsperaMeta: number;
  perdaInfo: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusMeta(s: StepStatus) {
  const map: Record<StepStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ok: { label: "Dentro do prazo", color: "text-emerald-700", bg: "bg-emerald-100", icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
    alerta: { label: "Atenção", color: "text-amber-700", bg: "bg-amber-100", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    critico: { label: "Crítico", color: "text-red-700", bg: "bg-red-100", icon: <XCircle className="w-4 h-4 text-red-500" /> },
    inativo: { label: "Inativo", color: "text-gray-600", bg: "bg-gray-100", icon: <Clock className="w-4 h-4 text-gray-400" /> },
  };
  return map[s];
}

function ruptureLevelMeta(l: RuptureLevel) {
  const map: Record<RuptureLevel, { label: string; color: string; bg: string }> = {
    critico: { label: "Crítico", color: "text-red-700", bg: "bg-red-100" },
    alto: { label: "Alto", color: "text-orange-700", bg: "bg-orange-100" },
    medio: { label: "Médio", color: "text-amber-700", bg: "bg-amber-100" },
  };
  return map[l];
}

function journeyTypeMeta(t: JourneyType) {
  const map: Record<JourneyType, { label: string; color: string; bg: string; border: string }> = {
    eletivo: { label: "Eletivo", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    urgencia: { label: "Urgência", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    emergencia: { label: "Emergência", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  };
  return map[t];
}

function timeColor(atual: number, meta: number) {
  const ratio = atual / meta;
  if (ratio <= 1) return "text-emerald-600";
  if (ratio <= 1.3) return "text-amber-600";
  return "text-red-600";
}

function timeBg(atual: number, meta: number) {
  const ratio = atual / meta;
  if (ratio <= 1) return "bg-emerald-500";
  if (ratio <= 1.3) return "bg-amber-500";
  return "bg-red-500";
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const eletivoSteps: JourneyStep[] = [
  { id: "e1", setor: "Recepção", etapa: "Admissão & Cadastro", responsavel: "Atendente", tempoMedioMin: 18, tempoMetaMin: 15, status: "alerta", handoffs: ["Triagem"], rupturas: 2 },
  { id: "e2", setor: "Triagem", etapa: "Triagem de Enfermagem", responsavel: "Enfermeiro", tempoMedioMin: 12, tempoMetaMin: 15, status: "ok", handoffs: ["Consultório"], rupturas: 0 },
  { id: "e3", setor: "Consultório", etapa: "Consulta Médica", responsavel: "Médico", tempoMedioMin: 25, tempoMetaMin: 20, status: "alerta", handoffs: ["Exames", "Alta"], rupturas: 1 },
  { id: "e4", setor: "Exames", etapa: "Solicitação & Realização de Exames", responsavel: "Técnico", tempoMedioMin: 65, tempoMetaMin: 45, status: "critico", handoffs: ["Consultório"], rupturas: 4 },
  { id: "e5", setor: "Consultório", etapa: "Retorno com Resultado", responsavel: "Médico", tempoMedioMin: 20, tempoMetaMin: 20, status: "ok", handoffs: ["Farmácia", "Alta"], rupturas: 0 },
  { id: "e6", setor: "Farmácia", etapa: "Dispensação de Medicamentos", responsavel: "Farmacêutico", tempoMedioMin: 22, tempoMetaMin: 15, status: "alerta", handoffs: ["Alta"], rupturas: 1 },
  { id: "e7", setor: "Recepção", etapa: "Alta & Orientações", responsavel: "Atendente", tempoMedioMin: 10, tempoMetaMin: 10, status: "ok", handoffs: [], rupturas: 0 },
];

const urgenciaSteps: JourneyStep[] = [
  { id: "u1", setor: "Recepção", etapa: "Acolhimento Imediato", responsavel: "Atendente", tempoMedioMin: 5, tempoMetaMin: 5, status: "ok", handoffs: ["Triagem"], rupturas: 0 },
  { id: "u2", setor: "Triagem", etapa: "Triagem Manchester", responsavel: "Enfermeiro", tempoMedioMin: 8, tempoMetaMin: 5, status: "alerta", handoffs: ["Sala Urgência"], rupturas: 2 },
  { id: "u3", setor: "Sala Urgência", etapa: "Avaliação Inicial", responsavel: "Médico", tempoMedioMin: 15, tempoMetaMin: 10, status: "alerta", handoffs: ["Exames", "Internação"], rupturas: 1 },
  { id: "u4", setor: "Exames", etapa: "Exames de Urgência", responsavel: "Técnico", tempoMedioMin: 45, tempoMetaMin: 30, status: "critico", handoffs: ["Sala Urgência"], rupturas: 5 },
  { id: "u5", setor: "Sala Urgência", etapa: "Reavaliação & Decisão", responsavel: "Médico", tempoMedioMin: 20, tempoMetaMin: 15, status: "alerta", handoffs: ["Internação", "Alta"], rupturas: 1 },
  { id: "u6", setor: "Internação", etapa: "Transferência & Acomodação", responsavel: "Enfermeiro", tempoMedioMin: 35, tempoMetaMin: 20, status: "critico", handoffs: [], rupturas: 3 },
];

const emergenciaSteps: JourneyStep[] = [
  { id: "em1", setor: "Entrada", etapa: "Chegada & Identificação", responsavel: "Equipe SAMU", tempoMedioMin: 2, tempoMetaMin: 2, status: "ok", handoffs: ["Sala Vermelha"], rupturas: 0 },
  { id: "em2", setor: "Sala Vermelha", etapa: "Atendimento Primário ABCDE", responsavel: "Médico/Equipe", tempoMedioMin: 10, tempoMetaMin: 10, status: "ok", handoffs: ["Exames", "Cirurgia"], rupturas: 0 },
  { id: "em3", setor: "Exames", etapa: "Exames Críticos (Labs + Imagem)", responsavel: "Técnico", tempoMedioMin: 30, tempoMetaMin: 20, status: "critico", handoffs: ["Sala Vermelha"], rupturas: 3 },
  { id: "em4", setor: "Sala Vermelha", etapa: "Estabilização", responsavel: "Médico", tempoMedioMin: 25, tempoMetaMin: 20, status: "alerta", handoffs: ["UTI", "Cirurgia"], rupturas: 1 },
  { id: "em5", setor: "UTI", etapa: "Internação em UTI", responsavel: "Intensivista", tempoMedioMin: 40, tempoMetaMin: 30, status: "alerta", handoffs: [], rupturas: 2 },
];

const journeys: JourneyType2[] = [
  { tipo: "eletivo", label: "Eletivo", steps: eletivoSteps, tempoTotalMedio: 172, tempoTotalMeta: 140, satisfacao: 78, rupturas: 8 },
  { tipo: "urgencia", label: "Urgência", steps: urgenciaSteps, tempoTotalMedio: 128, tempoTotalMeta: 85, satisfacao: 65, rupturas: 12 },
  { tipo: "emergencia", label: "Emergência", steps: emergenciaSteps, tempoTotalMedio: 107, tempoTotalMeta: 82, satisfacao: 71, rupturas: 6 },
];

const rupturas: Rupture[] = [
  { id: "R001", etapa: "Exames", setor: "Laboratório", descricao: "Resultado de exame não retorna ao médico dentro do prazo, forçando nova solicitação", nivel: "critico", frequencia: 28, impactoScore: 87, acaoCorretiva: "Implantar alerta automático no HIS quando resultado liberado", status: "em_andamento" },
  { id: "R002", etapa: "Transferência & Acomodação", setor: "Internação", descricao: "Falta de leito disponível no momento da decisão de internação — paciente aguarda >1h na urgência", nivel: "critico", frequencia: 19, impactoScore: 92, acaoCorretiva: "Dashboard de gestão de leitos em tempo real + reunião diária de vagas", status: "aberta" },
  { id: "R003", etapa: "Triagem Manchester", setor: "Triagem", descricao: "Classificação de risco divergente entre turnos por falta de calibração da equipe", nivel: "alto", frequencia: 12, impactoScore: 74, acaoCorretiva: "Capacitação mensal Manchester + revisão de casos divergentes", status: "em_andamento" },
  { id: "R004", etapa: "Dispensação de Medicamentos", setor: "Farmácia", descricao: "Prescrição incompleta gera dupla conferência e atraso na dispensação", nivel: "alto", frequencia: 15, impactoScore: 68, acaoCorretiva: "Implantação de prescrição eletrônica com validação obrigatória", status: "aberta" },
  { id: "R005", etapa: "Admissão & Cadastro", setor: "Recepção", descricao: "Informações do paciente não chegam previamente, causando retrabalho no cadastro", nivel: "medio", frequencia: 22, impactoScore: 52, acaoCorretiva: "Formulário digital pré-admissão enviado via WhatsApp", status: "resolvida" },
  { id: "R006", etapa: "Exames Críticos", setor: "Imagem", descricao: "Fila de tomografia impacta tempo de estabilização em emergências", nivel: "critico", frequencia: 8, impactoScore: 95, acaoCorretiva: "Protocolo de prioridade em emergências + segundo turno de plantão", status: "aberta" },
  { id: "R007", etapa: "Reavaliação & Decisão", setor: "Sala Urgência", descricao: "Comunicação entre plantões sem handoff estruturado perde informações do histórico do paciente", nivel: "alto", frequencia: 10, impactoScore: 79, acaoCorretiva: "Implantar protocolo SBAR para passagem de plantão", status: "em_andamento" },
];

const handoffs: HandoffMetric[] = [
  { ponto: "Recepção → Triagem", de: "Recepção", para: "Triagem", tempoEsperaMed: 8, tempoEsperaMeta: 5, perdaInfo: 12 },
  { ponto: "Triagem → Consultório", de: "Triagem", para: "Consultório", tempoEsperaMed: 22, tempoEsperaMeta: 15, perdaInfo: 8 },
  { ponto: "Consultório → Exames", de: "Consultório", para: "Exames", tempoEsperaMed: 45, tempoEsperaMeta: 30, perdaInfo: 18 },
  { ponto: "Exames → Consultório", de: "Exames", para: "Consultório", tempoEsperaMed: 65, tempoEsperaMeta: 45, perdaInfo: 24 },
  { ponto: "Urgência → Internação", de: "Sala Urgência", para: "Internação", tempoEsperaMed: 95, tempoEsperaMeta: 30, perdaInfo: 35 },
  { ponto: "Emergência → UTI", de: "Sala Vermelha", para: "UTI", tempoEsperaMed: 38, tempoEsperaMeta: 20, perdaInfo: 22 },
];

const timeTrendData = [
  { mes: "Out", eletivo: 185, urgencia: 142, emergencia: 118, metaEletivo: 140, metaUrgencia: 85, metaEmergencia: 82 },
  { mes: "Nov", eletivo: 178, urgencia: 138, emergencia: 112, metaEletivo: 140, metaUrgencia: 85, metaEmergencia: 82 },
  { mes: "Dez", eletivo: 175, urgencia: 135, emergencia: 115, metaEletivo: 140, metaUrgencia: 85, metaEmergencia: 82 },
  { mes: "Jan", eletivo: 172, urgencia: 130, emergencia: 110, metaEletivo: 140, metaUrgencia: 85, metaEmergencia: 82 },
  { mes: "Fev", eletivo: 170, urgencia: 128, emergencia: 107, metaEletivo: 140, metaUrgencia: 85, metaEmergencia: 82 },
  { mes: "Mar", eletivo: 172, urgencia: 128, emergencia: 107, metaEletivo: 140, metaUrgencia: 85, metaEmergencia: 82 },
];

const ruptureStatusMeta = {
  aberta: { label: "Aberta", color: "text-red-700", bg: "bg-red-100" },
  em_andamento: { label: "Em andamento", color: "text-amber-700", bg: "bg-amber-100" },
  resolvida: { label: "Resolvida", color: "text-emerald-700", bg: "bg-emerald-100" },
};

// ── Sector Icons ──────────────────────────────────────────────────────────────

function sectorIcon(setor: string) {
  if (setor.includes("Recep") || setor.includes("Entra") || setor.includes("Porta")) return <DoorOpen className="w-4 h-4" />;
  if (setor.includes("Triagem")) return <ClipboardList className="w-4 h-4" />;
  if (setor.includes("Consul") || setor.includes("Vermel")) return <Stethoscope className="w-4 h-4" />;
  if (setor.includes("Exam") || setor.includes("Imagem") || setor.includes("Lab")) return <Activity className="w-4 h-4" />;
  if (setor.includes("Intern") || setor.includes("UTI")) return <Bed className="w-4 h-4" />;
  if (setor.includes("Farm")) return <HeartPulse className="w-4 h-4" />;
  return <Users className="w-4 h-4" />;
}

// ── Swimlane Component ────────────────────────────────────────────────────────

function Swimlane({ journey }: { journey: JourneyType2 }) {
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);
  const meta = journeyTypeMeta(journey.tipo);

  return (
    <div className="space-y-4">
      {/* Journey KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Tempo Médio Total</p>
          <p className={cn("text-2xl font-bold", timeColor(journey.tempoTotalMedio, journey.tempoTotalMeta))}>
            {journey.tempoTotalMedio}min
          </p>
          <p className="text-xs text-gray-400">Meta: {journey.tempoTotalMeta}min</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Desvio da Meta</p>
          <p className="text-2xl font-bold text-red-600">+{journey.tempoTotalMedio - journey.tempoTotalMeta}min</p>
          <p className="text-xs text-gray-400">{Math.round(((journey.tempoTotalMedio - journey.tempoTotalMeta) / journey.tempoTotalMeta) * 100)}% acima</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Satisfação</p>
          <p className={cn("text-2xl font-bold", journey.satisfacao >= 80 ? "text-emerald-600" : journey.satisfacao >= 70 ? "text-amber-600" : "text-red-600")}>
            {journey.satisfacao}%
          </p>
          <p className="text-xs text-gray-400">Meta: 85%</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Rupturas Ativas</p>
          <p className={cn("text-2xl font-bold", journey.rupturas > 10 ? "text-red-600" : journey.rupturas > 5 ? "text-amber-600" : "text-emerald-600")}>
            {journey.rupturas}
          </p>
          <p className="text-xs text-gray-400">pontos críticos</p>
        </div>
      </div>

      {/* Swimlane */}
      <div className={cn("border rounded-lg overflow-hidden", meta.border)}>
        <div className={cn("px-4 py-2 flex items-center gap-2", meta.bg)}>
          <Badge className={cn("text-xs", meta.color, meta.bg)}>{meta.label}</Badge>
          <span className="text-sm font-medium text-gray-700">Mapa Swimlane — Fluxo do Paciente</span>
          <span className="text-xs text-gray-400 ml-auto">Clique em uma etapa para ver detalhes</span>
        </div>
        <div className="p-4 bg-gray-50">
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {journey.steps.map((step, idx) => {
              const sm = statusMeta(step.status);
              const isSelected = selectedStep?.id === step.id;
              const overTime = step.tempoMedioMin > step.tempoMetaMin;
              return (
                <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setSelectedStep(isSelected ? null : step)}
                    className={cn(
                      "w-36 rounded-lg border-2 p-3 text-left transition-all",
                      isSelected ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-300",
                      "bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={cn("p-1 rounded", sm.bg)}>{sm.icon}</div>
                      {step.rupturas > 0 && (
                        <Badge className="text-xs px-1 py-0 bg-red-100 text-red-700">{step.rupturas}</Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 leading-tight mb-1">{step.etapa}</p>
                    <p className="text-xs text-gray-500 mb-2">{step.setor}</p>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className={cn("text-xs font-medium", timeColor(step.tempoMedioMin, step.tempoMetaMin))}>
                        {step.tempoMedioMin}min
                      </span>
                      <span className="text-xs text-gray-300">/{step.tempoMetaMin}</span>
                    </div>
                    <div className="mt-2">
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", timeBg(step.tempoMedioMin, step.tempoMetaMin))}
                          style={{ width: `${Math.min((step.tempoMetaMin / step.tempoMedioMin) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                  {idx < journey.steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Detail Panel */}
        {selectedStep && (
          <div className="border-t bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {sectorIcon(selectedStep.setor)}
                  <h3 className="font-semibold text-gray-900">{selectedStep.etapa}</h3>
                  <Badge className={cn("text-xs", statusMeta(selectedStep.status).color, statusMeta(selectedStep.status).bg)}>
                    {statusMeta(selectedStep.status).label}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Setor</p>
                    <p className="font-medium">{selectedStep.setor}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Responsável</p>
                    <p className="font-medium">{selectedStep.responsavel}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Tempo Médio</p>
                    <p className={cn("font-bold", timeColor(selectedStep.tempoMedioMin, selectedStep.tempoMetaMin))}>
                      {selectedStep.tempoMedioMin} min
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Meta</p>
                    <p className="font-medium text-gray-700">{selectedStep.tempoMetaMin} min</p>
                  </div>
                </div>
              </div>
              {selectedStep.handoffs.length > 0 && (
                <div className="text-sm">
                  <p className="text-gray-500 text-xs mb-1">Handoffs para</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedStep.handoffs.map(h => (
                      <Badge key={h} className="text-xs bg-blue-100 text-blue-700">{h}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function JornadaPaciente() {
  const [selectedJourney, setSelectedJourney] = useState<JourneyType>("eletivo");
  const [ruptureFilter, setRuptureFilter] = useState<"todos" | RuptureLevel>("todos");
  const [selectedRupture, setSelectedRupture] = useState<Rupture | null>(null);

  const journey = journeys.find(j => j.tipo === selectedJourney)!;
  const filteredRupturas = ruptureFilter === "todos"
    ? rupturas
    : rupturas.filter(r => r.nivel === ruptureFilter);

  const openRupturas = rupturas.filter(r => r.status !== "resolvida").length;
  const criticalRupturas = rupturas.filter(r => r.nivel === "critico" && r.status !== "resolvida").length;
  const avgSatisfacao = Math.round(journeys.reduce((a, j) => a + j.satisfacao, 0) / journeys.length);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jornada do Paciente</h1>
          <p className="text-sm text-gray-500 mt-1">Módulo 11 — Mapeamento e rupturas do fluxo assistencial</p>
        </div>
        <Badge className="bg-blue-100 text-blue-700 text-xs px-3 py-1">ONA 2026 Seção 2.3</Badge>
      </div>

      {/* Alert Banner */}
      {criticalRupturas > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {criticalRupturas} ruptura{criticalRupturas > 1 ? "s" : ""} crítica{criticalRupturas > 1 ? "s" : ""} identificada{criticalRupturas > 1 ? "s" : ""} com impacto direto na segurança do paciente. Ação imediata requerida.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Jornadas Mapeadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">3</p>
                <p className="text-xs text-gray-400 mt-1">Eletivo · Urgência · Emergência</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Rupturas Abertas</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{openRupturas}</p>
                <p className="text-xs text-gray-400 mt-1">{criticalRupturas} críticas</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertOctagon className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Pontos de Handoff</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{handoffs.length}</p>
                <p className="text-xs text-amber-600 mt-1">4 com perda de info &gt;15%</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Satisfação Média</p>
                <p className={cn("text-3xl font-bold mt-1", avgSatisfacao >= 80 ? "text-emerald-600" : avgSatisfacao >= 70 ? "text-amber-600" : "text-red-600")}>
                  {avgSatisfacao}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Meta: 85%</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <HeartPulse className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="swimlane">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="swimlane">Mapa Swimlane</TabsTrigger>
          <TabsTrigger value="rupturas">Rupturas & Falhas</TabsTrigger>
          <TabsTrigger value="handoffs">Handoffs & Tempos</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Swimlane ─────────────────────────────────────────────── */}
        <TabsContent value="swimlane" className="space-y-4 mt-4">
          {/* Journey selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Tipo de Jornada:</span>
            {journeys.map(j => {
              const m = journeyTypeMeta(j.tipo);
              return (
                <button
                  key={j.tipo}
                  onClick={() => setSelectedJourney(j.tipo)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                    selectedJourney === j.tipo
                      ? cn("border-transparent", m.bg, m.color)
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <Swimlane journey={journey} />

          {/* Step status legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="font-medium">Legenda:</span>
            {(["ok", "alerta", "critico"] as StepStatus[]).map(s => {
              const m = statusMeta(s);
              return (
                <div key={s} className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", s === "ok" ? "bg-emerald-500" : s === "alerta" ? "bg-amber-500" : "bg-red-500")} />
                  <span>{m.label}</span>
                </div>
              );
            })}
            <span className="ml-2">· Número em vermelho = rupturas na etapa · Barra = % dentro da meta de tempo</span>
          </div>
        </TabsContent>

        {/* ── Tab 2: Rupturas ─────────────────────────────────────────────── */}
        <TabsContent value="rupturas" className="space-y-4 mt-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Nível:</span>
            {(["todos", "critico", "alto", "medio"] as const).map(f => (
              <button
                key={f}
                onClick={() => setRuptureFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  ruptureFilter === f
                    ? "bg-gray-800 text-white border-gray-800"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {f === "todos" ? "Todos" : ruptureLevelMeta(f).label}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            {/* List */}
            <div className="flex-1 space-y-2">
              {filteredRupturas.map(r => {
                const lm = ruptureLevelMeta(r.nivel);
                const sm = ruptureStatusMeta[r.status];
                const isSelected = selectedRupture?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRupture(isSelected ? null : r)}
                    className={cn(
                      "w-full text-left bg-white border rounded-lg p-4 transition-all",
                      isSelected ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{r.id}</span>
                          <Badge className={cn("text-xs", lm.color, lm.bg)}>{lm.label}</Badge>
                          <Badge className={cn("text-xs", sm.color, sm.bg)}>{sm.label}</Badge>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{r.descricao}</p>
                        <p className="text-xs text-gray-500 mt-1">{r.etapa} · {r.setor}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn("text-lg font-bold", r.impactoScore >= 85 ? "text-red-600" : r.impactoScore >= 70 ? "text-amber-600" : "text-gray-700")}>
                          {r.impactoScore}
                        </p>
                        <p className="text-xs text-gray-400">impacto</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {r.frequencia}x/mês
                      </span>
                      <div className="flex-1">
                        <Progress value={r.impactoScore} className="h-1" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selectedRupture && (
              <div className="w-80 flex-shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-red-500" />
                      <CardTitle className="text-base">{selectedRupture.id}</CardTitle>
                      <Badge className={cn("text-xs ml-auto", ruptureLevelMeta(selectedRupture.nivel).color, ruptureLevelMeta(selectedRupture.nivel).bg)}>
                        {ruptureLevelMeta(selectedRupture.nivel).label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Descrição do Problema</p>
                      <p className="text-gray-800">{selectedRupture.descricao}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">Frequência</p>
                        <p className="font-bold text-gray-900">{selectedRupture.frequencia}×/mês</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">Score de Impacto</p>
                        <p className={cn("font-bold", selectedRupture.impactoScore >= 85 ? "text-red-600" : "text-amber-600")}>
                          {selectedRupture.impactoScore}/100
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Etapa / Setor</p>
                      <p className="font-medium">{selectedRupture.etapa}</p>
                      <p className="text-gray-500">{selectedRupture.setor}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Ação Corretiva Proposta</p>
                      <p className="text-gray-800 text-xs bg-blue-50 rounded p-2 border border-blue-100">
                        {selectedRupture.acaoCorretiva}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Status</p>
                      <Badge className={cn("text-xs", ruptureStatusMeta[selectedRupture.status].color, ruptureStatusMeta[selectedRupture.status].bg)}>
                        {ruptureStatusMeta[selectedRupture.status].label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Handoffs & Tempos ────────────────────────────────────── */}
        <TabsContent value="handoffs" className="space-y-6 mt-4">
          {/* Time trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução do Tempo Total por Tipo de Jornada (min)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timeTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="min" />
                  <Tooltip formatter={(v: number) => `${v} min`} />
                  <Legend />
                  <ReferenceLine y={140} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "Meta Eletivo", fontSize: 10, fill: "#3b82f6" }} />
                  <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Meta Urgência", fontSize: 10, fill: "#f59e0b" }} />
                  <ReferenceLine y={82} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Meta Emerg.", fontSize: 10, fill: "#ef4444" }} />
                  <Line type="monotone" dataKey="eletivo" name="Eletivo" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="urgencia" name="Urgência" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="emergencia" name="Emergência" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Handoff table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pontos de Handoff — Tempo de Espera e Perda de Informação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 text-xs text-gray-500 font-medium">Ponto de Transição</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium text-right">Tempo Médio</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium text-right">Meta</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium text-right">Desvio</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium text-right">Perda de Info</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {handoffs.map(h => {
                      const desvio = h.tempoEsperaMed - h.tempoEsperaMeta;
                      const ratio = h.tempoEsperaMed / h.tempoEsperaMeta;
                      const statusLabel = ratio <= 1 ? "ok" : ratio <= 1.5 ? "alerta" : "critico";
                      const sm = statusMeta(statusLabel as StepStatus);
                      return (
                        <tr key={h.ponto} className="hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                              <span className="font-medium">{h.ponto}</span>
                            </div>
                          </td>
                          <td className={cn("py-3 text-right font-medium", timeColor(h.tempoEsperaMed, h.tempoEsperaMeta))}>
                            {h.tempoEsperaMed}min
                          </td>
                          <td className="py-3 text-right text-gray-500">{h.tempoEsperaMeta}min</td>
                          <td className={cn("py-3 text-right font-medium", desvio > 0 ? "text-red-600" : "text-emerald-600")}>
                            {desvio > 0 ? "+" : ""}{desvio}min
                          </td>
                          <td className="py-3 text-right">
                            <span className={cn("font-medium", h.perdaInfo >= 25 ? "text-red-600" : h.perdaInfo >= 15 ? "text-amber-600" : "text-emerald-600")}>
                              {h.perdaInfo}%
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <Badge className={cn("text-xs", sm.color, sm.bg)}>{sm.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Handoff bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tempo de Espera nos Handoffs (Atual vs Meta)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={handoffs.map(h => ({ name: h.ponto.split(" → ")[1] || h.ponto, atual: h.tempoEsperaMed, meta: h.tempoEsperaMeta }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="min" />
                  <Tooltip formatter={(v: number) => `${v} min`} />
                  <Legend />
                  <Bar dataKey="atual" name="Tempo Atual" fill="#f87171" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" name="Meta" fill="#86efac" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
