import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
  ChevronRight,
  ChevronDown,
  Building2,
  FileText,
  Bot,
  Search,
  Filter,
  Download,
  Eye,
  Star,
  TrendingUp,
  Target,
  Clock,
  Plus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ONALevel = "N1" | "N2" | "N3";
type AdherenceStatus = "Aderente" | "Parcial" | "Não Aderente" | "Não Avaliado";
type EvidenceStatus = "Válida" | "Vencida" | "Pendente";

interface Criterion {
  code: string;
  description: string;
  level: ONALevel;
  status: AdherenceStatus;
  evidences: number;
}

interface Standard {
  code: string;
  title: string;
  criteria: Criterion[];
}

interface Chapter {
  id: number;
  title: string;
  items: number;
  adherencePercent: number;
  standards: Standard[];
}

interface Evidence {
  id: number;
  title: string;
  type: "POP" | "Protocolo" | "Ata" | "Indicador";
  reqCode: string;
  unit: string;
  validFrom: string;
  validTo: string;
  status: EvidenceStatus;
}

interface ChecklistItem {
  id: number;
  description: string;
  level: ONALevel;
  checked: boolean;
  status: AdherenceStatus;
  notes: string;
}

interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface GapItem {
  code: string;
  description: string;
  criticality: "Alta" | "Média" | "Baixa";
  level: ONALevel;
  unit: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const radarData = [
  { subject: "Liderança", N1: 84, N2: 72, N3: 58 },
  { subject: "Pessoas", N1: 78, N2: 64, N3: 52 },
  { subject: "Paciente", N1: 91, N2: 81, N3: 66 },
  { subject: "Segurança", N1: 80, N2: 68, N3: 55 },
  { subject: "Diagnóstico", N1: 74, N2: 61, N3: 47 },
  { subject: "Infraestrutura", N1: 68, N2: 52, N3: 38 },
];

const unitScores = [
  { name: "UTI Adulto", n1: 88, n2: 75, n3: 62, status: "ok" as const },
  { name: "Centro Cirúrgico", n1: 82, n2: 71, n3: 55, status: "warn" as const },
  { name: "Laboratório", n1: 78, n2: 65, n3: 48, status: "warn" as const },
  { name: "Pronto-Socorro", n1: 67, n2: 52, n3: 38, status: "danger" as const },
  { name: "Imagem", n1: 61, n2: 48, n3: 35, status: "danger" as const },
  { name: "Hemodiálise", n1: 54, n2: 42, n3: 28, status: "danger" as const },
];

const chapters: Chapter[] = [
  {
    id: 1,
    title: "Cap. 1 — Liderança e Governança",
    items: 12,
    adherencePercent: 75,
    standards: [
      {
        code: "1.1",
        title: "Planejamento Estratégico",
        criteria: [
          { code: "1.1.1", description: "Missão, visão e valores formalizados e amplamente divulgados", level: "N1", status: "Aderente", evidences: 4 },
          { code: "1.1.2", description: "Plano estratégico institucional com indicadores e metas definidos", level: "N2", status: "Parcial", evidences: 2 },
          { code: "1.1.3", description: "Ciclo de monitoramento e revisão do planejamento estratégico", level: "N3", status: "Não Avaliado", evidences: 0 },
        ],
      },
      {
        code: "1.2",
        title: "Governança Corporativa",
        criteria: [
          { code: "1.2.1", description: "Estrutura de governança documentada com papéis e responsabilidades", level: "N1", status: "Aderente", evidences: 6 },
          { code: "1.2.2", description: "Comitês e colegiados de gestão estabelecidos e atuantes", level: "N2", status: "Não Aderente", evidences: 1 },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Cap. 2 — Gestão de Pessoas",
    items: 8,
    adherencePercent: 60,
    standards: [
      {
        code: "2.1",
        title: "Dimensionamento e Qualificação",
        criteria: [
          { code: "2.1.1", description: "Dimensionamento de pessoal baseado em critérios técnicos e regulatórios", level: "N1", status: "Parcial", evidences: 3 },
          { code: "2.1.2", description: "Programa de educação continuada implantado e monitorado", level: "N2", status: "Parcial", evidences: 2 },
          { code: "2.1.3", description: "Avaliação de competências e desempenho com periodicidade definida", level: "N2", status: "Não Aderente", evidences: 0 },
        ],
      },
      {
        code: "2.2",
        title: "Saúde Ocupacional",
        criteria: [
          { code: "2.2.1", description: "Programa de saúde do trabalhador implementado com registros", level: "N1", status: "Aderente", evidences: 5 },
          { code: "2.2.2", description: "Monitoramento de indicadores de absenteísmo e acidentes de trabalho", level: "N2", status: "Parcial", evidences: 1 },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Cap. 3 — Atenção ao Paciente",
    items: 15,
    adherencePercent: 82,
    standards: [
      {
        code: "3.1",
        title: "Processo Assistencial",
        criteria: [
          { code: "3.1.1", description: "Fluxo de atendimento ao paciente documentado e amplamente conhecido", level: "N1", status: "Aderente", evidences: 7 },
          { code: "3.1.2", description: "Protocolos clínicos baseados em evidências implantados e auditados", level: "N2", status: "Aderente", evidences: 5 },
          { code: "3.1.3", description: "Gestão de leitos com monitoramento de indicadores de eficiência", level: "N3", status: "Parcial", evidences: 2 },
        ],
      },
      {
        code: "3.2",
        title: "Continuidade do Cuidado",
        criteria: [
          { code: "3.2.1", description: "Processo de alta hospitalar com orientações e seguimento ambulatorial", level: "N1", status: "Aderente", evidences: 4 },
          { code: "3.2.2", description: "Transferência interna e externa com registro e checklist padronizado", level: "N2", status: "Parcial", evidences: 2 },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Cap. 4 — Segurança do Paciente",
    items: 12,
    adherencePercent: 68,
    standards: [
      {
        code: "4.1",
        title: "Metas Internacionais de Segurança",
        criteria: [
          { code: "4.1.1", description: "Identificação correta do paciente com duplo identificador implantado", level: "N1", status: "Aderente", evidences: 8 },
          { code: "4.1.2", description: "Comunicação efetiva entre profissionais com protocolo SBAR", level: "N2", status: "Parcial", evidences: 3 },
          { code: "4.1.3", description: "Medicamentos potencialmente perigosos com controle diferenciado", level: "N1", status: "Não Aderente", evidences: 1 },
        ],
      },
      {
        code: "4.2",
        title: "Gestão de Incidentes",
        criteria: [
          { code: "4.2.1", description: "Sistema de notificação de incidentes com análise de causa raiz", level: "N2", status: "Parcial", evidences: 4 },
          { code: "4.2.2", description: "Cultura justa de segurança com indicadores monitorados", level: "N3", status: "Não Aderente", evidences: 0 },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Cap. 5 — Diagnóstico e Terapêutica",
    items: 10,
    adherencePercent: 55,
    standards: [
      {
        code: "5.1",
        title: "Laboratório Clínico",
        criteria: [
          { code: "5.1.1", description: "Controle de qualidade interno e externo com registros de controle", level: "N1", status: "Parcial", evidences: 3 },
          { code: "5.1.2", description: "Gestão de amostras com rastreabilidade completa do processo", level: "N2", status: "Não Aderente", evidences: 0 },
          { code: "5.1.3", description: "Valores críticos definidos e comunicação documentada em 100% dos casos", level: "N2", status: "Não Avaliado", evidences: 0 },
        ],
      },
      {
        code: "5.2",
        title: "Imagem e Diagnóstico",
        criteria: [
          { code: "5.2.1", description: "Laudos com tempo de entrega conforme protocolo institucional", level: "N1", status: "Parcial", evidences: 2 },
          { code: "5.2.2", description: "Calibração e manutenção preventiva dos equipamentos documentada", level: "N2", status: "Não Aderente", evidences: 1 },
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Cap. 6 — Infraestrutura e Suprimentos",
    items: 9,
    adherencePercent: 45,
    standards: [
      {
        code: "6.1",
        title: "Gestão da Infraestrutura",
        criteria: [
          { code: "6.1.1", description: "Plano de manutenção preventiva e corretiva documentado e executado", level: "N1", status: "Parcial", evidences: 2 },
          { code: "6.1.2", description: "Gestão de utilidades críticas (energia, água, gases medicinais)", level: "N1", status: "Não Aderente", evidences: 1 },
          { code: "6.1.3", description: "Plano de contingência para falhas de infraestrutura crítica", level: "N3", status: "Não Avaliado", evidences: 0 },
        ],
      },
      {
        code: "6.2",
        title: "Gestão de Suprimentos",
        criteria: [
          { code: "6.2.1", description: "Controle de estoque de medicamentos e materiais com rastreabilidade", level: "N1", status: "Não Aderente", evidences: 0 },
          { code: "6.2.2", description: "Gestão de fornecedores com avaliação periódica de desempenho", level: "N2", status: "Não Avaliado", evidences: 0 },
        ],
      },
    ],
  },
];

const evidences: Evidence[] = [
  { id: 1, title: "POP Identificação do Paciente — Rev. 4", type: "POP", reqCode: "4.1.1", unit: "UTI Adulto", validFrom: "2025-01-10", validTo: "2026-01-10", status: "Válida" },
  { id: 2, title: "Protocolo de Sepse Adulto — OMS", type: "Protocolo", reqCode: "3.1.2", unit: "Pronto-Socorro", validFrom: "2024-06-01", validTo: "2025-06-01", status: "Vencida" },
  { id: 3, title: "Ata Comitê de Qualidade — Fev/2026", type: "Ata", reqCode: "1.2.2", unit: "Institucional", validFrom: "2026-02-15", validTo: "2026-08-15", status: "Válida" },
  { id: 4, title: "Indicador Taxa de Infecção IRAS — Jan/2026", type: "Indicador", reqCode: "4.2.1", unit: "UTI Adulto", validFrom: "2026-01-01", validTo: "2026-12-31", status: "Válida" },
  { id: 5, title: "POP Administração de Medicamentos Potencialmente Perigosos", type: "POP", reqCode: "4.1.3", unit: "Centro Cirúrgico", validFrom: "2025-08-01", validTo: "2025-08-01", status: "Vencida" },
  { id: 6, title: "Protocolo de Higienização das Mãos — ANVISA", type: "Protocolo", reqCode: "4.1.1", unit: "Todas as Unidades", validFrom: "2025-03-01", validTo: "2026-03-01", status: "Pendente" },
  { id: 7, title: "POP Controle de Qualidade Laboratório", type: "POP", reqCode: "5.1.1", unit: "Laboratório", validFrom: "2025-11-01", validTo: "2026-11-01", status: "Válida" },
  { id: 8, title: "Indicador Tempo Médio de Laudo — Imagem", type: "Indicador", reqCode: "5.2.1", unit: "Imagem", validFrom: "2026-01-01", validTo: "2026-12-31", status: "Válida" },
];

const checklistGroups: ChecklistGroup[] = [
  {
    title: "Documentação Obrigatória",
    items: [
      { id: 1, description: "Regimento interno atualizado e aprovado pela diretoria", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 2, description: "Plano de gerenciamento de resíduos (PGRSS) vigente", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 3, description: "Plano de prevenção e combate a incêndio (PPCI) válido", level: "N1", checked: false, status: "Não Aderente", notes: "Laudo vencido há 6 meses" },
      { id: 4, description: "Alvará sanitário vigente e afixado em local visível", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 5, description: "Organograma institucional atualizado e publicado", level: "N1", checked: false, status: "Parcial", notes: "Revisão pendente pós-reestruturação" },
    ],
  },
  {
    title: "Processos Assistenciais",
    items: [
      { id: 6, description: "Protocolos de identificação do paciente com duplo identificador", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 7, description: "Protocolo SBAR implementado nas passagens de plantão", level: "N2", checked: false, status: "Parcial", notes: "Implementado em 60% das unidades" },
      { id: 8, description: "Checklist cirúrgico (OMS) aplicado em 100% das cirurgias", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 9, description: "Protocolo de triagem de risco nutricional implantado", level: "N2", checked: false, status: "Não Aderente", notes: "Sem evidências" },
      { id: 10, description: "Protocolo de prevenção de quedas com escala validada", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 11, description: "Gestão da dor com escala padronizada e monitorada", level: "N2", checked: true, status: "Aderente", notes: "" },
      { id: 12, description: "Protocolo de prevenção de lesão por pressão (LPP)", level: "N1", checked: false, status: "Parcial", notes: "Escala aplicada mas sem auditoria" },
      { id: 13, description: "Prescrição médica eletrônica com alertas de interação", level: "N3", checked: false, status: "Não Avaliado", notes: "" },
    ],
  },
  {
    title: "Segurança do Paciente",
    items: [
      { id: 14, description: "Sistema de notificação de eventos adversos em funcionamento", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 15, description: "Análise de causa raiz (RCA) realizada nos eventos sentinela", level: "N2", checked: false, status: "Parcial", notes: "Apenas 2 de 5 eventos analisados" },
      { id: 16, description: "Medicamentos potencialmente perigosos identificados e segregados", level: "N1", checked: false, status: "Não Aderente", notes: "Sem rotulagem padronizada" },
      { id: 17, description: "Bundles de prevenção de IRAS implementados e auditados", level: "N2", checked: true, status: "Aderente", notes: "" },
      { id: 18, description: "Ronda de segurança da liderança com frequência estabelecida", level: "N3", checked: false, status: "Não Avaliado", notes: "" },
      { id: 19, description: "Indicadores de segurança publicados e discutidos com a equipe", level: "N2", checked: true, status: "Aderente", notes: "" },
    ],
  },
  {
    title: "Infraestrutura",
    items: [
      { id: 20, description: "Plano de manutenção preventiva executado e documentado", level: "N1", checked: false, status: "Parcial", notes: "60% dos equipamentos cobertos" },
      { id: 21, description: "Gerador de emergência testado mensalmente com registro", level: "N1", checked: true, status: "Aderente", notes: "" },
      { id: 22, description: "Controle de temperatura e umidade em ambientes críticos", level: "N1", checked: false, status: "Não Aderente", notes: "Sem monitoramento contínuo" },
      { id: 23, description: "Plano de contingência para falta d'água e energia testado", level: "N2", checked: false, status: "Não Avaliado", notes: "" },
    ],
  },
];

const initialMessages: ChatMessage[] = [
  {
    role: "ai",
    content:
      "Olá! Sou o **ONA Copilot**, seu especialista em acreditação ONA 2026. Analisei todos os dados do hospital e estou pronto para ajudar a preparar a visita de acreditação. O que você gostaria de saber?",
  },
  {
    role: "user",
    content: "Quais são os gaps mais críticos do Pronto-Socorro para a acreditação N1?",
  },
  {
    role: "ai",
    content:
      "Com base na análise dos dados do **Pronto-Socorro**, identifiquei **3 gaps críticos** para o Nível 1 ONA:\n\n1. **4.1.3 — Medicamentos Potencialmente Perigosos**: Sem rotulagem padronizada e sem segregação física. Criticidade: **ALTA**.\n\n2. **6.1.2 — Gestão de Utilidades Críticas**: Ausência de plano documentado para gases medicinais e energia. Criticidade: **ALTA**.\n\n3. **2.1.1 — Dimensionamento de Pessoal**: Quadro de enfermagem abaixo do mínimo COFEN para a capacidade instalada. Criticidade: **MÉDIA**.\n\nRecomendo iniciar um plano de ação imediato para os itens 1 e 2, pois são eliminatórios na visita ONA. Deseja que eu gere um plano de ação detalhado?",
  },
];

const gaps: GapItem[] = [
  { code: "4.1.3", description: "Medicamentos potencialmente perigosos sem controle diferenciado", criticality: "Alta", level: "N1", unit: "Pronto-Socorro, Hemodiálise" },
  { code: "6.1.2", description: "Gestão de utilidades críticas sem plano documentado", criticality: "Alta", level: "N1", unit: "Infraestrutura Geral" },
  { code: "4.2.2", description: "Cultura justa de segurança sem indicadores definidos", criticality: "Alta", level: "N3", unit: "Institucional" },
  { code: "5.1.2", description: "Rastreabilidade de amostras laboratoriais incompleta", criticality: "Média", level: "N2", unit: "Laboratório" },
  { code: "2.1.3", description: "Avaliação de competências sem periodicidade estabelecida", criticality: "Média", level: "N2", unit: "Todas as Unidades" },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function ONALevelBadge({ level }: { level: ONALevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
        level === "N1" && "bg-sky-100 text-sky-700",
        level === "N2" && "bg-violet-100 text-violet-700",
        level === "N3" && "bg-amber-100 text-amber-700"
      )}
    >
      {level}
    </span>
  );
}

function StatusChip({ status }: { status: AdherenceStatus }) {
  const map: Record<AdherenceStatus, { color: string; icon: React.ReactNode }> = {
    Aderente: { color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3 w-3" /> },
    Parcial: { color: "bg-amber-100 text-amber-700", icon: <AlertCircle className="h-3 w-3" /> },
    "Não Aderente": { color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> },
    "Não Avaliado": { color: "bg-gray-100 text-gray-500", icon: <MinusCircle className="h-3 w-3" /> },
  };
  const { color, icon } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", color)}>
      {icon}
      {status}
    </span>
  );
}

function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  const map: Record<EvidenceStatus, string> = {
    Válida: "bg-emerald-100 text-emerald-700",
    Vencida: "bg-red-100 text-red-700",
    Pendente: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[status])}>
      {status}
    </span>
  );
}

function EvidenceTypeBadge({ type }: { type: Evidence["type"] }) {
  const map: Record<Evidence["type"], string> = {
    POP: "bg-blue-100 text-blue-700",
    Protocolo: "bg-purple-100 text-purple-700",
    Ata: "bg-teal-100 text-teal-700",
    Indicador: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold", map[type])}>
      {type}
    </span>
  );
}

function UnitStatusIcon({ status }: { status: "ok" | "warn" | "danger" }) {
  if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "warn") return <AlertCircle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
}

function ScoreRing({ score, color }: { score: number; color: "sky" | "violet" | "amber" }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorMap = {
    sky: { stroke: "#0ea5e9", text: "text-sky-600", bg: "bg-sky-50" },
    violet: { stroke: "#8b5cf6", text: "text-violet-600", bg: "bg-violet-50" },
    amber: { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" },
  };
  const c = colorMap[color];
  return (
    <div className={cn("relative flex items-center justify-center w-24 h-24 rounded-full", c.bg)}>
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={c.stroke}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute text-xl font-bold", c.text)}>{score}%</span>
    </div>
  );
}

// ─── Tab: Dashboard ONA ───────────────────────────────────────────────────────

function TabDashboard() {
  const barData = unitScores.map((u) => ({ name: u.name.split(" ")[0], N1: u.n1, N2: u.n2, N3: u.n3 }));

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Nível 1 — Acreditado", score: 84, color: "sky" as const, icon: Award, desc: "Base da Acreditação", target: 80 },
          { label: "Nível 2 — Pleno", score: 71, color: "violet" as const, icon: ShieldCheck, desc: "Acreditação Plena", target: 80 },
          { label: "Nível 3 — Excelência", score: 58, color: "amber" as const, icon: Star, desc: "Acreditação com Excelência", target: 80 },
        ].map(({ label, score, color, icon: Icon, desc, target }) => (
          <Card key={label} className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{desc}</p>
                  <h3 className="text-base font-bold text-gray-800 mt-0.5">{label}</h3>
                </div>
                <Icon className={cn("h-8 w-8", color === "sky" && "text-sky-500", color === "violet" && "text-violet-500", color === "amber" && "text-amber-500")} />
              </div>
              <div className="flex items-center gap-5">
                <ScoreRing score={score} color={color} />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Meta ONA</span>
                    <span className="font-semibold">{target}%</span>
                  </div>
                  <Progress
                    value={score}
                    className={cn(
                      "h-2",
                      color === "sky" && "[&>div]:bg-sky-500",
                      color === "violet" && "[&>div]:bg-violet-500",
                      color === "amber" && "[&>div]:bg-amber-500"
                    )}
                  />
                  <p className={cn("text-xs font-medium", score >= target ? "text-emerald-600" : "text-red-500")}>
                    {score >= target ? `✓ Meta atingida (+${score - target}pp)` : `⚠ ${target - score}pp abaixo da meta`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-500" />
              Score ONA por Capítulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="N1" dataKey="N1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="N2" dataKey="N2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="N3" dataKey="N3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-1">
              {[{ c: "bg-sky-500", l: "N1" }, { c: "bg-violet-500", l: "N2" }, { c: "bg-amber-500", l: "N3" }].map(({ c, l }) => (
                <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={cn("w-3 h-3 rounded-full", c)} />
                  {l}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              Score por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="N1" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                <Bar dataKey="N2" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="N3" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Unit table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            Score de Prontidão por Unidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Unidade</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-sky-600 uppercase">N1</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-violet-600 uppercase">N2</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-amber-600 uppercase">N3</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {unitScores.map((u) => (
                  <tr key={u.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-800">{u.name}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={cn("font-bold text-sm", u.n1 >= 80 ? "text-sky-600" : u.n1 >= 70 ? "text-amber-600" : "text-red-600")}>{u.n1}%</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={cn("font-bold text-sm", u.n2 >= 80 ? "text-violet-600" : u.n2 >= 70 ? "text-amber-600" : "text-red-600")}>{u.n2}%</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={cn("font-bold text-sm", u.n3 >= 70 ? "text-amber-600" : u.n3 >= 50 ? "text-orange-500" : "text-red-600")}>{u.n3}%</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex justify-center">
                        <UnitStatusIcon status={u.status} />
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

// ─── Tab: Árvore de Requisitos ────────────────────────────────────────────────

function TabRequisitos() {
  const [expandedChapters, setExpandedChapters] = useState<number[]>([1, 4]);
  const [expandedStandards, setExpandedStandards] = useState<string[]>(["1.1", "4.1"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<"all" | ONALevel>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | AdherenceStatus>("all");
  const [filterChapter, setFilterChapter] = useState<string>("all");

  const toggleChapter = (id: number) => {
    setExpandedChapters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleStandard = (code: string) => {
    setExpandedStandards((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  };

  const matchesCriterion = (c: Criterion) => {
    if (filterLevel !== "all" && c.level !== filterLevel) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchQuery && !c.code.includes(searchQuery) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  };

  const filteredChapters = chapters.filter((ch) => {
    if (filterChapter !== "all" && String(ch.id) !== filterChapter) return false;
    return ch.standards.some((s) => s.criteria.some(matchesCriterion));
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 text-sm h-9"
            placeholder="Buscar por código ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "N1", "N2", "N3"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setFilterLevel(l)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                filterLevel === l
                  ? l === "all" ? "bg-gray-700 text-white" : l === "N1" ? "bg-sky-500 text-white" : l === "N2" ? "bg-violet-500 text-white" : "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {l === "all" ? "Todos" : l}
            </button>
          ))}
        </div>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">Todos os status</option>
          <option value="Aderente">Aderente</option>
          <option value="Parcial">Parcial</option>
          <option value="Não Aderente">Não Aderente</option>
          <option value="Não Avaliado">Não Avaliado</option>
        </select>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
        >
          <option value="all">Todos os capítulos</option>
          {chapters.map((c) => (
            <option key={c.id} value={String(c.id)}>Cap. {c.id}</option>
          ))}
        </select>
      </div>

      {/* Chapter tree */}
      <div className="space-y-2">
        {filteredChapters.map((chapter) => {
          const isChapterExpanded = expandedChapters.includes(chapter.id);
          const adherenceColor = chapter.adherencePercent >= 75 ? "text-emerald-600" : chapter.adherencePercent >= 60 ? "text-amber-600" : "text-red-600";

          return (
            <div key={chapter.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Chapter header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {isChapterExpanded ? <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                <span className="font-semibold text-gray-800 text-sm flex-1 text-left">{chapter.title}</span>
                <span className="text-xs text-gray-500">{chapter.items} itens</span>
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        chapter.adherencePercent >= 75 ? "bg-emerald-500" : chapter.adherencePercent >= 60 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${chapter.adherencePercent}%` }}
                    />
                  </div>
                  <span className={cn("text-xs font-bold", adherenceColor)}>{chapter.adherencePercent}%</span>
                </div>
              </button>

              {/* Standards */}
              {isChapterExpanded && (
                <div className="divide-y divide-gray-100">
                  {chapter.standards.map((standard) => {
                    const isStandardExpanded = expandedStandards.includes(standard.code);
                    const filteredCriteria = standard.criteria.filter(matchesCriterion);
                    if (filteredCriteria.length === 0) return null;

                    return (
                      <div key={standard.code}>
                        <button
                          onClick={() => toggleStandard(standard.code)}
                          className="w-full flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-blue-50 transition-colors"
                        >
                          {isStandardExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{standard.code}</span>
                          <span className="text-sm text-gray-700 font-medium text-left flex-1">{standard.title}</span>
                          <span className="text-xs text-gray-400">{filteredCriteria.length} critérios</span>
                        </button>

                        {/* Criteria */}
                        {isStandardExpanded && (
                          <div className="bg-white">
                            {filteredCriteria.map((criterion) => (
                              <div
                                key={criterion.code}
                                className="flex flex-wrap items-center gap-2 px-10 py-2.5 border-t border-gray-50 hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-xs font-mono font-bold text-gray-500 w-12 flex-shrink-0">{criterion.code}</span>
                                <p className="text-xs text-gray-700 flex-1 min-w-[200px] leading-relaxed">{criterion.description}</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <ONALevelBadge level={criterion.level} />
                                  <StatusChip status={criterion.status} />
                                  <span className="text-xs text-gray-400">{criterion.evidences} evidência{criterion.evidences !== 1 ? "s" : ""}</span>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-700 px-2">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver evidências
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Evidências ──────────────────────────────────────────────────────────

function TabEvidencias() {
  const [filterType, setFilterType] = useState<"all" | Evidence["type"]>("all");
  const [filterUnit, setFilterUnit] = useState("all");
  const [search, setSearch] = useState("");

  const units = Array.from(new Set(evidences.map((e) => e.unit)));

  const filtered = evidences.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterUnit !== "all" && e.unit !== filterUnit) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.reqCode.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 text-sm h-9"
              placeholder="Buscar evidências..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(["all", "POP", "Protocolo", "Ata", "Indicador"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  filterType === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {t === "all" ? "Todos" : t}
              </button>
            ))}
          </div>
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
          >
            <option value="all">Todas as unidades</option>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" />
          Adicionar Evidência
        </Button>
      </div>

      {/* Evidence list */}
      <div className="space-y-2">
        {filtered.map((ev) => (
          <div key={ev.id} className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-medium text-gray-800">{ev.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">Validade: {ev.validFrom} → {ev.validTo}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <EvidenceTypeBadge type={ev.type} />
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ev.reqCode}</span>
              <span className="text-xs text-gray-500">{ev.unit}</span>
              <EvidenceStatusBadge status={ev.status} />
              <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-gray-700 px-2">
                <Eye className="h-3.5 w-3.5 mr-1" />
                Ver
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-gray-700 px-2">
                <Download className="h-3.5 w-3.5 mr-1" />
                Baixar
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma evidência encontrada para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Simulação de Visita ─────────────────────────────────────────────────

function TabSimulacao() {
  const [selectedUnit, setSelectedUnit] = useState("UTI Adulto");
  const [items, setItems] = useState(checklistGroups);

  const allItems = items.flatMap((g) => g.items);
  const checkedCount = allItems.filter((i) => i.checked).length;
  const totalCount = allItems.length;

  const toggleItem = (groupIdx: number, itemId: number) => {
    setItems((prev) =>
      prev.map((g, gi) =>
        gi === groupIdx ? { ...g, items: g.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) } : g
      )
    );
  };

  const levelColor: Record<ONALevel, string> = {
    N1: "text-sky-600 bg-sky-50",
    N2: "text-violet-600 bg-violet-50",
    N3: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Checklist de Simulação de Visita — ONA 2026</h2>
          <p className="text-sm text-gray-500 mt-0.5">Simule a visita dos avaliadores e identifique lacunas antes do dia oficial.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-sm border border-gray-200 rounded-xl px-4 py-2 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            {["UTI Adulto", "Centro Cirúrgico", "Laboratório", "Pronto-Socorro", "Imagem", "Hemodiálise"].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Progresso do Checklist</span>
            </div>
            <span className="text-sm font-bold text-blue-700">{checkedCount} de {totalCount} itens verificados</span>
          </div>
          <Progress value={(checkedCount / totalCount) * 100} className="h-3 [&>div]:bg-blue-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span className="font-medium text-blue-600">{Math.round((checkedCount / totalCount) * 100)}% concluído</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Checklist groups */}
      <div className="space-y-4">
        {items.map((group, gi) => {
          const groupChecked = group.items.filter((i) => i.checked).length;
          return (
            <Card key={group.title} className="border-0 shadow-md overflow-hidden">
              <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">{group.title}</CardTitle>
                  <span className="text-xs font-medium text-gray-500">{groupChecked}/{group.items.length} verificados</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                      item.checked && "bg-emerald-50/30"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(gi, item.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer flex-shrink-0 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm text-gray-700 leading-relaxed", item.checked && "line-through text-gray-400")}>{item.description}</p>
                      {item.notes && (
                        <p className="text-xs text-amber-600 mt-0.5 italic">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", levelColor[item.level])}>{item.level}</span>
                      <StatusChip status={item.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-8 py-3 h-auto text-sm font-semibold shadow-lg shadow-blue-200 gap-2 rounded-xl">
          <Download className="h-5 w-5" />
          Gerar Dossiê Final
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: IA ONA Copilot ──────────────────────────────────────────────────────

function TabCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    "Quais evidências faltam para UTI Nível 2?",
    "Gaps críticos do Pronto-Socorro",
    "Gerar relatório de prontidão",
    "Checklist para visita simulada",
  ];

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Analisando os dados da plataforma QHealth One... Baseado no mapeamento atual de requisitos e evidências, posso identificar as principais lacunas e recomendar ações prioritárias. Por favor, aguarde enquanto processo as informações mais recentes do hospital.",
        },
      ]);
    }, 1500);
  };

  const criticalityColor: Record<GapItem["criticality"], string> = {
    Alta: "bg-red-100 text-red-700 border-red-200",
    Média: "bg-amber-100 text-amber-700 border-amber-200",
    Baixa: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const criticalityBar: Record<GapItem["criticality"], string> = {
    Alta: "bg-red-500",
    Média: "bg-amber-500",
    Baixa: "bg-gray-400",
  };

  const criticalityWidth: Record<GapItem["criticality"], string> = {
    Alta: "w-full",
    Média: "w-2/3",
    Baixa: "w-1/3",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Chat area */}
      <div className="lg:col-span-3 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-t-2xl">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">ONA Copilot</h3>
            <p className="text-xs text-blue-100">Especialista em Acreditação ONA 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-blue-100">Online</span>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-x border-gray-200">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-xs bg-white border border-blue-200 text-blue-700 rounded-full px-3 py-1.5 hover:bg-blue-50 transition-colors font-medium shadow-sm"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 border-x border-gray-200 min-h-[280px] max-h-[340px] bg-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "ai"
                    ? "bg-gray-100 text-gray-800 rounded-tl-none"
                    : "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-none"
                )}
              >
                {msg.content.split("**").map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 p-3 border border-gray-200 rounded-b-2xl bg-white">
          <Input
            className="flex-1 text-sm h-9 border-gray-200"
            placeholder="Pergunte sobre requisitos, evidências, gaps..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          />
          <Button
            onClick={() => sendMessage(input)}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 flex-shrink-0"
          >
            Enviar
          </Button>
        </div>
      </div>

      {/* Gap Analysis panel */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Gap Analysis Automático
              <span className="ml-auto text-xs font-normal text-gray-400">Top 5 lacunas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gaps.map((gap, idx) => (
              <div key={gap.code} className={cn("p-3 rounded-xl border", criticalityColor[gap.criticality])}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                    <span className="text-xs font-mono font-bold">{gap.code}</span>
                    <ONALevelBadge level={gap.level} />
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", criticalityColor[gap.criticality])}>
                    {gap.criticality}
                  </span>
                </div>
                <p className="text-xs font-medium leading-snug mb-1.5">{gap.description}</p>
                <p className="text-xs opacity-70 mb-2">{gap.unit}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", criticalityBar[gap.criticality], criticalityWidth[gap.criticality])} />
                  </div>
                  <span className="text-xs font-bold">
                    {gap.criticality === "Alta" ? "100%" : gap.criticality === "Média" ? "66%" : "33%"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: "Gaps Críticos", value: "3", color: "text-red-600", icon: XCircle },
              { label: "Gaps Médios", value: "2", color: "text-amber-600", icon: AlertCircle },
              { label: "Evidências Vencidas", value: "2", color: "text-orange-600", icon: Clock },
              { label: "Itens N/A", value: "5", color: "text-gray-500", icon: MinusCircle },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center p-2 rounded-xl bg-gray-50">
                <Icon className={cn("h-5 w-5 mb-1", color)} />
                <span className={cn("text-xl font-bold", color)}>{value}</span>
                <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AcreditacaoONA() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Award className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">Acreditação ONA 2026</h1>
                  <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-violet-600 text-white px-2.5 py-1 rounded-full shadow">
                    Módulo 4
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestão completa do processo de acreditação — Organização Nacional de Acreditação
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-gray-600 border-gray-300 h-9">
                <Download className="h-4 w-4" />
                Exportar Relatório
              </Button>
              <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white h-9">
                <Clock className="h-4 w-4" />
                Agendar Visita
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm rounded-xl p-1 flex-wrap h-auto gap-0.5">
            {[
              { value: "dashboard", label: "Dashboard ONA", icon: TrendingUp },
              { value: "requisitos", label: "Árvore de Requisitos", icon: ShieldCheck },
              { value: "evidencias", label: "Evidências", icon: FileText },
              { value: "simulacao", label: "Simulação de Visita", icon: CheckCircle2 },
              { value: "copilot", label: "IA ONA Copilot", icon: Bot },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 text-xs font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow rounded-lg px-3 py-2 transition-all"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <TabDashboard />
          </TabsContent>

          <TabsContent value="requisitos">
            <TabRequisitos />
          </TabsContent>

          <TabsContent value="evidencias">
            <TabEvidencias />
          </TabsContent>

          <TabsContent value="simulacao">
            <TabSimulacao />
          </TabsContent>

          <TabsContent value="copilot">
            <TabCopilot />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
