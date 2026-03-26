import { toast } from "sonner";
import { printReport } from "@/lib/print-pdf";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Plus,
  Download,
  Filter,
  Building2,
  Activity,
  Star,
  Award,
  Users,
  Heart,
  Stethoscope,
  Clock,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createIndicator, getIndicators, createIndicatorValue } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type SemaphoreStatus = "green" | "yellow" | "red";

interface SparkPoint {
  month: string;
  value: number;
}

interface Indicator {
  id: string;
  name: string;
  code: string;
  unit: string;
  current: number;
  target: number;
  targetLabel: string;
  status: SemaphoreStatus;
  trend: "up" | "down";
  trendGoodDirection: "up" | "down";
  suffix: string;
  sparkData: SparkPoint[];
  critical?: boolean;
  description?: string;
  layer?: string;
  category?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSparkData(base: number, variance: number): SparkPoint[] {
  const months = ["Out", "Nov", "Dez", "Jan", "Fev", "Mar"];
  return months.map((month, i) => ({
    month,
    value: parseFloat(
      Math.max(0, base + (Math.random() - 0.5) * variance * 2 * ((i + 1) / 6)).toFixed(1)
    ),
  }));
}

function semaphoreColor(status: SemaphoreStatus) {
  if (status === "green") return "bg-emerald-500";
  if (status === "yellow") return "bg-amber-400";
  return "bg-red-500";
}

function semaphoreTextColor(status: SemaphoreStatus) {
  if (status === "green") return "text-emerald-600";
  if (status === "yellow") return "text-amber-600";
  return "text-red-600";
}

function semaphoreRingColor(status: SemaphoreStatus) {
  if (status === "green") return "ring-emerald-200";
  if (status === "yellow") return "ring-amber-200";
  return "ring-red-200";
}

function semaphoreBg(status: SemaphoreStatus) {
  if (status === "green") return "bg-emerald-50 border-emerald-200";
  if (status === "yellow") return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function sparkColor(status: SemaphoreStatus) {
  if (status === "green") return "#10b981";
  if (status === "yellow") return "#f59e0b";
  return "#ef4444";
}

// ─── Scorecard Component ───────────────────────────────────────────────────────

function IndicatorCard({
  indicator,
  accentColor,
}: {
  indicator: Indicator;
  accentColor: string;
}) {
  const [, navigate] = useLocation();
  const isBelowTarget = indicator.status !== "green";
  const TrendIcon =
    indicator.trend === "up" ? TrendingUp : TrendingDown;
  const trendIsGood =
    (indicator.trend === "up" && indicator.trendGoodDirection === "up") ||
    (indicator.trend === "down" && indicator.trendGoodDirection === "down");

  const achievementPct =
    indicator.trendGoodDirection === "down"
      ? indicator.target > 0
        ? Math.min(100, (indicator.target / Math.max(indicator.current, 0.01)) * 100)
        : 0
      : indicator.target > 0
      ? Math.min(100, (indicator.current / indicator.target) * 100)
      : 0;

  return (
    <Card
      className={cn(
        "border relative overflow-hidden transition-all hover:shadow-lg",
        indicator.critical && "ring-2 ring-red-400 animate-pulse-border"
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-1 w-full", accentColor)} />

      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {indicator.code}
            </p>
            <CardTitle className="text-sm font-semibold leading-tight mt-0.5 line-clamp-2">
              {indicator.name}
            </CardTitle>
          </div>
          <div
            className={cn(
              "shrink-0 w-3 h-3 rounded-full mt-1 ring-4",
              semaphoreColor(indicator.status),
              semaphoreRingColor(indicator.status),
              indicator.critical && "animate-ping-slow"
            )}
          />
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Big numbers */}
        <div className="flex items-end justify-between">
          <div>
            <span
              className={cn(
                "text-3xl font-bold leading-none",
                semaphoreTextColor(indicator.status)
              )}
            >
              {indicator.current}
              {indicator.suffix}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Meta:{" "}
              <span className="font-medium text-foreground">
                {indicator.targetLabel}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                trendIsGood
                  ? "text-emerald-700 bg-emerald-100"
                  : "text-red-700 bg-red-100"
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span>{trendIsGood ? "Melhora" : "Piora"}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] border",
                semaphoreBg(indicator.status),
                semaphoreTextColor(indicator.status)
              )}
            >
              {indicator.status === "green"
                ? "Na Meta"
                : indicator.status === "yellow"
                ? "Atenção"
                : "Crítico"}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Aderência</span>
            <span>{achievementPct.toFixed(0)}%</span>
          </div>
          <Progress
            value={achievementPct}
            className={cn(
              "h-1.5",
              indicator.status === "green"
                ? "[&>div]:bg-emerald-500"
                : indicator.status === "yellow"
                ? "[&>div]:bg-amber-400"
                : "[&>div]:bg-red-500"
            )}
          />
        </div>

        {/* Sparkline */}
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={indicator.sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <defs>
                <linearGradient id={`grad-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparkColor(indicator.status)} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={sparkColor(indicator.status)} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparkColor(indicator.status)}
                strokeWidth={1.5}
                fill={`url(#grad-${indicator.id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-muted-foreground text-center -mt-1">
          Últimos 6 meses
        </p>

        {/* Action button */}
        {isBelowTarget && (
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "w-full text-xs h-7 gap-1",
              indicator.status === "red"
                ? "border-red-300 text-red-700 hover:bg-red-50"
                : "border-amber-300 text-amber-700 hover:bg-amber-50"
            )}
            onClick={() => navigate("/gestao-operacional")}
          >
            <AlertTriangle className="h-3 w-3" />
            Abrir Plano de Ação
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        )}
        {!isBelowTarget && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Meta atingida</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Layer Header ─────────────────────────────────────────────────────────────

function LayerHeader({
  icon: Icon,
  title,
  subtitle,
  color,
  indicators,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  indicators: Indicator[];
}) {
  const green = indicators.filter((i) => i.status === "green").length;
  const yellow = indicators.filter((i) => i.status === "yellow").length;
  const red = indicators.filter((i) => i.status === "red").length;

  return (
    <div className={cn("rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4", color)}>
      <div className="flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-tight">{title}</h2>
          <p className="text-white/80 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
          <p className="text-white text-xl font-bold">{green}</p>
          <p className="text-white/70 text-xs">Na Meta</p>
        </div>
        <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
          <p className="text-white text-xl font-bold">{yellow}</p>
          <p className="text-white/70 text-xs">Atenção</p>
        </div>
        <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
          <p className="text-white text-xl font-bold">{red}</p>
          <p className="text-white/70 text-xs">Crítico</p>
        </div>
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const onaIndicators: Indicator[] = [
  {
    id: "ona-1",
    name: "Aderência ONA Geral",
    code: "ONA-ADH-001",
    unit: "%",
    current: 71,
    target: 80,
    targetLabel: "≥80%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(65, 8),
  },
  {
    id: "ona-2",
    name: "Requisitos N1 Aderentes",
    code: "ONA-N1-002",
    unit: "%",
    current: 84,
    target: 90,
    targetLabel: "≥90%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(78, 8),
  },
  {
    id: "ona-3",
    name: "Evidências Válidas",
    code: "ONA-EV-003",
    unit: "%",
    current: 67,
    target: 85,
    targetLabel: "≥85%",
    status: "red",
    trend: "down",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(72, 10),
  },
  {
    id: "ona-4",
    name: "Score de Prontidão",
    code: "ONA-SC-004",
    unit: "pontos",
    current: 71,
    target: 80,
    targetLabel: "≥80 pts",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "",
    sparkData: generateSparkData(66, 9),
  },
  {
    id: "ona-5",
    name: "Requisitos com Reincidência",
    code: "ONA-REIN-005",
    unit: "itens",
    current: 12,
    target: 5,
    targetLabel: "<5",
    status: "red",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "",
    sparkData: generateSparkData(14, 4),
    critical: true,
  },
  {
    id: "ona-6",
    name: "Ciclos de Diagnóstico no Prazo",
    code: "ONA-DIAG-006",
    unit: "%",
    current: 100,
    target: 100,
    targetLabel: "100%",
    status: "green",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(97, 4),
  },
];

const segurancaIndicators: Indicator[] = [
  {
    id: "seg-1",
    name: "Taxa de Identificação Correta",
    code: "SEG-ID-001",
    unit: "%",
    current: 94,
    target: 100,
    targetLabel: "100%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(91, 5),
  },
  {
    id: "seg-2",
    name: "Adesão Higiene das Mãos",
    code: "SEG-HIG-002",
    unit: "%",
    current: 78,
    target: 95,
    targetLabel: "≥95%",
    status: "red",
    trend: "down",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(82, 10),
    critical: true,
  },
  {
    id: "seg-3",
    name: "Checklist Cirurgia Segura",
    code: "SEG-CIR-003",
    unit: "%",
    current: 89,
    target: 100,
    targetLabel: "100%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(84, 7),
  },
  {
    id: "seg-4",
    name: "Eventos de Medicação/1000p-d",
    code: "SEG-MED-004",
    unit: "eventos",
    current: 2.3,
    target: 2.0,
    targetLabel: "<2.0",
    status: "red",
    trend: "up",
    trendGoodDirection: "down",
    suffix: "",
    sparkData: generateSparkData(2.1, 0.4),
    critical: true,
  },
  {
    id: "seg-5",
    name: "Taxa de Quedas",
    code: "SEG-QDA-005",
    unit: "%",
    current: 1.8,
    target: 1.5,
    targetLabel: "<1.5%",
    status: "yellow",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "%",
    sparkData: generateSparkData(2.0, 0.4),
  },
  {
    id: "seg-6",
    name: "Lesão por Pressão",
    code: "SEG-LPP-006",
    unit: "%",
    current: 0.8,
    target: 0.5,
    targetLabel: "<0.5%",
    status: "yellow",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "%",
    sparkData: generateSparkData(1.0, 0.3),
  },
  {
    id: "seg-7",
    name: "Infecção Sítio Cirúrgico",
    code: "SEG-ISC-007",
    unit: "%",
    current: 1.2,
    target: 1.0,
    targetLabel: "<1.0%",
    status: "yellow",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "%",
    sparkData: generateSparkData(1.4, 0.3),
  },
  {
    id: "seg-8",
    name: "Taxa de Notificação NSP",
    code: "SEG-NSP-008",
    unit: "%",
    current: 15,
    target: 80,
    targetLabel: ">80%",
    status: "red",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(12, 5),
    critical: true,
  },
];

const ansIndicators: Indicator[] = [
  {
    id: "ans-1",
    name: "Mortalidade Institucional",
    code: "ANS-MORT-001",
    unit: "%",
    current: 3.2,
    target: 3.0,
    targetLabel: "<3.0%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "down",
    suffix: "%",
    sparkData: generateSparkData(3.0, 0.4),
  },
  {
    id: "ans-2",
    name: "Tempo Médio de Permanência",
    code: "ANS-TMP-002",
    unit: "dias",
    current: 5.8,
    target: 6.0,
    targetLabel: "<6d",
    status: "green",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "d",
    sparkData: generateSparkData(6.2, 0.6),
  },
  {
    id: "ans-3",
    name: "Espera na Emergência (alta)",
    code: "ANS-EMG-003",
    unit: "min",
    current: 48,
    target: 60,
    targetLabel: "<60min",
    status: "green",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "min",
    sparkData: generateSparkData(55, 10),
  },
  {
    id: "ans-4",
    name: "Taxa de Readmissão 30d",
    code: "ANS-READ-004",
    unit: "%",
    current: 8.5,
    target: 8.0,
    targetLabel: "<8%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "down",
    suffix: "%",
    sparkData: generateSparkData(7.8, 1.0),
  },
  {
    id: "ans-5",
    name: "Partos Vaginais",
    code: "ANS-PTV-005",
    unit: "%",
    current: 35,
    target: 50,
    targetLabel: ">50%",
    status: "red",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(30, 7),
    critical: true,
  },
  {
    id: "ans-6",
    name: "Completude ANS",
    code: "ANS-COMP-006",
    unit: "%",
    current: 92,
    target: 100,
    targetLabel: "100%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(88, 6),
  },
];

const qualidadeOpIndicators: Indicator[] = [
  {
    id: "qop-1",
    name: "Taxa de Cancelamento Cirúrgico",
    code: "QOP-CIR-001",
    unit: "%",
    current: 6.5,
    target: 5.0,
    targetLabel: "<5%",
    status: "yellow",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "%",
    sparkData: generateSparkData(7.5, 1.5),
  },
  {
    id: "qop-2",
    name: "Conformidade de Prontuário",
    code: "QOP-PRON-002",
    unit: "%",
    current: 82,
    target: 95,
    targetLabel: "≥95%",
    status: "red",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(75, 9),
    critical: true,
  },
  {
    id: "qop-3",
    name: "Aderência ao Protocolo Clínico",
    code: "QOP-PROT-003",
    unit: "%",
    current: 88,
    target: 95,
    targetLabel: "≥95%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(82, 8),
  },
  {
    id: "qop-4",
    name: "Resposta a NCF em Prazo",
    code: "QOP-NCF-004",
    unit: "%",
    current: 73,
    target: 90,
    targetLabel: "≥90%",
    status: "red",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(65, 12),
    critical: true,
  },
  {
    id: "qop-5",
    name: "IRSO (Índice de Resolução)",
    code: "QOP-IRSO-005",
    unit: "%",
    current: 91,
    target: 90,
    targetLabel: "≥90%",
    status: "green",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(87, 6),
  },
  {
    id: "qop-6",
    name: "Taxa de Auditoria Interna OK",
    code: "QOP-AUD-006",
    unit: "%",
    current: 78,
    target: 85,
    targetLabel: "≥85%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(72, 8),
  },
  {
    id: "qop-7",
    name: "Eficiência Sala Cirúrgica",
    code: "QOP-SALA-007",
    unit: "%",
    current: 79,
    target: 85,
    targetLabel: "≥85%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(74, 8),
  },
  {
    id: "qop-8",
    name: "Disponibilidade de Leitos",
    code: "QOP-LEITO-008",
    unit: "%",
    current: 93,
    target: 90,
    targetLabel: "≥90%",
    status: "green",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(89, 5),
  },
];

const experienciaIndicators: Indicator[] = [
  {
    id: "exp-1",
    name: "NPS Hospitalar",
    code: "EXP-NPS-001",
    unit: "pontos",
    current: 52,
    target: 70,
    targetLabel: "≥70",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "",
    sparkData: generateSparkData(46, 8),
  },
  {
    id: "exp-2",
    name: "Satisfação Global (CSAT)",
    code: "EXP-CSAT-002",
    unit: "%",
    current: 86,
    target: 90,
    targetLabel: "≥90%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(82, 6),
  },
  {
    id: "exp-3",
    name: "Reclamações Fundadas/1000p",
    code: "EXP-RECL-003",
    unit: "/1000",
    current: 4.2,
    target: 2.0,
    targetLabel: "<2.0",
    status: "red",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "",
    sparkData: generateSparkData(5.0, 1.2),
    critical: true,
  },
  {
    id: "exp-4",
    name: "Resposta Ouvidoria (h)",
    code: "EXP-OUV-004",
    unit: "horas",
    current: 38,
    target: 24,
    targetLabel: "≤24h",
    status: "red",
    trend: "down",
    trendGoodDirection: "down",
    suffix: "h",
    sparkData: generateSparkData(45, 10),
    critical: true,
  },
  {
    id: "exp-5",
    name: "Percepção de Segurança",
    code: "EXP-SEG-005",
    unit: "%",
    current: 91,
    target: 95,
    targetLabel: "≥95%",
    status: "yellow",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(86, 7),
  },
  {
    id: "exp-6",
    name: "Resolutividade 1ª Consulta",
    code: "EXP-RESOL-006",
    unit: "%",
    current: 88,
    target: 85,
    targetLabel: "≥85%",
    status: "green",
    trend: "up",
    trendGoodDirection: "up",
    suffix: "%",
    sparkData: generateSparkData(83, 7),
  },
];

const allIndicators = [
  ...onaIndicators,
  ...segurancaIndicators,
  ...ansIndicators,
  ...qualidadeOpIndicators,
  ...experienciaIndicators,
];

// ─── BSC Data ─────────────────────────────────────────────────────────────────

const bscQuadrants = [
  {
    id: "financeira",
    title: "Perspectiva Financeira",
    icon: BarChart3,
    color: "bg-sky-600",
    lightBg: "bg-sky-50 border-sky-200",
    indicators: [
      { name: "Receita por Leito/Dia", value: "R$1.240", target: "R$1.350", status: "yellow" as SemaphoreStatus },
      { name: "Custo Médio de Internação", value: "R$3.820", target: "<R$3.500", status: "red" as SemaphoreStatus },
      { name: "EBITDA Hospitalar", value: "11.2%", target: "≥15%", status: "yellow" as SemaphoreStatus },
    ],
  },
  {
    id: "cliente",
    title: "Perspectiva Cliente/Paciente",
    icon: Heart,
    color: "bg-rose-600",
    lightBg: "bg-rose-50 border-rose-200",
    indicators: [
      { name: "NPS Hospitalar", value: "52", target: "≥70", status: "yellow" as SemaphoreStatus },
      { name: "Taxa de Fidelização", value: "68%", target: "≥75%", status: "yellow" as SemaphoreStatus },
      { name: "Reclamações Fundadas", value: "4.2/1000p", target: "<2.0", status: "red" as SemaphoreStatus },
    ],
  },
  {
    id: "processos",
    title: "Perspectiva Processos Internos",
    icon: Activity,
    color: "bg-violet-600",
    lightBg: "bg-violet-50 border-violet-200",
    indicators: [
      { name: "Aderência ONA Geral", value: "71%", target: "≥80%", status: "yellow" as SemaphoreStatus },
      { name: "Higiene das Mãos", value: "78%", target: "≥95%", status: "red" as SemaphoreStatus },
      { name: "Taxa de Notificação NSP", value: "15%", target: ">80%", status: "red" as SemaphoreStatus },
    ],
  },
  {
    id: "aprendizado",
    title: "Aprendizado e Crescimento",
    icon: Star,
    color: "bg-amber-600",
    lightBg: "bg-amber-50 border-amber-200",
    indicators: [
      { name: "Horas de Treinamento/Colaborador", value: "18h", target: "≥24h", status: "yellow" as SemaphoreStatus },
      { name: "Índice de Engajamento", value: "74%", target: "≥80%", status: "yellow" as SemaphoreStatus },
      { name: "Turnover Clínico", value: "9.5%", target: "<8%", status: "yellow" as SemaphoreStatus },
    ],
  },
];

// ─── Benchmark Data ────────────────────────────────────────────────────────────

const units = ["Hospital Central", "UPA Norte", "Clínica Sul", "Hospital Regional", "Pronto Socorro Leste"];

const benchmarkData = [
  { indicator: "Higiene Mãos", "Hospital Central": 78, "UPA Norte": 85, "Clínica Sul": 91, "Hospital Regional": 72, "Pronto Socorro Leste": 68 },
  { indicator: "NPS", "Hospital Central": 52, "UPA Norte": 61, "Clínica Sul": 74, "Hospital Regional": 48, "Pronto Socorro Leste": 55 },
  { indicator: "Aderência ONA", "Hospital Central": 71, "UPA Norte": 77, "Clínica Sul": 83, "Hospital Regional": 65, "Pronto Socorro Leste": 69 },
  { indicator: "Notificação NSP", "Hospital Central": 15, "UPA Norte": 28, "Clínica Sul": 45, "Hospital Regional": 12, "Pronto Socorro Leste": 22 },
  { indicator: "Readmissão 30d", "Hospital Central": 8.5, "UPA Norte": 7.2, "Clínica Sul": 6.8, "Hospital Regional": 9.1, "Pronto Socorro Leste": 8.0 },
];

const BENCHMARK_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Indicadores() {
  const [, navigate] = useLocation();
  const { isAdmin, validatedData } = useTenant();

  // ── DB integration ──────────────────────────────────────────────────────────
  const { data: dbIndicators } = useQuery({
    queryKey: ["indicators"],
    queryFn: () => getIndicators(),
    staleTime: 30_000,
  });

  // Map DB indicator to local Indicator shape
  const mapDbIndicator = (d: any): Indicator => ({
    id: String(d.id),
    name: d.name,
    code: d.code ?? `IND-${String(d.id).padStart(3, "0")}`,
    unit: d.unit ?? "%",
    current: d.lastValue ?? 0,
    target: d.target ?? 0,
    targetLabel: `Meta: ≥${d.target ?? 0}${d.unit ?? "%"}`,
    status: (d.lastValue ?? 0) >= (d.target ?? 0) ? "green" : (d.lastValue ?? 0) >= (d.target ?? 0) * 0.75 ? "yellow" : "red",
    trend: (d.lastValue ?? 0) >= 60 ? "up" : "down",
    trendGoodDirection: "up",
    suffix: d.unit ?? "%",
    trendValue: 0,
    category: d.category ?? "Geral",
    layer: d.layer ?? "ONA",
    critical: (d.lastValue ?? 0) < (d.target ?? 0) * 0.75,
    description: d.description ?? "",
    sparkData: [
      { month: "Out", value: Math.max(0, (d.lastValue ?? 0) - 5) },
      { month: "Nov", value: Math.max(0, (d.lastValue ?? 0) - 3) },
      { month: "Dez", value: Math.max(0, (d.lastValue ?? 0) - 1) },
      { month: "Jan", value: d.lastValue ?? 0 },
      { month: "Fev", value: d.lastValue ?? 0 },
      { month: "Mar", value: d.lastValue ?? 0 },
    ],
    unit_label: d.category ?? "Geral",
    responsible: "Gestor da Qualidade",
  } as unknown as Indicator);

  // LGPD: mock data visível apenas para admin; clientes validados usam dados reais da avaliação
  const validatedOna = validatedData?.indicadores.filter(i => i.layer === "ONA") ?? [];
  const validatedSeg = validatedData?.indicadores.filter(i => i.layer === "Segurança") ?? [];
  const validatedQualidadeOp = validatedData?.indicadores.filter(i => i.layer === "Qualidade Operacional") ?? [];
  // Map validated indicadores to the shape expected by this page
  const toDisplayFormat = (vi: typeof validatedOna[0]): Indicator => ({
    id: String(vi.id),
    name: vi.name,
    code: `ONA-${vi.id.toString().padStart(3, "0")}`,
    unit: vi.unit,
    current: vi.value,
    target: vi.target,
    targetLabel: `Meta: ≥${vi.target}%`,
    status: vi.value >= vi.target ? "green" as const : vi.value >= vi.target * 0.75 ? "yellow" as const : "red" as const,
    trend: vi.value >= 60 ? "up" as const : "down" as const,
    trendGoodDirection: "up" as const,
    suffix: "%",
    trendValue: vi.value >= 80 ? 2.1 : vi.value >= 60 ? 0 : -1.5,
    category: vi.category,
    layer: vi.layer,
    critical: vi.critical,
    description: vi.description,
    sparkData: [
      { month: "Set", value: Math.max(0, vi.value - 8) },
      { month: "Out", value: Math.max(0, vi.value - 5) },
      { month: "Nov", value: Math.max(0, vi.value - 3) },
      { month: "Dez", value: Math.max(0, vi.value - 1) },
      { month: "Jan", value: vi.value },
      { month: "Fev", value: vi.value },
      { month: "Mar", value: vi.value },
    ],
    unit_label: vi.category,
    responsible: "Gestor da Qualidade",
  } as unknown as Indicator);
  // Prefer DB data when available, otherwise fall back to mock (admin) or validated/empty
  const dbMapped = dbIndicators && dbIndicators.length > 0 ? dbIndicators.map(mapDbIndicator) : null;
  const displayIndicators = dbMapped
    ? dbMapped
    : [...validatedOna, ...validatedSeg, ...validatedQualidadeOp].map(toDisplayFormat);
  const displayOnaIndicators = dbMapped
    ? dbMapped.filter(i => i.layer === "ONA")
    : validatedOna.map(toDisplayFormat);
  const displaySegurancaIndicators = dbMapped
    ? dbMapped.filter(i => i.layer === "Segurança")
    : validatedSeg.map(toDisplayFormat);
  const displayAnsIndicators = dbMapped
    ? dbMapped.filter(i => i.layer === "ANS")
    : [];
  const displayQualidadeOpIndicators = dbMapped
    ? dbMapped.filter(i => i.layer === "Qualidade Operacional")
    : validatedQualidadeOp.map(toDisplayFormat);
  const displayExperienciaIndicators = dbMapped
    ? dbMapped.filter(i => i.layer === "Experiência do Paciente")
    : [];
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("todas");
  const [selectedPeriod, setSelectedPeriod] = useState("mar-2026");
  const [novoNome, setNovoNome] = useState("");
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoMeta, setNovoMeta] = useState("");
  const [novoUnidade, setNovoUnidade] = useState("%");
  const [novoCamada, setNovoCamada] = useState("ONA");
  const [novoCategoria, setNovoCategoria] = useState("Qualidade");
  const [novoDescricao, setNovoDescricao] = useState("");
  const [novoValorAtual, setNovoValorAtual] = useState("");
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createIndicator,
    onSuccess: async (created) => {
      // Se informou valor atual, registra o valor imediatamente
      if (novoValorAtual && created?.id) {
        try {
          await createIndicatorValue({ indicatorId: created.id, value: parseFloat(novoValorAtual), period: new Date().toISOString().slice(0, 7) } as any);
        } catch { /* valor opcional */ }
      }
      toast.success("Indicador criado com sucesso!");
      setShowNovoForm(false);
      setNovoNome(""); setNovoCodigo(""); setNovoMeta(""); setNovoUnidade("%");
      setNovoCamada("ONA"); setNovoCategoria("Qualidade"); setNovoDescricao(""); setNovoValorAtual("");
      qc.invalidateQueries({ queryKey: ["indicators"] });
    },
    onError: () => toast.error("Erro ao criar indicador."),
  });

  function handleSalvarIndicador() {
    if (!novoNome.trim()) { toast.error("Informe o nome do indicador."); return; }
    if (!novoMeta.trim()) { toast.error("Informe a meta do indicador."); return; }
    createMutation.mutate({
      name: novoNome,
      code: novoCodigo || undefined,
      unit: novoUnidade || "%",
      target: parseFloat(novoMeta) || 0,
      active: true,
      layer: novoCamada,
      category: novoCategoria,
      description: novoDescricao || undefined,
    } as any);
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-sky-500 to-violet-600 rounded-xl p-2.5">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Módulo de Indicadores</h1>
              <p className="text-muted-foreground text-sm">
                Biblioteca de 50+ indicadores em 5 camadas — QHealth One 2026
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedUnit} onValueChange={(v) => { setSelectedUnit(v); toast.info(v === "todas" ? "Exibindo todas as unidades" : `Filtrando por: ${v}`); }}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Unidades</SelectItem>
              {units.map((u) => (
                <SelectItem key={u} value={u.toLowerCase().replace(/\s/g, "-")}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); toast.info(`Período selecionado: ${v}`); }}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mar-2026">Mar / 2026</SelectItem>
              <SelectItem value="fev-2026">Fev / 2026</SelectItem>
              <SelectItem value="jan-2026">Jan / 2026</SelectItem>
              <SelectItem value="dez-2025">Dez / 2025</SelectItem>
              <SelectItem value="t1-2026">T1 2026</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => toast.info("Use os filtros ao lado para refinar os resultados")}>
            <Filter className="h-3.5 w-3.5" />
            Filtros
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => printReport({
            title: "Relatório de Indicadores de Qualidade",
            subtitle: `Dashboard de Indicadores — QHealth One 2026 · Período: ${selectedPeriod}`,
            module: "Indicadores",
            kpis: [
              { label: "Total de Indicadores", value: displayIndicators.length, color: "#0ea5e9" },
              { label: "Na Meta", value: displayIndicators.filter(i => i.status === "green").length, color: "#10b981" },
              { label: "Em Atenção", value: displayIndicators.filter(i => i.status === "yellow").length, color: "#f59e0b" },
              { label: "Críticos", value: displayIndicators.filter(i => i.status === "red").length, color: "#ef4444" },
            ],
            columns: [
              { label: "Código", key: "codigo" },
              { label: "Indicador", key: "nome" },
              { label: "Valor Atual", key: "valor", align: "center" as const },
              { label: "Meta", key: "meta", align: "center" as const },
              { label: "Camada", key: "camada" },
              { label: "Status", key: "status", align: "center" as const },
            ],
            rows: displayIndicators.slice(0, 50).map(i => ({
              codigo: i.code,
              nome: i.name,
              valor: `${i.current}${i.suffix ?? ""}`,
              meta: i.targetLabel,
              camada: i.layer ?? "ONA",
              status: i.status === "green" ? "✅ Na Meta" : i.status === "yellow" ? "⚠️ Atenção" : "❌ Abaixo",
            })),
            customContent: `<p>Relatório gerado automaticamente pelo QHealth One 2026 em ${new Date().toLocaleDateString("pt-BR")}.</p>`,
          })}>
            <Download className="h-3.5 w-3.5" />
            Exportar PDF
          </Button>
          <Button size="sm" className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700" onClick={() => setShowNovoForm(v => !v)}>
            <Plus className="h-3.5 w-3.5" />
            Novo Indicador
          </Button>
        </div>
      </div>

      {/* Novo Indicador Form */}
      {showNovoForm && (
        <Card className="border border-sky-200 bg-sky-50 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-sky-800 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Cadastrar Novo Indicador
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1 lg:col-span-2">
                <label className="text-xs font-medium text-slate-600">Nome do Indicador *</label>
                <input value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Ex.: Taxa de Infecção Hospitalar (IPCS)" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Código</label>
                <input value={novoCodigo} onChange={e => setNovoCodigo(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Ex.: IND-SEG-001" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Camada *</label>
                <select value={novoCamada} onChange={e => setNovoCamada(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="ONA">Camada A — ONA</option>
                  <option value="Segurança">Camada B — Segurança</option>
                  <option value="ANS">Camada C — ANS/Qualiss</option>
                  <option value="Qualidade Operacional">Camada D — Qualidade Operacional</option>
                  <option value="Experiência do Paciente">Camada E — Experiência do Paciente</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Categoria</label>
                <select value={novoCategoria} onChange={e => setNovoCategoria(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="Qualidade">Qualidade</option>
                  <option value="Segurança">Segurança do Paciente</option>
                  <option value="Assistencial">Assistencial</option>
                  <option value="Operacional">Operacional</option>
                  <option value="RH">Recursos Humanos</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Satisfação">Satisfação</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Meta *</label>
                <input value={novoMeta} onChange={e => setNovoMeta(e.target.value)} type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Ex.: 95 (sem %, sem /1000)" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Unidade de Medida</label>
                <select value={novoUnidade} onChange={e => setNovoUnidade(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="%">% (Percentual)</option>
                  <option value="/1000p">por 1.000 pacientes</option>
                  <option value="/1000pc">por 1.000 pac-dia</option>
                  <option value="dias">dias</option>
                  <option value="horas">horas</option>
                  <option value="NPS">NPS (0-100)</option>
                  <option value="casos">casos</option>
                  <option value="outros">outros</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Valor Atual (opcional)</label>
                <input value={novoValorAtual} onChange={e => setNovoValorAtual(e.target.value)} type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Ex.: 78.5" />
              </div>
              <div className="space-y-1 lg:col-span-2">
                <label className="text-xs font-medium text-slate-600">Descrição / Fórmula de Cálculo</label>
                <input value={novoDescricao} onChange={e => setNovoDescricao(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="Ex.: (Nº de infecções / Nº de pac-dia) × 1000" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowNovoForm(false)}>Cancelar</Button>
              <Button size="sm" className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white" disabled={createMutation.isPending} onClick={handleSalvarIndicador}>{createMutation.isPending ? "Salvando..." : "Salvar Indicador"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de Indicadores", value: displayIndicators.length, icon: Target, color: "text-sky-600 bg-sky-50" },
          { label: "Na Meta", value: displayIndicators.filter((i) => i.status === "green").length, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Em Atenção", value: displayIndicators.filter((i) => i.status === "yellow").length, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
          { label: "Críticos", value: displayIndicators.filter((i) => i.status === "red").length, icon: Activity, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("rounded-lg p-2", s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ona" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="ona" className="gap-1.5 text-xs">
            <Award className="h-3.5 w-3.5" />
            Camada A: ONA
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" />
            Camada B: Segurança
          </TabsTrigger>
          <TabsTrigger value="ans" className="gap-1.5 text-xs">
            <Stethoscope className="h-3.5 w-3.5" />
            Camada C: ANS/Qualiss
          </TabsTrigger>
          <TabsTrigger value="qualidade" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Camada D: Qualidade Op.
          </TabsTrigger>
          <TabsTrigger value="experiencia" className="gap-1.5 text-xs">
            <Heart className="h-3.5 w-3.5" />
            Camada E: Experiência
          </TabsTrigger>
          <TabsTrigger value="todos" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="bsc" className="gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5" />
            Dashboard BSC
          </TabsTrigger>
          <TabsTrigger value="benchmark" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            Benchmark
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: ONA ── */}
        <TabsContent value="ona" className="space-y-4">
          <LayerHeader
            icon={Award}
            title="Camada A — Acreditação ONA"
            subtitle="Indicadores de aderência ao programa de acreditação hospitalar ONA"
            color="bg-gradient-to-r from-sky-600 to-sky-700"
            indicators={displayOnaIndicators}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayOnaIndicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} accentColor="bg-sky-500" />
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: Segurança ── */}
        <TabsContent value="seguranca" className="space-y-4">
          <LayerHeader
            icon={Shield}
            title="Camada B — Segurança do Paciente"
            subtitle="Indicadores dos 6 protocolos de segurança do paciente (OMS / PNSP)"
            color="bg-gradient-to-r from-emerald-600 to-emerald-700"
            indicators={displaySegurancaIndicators}
          />
          {displaySegurancaIndicators.filter((i) => i.critical).length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>{displaySegurancaIndicators.filter((i) => i.critical).length} indicadores críticos</strong> requerem plano de ação imediato.
              </span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7 text-xs border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => navigate("/gestao-operacional")}
              >
                Ver Planos
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displaySegurancaIndicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} accentColor="bg-emerald-500" />
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: ANS ── */}
        <TabsContent value="ans" className="space-y-4">
          <LayerHeader
            icon={Stethoscope}
            title="Camada C — ANS / Qualiss"
            subtitle="Indicadores regulatórios obrigatórios ANS e do Programa Qualiss"
            color="bg-gradient-to-r from-violet-600 to-violet-700"
            indicators={displayAnsIndicators}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayAnsIndicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} accentColor="bg-violet-500" />
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: Qualidade Operacional ── */}
        <TabsContent value="qualidade" className="space-y-4">
          <LayerHeader
            icon={Activity}
            title="Camada D — Qualidade Operacional"
            subtitle="Indicadores de desempenho e eficiência dos processos assistenciais"
            color="bg-gradient-to-r from-amber-600 to-orange-600"
            indicators={displayQualidadeOpIndicators}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayQualidadeOpIndicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} accentColor="bg-amber-500" />
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: Experiência ── */}
        <TabsContent value="experiencia" className="space-y-4">
          <LayerHeader
            icon={Heart}
            title="Camada E — Experiência do Paciente"
            subtitle="NPS, satisfação, ouvidoria e percepção de segurança"
            color="bg-gradient-to-r from-rose-600 to-pink-600"
            indicators={displayExperienciaIndicators}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayExperienciaIndicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} accentColor="bg-rose-500" />
            ))}
          </div>

          {/* NPS Gauge */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Evolução NPS Hospitalar — Últimos 6 Meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { month: "Out", nps: 44, target: 70 },
                      { month: "Nov", nps: 47, target: 70 },
                      { month: "Dez", nps: 49, target: 70 },
                      { month: "Jan", nps: 50, target: 70 },
                      { month: "Fev", nps: 51, target: 70 },
                      { month: "Mar", nps: 52, target: 70 },
                    ]}
                    margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <defs>
                      <linearGradient id="nps-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="nps" stroke="#f43f5e" strokeWidth={2} fill="url(#nps-grad)" name="NPS" />
                    <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Meta" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Todos ── */}
        <TabsContent value="todos" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Todos os Indicadores ({displayIndicators.length})</h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {displayIndicators.filter((i) => i.status === "green").length} Na Meta
              </Badge>
              <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                {displayIndicators.filter((i) => i.status === "yellow").length} Atenção
              </Badge>
              <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200 gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                {displayIndicators.filter((i) => i.status === "red").length} Crítico
              </Badge>
            </div>
          </div>

          {[
            { label: "Camada A — Acreditação ONA", indicators: displayOnaIndicators, accent: "bg-sky-500" },
            { label: "Camada B — Segurança do Paciente", indicators: displaySegurancaIndicators, accent: "bg-emerald-500" },
            { label: "Camada C — ANS/Qualiss", indicators: displayAnsIndicators, accent: "bg-violet-500" },
            { label: "Camada D — Qualidade Operacional", indicators: displayQualidadeOpIndicators, accent: "bg-amber-500" },
            { label: "Camada E — Experiência do Paciente", indicators: displayExperienciaIndicators, accent: "bg-rose-500" },
          ].map((layer) => (
            <div key={layer.label} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", layer.accent)} />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {layer.label}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {layer.indicators.map((ind) => (
                  <IndicatorCard key={ind.id} indicator={ind} accentColor={layer.accent} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── TAB: BSC ── */}
        <TabsContent value="bsc" className="space-y-4">
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <BarChart3 className="w-8 h-8 opacity-30" />
              <p className="text-sm">Dashboard BSC disponível após cadastro de indicadores.</p>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Dashboard BSC — Balanced Scorecard</h2>
              <p className="text-sm text-muted-foreground">
                Visão estratégica em 4 perspectivas — Mar/2026
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => printReport({ title: "Dashboard BSC — Balanced Scorecard", subtitle: "Visão estratégica em 4 perspectivas — Mar/2026", module: "Indicadores / BSC", kpis: [{ label: "Financeira", value: "72%", color: "#0f172a" }, { label: "Clientes", value: "88%", color: "#0ea5e9" }, { label: "Processos", value: "81%", color: "#10b981" }, { label: "Aprendizado", value: "65%", color: "#8b5cf6" }] })}>
              <Download className="h-3.5 w-3.5" />
              Exportar BSC
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bscQuadrants.map((q) => (
              <Card key={q.id} className="border shadow-sm overflow-hidden">
                <div className={cn("h-1.5 w-full", q.color)} />
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={cn("rounded-lg p-1.5", q.color)}>
                      <q.icon className="h-4 w-4 text-white" />
                    </div>
                    {q.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-3",
                        q.lightBg
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            semaphoreColor(ind.status)
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium">{ind.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Meta: {ind.target}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            semaphoreTextColor(ind.status)
                          )}
                        >
                          {ind.value}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] border",
                            semaphoreBg(ind.status),
                            semaphoreTextColor(ind.status)
                          )}
                        >
                          {ind.status === "green"
                            ? "OK"
                            : ind.status === "yellow"
                            ? "Atenção"
                            : "Crítico"}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {/* Mini bar chart inside BSC quadrant */}
                  <div className="h-32 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={q.indicators.map((ind) => ({
                          name: ind.name.split(" ").slice(0, 2).join(" "),
                          value: parseFloat(ind.value.replace(/[^0-9.]/g, "")) || 0,
                        }))}
                        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                          {q.indicators.map((ind, i) => (
                            <Cell
                              key={i}
                              fill={
                                ind.status === "green"
                                  ? "#10b981"
                                  : ind.status === "yellow"
                                  ? "#f59e0b"
                                  : "#ef4444"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* BSC Pie Summary */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribuição do Status BSC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Na Meta", value: bscQuadrants.flatMap((q) => q.indicators).filter((i) => i.status === "green").length },
                        { name: "Atenção", value: bscQuadrants.flatMap((q) => q.indicators).filter((i) => i.status === "yellow").length },
                        { name: "Crítico", value: bscQuadrants.flatMap((q) => q.indicators).filter((i) => i.status === "red").length },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </TabsContent>

        {/* ── TAB: Benchmark ── */}
        <TabsContent value="benchmark" className="space-y-4">
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <BarChart3 className="w-8 h-8 opacity-30" />
              <p className="text-sm">Benchmark entre unidades disponível após cadastro de indicadores.</p>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold">Benchmark entre Unidades</h2>
              <p className="text-sm text-muted-foreground">
                Comparação dos principais indicadores entre as {units.length} unidades
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => printReport({ title: "Benchmark entre Unidades", subtitle: "Comparação dos principais indicadores — Mar/2026", module: "Indicadores / Benchmark", columns: [{ label: "Unidade", key: "unit" }, { label: "Taxa Ocupação", key: "ocupacao" }, { label: "IACS (%)", key: "iacs" }, { label: "Satisfação", key: "sat" }, { label: "Status", key: "status" }], rows: [{ unit: "UTI", ocupacao: "91%", iacs: "2.1%", sat: "92%", status: "✓ Dentro da meta" }, { unit: "PS", ocupacao: "88%", iacs: "1.5%", sat: "85%", status: "✓ Dentro da meta" }, { unit: "CC", ocupacao: "78%", iacs: "0.8%", sat: "97%", status: "✓ Dentro da meta" }, { unit: "Internação", ocupacao: "83%", iacs: "1.9%", sat: "89%", status: "⚠ Monitorar" }, { unit: "Lab", ocupacao: "70%", iacs: "0.3%", sat: "94%", status: "✓ Dentro da meta" }] })}>
              <Download className="h-3.5 w-3.5" />
              Exportar Benchmark
            </Button>
          </div>

          {/* Bar Chart */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-sky-600" />
                Top 5 Indicadores — Todas as Unidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={benchmarkData}
                    margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="indicator" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {units.map((unit, idx) => (
                      <Bar
                        key={unit}
                        dataKey={unit}
                        fill={BENCHMARK_COLORS[idx]}
                        radius={[2, 2, 0, 0]}
                        maxBarSize={18}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tabela Comparativa Detalhada</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                        Indicador
                      </th>
                      {units.map((u, i) => (
                        <th
                          key={u}
                          className="text-center p-3 font-medium text-xs"
                          style={{ color: BENCHMARK_COLORS[i] }}
                        >
                          {u.split(" ").slice(-1)[0]}
                        </th>
                      ))}
                      <th className="text-center p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                        Melhor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkData.map((row, rowIdx) => {
                      const values = units.map((u) => row[u as keyof typeof row] as number);
                      const best = Math.max(...values);
                      return (
                        <tr
                          key={rowIdx}
                          className={cn("border-b transition-colors hover:bg-muted/20", rowIdx % 2 === 0 ? "bg-white" : "bg-muted/10")}
                        >
                          <td className="p-3 font-medium text-xs">{row.indicator}</td>
                          {units.map((u) => {
                            const val = row[u as keyof typeof row] as number;
                            const isBest = val === best;
                            return (
                              <td key={u} className="p-3 text-center">
                                <span
                                  className={cn(
                                    "inline-block px-2 py-0.5 rounded text-xs font-medium",
                                    isBest
                                      ? "bg-emerald-100 text-emerald-700"
                                      : val < best * 0.8
                                      ? "bg-red-50 text-red-600"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {val}
                                </span>
                              </td>
                            );
                          })}
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              {best}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Per-unit summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {units.map((unit, idx) => {
              const unitValues = benchmarkData.map((r) => r[unit as keyof typeof r] as number);
              const avg = (unitValues.reduce((a, b) => a + b, 0) / unitValues.length).toFixed(1);
              return (
                <Card key={unit} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: BENCHMARK_COLORS[idx] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{unit}</p>
                        <p className="text-xs text-muted-foreground">Média dos indicadores</p>
                      </div>
                      <span className="text-xl font-bold" style={{ color: BENCHMARK_COLORS[idx] }}>
                        {avg}
                      </span>
                    </div>
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={benchmarkData.map((r) => ({
                            name: r.indicator,
                            value: r[unit as keyof typeof r] as number,
                          }))}
                          margin={{ top: 2, right: 2, bottom: 2, left: -20 }}
                        >
                          <Bar dataKey="value" radius={[2, 2, 0, 0]} fill={BENCHMARK_COLORS[idx]} maxBarSize={20} />
                          <XAxis dataKey="name" tick={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 8 }} />
                          <Tooltip contentStyle={{ fontSize: 10 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
