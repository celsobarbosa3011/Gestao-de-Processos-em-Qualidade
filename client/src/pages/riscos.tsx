import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { printReport } from "@/lib/print-pdf";
import { getRisks, createRisk } from "@/lib/api";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ShieldAlert,
  ClipboardList,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Info,
  TrendingDown,
  Activity,
  Eye,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskCategory = "Assistencial" | "Operacional" | "Regulatório" | "Estratégico";
type RiskStatus = "identified" | "analyzing" | "mitigating" | "monitored" | "closed";

interface Risk {
  id: number;
  title: string;
  cat: RiskCategory;
  prob: number;
  impact: number;
  unit: string;
  status: RiskStatus;
  residualProb?: number;
  residualImpact?: number;
  controls?: string;
  mitigation?: string;
  ona?: string;
  gut?: number;
}

interface HFMEARow {
  id: number;
  process: string;
  function: string;
  failureMode: string;
  effect: string;
  sev: number;
  occ: number;
  det: number;
  status: string;
}

interface MitigationPlan {
  id: number;
  riskId: number;
  riskTitle: string;
  action: string;
  responsible: string;
  deadline: string;
  status: "pending" | "in_progress" | "done" | "overdue";
  progress: number;
  unit: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const risks: Risk[] = [
  {
    id: 1,
    title: "Falha na identificação do paciente",
    cat: "Assistencial",
    prob: 4,
    impact: 5,
    unit: "PS",
    status: "mitigating",
    residualProb: 2,
    residualImpact: 4,
    controls: "Protocolo de dupla checagem implantado em 60% das unidades",
    mitigation: "Expandir protocolo de pulseira para 100% dos leitos e treinar equipe",
    ona: "ONA 3.1 – Assistência ao Paciente",
    gut: 60,
  },
  {
    id: 2,
    title: "Contaminação cruzada no CME",
    cat: "Operacional",
    prob: 3,
    impact: 5,
    unit: "CME",
    status: "identified",
    controls: "Sem controles formais documentados",
    mitigation: "Elaborar POP e treinar técnicos de esterilização",
    ona: "ONA 2.4 – Gestão de Infraestrutura",
    gut: 45,
  },
  {
    id: 3,
    title: "Aderência ao protocolo de sepse < 60%",
    cat: "Assistencial",
    prob: 4,
    impact: 4,
    unit: "PS",
    status: "analyzing",
    controls: "Protocolo publicado, sem monitoramento sistemático",
    mitigation: "Criar dashboard de sepse, incluir indicador no painel semanal",
    ona: "ONA 3.2 – Protocolos Clínicos",
    gut: 48,
  },
  {
    id: 4,
    title: "Falta de EPI em área de isolamento",
    cat: "Regulatório",
    prob: 3,
    impact: 4,
    unit: "UTI",
    status: "mitigating",
    residualProb: 2,
    residualImpact: 3,
    controls: "Auditoria de conformidade mensal",
    mitigation: "Revisão do processo de compras e estoque mínimo de EPI",
    ona: "ONA 4.1 – Segurança do Trabalhador",
    gut: 36,
  },
  {
    id: 5,
    title: "Documentação irregular para ANVISA",
    cat: "Regulatório",
    prob: 2,
    impact: 5,
    unit: "Farm",
    status: "identified",
    controls: "Verificação semestral manual",
    mitigation: "Automatizar controle de validades e licenças regulatórias",
    ona: "ONA 4.2 – Conformidade Regulatória",
    gut: 50,
  },
  {
    id: 6,
    title: "Falta de calibração de equipamentos",
    cat: "Operacional",
    prob: 3,
    impact: 3,
    unit: "Lab",
    status: "monitored",
    residualProb: 2,
    residualImpact: 2,
    controls: "Calendário de manutenção preventiva ativo",
    mitigation: "Manter cronograma e integrar com sistema de manutenção",
    ona: "ONA 2.3 – Equipamentos",
    gut: 27,
  },
  {
    id: 7,
    title: "Ausência de protocolo de TEV",
    cat: "Assistencial",
    prob: 3,
    impact: 4,
    unit: "CC",
    status: "identified",
    controls: "Nenhum controle formal",
    mitigation: "Elaborar e implantar protocolo de profilaxia de TEV",
    ona: "ONA 3.2 – Protocolos Clínicos",
    gut: 36,
  },
  {
    id: 8,
    title: "Comunicação inadequada em handoff",
    cat: "Assistencial",
    prob: 4,
    impact: 3,
    unit: "Geral",
    status: "analyzing",
    controls: "Treinamento pontual sem avaliação",
    mitigation: "Implantar ferramenta SBAR e auditar passagens de plantão",
    ona: "ONA 3.3 – Comunicação em Saúde",
    gut: 36,
  },
  {
    id: 9,
    title: "Sistema de backup de dados sem teste",
    cat: "Operacional",
    prob: 2,
    impact: 4,
    unit: "TI",
    status: "identified",
    controls: "Backup automático configurado, sem teste de restauração",
    mitigation: "Realizar teste de DR semestral documentado",
    ona: "ONA 2.5 – Tecnologia da Informação",
    gut: 32,
  },
  {
    id: 10,
    title: "Ausência de higiene das mãos pré-procedimento",
    cat: "Assistencial",
    prob: 5,
    impact: 3,
    unit: "Geral",
    status: "mitigating",
    residualProb: 3,
    residualImpact: 3,
    controls: "Campanha ativa de higiene de mãos, dispensers instalados",
    mitigation: "Auditorias de observação direta e feedback imediato",
    ona: "ONA 3.1 – Assistência ao Paciente",
    gut: 45,
  },
  {
    id: 11,
    title: "Não conformidade no armazenamento de medicamentos",
    cat: "Regulatório",
    prob: 3,
    impact: 3,
    unit: "Farm",
    status: "monitored",
    residualProb: 2,
    residualImpact: 2,
    controls: "Checklist diário de temperatura e armazenamento",
    mitigation: "Manter monitoramento e corrigir desvios em 24h",
    ona: "ONA 4.2 – Conformidade Regulatória",
    gut: 27,
  },
  {
    id: 12,
    title: "Risco de queda em idosos sem avaliação",
    cat: "Assistencial",
    prob: 4,
    impact: 3,
    unit: "Amb",
    status: "mitigating",
    residualProb: 2,
    residualImpact: 3,
    controls: "Escala de Morse implantada em 70% das unidades",
    mitigation: "Universalizar avaliação de Morse e instalar barras de apoio",
    ona: "ONA 3.1 – Assistência ao Paciente",
    gut: 36,
  },
];

const hfmeaRows: HFMEARow[] = [
  {
    id: 1,
    process: "Administração de Medicamentos",
    function: "Prescrição",
    failureMode: "Prescrição ilegível ou incompleta",
    effect: "Erro de dose ou medicamento errado",
    sev: 9,
    occ: 5,
    det: 4,
    status: "Ação Requerida",
  },
  {
    id: 2,
    process: "Administração de Medicamentos",
    function: "Dispensação",
    failureMode: "Troca de medicamento na dispensação",
    effect: "Administração de fármaco incorreto",
    sev: 9,
    occ: 3,
    det: 3,
    status: "Ação Requerida",
  },
  {
    id: 3,
    process: "Administração de Medicamentos",
    function: "Checagem",
    failureMode: "Falha na dupla checagem de alto risco",
    effect: "Administração de dose incorreta de medicamento de alto risco",
    sev: 10,
    occ: 4,
    det: 2,
    status: "Ação Requerida",
  },
  {
    id: 4,
    process: "Administração de Medicamentos",
    function: "Administração",
    failureMode: "Velocidade de infusão incorreta",
    effect: "Superdosagem ou subdosagem",
    sev: 7,
    occ: 4,
    det: 5,
    status: "Monitorar",
  },
  {
    id: 5,
    process: "Administração de Medicamentos",
    function: "Registro",
    failureMode: "Não registro da administração no prontuário",
    effect: "Duplicidade de dose ou omissão de tratamento",
    sev: 6,
    occ: 5,
    det: 3,
    status: "Monitorar",
  },
];

const mitigationPlans: MitigationPlan[] = [
  {
    id: 1,
    riskId: 1,
    riskTitle: "Falha na identificação do paciente",
    action: "Expandir protocolo de pulseira para 100% dos leitos",
    responsible: "Dra. Ana Lima – Qualidade",
    deadline: "2026-04-30",
    status: "in_progress",
    progress: 60,
    unit: "PS",
  },
  {
    id: 2,
    riskId: 1,
    riskTitle: "Falha na identificação do paciente",
    action: "Treinamento equipe de enfermagem — identificação segura",
    responsible: "Enf. Carlos Souza",
    deadline: "2026-03-31",
    status: "done",
    progress: 100,
    unit: "PS",
  },
  {
    id: 3,
    riskId: 3,
    riskTitle: "Aderência ao protocolo de sepse < 60%",
    action: "Criar dashboard de monitoramento de sepse no sistema",
    responsible: "TI – João Mendes",
    deadline: "2026-05-15",
    status: "pending",
    progress: 10,
    unit: "PS",
  },
  {
    id: 4,
    riskId: 4,
    riskTitle: "Falta de EPI em área de isolamento",
    action: "Revisão do processo de compras e estoque mínimo de EPI",
    responsible: "Suprimentos – Maria Gomes",
    deadline: "2026-04-10",
    status: "in_progress",
    progress: 45,
    unit: "UTI",
  },
  {
    id: 5,
    riskId: 10,
    riskTitle: "Ausência de higiene das mãos pré-procedimento",
    action: "Auditorias de observação direta — 10 por semana",
    responsible: "SCIH – Dr. Paulo Ramos",
    deadline: "2026-06-01",
    status: "in_progress",
    progress: 35,
    unit: "Geral",
  },
  {
    id: 6,
    riskId: 12,
    riskTitle: "Risco de queda em idosos sem avaliação",
    action: "Universalizar avaliação de Morse em todas as unidades",
    responsible: "Enf. Beatriz Nunes",
    deadline: "2026-04-15",
    status: "overdue",
    progress: 55,
    unit: "Amb",
  },
  {
    id: 7,
    riskId: 2,
    riskTitle: "Contaminação cruzada no CME",
    action: "Elaborar POP de esterilização e treinar técnicos",
    responsible: "Coord. CME – Renata Silva",
    deadline: "2026-05-01",
    status: "pending",
    progress: 0,
    unit: "CME",
  },
  {
    id: 8,
    riskId: 9,
    riskTitle: "Sistema de backup de dados sem teste",
    action: "Realizar teste de recuperação de desastre (DR) documentado",
    responsible: "TI – João Mendes",
    deadline: "2026-06-30",
    status: "pending",
    progress: 0,
    unit: "TI",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRiskScore(prob: number, impact: number) {
  return prob * impact;
}

function getRiskLevel(score: number): "low" | "moderate" | "high" | "critical" {
  if (score <= 5) return "low";
  if (score <= 14) return "moderate";
  if (score <= 19) return "high";
  return "critical";
}

function getRiskCellBg(score: number) {
  const level = getRiskLevel(score);
  if (level === "low") return "bg-emerald-100 border-emerald-200";
  if (level === "moderate") return "bg-yellow-100 border-yellow-200";
  if (level === "high") return "bg-orange-100 border-orange-200";
  return "bg-red-100 border-red-200";
}

function getRiskScoreBadge(score: number) {
  const level = getRiskLevel(score);
  if (level === "low") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (level === "moderate") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (level === "high") return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-red-100 text-red-800 border-red-300";
}

function getCatColor(cat: RiskCategory) {
  switch (cat) {
    case "Assistencial": return "bg-sky-500";
    case "Operacional": return "bg-slate-500";
    case "Regulatório": return "bg-amber-500";
    case "Estratégico": return "bg-violet-500";
  }
}

function getCatBadge(cat: RiskCategory) {
  switch (cat) {
    case "Assistencial": return "bg-sky-100 text-sky-800 border-sky-300";
    case "Operacional": return "bg-slate-100 text-slate-800 border-slate-300";
    case "Regulatório": return "bg-amber-100 text-amber-800 border-amber-300";
    case "Estratégico": return "bg-violet-100 text-violet-800 border-violet-300";
  }
}

function getStatusBadge(status: RiskStatus) {
  switch (status) {
    case "identified": return { label: "Identificado", cls: "bg-gray-100 text-gray-700 border-gray-300" };
    case "analyzing": return { label: "Analisando", cls: "bg-amber-100 text-amber-800 border-amber-300" };
    case "mitigating": return { label: "Mitigando", cls: "bg-sky-100 text-sky-800 border-sky-300" };
    case "monitored": return { label: "Monitorado", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "closed": return { label: "Encerrado", cls: "bg-slate-100 text-slate-600 border-slate-300" };
  }
}

function getMitigationStatusBadge(status: MitigationPlan["status"]) {
  switch (status) {
    case "pending": return { label: "Pendente", cls: "bg-gray-100 text-gray-700 border-gray-300" };
    case "in_progress": return { label: "Em Andamento", cls: "bg-sky-100 text-sky-800 border-sky-300" };
    case "done": return { label: "Concluído", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "overdue": return { label: "Atrasado", cls: "bg-red-100 text-red-800 border-red-300" };
  }
}

function getNPRBadge(npr: number) {
  if (npr > 200) return "bg-red-100 text-red-800 border-red-300";
  if (npr >= 100) return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-emerald-100 text-emerald-800 border-emerald-300";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskDot({ risk }: { risk: Risk }) {
  const [hovered, setHovered] = useState(false);
  const score = getRiskScore(risk.prob, risk.impact);
  return (
    <div className="relative inline-block" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold cursor-pointer shadow-sm border-2 border-white hover:scale-110 transition-transform",
          getCatColor(risk.cat)
        )}
      >
        {risk.id}
      </div>
      {hovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl pointer-events-none">
          <p className="font-semibold mb-1">R{risk.id} – {risk.title}</p>
          <p className="text-gray-300">Cat: {risk.cat} | Unidade: {risk.unit}</p>
          <p className="text-gray-300">Score: {score} ({getRiskLevel(score)})</p>
          <p className="text-gray-300">Prob: {risk.prob} × Impacto: {risk.impact}</p>
        </div>
      )}
    </div>
  );
}

// ─── TAB 1: Heatmap ──────────────────────────────────────────────────────────

function HeatmapTab() {
  const { isAdmin, validatedData } = useTenant();
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { key: "all", label: "Todos" },
    { key: "Assistencial", label: "Assistencial" },
    { key: "Operacional", label: "Operacional" },
    { key: "Regulatório", label: "Regulatório" },
    { key: "Estratégico", label: "Estratégico" },
  ];

  const catToLocalHeatmap = (cat: string): RiskCategory => {
    const map: Record<string, RiskCategory> = { "Assistencial": "Assistencial", "Operacional": "Operacional", "Regulatório": "Regulatório", "Estratégico": "Estratégico" };
    return map[cat] ?? "Operacional";
  };
  const validatedHeatmapRisks: typeof risks = validatedData?.riscos.map(r => ({
    id: r.id,
    title: r.title,
    cat: catToLocalHeatmap(r.cat || r.category),
    prob: r.prob ?? 3,
    impact: r.impact_num ?? 3,
    unit: r.category,
    status: "identified" as RiskStatus,
  })) ?? [];

  const riskBase = validatedHeatmapRisks;
  const filteredRisks = activeFilter === "all" ? riskBase : riskBase.filter((r) => r.cat === activeFilter);

  // Build cell map: [prob][impact] -> risks[]
  const cellMap: Record<string, Risk[]> = {};
  for (let p = 1; p <= 5; p++) {
    for (let i = 1; i <= 5; i++) {
      cellMap[`${p}-${i}`] = [];
    }
  }
  filteredRisks.forEach((r) => {
    const key = `${r.prob}-${r.impact}`;
    if (cellMap[key]) cellMap[key].push(r);
  });

  const impactLabels = ["Insignificante", "Baixo", "Moderado", "Alto", "Catastrófico"];
  const probLabels = ["Quase Certa", "Provável", "Possível", "Improvável", "Rara"];

  const criticalRisks = [...riskBase]
    .sort((a, b) => getRiskScore(b.prob, b.impact) - getRiskScore(a.prob, a.impact))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Matriz de Riscos (Heatmap)</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visualização da distribuição de riscos por probabilidade e impacto</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                activeFilter === f.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs font-medium text-gray-500">Nível de Risco:</span>
        {[
          { label: "Baixo (1–5)", cls: "bg-emerald-100 border-emerald-300 text-emerald-800" },
          { label: "Moderado (6–14)", cls: "bg-yellow-100 border-yellow-300 text-yellow-800" },
          { label: "Alto (15–19)", cls: "bg-orange-100 border-orange-300 text-orange-800" },
          { label: "Crítico (20–25)", cls: "bg-red-100 border-red-300 text-red-800" },
        ].map((l) => (
          <span key={l.label} className={cn("px-2 py-0.5 rounded text-xs border font-medium", l.cls)}>{l.label}</span>
        ))}
        <span className="ml-2 text-xs font-medium text-gray-500">Categorias:</span>
        {(["Assistencial", "Operacional", "Regulatório", "Estratégico"] as RiskCategory[]).map((c) => (
          <span key={c} className="flex items-center gap-1 text-xs text-gray-600">
            <span className={cn("w-3 h-3 rounded-full", getCatColor(c))} />
            {c}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* X-axis label */}
          <div className="flex items-center mb-1 ml-24">
            <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase w-full text-center">Impacto →</span>
          </div>
          <div className="flex">
            {/* Y-axis label */}
            <div className="flex flex-col items-center justify-center w-6 mr-2">
              <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase transform -rotate-90 whitespace-nowrap">Probabilidade →</span>
            </div>
            {/* Prob labels */}
            <div className="flex flex-col justify-around w-16 mr-1">
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="h-20 flex flex-col items-end justify-center pr-1">
                  <span className="text-xs font-bold text-gray-700">{p}</span>
                  <span className="text-[9px] text-gray-400 text-right leading-tight">{probLabels[5 - p]}</span>
                </div>
              ))}
            </div>
            {/* Grid cells */}
            <div className="flex-1">
              {/* Impact header */}
              <div className="grid grid-cols-5 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-700">{i}</span>
                    <span className="text-[9px] text-gray-400 text-center leading-tight">{impactLabels[i - 1]}</span>
                  </div>
                ))}
              </div>
              {/* Rows */}
              {[5, 4, 3, 2, 1].map((p) => (
                <div key={p} className="grid grid-cols-5 gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const score = p * i;
                    const cellRisks = cellMap[`${p}-${i}`] || [];
                    return (
                      <div
                        key={i}
                        className={cn(
                          "h-20 rounded-lg border-2 p-1 flex flex-wrap gap-1 content-start items-start transition-all",
                          getRiskCellBg(score)
                        )}
                      >
                        <span className="w-full text-[9px] font-bold text-gray-500 mb-0.5">{score}</span>
                        {cellRisks.map((r) => (
                          <RiskDot key={r.id} risk={r} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Risks List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Top 5 Riscos Críticos — Maior Pontuação
        </h3>
        <div className="space-y-2">
          {criticalRisks.map((r, idx) => {
            const score = getRiskScore(r.prob, r.impact);
            const status = getStatusBadge(r.status);
            return (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</span>
                <span className={cn("w-3 h-3 rounded-full flex-shrink-0", getCatColor(r.cat))} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.unit} · {r.cat}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("px-2 py-0.5 rounded border text-xs font-bold", getRiskScoreBadge(score))}>
                    {score}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded border text-xs", status.cls)}>{status.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: Lista de Riscos ───────────────────────────────────────────────────

function RiskListTab() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoForm, setNovoForm] = useState({ title: "", cat: "Assistencial" as RiskCategory, unit: "", prob: "3", impact: "3" });
  const qc = useQueryClient();

  const { data: dbRisks } = useQuery({
    queryKey: ["risks"],
    queryFn: getRisks,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createRisk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risks"] });
      setNovoForm({ title: "", cat: "Assistencial", unit: "", prob: "3", impact: "3" });
      setShowNovoForm(false);
      toast.success("Risco cadastrado com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar risco."),
  });

  // Map DB risk to local Risk interface
  const catToLocal: Record<string, RiskCategory> = {
    operational: "Operacional", assistencial: "Assistencial",
    strategic: "Estratégico", regulatory: "Regulatório",
  };

  // LGPD: mock data visível apenas para admin; clientes validados usam dados da avaliação
  const { isAdmin, validatedData } = useTenant();

  const probLabelToNum = (p: string): number => {
    const map: Record<string, number> = { "Muito Alta": 5, "Alta": 4, "Média": 3, "Baixa": 2, "Muito Baixa": 1 };
    return map[p] ?? 3;
  };
  const impactLabelToNum = (i: string): number => {
    const map: Record<string, number> = { "Catastrófico": 5, "Crítico": 4, "Moderado": 3, "Menor": 2, "Insignificante": 1 };
    return map[i] ?? 3;
  };
  const catToLocalFromStr = (cat: string): RiskCategory => {
    const map: Record<string, RiskCategory> = { "Assistencial": "Assistencial", "Operacional": "Operacional", "Regulatório": "Regulatório", "Estratégico": "Estratégico" };
    return map[cat] ?? "Operacional";
  };
  const statusToLocal = (s: string): RiskStatus => {
    if (s === "Em Mitigação") return "mitigating";
    if (s === "Mitigado") return "monitored";
    return "identified";
  };

  const validatedRisks: typeof risks = validatedData?.riscos.map(r => ({
    id: r.id,
    title: r.title,
    cat: catToLocalFromStr(r.cat || r.category),
    prob: r.prob ?? probLabelToNum(r.probability),
    impact: r.impact_num ?? impactLabelToNum(r.impact),
    unit: r.category,
    status: statusToLocal(r.status),
    mitigation: r.mitigation,
  })) ?? [];

  const baseRisks: typeof risks = (dbRisks && dbRisks.length > 0)
    ? dbRisks.map(r => ({
        id: r.id,
        title: r.title,
        cat: catToLocal[r.category] ?? "Operacional",
        prob: r.probability,
        impact: r.impact,
        unit: r.description?.split("Unidade: ")[1]?.split(" ")[0] || "—",
        status: r.status as RiskStatus,
        residualProb: r.residualProbability ?? undefined,
        residualImpact: r.residualImpact ?? undefined,
        controls: r.existingControls ?? undefined,
      }))
    : validatedRisks;

  const allRisks = baseRisks;
  const units = Array.from(new Set(allRisks.map((r) => r.unit)));

  const filtered = allRisks.filter((r) => {
    if (filterCat !== "all" && r.cat !== filterCat) return false;
    if (filterUnit !== "all" && r.unit !== filterUnit) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  function handleNovoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!novoForm.title.trim() || !novoForm.unit.trim()) {
      toast.error("Preencha título e unidade.");
      return;
    }
    const catToDb: Record<string, string> = {
      "Assistencial": "assistencial", "Operacional": "operational",
      "Estratégico": "strategic", "Regulatório": "regulatory",
    };
    createMutation.mutate({
      title: novoForm.title,
      description: `Unidade: ${novoForm.unit}`,
      category: catToDb[novoForm.cat] || "operational",
      probability: Number(novoForm.prob),
      impact: Number(novoForm.impact),
      status: "identified",
    } as any);
  }

  const toggle = (id: number) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Filtros:</span>
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="Assistencial">Assistencial</SelectItem>
            <SelectItem value="Operacional">Operacional</SelectItem>
            <SelectItem value="Regulatório">Regulatório</SelectItem>
            <SelectItem value="Estratégico">Estratégico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="identified">Identificado</SelectItem>
            <SelectItem value="analyzing">Analisando</SelectItem>
            <SelectItem value="mitigating">Mitigando</SelectItem>
            <SelectItem value="monitored">Monitorado</SelectItem>
            <SelectItem value="closed">Encerrado</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" className="h-8 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowNovoForm(true)}>
            <Plus className="w-3.5 h-3.5" />
            Novo Risco
          </Button>
        </div>
      </div>

      {/* Novo Risco inline form */}
      {showNovoForm && (
        <form onSubmit={handleNovoSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-indigo-800">Cadastrar Novo Risco</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Descrição do risco"
                value={novoForm.title}
                onChange={e => setNovoForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidade *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Ex: UTI, PS, CME"
                value={novoForm.unit}
                onChange={e => setNovoForm(f => ({ ...f, unit: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={novoForm.cat}
                onChange={e => setNovoForm(f => ({ ...f, cat: e.target.value as RiskCategory }))}
              >
                <option>Assistencial</option>
                <option>Operacional</option>
                <option>Regulatório</option>
                <option>Estratégico</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Probabilidade (1-5)</label>
                <input
                  type="number" min={1} max={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={novoForm.prob}
                  onChange={e => setNovoForm(f => ({ ...f, prob: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Impacto (1-5)</label>
                <input
                  type="number" min={1} max={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={novoForm.impact}
                  onChange={e => setNovoForm(f => ({ ...f, impact: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowNovoForm(false)}>Cancelar</Button>
            <Button type="submit" size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">Salvar Risco</Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Risco Inerente</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Risco Residual</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const score = getRiskScore(r.prob, r.impact);
                const resScore = r.residualProb && r.residualImpact ? getRiskScore(r.residualProb, r.residualImpact) : null;
                const status = getStatusBadge(r.status);
                const isExpanded = expandedId === r.id;
                return (
                  <>
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggle(r.id)}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-gray-400">{r.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                          <span className="text-sm font-medium text-gray-800">{r.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded border text-xs font-medium", getCatBadge(r.cat))}>{r.cat}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("px-2 py-1 rounded border text-xs font-bold", getRiskScoreBadge(score))}>
                          {score} <span className="font-normal opacity-70">({r.prob}×{r.impact})</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {resScore !== null ? (
                          <span className={cn("px-2 py-1 rounded border text-xs font-bold", getRiskScoreBadge(resScore))}>
                            {resScore} <span className="font-normal opacity-70">({r.residualProb}×{r.residualImpact})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("px-2 py-0.5 rounded border text-xs", status.cls)}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button className="text-xs text-indigo-600 hover:underline">Editar</button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`exp-${r.id}`} className="bg-indigo-50/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Controles Existentes</p>
                              <p className="text-gray-700">{r.controls || "Sem controles documentados"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Plano de Mitigação</p>
                              <p className="text-gray-700">{r.mitigation || "Não definido"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Requisito ONA</p>
                              <p className="text-indigo-700 font-medium">{r.ona || "Não vinculado"}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhum risco encontrado com os filtros selecionados.</div>
        )}
      </div>
      <p className="text-xs text-gray-400">{filtered.length} riscos exibidos de {allRisks.length} cadastrados</p>
    </div>
  );
}

// ─── TAB 3: HFMEA ────────────────────────────────────────────────────────────

function HFMEATab() {
  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Healthcare Failure Mode and Effect Analysis (HFMEA)</p>
          <p className="text-xs text-indigo-600 mt-1">
            Metodologia de análise prospectiva de riscos adaptada para a área da saúde. Avalia modos de falha em processos críticos,
            calculando o Número de Prioridade de Risco (NPR = Severidade × Ocorrência × Detecção).
            NPR &gt; 200 exige ação imediata; 100–200 requer monitoramento; &lt;100 manter controles.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className={cn("px-2 py-0.5 rounded border text-xs font-bold", "bg-red-100 text-red-800 border-red-300")}>NPR &gt; 200 — Ação Imediata</span>
          <span className={cn("px-2 py-0.5 rounded border text-xs font-bold", "bg-orange-100 text-orange-800 border-orange-300")}>NPR 100–200 — Monitorar</span>
          <span className={cn("px-2 py-0.5 rounded border text-xs font-bold", "bg-emerald-100 text-emerald-800 border-emerald-300")}>NPR &lt; 100 — Manter</span>
        </div>
        <Button size="sm" className="h-8 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => toast.info("Formulário de novo HFMEA em breve disponível")}>
          <Plus className="w-3.5 h-3.5" />
          Novo HFMEA
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Processo", "Função", "Modo de Falha", "Efeito Potencial", "SEV", "OCC", "DET", "NPR", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hfmeaRows.map((row) => {
                const npr = row.sev * row.occ * row.det;
                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600">{row.process}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">{row.function}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{row.failureMode}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{row.effect}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto",
                        row.sev >= 8 ? "bg-red-100 text-red-800" : row.sev >= 5 ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800"
                      )}>{row.sev}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto",
                        row.occ >= 7 ? "bg-red-100 text-red-800" : row.occ >= 4 ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800"
                      )}>{row.occ}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto",
                        row.det >= 7 ? "bg-red-100 text-red-800" : row.det >= 4 ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800"
                      )}>{row.det}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("px-2 py-1 rounded border text-xs font-bold", getNPRBadge(npr))}>{npr}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded border text-xs font-medium",
                        row.status === "Ação Requerida" ? "bg-red-100 text-red-800 border-red-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"
                      )}>{row.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Nota:</span> Modos de falha com NPR &gt; 200 geram automaticamente planos de ação vinculados
          ao Módulo de Gestão Operacional. O acompanhamento de cada NPR é revisado trimestralmente.
        </p>
      </div>
    </div>
  );
}

// ─── TAB 4: Planos de Mitigação ───────────────────────────────────────────────

function MitigationTab() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUnit, setFilterUnit] = useState<string>("all");

  const units = Array.from(new Set(mitigationPlans.map((p) => p.unit)));

  const filtered = mitigationPlans.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterUnit !== "all" && p.unit !== filterUnit) return false;
    return true;
  });

  const grouped: Record<string, MitigationPlan[]> = {};
  filtered.forEach((p) => {
    const key = p.riskTitle;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Filtros:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="done">Concluído</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => toast.info("Redirecionando para Gestão Operacional...")}>
            <ArrowRight className="w-3.5 h-3.5" />
            Ver no Módulo Gestão Operacional
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: mitigationPlans.length, cls: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
          { label: "Em Andamento", value: mitigationPlans.filter(p => p.status === "in_progress").length, cls: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
          { label: "Concluídos", value: mitigationPlans.filter(p => p.status === "done").length, cls: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Atrasados", value: mitigationPlans.filter(p => p.status === "overdue").length, cls: "text-red-700", bg: "bg-red-50 border-red-200" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg)}>
            <p className={cn("text-2xl font-bold", s.cls)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards grouped by risk */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([riskTitle, plans]) => {
          const riskData = risks.find(r => r.title === riskTitle);
          const score = riskData ? getRiskScore(riskData.prob, riskData.impact) : 0;
          return (
            <div key={riskTitle} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                {riskData && (
                  <span className={cn("w-3 h-3 rounded-full flex-shrink-0", getCatColor(riskData.cat))} />
                )}
                <span className="text-sm font-semibold text-gray-800 flex-1">{riskTitle}</span>
                {riskData && (
                  <span className={cn("px-2 py-0.5 rounded border text-xs font-bold", getRiskScoreBadge(score))}>
                    Score {score}
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {plans.map((plan) => {
                  const st = getMitigationStatusBadge(plan.status);
                  return (
                    <div key={plan.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{plan.action}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{plan.responsible}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Prazo: {plan.deadline}</span>
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" />Unidade: {plan.unit}</span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", plan.status === "done" ? "bg-emerald-500" : plan.status === "overdue" ? "bg-red-500" : "bg-sky-500")}
                              style={{ width: `${plan.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{plan.progress}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={cn("px-2 py-0.5 rounded border text-xs", st.cls)}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhum plano encontrado com os filtros selecionados.</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Riscos() {
  const { isAdmin, validatedData } = useTenant();
  const [showHeaderNovoForm, setShowHeaderNovoForm] = useState(false);
  const [headerNovoItems, setHeaderNovoItems] = useState<typeof risks[0][]>([]);
  const [headerNovoForm, setHeaderNovoForm] = useState({ title: "", cat: "Assistencial" as RiskCategory, unit: "", prob: "3", impact: "3" });

  function handleHeaderNovoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!headerNovoForm.title.trim() || !headerNovoForm.unit.trim()) {
      toast.error("Preencha título e unidade.");
      return;
    }
    const newRisk: typeof risks[0] = {
      id: risks.length + headerNovoItems.length + 1,
      title: headerNovoForm.title,
      cat: headerNovoForm.cat,
      prob: Number(headerNovoForm.prob),
      impact: Number(headerNovoForm.impact),
      unit: headerNovoForm.unit,
      status: "identified",
    };
    setHeaderNovoItems(prev => [...prev, newRisk]);
    setHeaderNovoForm({ title: "", cat: "Assistencial", unit: "", prob: "3", impact: "3" });
    setShowHeaderNovoForm(false);
    toast.success("Risco cadastrado com sucesso!");
  }

  // LGPD: KPIs usam mock apenas para admin; clientes validados usam dados da avaliação
  const catToLocalKpi = (cat: string): RiskCategory => {
    const m: Record<string, RiskCategory> = { "Assistencial": "Assistencial", "Operacional": "Operacional", "Regulatório": "Regulatório", "Estratégico": "Estratégico" };
    return m[cat] ?? "Operacional";
  };
  const validatedKpiRisks: typeof risks = validatedData?.riscos.map(r => ({
    id: r.id, title: r.title, cat: catToLocalKpi(r.cat || r.category),
    prob: r.prob ?? 3, impact: r.impact_num ?? 3, unit: r.category, status: "identified" as RiskStatus,
  })) ?? [];
  const kpiRisks = [...validatedKpiRisks, ...headerNovoItems];
  const totalCritical = kpiRisks.filter((r) => getRiskScore(r.prob, r.impact) >= 20).length;
  const totalHigh = kpiRisks.filter((r) => {
    const s = getRiskScore(r.prob, r.impact);
    return s >= 15 && s < 20;
  }).length;
  const totalModerate = kpiRisks.filter((r) => {
    const s = getRiskScore(r.prob, r.impact);
    return s >= 6 && s < 15;
  }).length;
  const totalLow = kpiRisks.filter((r) => getRiskScore(r.prob, r.impact) < 6).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Gestão de Riscos</h1>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">Módulo 7</span>
            </div>
            <p className="text-sm text-gray-500">Identificação, análise e mitigação de riscos assistenciais e operacionais · QHealth One 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => printReport({
              title: "Matriz de Gestão de Riscos",
              subtitle: "Riscos identificados, analisados e mitigados — QHealth One 2026",
              module: "Gestão de Riscos",
              kpis: [
                { label: "Riscos Críticos", value: totalCritical, color: "#dc2626" },
                { label: "Alto Risco", value: totalHigh, color: "#f59e0b" },
                { label: "Risco Moderado", value: totalModerate, color: "#0ea5e9" },
                { label: "Baixo Risco", value: totalLow, color: "#10b981" },
              ],
              columns: [
                { label: "Risco", key: "titulo" },
                { label: "Categoria", key: "cat" },
                { label: "Probabilidade", key: "prob", align: "center" as const },
                { label: "Impacto", key: "impacto", align: "center" as const },
                { label: "Score", key: "score", align: "center" as const },
                { label: "Status", key: "status" },
              ],
              rows: kpiRisks.slice(0, 50).map(r => ({
                titulo: r.title,
                cat: r.cat,
                prob: String(r.prob),
                impacto: String(r.impact),
                score: String(getRiskScore(r.prob, r.impact)),
                status: r.status === "identified" ? "Identificado" : r.status === "mitigating" ? "Em Mitigação" : "Monitorado",
              })),
              customContent: `<p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")}.</p>`,
            })}>
              <Download className="w-3.5 h-3.5" />
              Exportar PDF
            </Button>
            <Button size="sm" className="h-8 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs" onClick={() => setShowHeaderNovoForm(true)}>
              <Plus className="w-3.5 h-3.5" />
              Novo Risco
            </Button>
          </div>
        </div>

        {/* Novo Risco inline form (header) */}
        {showHeaderNovoForm && (
          <form onSubmit={handleHeaderNovoSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3 mt-4">
            <p className="text-sm font-semibold text-indigo-800">Cadastrar Novo Risco</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Descrição do risco"
                  value={headerNovoForm.title}
                  onChange={e => setHeaderNovoForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unidade *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ex: UTI, PS, CME"
                  value={headerNovoForm.unit}
                  onChange={e => setHeaderNovoForm(f => ({ ...f, unit: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={headerNovoForm.cat}
                  onChange={e => setHeaderNovoForm(f => ({ ...f, cat: e.target.value as RiskCategory }))}
                >
                  <option>Assistencial</option>
                  <option>Operacional</option>
                  <option>Regulatório</option>
                  <option>Estratégico</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Probabilidade (1-5)</label>
                  <input
                    type="number" min={1} max={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={headerNovoForm.prob}
                    onChange={e => setHeaderNovoForm(f => ({ ...f, prob: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Impacto (1-5)</label>
                  <input
                    type="number" min={1} max={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={headerNovoForm.impact}
                    onChange={e => setHeaderNovoForm(f => ({ ...f, impact: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowHeaderNovoForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">Salvar Risco</Button>
            </div>
          </form>
        )}

        {/* KPI bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Críticos", value: totalCritical, sub: "Score 20–25", cls: "text-red-700", bg: "bg-red-50 border-red-200" },
            { label: "Altos", value: totalHigh, sub: "Score 15–19", cls: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
            { label: "Moderados", value: totalModerate, sub: "Score 6–14", cls: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
            { label: "Baixos", value: totalLow, sub: "Score 1–5", cls: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          ].map((kpi) => (
            <div key={kpi.label} className={cn("rounded-xl border p-4 text-center shadow-sm", kpi.bg)}>
              <p className={cn("text-3xl font-bold", kpi.cls)}>{kpi.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{kpi.label}</p>
              <p className="text-xs text-gray-400">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList className="bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-full sm:w-auto flex flex-wrap gap-1">
          <TabsTrigger value="heatmap" className="gap-1.5 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
            <Activity className="w-3.5 h-3.5" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
            <ClipboardList className="w-3.5 h-3.5" />
            Lista de Riscos
          </TabsTrigger>
          <TabsTrigger value="hfmea" className="gap-1.5 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
            <GitBranch className="w-3.5 h-3.5" />
            HFMEA
          </TabsTrigger>
          <TabsTrigger value="mitigation" className="gap-1.5 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
            <TrendingDown className="w-3.5 h-3.5" />
            Planos de Mitigação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <HeatmapTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <RiskListTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hfmea">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <HFMEATab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mitigation">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <MitigationTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
