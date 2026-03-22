import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Filter,
  ArrowRight,
  Building2,
  User,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Tag,
  FileText,
  Target,
  TrendingUp,
  Kanban,
  List,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanStatus = "pending" | "in_progress" | "done" | "overdue" | "near";
type Priority = "critical" | "high" | "medium" | "low";

interface ActionPlan {
  id: number;
  title: string;
  origin: string;
  unit: string;
  responsible: string;
  dueDate: string;
  status: PlanStatus;
  priority: Priority;
  progress: number;
  total: number;
  originPath?: string;
  description?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const plans: ActionPlan[] = [
  {
    id: 1,
    title: "Implantar pulseira de identificação dupla na UTI e PS",
    origin: "NSP/Evento",
    unit: "UTI",
    responsible: "Enf. Carla Santos",
    dueDate: "2026-03-10",
    status: "overdue",
    priority: "high",
    progress: 2,
    total: 5,
    originPath: "/eventos",
    description:
      "Implantação do protocolo de dupla checagem na identificação de pacientes via pulseira eletrônica e física nas unidades de maior risco.",
  },
  {
    id: 2,
    title: "Atualizar POP de Higienização das Mãos",
    origin: "Diagnóstico",
    unit: "Geral",
    responsible: "Dr. José Almeida",
    dueDate: "2026-03-18",
    status: "overdue",
    priority: "high",
    progress: 4,
    total: 4,
    description:
      "Revisão e atualização do Procedimento Operacional Padrão de Higienização das Mãos conforme normativas vigentes da ANVISA.",
  },
  {
    id: 3,
    title: "Treinar equipe do PS em protocolo de sepse bundle",
    origin: "Protocolo",
    unit: "PS",
    responsible: "Enf. Ana Lima",
    dueDate: "2026-03-22",
    status: "near",
    priority: "high",
    progress: 2,
    total: 3,
    description:
      "Capacitação de toda a equipe multiprofissional do Pronto-Socorro no protocolo de reconhecimento e tratamento precoce de sepse.",
  },
  {
    id: 4,
    title: "Revisar regimento do NSP conforme RDC 63",
    origin: "Comissão",
    unit: "NSP",
    responsible: "Dr. Marcos",
    dueDate: "2026-03-25",
    status: "near",
    priority: "medium",
    progress: 1,
    total: 2,
    description:
      "Revisão e adequação do regimento interno do Núcleo de Segurança do Paciente às exigências da RDC 63/2011.",
  },
  {
    id: 5,
    title: "Implantar checklist de cirurgia segura digital",
    origin: "ONA",
    unit: "CC",
    responsible: "Méd. Cirurgia",
    dueDate: "2026-04-15",
    status: "pending",
    priority: "high",
    progress: 0,
    total: 4,
    description:
      "Digitalização e implantação do checklist de cirurgia segura da OMS no sistema hospitalar, substituindo o formulário físico.",
  },
  {
    id: 6,
    title: "Elaborar plano de ação para NC ANVISA — Farmácia",
    origin: "Risco",
    unit: "Farm",
    responsible: "Farm. Pedro",
    dueDate: "2026-04-10",
    status: "in_progress",
    priority: "medium",
    progress: 1,
    total: 3,
    description:
      "Elaboração de plano de ação corretivo para as não conformidades identificadas durante inspeção da ANVISA na Farmácia Hospitalar.",
  },
  {
    id: 7,
    title: "Calibração de equipamentos do laboratório",
    origin: "GUT",
    unit: "Lab",
    responsible: "Lab. Técnico",
    dueDate: "2026-04-20",
    status: "pending",
    priority: "medium",
    progress: 0,
    total: 2,
    description:
      "Calibração periódica de todos os equipamentos analíticos do laboratório clínico conforme cronograma de manutenção preventiva.",
  },
  {
    id: 8,
    title: "Implementar programa de prevenção de quedas",
    origin: "Indicador",
    unit: "Amb",
    responsible: "Enf. Chefe",
    dueDate: "2026-05-01",
    status: "in_progress",
    priority: "high",
    progress: 2,
    total: 5,
    description:
      "Implantação do programa institucional de prevenção de quedas incluindo avaliação de risco, sinalização e treinamento.",
  },
  {
    id: 9,
    title: "Notificar ANVISA sobre evento sentinela ES-2026-08",
    origin: "NSP/Evento",
    unit: "CC",
    responsible: "Qual. Maria",
    dueDate: "2026-03-17",
    status: "overdue",
    priority: "critical",
    progress: 0,
    total: 1,
    description:
      "Notificação obrigatória ao NOTIVISA referente ao evento sentinela ES-2026-08 ocorrido no Centro Cirúrgico.",
  },
  {
    id: 10,
    title: "Treinamento de biossegurança para equipe da UTI",
    origin: "Comissão",
    unit: "UTI",
    responsible: "CCIH",
    dueDate: "2026-04-30",
    status: "pending",
    priority: "low",
    progress: 0,
    total: 2,
    description:
      "Capacitação em biossegurança e prevenção de infecção relacionada à assistência para toda equipe multiprofissional da UTI.",
  },
];

const mockSubtasks = [
  { id: 1, label: "Levantar materiais necessários", done: true },
  { id: 2, label: "Treinamento da equipe envolvida", done: true },
  { id: 3, label: "Implantação piloto na unidade", done: false },
  { id: 4, label: "Avaliação dos resultados iniciais", done: false },
  { id: 5, label: "Documentar e protocolizar", done: false },
];

const mockStatusHistory = [
  { date: "2026-02-10", status: "Criado", user: "Qual. Maria" },
  { date: "2026-02-15", status: "Em Andamento", user: "Resp. Unidade" },
  { date: "2026-03-05", status: "Atualização de progresso", user: "Enf. Carla" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInfo(dueDateStr: string) {
  const today = new Date("2026-03-21");
  const due = new Date(dueDateStr);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function originStyle(origin: string) {
  const map: Record<string, string> = {
    "Diagnóstico": "bg-sky-100 text-sky-700",
    "ONA": "bg-violet-100 text-violet-700",
    "GUT": "bg-amber-100 text-amber-700",
    "Risco": "bg-orange-100 text-orange-700",
    "Comissão": "bg-emerald-100 text-emerald-700",
    "NSP/Evento": "bg-red-100 text-red-700",
    "Indicador": "bg-purple-100 text-purple-700",
    "Manual": "bg-slate-100 text-slate-600",
    "Protocolo": "bg-teal-100 text-teal-700",
  };
  return map[origin] ?? "bg-gray-100 text-gray-600";
}

function priorityDot(priority: Priority) {
  const map: Record<Priority, string> = {
    critical: "bg-red-600 ring-2 ring-red-300",
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-green-500",
  };
  return map[priority];
}

function priorityLabel(priority: Priority) {
  const map: Record<Priority, string> = {
    critical: "Crítica",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  };
  return map[priority];
}

function priorityBadgeStyle(priority: Priority) {
  const map: Record<Priority, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-red-50 text-red-600 border-red-100",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    low: "bg-green-50 text-green-700 border-green-100",
  };
  return map[priority];
}

function statusLabel(status: PlanStatus) {
  const map: Record<PlanStatus, string> = {
    pending: "Pendente",
    in_progress: "Em Andamento",
    done: "Concluído",
    overdue: "Vencido",
    near: "Próximo",
  };
  return map[status];
}

function semaphoreStyle(status: PlanStatus) {
  const map: Record<PlanStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    in_progress: "bg-sky-100 text-sky-700",
    done: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
    near: "bg-yellow-100 text-yellow-700",
  };
  return map[status];
}

const kanbanColumns: { key: PlanStatus; label: string; color: string; headerColor: string }[] = [
  { key: "pending", label: "Pendente", color: "border-gray-200", headerColor: "bg-gray-100 text-gray-700" },
  { key: "in_progress", label: "Em Andamento", color: "border-sky-200", headerColor: "bg-sky-100 text-sky-700" },
  { key: "done", label: "Concluído", color: "border-emerald-200", headerColor: "bg-emerald-100 text-emerald-700" },
  { key: "overdue", label: "Vencido", color: "border-red-200", headerColor: "bg-red-100 text-red-700" },
];

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ plan, onClick }: { plan: ActionPlan; onClick: () => void }) {
  const days = getDaysInfo(plan.dueDate);
  const isOverdue = days < 0;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2 mb-2">
        <span
          className={cn(
            "mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full",
            priorityDot(plan.priority)
          )}
        />
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
          {plan.title}
        </p>
      </div>

      {/* Origin badge */}
      <div className="mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            originStyle(plan.origin)
          )}
        >
          <Tag className="w-2.5 h-2.5" />
          {plan.origin}
        </span>
      </div>

      {/* Unit + responsible */}
      <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
        <Building2 className="w-3 h-3 flex-shrink-0" />
        <span>{plan.unit}</span>
        <span className="text-gray-300">·</span>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {getInitials(plan.responsible)}
          </div>
          <span className="truncate max-w-[100px]">{plan.responsible}</span>
        </div>
      </div>

      {/* Due date */}
      <div className={cn("flex items-center gap-1 text-xs mb-2", isOverdue ? "text-red-600 font-medium" : "text-gray-500")}>
        <Calendar className="w-3 h-3 flex-shrink-0" />
        <span>{plan.dueDate}</span>
        <span className="ml-auto font-semibold">
          {isOverdue ? `${Math.abs(days)}d atrasado` : `${days}d restantes`}
        </span>
      </div>

      {/* Progress */}
      {plan.total > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{plan.progress}/{plan.total} tarefas</span>
            <span>{Math.round((plan.progress / plan.total) * 100)}%</span>
          </div>
          <Progress value={(plan.progress / plan.total) * 100} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

// ─── Detail Dialog ─────────────────────────────────────────────────────────────

function DetailDialog({
  plan,
  open,
  onClose,
}: {
  plan: ActionPlan | null;
  open: boolean;
  onClose: () => void;
}) {
  const [subtasks, setSubtasks] = useState(mockSubtasks);
  const [reopenMode, setReopenMode] = useState(false);
  const [justification, setJustification] = useState("");

  if (!plan) return null;

  const days = getDaysInfo(plan.dueDate);
  const isOverdue = days < 0;

  function toggleSubtask(id: number) {
    setSubtasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{plan.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", originStyle(plan.origin))}>
              {plan.origin}
            </span>
            <span className={cn("text-xs px-2 py-1 rounded-full border font-medium", priorityBadgeStyle(plan.priority))}>
              {priorityLabel(plan.priority)}
            </span>
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", semaphoreStyle(plan.status))}>
              {statusLabel(plan.status)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600">{plan.description}</p>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span><strong>Unidade:</strong> {plan.unit}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span><strong>Responsável:</strong> {plan.responsible}</span>
            </div>
            <div className={cn("flex items-center gap-2", isOverdue ? "text-red-600 font-medium" : "text-gray-600")}>
              <Calendar className="w-4 h-4" />
              <span>
                <strong>Prazo:</strong> {plan.dueDate}{" "}
                ({isOverdue ? `${Math.abs(days)}d atrasado` : `${days}d restantes`})
              </span>
            </div>
            {plan.originPath && (
              <div className="flex items-center gap-2 text-gray-600">
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <a href={plan.originPath} className="text-sky-600 hover:underline text-xs">
                  Ver origem vinculada
                </a>
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <CheckSquare className="w-4 h-4" /> Subtarefas
            </h4>
            <div className="space-y-1.5">
              {subtasks.slice(0, plan.total).map((task) => (
                <label
                  key={task.id}
                  className="flex items-center gap-2 text-sm cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleSubtask(task.id)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className={cn(task.done ? "line-through text-gray-400" : "text-gray-700")}>
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Evidence upload */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4" /> Evidências
            </h4>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-400 hover:border-gray-300 transition-colors cursor-pointer">
              <FileText className="w-6 h-6 mx-auto mb-1 text-gray-300" />
              Arraste arquivos ou clique para anexar evidências
            </div>
          </div>

          {/* Status timeline */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Histórico de Status
            </h4>
            <div className="space-y-2">
              {mockStatusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{h.status}</span>
                    <span className="text-gray-400 ml-1">— {h.date} por {h.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {plan.status === "done" && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                <CheckCircle2 className="w-4 h-4" /> Validar Efetividade
              </Button>
            )}
            {!reopenMode ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => setReopenMode(true)}
              >
                <Edit className="w-4 h-4" /> Reabrir
              </Button>
            ) : (
              <div className="w-full space-y-2">
                <p className="text-xs text-gray-600 font-medium">Justificativa para reabertura:</p>
                <Input
                  placeholder="Descreva o motivo da reabertura..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={!justification} className="bg-amber-500 hover:bg-amber-600 text-white">
                    Confirmar Reabertura
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setReopenMode(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-1 ml-auto">
              <Edit className="w-4 h-4" /> Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GestaoOperacional() {
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showNovoPlanoForm, setShowNovoPlanoForm] = useState(false);
  const [novoPlano, setNovoPlano] = useState({ title: "", origin: "ONA", unit: "", responsible: "", dueDate: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const totalPlans = plans.length;
  const onTime = plans.filter((p) => p.status !== "overdue" && p.status !== "near").length;
  const near = plans.filter((p) => p.status === "near").length;
  const overdue = plans.filter((p) => p.status === "overdue").length;

  const filteredPlans = plans.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOrigin = filterOrigin === "all" || p.origin === filterOrigin;
    const matchUnit = filterUnit === "all" || p.unit === filterUnit;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchOrigin && matchUnit && matchStatus;
  });

  function openDetail(plan: ActionPlan) {
    setSelectedPlan(plan);
    setDetailOpen(true);
  }

  // Grouped data for tabs
  const byResponsible = plans.reduce<Record<string, ActionPlan[]>>((acc, p) => {
    if (!acc[p.responsible]) acc[p.responsible] = [];
    acc[p.responsible].push(p);
    return acc;
  }, {});

  const byUnit = plans.reduce<Record<string, ActionPlan[]>>((acc, p) => {
    if (!acc[p.unit]) acc[p.unit] = [];
    acc[p.unit].push(p);
    return acc;
  }, {});

  const completedPlans = plans.filter((p) => p.progress === p.total && p.total > 0);
  const validatedEffective = Math.floor(completedPlans.length * 0.6);
  const notEffective = completedPlans.length - validatedEffective;

  const effectivenessData = [
    { name: "Efetivas", value: validatedEffective, color: "#10b981" },
    { name: "Não confirmadas", value: notEffective, color: "#f59e0b" },
  ];

  const workloadData = Object.entries(byUnit).map(([unit, ps]) => ({
    unit,
    total: ps.length,
    overdue: ps.filter((p) => p.status === "overdue").length,
  }));

  const origins = Array.from(new Set(plans.map((p) => p.origin)));
  const units = Array.from(new Set(plans.map((p) => p.unit)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-600" />
                Gestão Operacional
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Backlog de Planos de Ação + Semáforo Institucional
              </p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 self-start sm:self-auto" onClick={() => setShowNovoPlanoForm(v => !v)}>
              <Plus className="w-4 h-4" /> Novo Plano de Ação
            </Button>
          </div>

          {/* Novo Plano de Ação inline form */}
          {showNovoPlanoForm && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 mb-2">
              <p className="text-sm font-semibold text-indigo-800 mb-3">Novo Plano de Ação</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">Título *</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Descreva o plano de ação..." value={novoPlano.title} onChange={e => setNovoPlano(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Origem</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" value={novoPlano.origin} onChange={e => setNovoPlano(p => ({ ...p, origin: e.target.value }))}>
                    {["ONA", "Risco", "GUT", "Indicador", "Diagnóstico", "Evento", "Comissão", "Protocolo"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Unidade</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" value={novoPlano.unit} onChange={e => setNovoPlano(p => ({ ...p, unit: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {["UTI", "PS", "CC", "Lab", "Farm", "CME", "Amb", "IMG", "HD", "Geral", "NSP"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Responsável</label>
                  <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Nome do responsável" value={novoPlano.responsible} onChange={e => setNovoPlano(p => ({ ...p, responsible: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Data Limite</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" value={novoPlano.dueDate} onChange={e => setNovoPlano(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50" onClick={() => setShowNovoPlanoForm(false)}>Cancelar</button>
                <button className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg" onClick={() => { if (!novoPlano.title) { toast.error("Informe o título do plano"); return; } toast.success(`Plano de ação "${novoPlano.title}" criado com sucesso!`); setNovoPlano({ title: "", origin: "ONA", unit: "", responsible: "", dueDate: "" }); setShowNovoPlanoForm(false); }}>Salvar Plano</button>
              </div>
            </div>
          )}

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total de Planos</p>
                <p className="text-2xl font-bold text-gray-900">{totalPlans}</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-600">No Prazo</p>
                <p className="text-2xl font-bold text-emerald-700">{onTime}</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-yellow-600">Próx. Vencimento</p>
                <p className="text-2xl font-bold text-yellow-700">{near}</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-700">{overdue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* ── Semáforo Institucional ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Semáforo Institucional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Verde */}
            <div className="bg-emerald-500 text-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl font-black">{onTime}</p>
                <p className="text-sm font-semibold opacity-90">Planos no Prazo</p>
                <p className="text-xs opacity-75">Dentro do cronograma</p>
              </div>
            </div>
            {/* Amarelo */}
            <div className="bg-yellow-400 text-yellow-900 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl font-black">{near}</p>
                <p className="text-sm font-semibold opacity-90">Próximos do Vencimento</p>
                <p className="text-xs opacity-75">Vencem em menos de 7 dias</p>
              </div>
            </div>
            {/* Vermelho */}
            <div className="bg-red-500 text-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl font-black">{overdue}</p>
                <p className="text-sm font-semibold opacity-90">Planos Vencidos</p>
                <p className="text-xs opacity-75">Prazo ultrapassado</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="planos">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="planos" className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Kanban className="w-3.5 h-3.5" /> Planos de Ação
            </TabsTrigger>
            <TabsTrigger value="responsavel" className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <User className="w-3.5 h-3.5" /> Por Responsável
            </TabsTrigger>
            <TabsTrigger value="unidade" className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Building2 className="w-3.5 h-3.5" /> Por Unidade
            </TabsTrigger>
            <TabsTrigger value="efetividade" className="gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <TrendingUp className="w-3.5 h-3.5" /> Efetividade
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Planos ── */}
          <TabsContent value="planos" className="mt-4 space-y-4">
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar planos ou responsável..."
                  className="pl-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas origens</SelectItem>
                  {origins.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas unidades</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="done">Concluído</SelectItem>
                  <SelectItem value="near">Próximo</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
              {/* View toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white ml-auto">
                <button
                  onClick={() => setView("kanban")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                    view === "kanban"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Kanban className="w-4 h-4" /> Kanban
                </button>
                <button
                  onClick={() => setView("lista")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                    view === "lista"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <List className="w-4 h-4" /> Lista
                </button>
              </div>
            </div>

            {/* ── Kanban View ── */}
            {view === "kanban" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {kanbanColumns.map((col) => {
                  const colPlans = filteredPlans.filter((p) => p.status === col.key);
                  return (
                    <div
                      key={col.key}
                      className={cn("rounded-xl border-2 bg-gray-50/50", col.color)}
                    >
                      {/* Column header */}
                      <div className={cn("rounded-t-lg px-3 py-2.5 flex items-center justify-between", col.headerColor)}>
                        <span className="text-sm font-semibold">{col.label}</span>
                        <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                          {colPlans.length}
                        </span>
                      </div>
                      {/* Cards */}
                      <div className="p-2 space-y-2 min-h-[120px]">
                        {colPlans.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-6">Nenhum plano</p>
                        ) : (
                          colPlans.map((plan) => (
                            <KanbanCard
                              key={plan.id}
                              plan={plan}
                              onClick={() => openDetail(plan)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Lista View ── */}
            {view === "lista" && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3 w-10">#</th>
                        <th className="text-left px-4 py-3 min-w-[200px]">Título</th>
                        <th className="text-left px-4 py-3">Origem</th>
                        <th className="text-left px-4 py-3">Unidade</th>
                        <th className="text-left px-4 py-3 min-w-[130px]">Responsável</th>
                        <th className="text-left px-4 py-3">Prazo</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Prioridade</th>
                        <th className="text-left px-4 py-3">Progresso</th>
                        <th className="text-center px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPlans.map((plan) => {
                        const days = getDaysInfo(plan.dueDate);
                        const isOverdue = days < 0;
                        return (
                          <tr
                            key={plan.id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => openDetail(plan)}
                          >
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                              #{plan.id}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800 line-clamp-1 max-w-[250px]">
                                {plan.title}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap", originStyle(plan.origin))}>
                                {plan.origin}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{plan.unit}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                  {getInitials(plan.responsible)}
                                </div>
                                <span className="text-gray-700 text-xs whitespace-nowrap">{plan.responsible}</span>
                              </div>
                            </td>
                            <td className={cn("px-4 py-3 whitespace-nowrap text-xs font-medium", isOverdue ? "text-red-600" : "text-gray-600")}>
                              {plan.dueDate}
                              <br />
                              <span className="font-normal text-gray-400">
                                {isOverdue ? `${Math.abs(days)}d atraso` : `${days}d`}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap", semaphoreStyle(plan.status))}>
                                {statusLabel(plan.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityDot(plan.priority))} />
                                <span className="text-xs text-gray-600 whitespace-nowrap">{priorityLabel(plan.priority)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 min-w-[80px]">
                                <Progress value={plan.total > 0 ? (plan.progress / plan.total) * 100 : 0} className="h-1.5 flex-1" />
                                <span className="text-xs text-gray-400 whitespace-nowrap">{plan.progress}/{plan.total}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openDetail(plan); }}
                                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredPlans.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhum plano encontrado com os filtros aplicados.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Por Responsável ── */}
          <TabsContent value="responsavel" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(byResponsible).map(([resp, ps]) => {
                const overdueCount = ps.filter((p) => p.status === "overdue").length;
                const load = ps.length;
                const loadColor = load >= 4 ? "bg-red-500" : load >= 2 ? "bg-amber-400" : "bg-emerald-500";
                return (
                  <Card key={resp} className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center gap-3 space-y-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {getInitials(resp)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold text-gray-800 truncate">{resp}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("w-2 h-2 rounded-full", loadColor)} />
                          <span className="text-xs text-gray-500">{load} planos atribuídos</span>
                          {overdueCount > 0 && (
                            <span className="text-xs text-red-600 font-medium ml-1">
                              · {overdueCount} vencidos
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1.5">
                        {ps.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => openDetail(p)}
                            className="flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer group"
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priorityDot(p.priority))} />
                            <span className="text-gray-700 line-clamp-1 flex-1">{p.title}</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap", semaphoreStyle(p.status))}>
                              {statusLabel(p.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Tab: Por Unidade ── */}
          <TabsContent value="unidade" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Volume de Planos por Unidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={workloadData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="unit" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(val: number, name: string) => [
                          val,
                          name === "total" ? "Total" : "Vencidos",
                        ]}
                      />
                      <Bar dataKey="total" name="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="overdue" name="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Unit cards */}
              <div className="space-y-3">
                {Object.entries(byUnit).map(([unit, ps]) => {
                  const overdueCount = ps.filter((p) => p.status === "overdue").length;
                  const pct = Math.round((overdueCount / ps.length) * 100);
                  return (
                    <div key={unit} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-500" />
                          <span className="font-semibold text-gray-800 text-sm">{unit}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{ps.length} planos</span>
                          {overdueCount > 0 && (
                            <span className="text-red-600 font-medium">{overdueCount} vencidos</span>
                          )}
                        </div>
                      </div>
                      <Progress
                        value={100 - pct}
                        className="h-2"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{100 - pct}% no prazo</span>
                        <span>{pct}% vencidos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── Tab: Efetividade ── */}
          <TabsContent value="efetividade" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats */}
              <div className="space-y-4">
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="pt-5">
                    <div className="text-center space-y-1">
                      <p className="text-4xl font-black text-gray-900">
                        {completedPlans.length}
                      </p>
                      <p className="text-sm text-gray-500">Planos concluídos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="pt-5">
                    <div className="text-center space-y-1">
                      <p className="text-4xl font-black text-emerald-600">
                        {validatedEffective}
                      </p>
                      <p className="text-sm text-gray-500">Validados efetivos</p>
                      <div className="mt-3">
                        <Progress value={(validatedEffective / Math.max(completedPlans.length, 1)) * 100} className="h-2" />
                        <p className="text-xs text-gray-400 mt-1">
                          {Math.round((validatedEffective / Math.max(completedPlans.length, 1)) * 100)}% validados
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="pt-5">
                    <div className="text-center space-y-1">
                      <p className="text-4xl font-black text-amber-500">
                        {notEffective}
                      </p>
                      <p className="text-sm text-gray-500">Aguardando validação</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pie chart */}
              <Card className="border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Distribuição de Efetividade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={effectivenessData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {effectivenessData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => [val, "planos"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3 flex-1">
                      {effectivenessData.map((d) => (
                        <div key={d.name} className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: d.color }}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-700">{d.name}</span>
                              <span className="text-sm font-bold text-gray-900">{d.value}</span>
                            </div>
                            <Progress
                              value={(d.value / Math.max(completedPlans.length, 1)) * 100}
                              className="h-1.5"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Taxa de efetividade confirmada:{" "}
                          <strong className="text-emerald-600">
                            {Math.round((validatedEffective / Math.max(completedPlans.length, 1)) * 100)}%
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pending validation list */}
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Aguardando Validação de Efetividade
                    </h4>
                    <div className="space-y-2">
                      {plans
                        .filter((p) => p.progress === p.total && p.total > 0)
                        .slice(0, 3)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-3 py-2 px-3 bg-amber-50 border border-amber-100 rounded-lg"
                          >
                            <p className="text-xs text-gray-700 line-clamp-1 flex-1">{p.title}</p>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Validar
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Detail Dialog ── */}
      <DetailDialog
        plan={selectedPlan}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
