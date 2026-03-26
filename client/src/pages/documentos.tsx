import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQHealthDocuments, createQHealthDocument } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Send,
  Shield,
  BookOpen,
  Users,
  Award,
  XCircle,
  ChevronRight,
  PenLine,
  FileCheck,
  Stamp,
  Radio,
  ClipboardList,
  Bell,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType = "POP" | "Protocolo" | "Política" | "Manual" | "Formulário" | "Regimento" | "Norma";
type DocStatus = "Vigente" | "Em Revisão" | "Vencido" | "Rascunho";

interface Document {
  id: string;
  code: string;
  title: string;
  type: DocType;
  unit: string;
  version: string;
  status: DocStatus;
  expiry: string | null;
  reads: number;
  ona?: string;
  expired?: boolean;
  expiringSoon?: boolean;
}

interface WorkflowItem {
  code: string;
  title: string;
  type: DocType;
  stage: 0 | 1 | 2 | 3 | 4;
  responsible: string;
  startDate: string;
  comment: string;
}

interface MandatoryReading {
  docCode: string;
  title: string;
  assignedTo: string;
  deadline: string;
  total: number;
  completed: number;
  pending: string[];
}

interface ONAEvidence {
  onaCode: string;
  description: string;
  docs: string[];
  status: "Atendido" | "Parcial" | "Ausente";
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const DOCUMENTS: Document[] = [
  { id: "1",  code: "POP-001",  title: "Higienização das Mãos",             type: "POP",        unit: "Geral",  version: "v3.0", status: "Vigente",    expiry: "30/12/2026", reads: 145, ona: "ONA 2.1.1" },
  { id: "2",  code: "PROT-001", title: "Protocolo de Sepse",                type: "Protocolo",  unit: "PS",     version: "v2.1", status: "Vigente",    expiry: "15/06/2026", reads: 67,  ona: "ONA 3.2.1" },
  { id: "3",  code: "POL-001",  title: "Política de Segurança do Paciente", type: "Política",   unit: "Geral",  version: "v1.5", status: "Vigente",    expiry: "01/03/2026", reads: 203, expired: true },
  { id: "4",  code: "MAN-001",  title: "Manual de Identidade Institucional",type: "Manual",     unit: "Geral",  version: "v2.0", status: "Em Revisão", expiry: "15/08/2026", reads: 88 },
  { id: "5",  code: "PROT-002", title: "Protocolo de Contenção",            type: "Protocolo",  unit: "UTI",    version: "v1.0", status: "Rascunho",   expiry: null,         reads: 0 },
  { id: "6",  code: "REG-001",  title: "Regimento do NSP",                  type: "Regimento",  unit: "NSP",    version: "v3.2", status: "Vigente",    expiry: "28/02/2026", reads: 23,  expired: true },
  { id: "7",  code: "POP-002",  title: "Coleta de Sangue",                  type: "POP",        unit: "Lab",    version: "v2.0", status: "Vigente",    expiry: "15/09/2026", reads: 89 },
  { id: "8",  code: "PROT-003", title: "Protocolo de AVC",                  type: "Protocolo",  unit: "PS",     version: "v1.2", status: "Vigente",    expiry: "10/07/2026", reads: 45,  ona: "ONA 3.3.4" },
  { id: "9",  code: "FOR-001",  title: "Formulário de Admissão",            type: "Formulário", unit: "Geral",  version: "v4.0", status: "Vigente",    expiry: "01/12/2026", reads: 312 },
  { id: "10", code: "NOR-001",  title: "Norma de Descarte de Resíduos",     type: "Norma",      unit: "CME",    version: "v2.0", status: "Vencido",    expiry: "01/01/2026", reads: 67 },
  { id: "11", code: "MAN-002",  title: "Manual do Centro Cirúrgico",        type: "Manual",     unit: "CC",     version: "v1.5", status: "Vigente",    expiry: "30/11/2026", reads: 34,  expiringSoon: true },
  { id: "12", code: "POP-003",  title: "Preparo de Medicamentos",           type: "POP",        unit: "Farm",   version: "v2.5", status: "Em Revisão", expiry: "28/04/2026", reads: 78,  ona: "ONA 2.3.2" },
];

const WORKFLOW_ITEMS: WorkflowItem[] = [
  { code: "POP-004",  title: "Administração de Hemocomponentes", type: "POP",       stage: 1, responsible: "Enf. Carla Mendes",   startDate: "10/03/2026", comment: "Aguardando revisão técnica da farmácia" },
  { code: "PROT-004", title: "Protocolo de Sepse Neonatal",      type: "Protocolo", stage: 2, responsible: "Dr. Fábio Resende",   startDate: "05/03/2026", comment: "Revisão técnica concluída. Pendente aprovação da chefia" },
  { code: "POL-002",  title: "Política de Privacidade de Dados", type: "Política",  stage: 3, responsible: "DPO Maria Cláudia",   startDate: "01/03/2026", comment: "Colhendo assinatura digital dos responsáveis" },
  { code: "NOR-002",  title: "Norma de Paramentação Cirúrgica",  type: "Norma",     stage: 4, responsible: "Coord. CC Beatriz Lima", startDate: "20/02/2026", comment: "Publicação prevista para 25/03/2026" },
];

const MANDATORY_READINGS: MandatoryReading[] = [
  { docCode: "POP-001",  title: "Higienização das Mãos",             assignedTo: "Toda a equipe assistencial", deadline: "31/03/2026", total: 120, completed: 108, pending: ["João S.", "Maria R.", "Carlos T.", "Ana P.", "Pedro V.", "Lúcia F.", "Marcos B.", "Rafael N.", "Sônia G.", "Cleber A.", "Fátima O.", "Renato K."] },
  { docCode: "PROT-001", title: "Protocolo de Sepse",                assignedTo: "PS + UTI",                   deadline: "15/04/2026", total: 45,  completed: 30,  pending: ["Dr. Henrique V.", "Enf. Sandra O.", "Téc. André M.", "Enf. Roberta C.", "Dr. Gustavo P.", "Téc. Camila R.", "Enf. Lucas T.", "Dr. Patrícia N.", "Téc. Felipe B.", "Enf. Vanessa A.", "Dr. Rodrigo S.", "Téc. Mariana L.", "Enf. Tiago F.", "Dr. Elaine C.", "Téc. Bruno K."] },
  { docCode: "POL-001",  title: "Política de Segurança do Paciente", assignedTo: "Todos os colaboradores",     deadline: "10/04/2026", total: 200, completed: 187, pending: ["Adriana F.", "Cláudio M.", "Débora S.", "Eduardo P.", "Fernanda A.", "Gilson T.", "Heloísa V.", "Igor R.", "Juliana C.", "Karine D.", "Leonardo B.", "Miriam T."] },
  { docCode: "PROT-003", title: "Protocolo de AVC",                  assignedTo: "PS + Neurologia",            deadline: "30/04/2026", total: 28,  completed: 19,  pending: ["Dr. Alexandre G.", "Enf. Bianca V.", "Téc. César A.", "Dr. Denise R.", "Enf. Eduardo F.", "Téc. Fabiana S.", "Dr. Geraldo O.", "Enf. Humberto P.", "Téc. Ivone M."] },
];

const ONA_EVIDENCE: ONAEvidence[] = [
  { onaCode: "2.1.1", description: "Higiene das mãos — 5 momentos",         docs: ["POP-001"],               status: "Atendido" },
  { onaCode: "2.1.3", description: "Identificação do paciente",             docs: ["POP-005", "FOR-002"],    status: "Ausente"  },
  { onaCode: "2.3.2", description: "Preparo e administração de medicamentos",docs: ["POP-003"],               status: "Parcial"  },
  { onaCode: "3.2.1", description: "Protocolo de sepse adulto",             docs: ["PROT-001"],              status: "Atendido" },
  { onaCode: "3.3.4", description: "Acidente vascular cerebral",            docs: ["PROT-003"],              status: "Atendido" },
  { onaCode: "4.1.2", description: "Gestão de resíduos de serviços de saúde",docs: ["NOR-001"],              status: "Parcial"  },
  { onaCode: "4.2.1", description: "Qualificação e segurança do ambiente",  docs: [],                        status: "Ausente"  },
  { onaCode: "5.1.1", description: "Política de segurança do paciente",     docs: ["POL-001"],               status: "Atendido" },
  { onaCode: "5.2.3", description: "Notificação de eventos adversos",       docs: ["REG-001", "FOR-003"],    status: "Parcial"  },
  { onaCode: "6.1.0", description: "Regulamento interno e regimento",       docs: ["REG-001"],               status: "Atendido" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPE_COLORS: Record<DocType, string> = {
  POP:        "bg-blue-100 text-blue-800",
  Protocolo:  "bg-purple-100 text-purple-800",
  Política:   "bg-indigo-100 text-indigo-800",
  Manual:     "bg-cyan-100 text-cyan-800",
  Formulário: "bg-teal-100 text-teal-800",
  Regimento:  "bg-orange-100 text-orange-800",
  Norma:      "bg-rose-100 text-rose-800",
};

function StatusBadge({ status, expired }: { status: DocStatus; expired?: boolean }) {
  if (status === "Vigente" && expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3" /> Vencido
      </span>
    );
  }
  const map: Record<DocStatus, string> = {
    Vigente:      "bg-emerald-100 text-emerald-700",
    "Em Revisão": "bg-amber-100 text-amber-700",
    Vencido:      "bg-red-100 text-red-700",
    Rascunho:     "bg-slate-100 text-slate-600",
  };
  const icons: Record<DocStatus, React.ReactNode> = {
    Vigente:      <CheckCircle2 className="w-3 h-3" />,
    "Em Revisão": <RefreshCw className="w-3 h-3" />,
    Vencido:      <XCircle className="w-3 h-3" />,
    Rascunho:     <Edit3 className="w-3 h-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", map[status])}>
      {icons[status]} {status}
    </span>
  );
}

const WORKFLOW_STAGES = [
  { label: "Elaboração",          icon: PenLine,      color: "bg-blue-500",   ring: "ring-blue-400" },
  { label: "Revisão Técnica",     icon: FileCheck,    color: "bg-amber-500",  ring: "ring-amber-400" },
  { label: "Aprovação da Chefia", icon: ClipboardList,color: "bg-orange-500", ring: "ring-orange-400" },
  { label: "Assinatura Digital",  icon: Stamp,        color: "bg-purple-500", ring: "ring-purple-400" },
  { label: "Publicação",          icon: Radio,        color: "bg-emerald-500",ring: "ring-emerald-400" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className={cn("border-l-4", color)}>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── TAB 1: Lista Mestra ──────────────────────────────────────────────────────

function ListaMestra() {
  const { isAdmin } = useTenant();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("Todos");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoTipo, setNovoTipo] = useState<DocType>("POP");
  const queryClient = useQueryClient();

  const { data: dbDocs } = useQuery({
    queryKey: ["qhealth-documents"],
    queryFn: () => getQHealthDocuments(),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createQHealthDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qhealth-documents"] });
      toast.success("Documento cadastrado com sucesso!");
      setShowNovoForm(false);
      setNovoTitulo("");
    },
    onError: () => toast.error("Erro ao cadastrar documento."),
  });

  // Mapear dados do BD com fallback no mock
  const statusDbMap: Record<string, DocStatus> = {
    approved: "Vigente", review: "Em Revisão", obsolete: "Vencido", draft: "Rascunho",
  };
  const typeDbMap: Record<string, DocType> = {
    POP: "POP", Protocol: "Protocolo", Policy: "Política", Manual: "Manual",
    Form: "Formulário", Regulation: "Regimento", Norm: "Norma",
  };
  const baseDocuments: Document[] = (dbDocs && dbDocs.length > 0)
    ? dbDocs.map(d => ({
        id: String(d.id),
        code: d.code || `DOC-${String(d.id).padStart(3, "0")}`,
        title: d.title,
        type: (typeDbMap[d.type] || "POP") as DocType,
        unit: "Geral",
        version: d.currentVersion,
        status: (statusDbMap[d.status] || "Rascunho") as DocStatus,
        expiry: d.validUntil ? new Date(d.validUntil).toLocaleDateString("pt-BR") : null,
        reads: 0,
        expired: d.validUntil ? new Date(d.validUntil) < new Date() : false,
        expiringSoon: false,
      }))
    : (isAdmin ? DOCUMENTS : []);

  const types: string[] = ["Todos", "POP", "Protocolo", "Política", "Manual", "Formulário", "Regimento", "Norma"];
  const statuses: string[] = ["Todos", "Vigente", "Em Revisão", "Vencido", "Rascunho"];
  const units = ["all", ...Array.from(new Set(baseDocuments.map(d => d.unit)))];

  const filtered = baseDocuments.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase()) || doc.code.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "Todos"   || doc.type   === typeFilter;
    const matchStatus = statusFilter === "Todos"  || doc.status === statusFilter || (statusFilter === "Vencido" && doc.expired);
    const matchUnit   = unitFilter === "all"      || doc.unit   === unitFilter;
    return matchSearch && matchType && matchStatus && matchUnit;
  });

  const displayDocuments = isAdmin ? DOCUMENTS : [];
  const expiredCount    = displayDocuments.filter(d => d.expired || d.status === "Vencido").length;
  const vigentCount     = displayDocuments.filter(d => d.status === "Vigente" && !d.expired).length;
  const revisaoCount    = displayDocuments.filter(d => d.status === "Em Revisão").length;
  const rascunhoCount   = displayDocuments.filter(d => d.status === "Rascunho").length;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total de Documentos" value={displayDocuments.length} color="border-l-blue-500" />
        <KpiCard label="Vigentes"    value={vigentCount}   color="border-l-emerald-500" sub="ativos" />
        <KpiCard label="Em Revisão"  value={revisaoCount}  color="border-l-amber-500" />
        <KpiCard label="Vencidos"    value={expiredCount}  color="border-l-red-500" sub="requer ação" />
      </div>

      {/* Alerta vencidos */}
      {expiredCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <Bell className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-sm text-red-700 font-medium">
            {expiredCount} documento(s) vencido(s) — revisão obrigatória para manutenção da acreditação ONA.
          </span>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar por código ou título..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs h-8 text-sm"
            />
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {units.filter(u => u !== "all").map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => toast.info("Exportando...")}>
              <Download className="w-3.5 h-3.5" /> Exportar
            </Button>
            <Button size="sm" className="h-8 gap-1 ml-auto bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowNovoForm(v => !v)}>
              <Plus className="w-3.5 h-3.5" /> Novo Documento
            </Button>
          </div>

          {/* Type filter chips */}
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  typeFilter === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status filter chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Status:</span>
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === s
                    ? "bg-slate-700 text-white border-slate-700"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Novo Documento Form */}
      {showNovoForm && (
        <Card className="border border-blue-200">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold text-slate-800">Novo Documento</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Título</label>
                <Input className="h-8 text-sm" placeholder="Título do documento" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
                <select
                  className="w-full h-8 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={novoTipo}
                  onChange={e => setNovoTipo(e.target.value as DocType)}
                >
                  <option value="POP">POP</option>
                  <option value="Protocol">Protocolo</option>
                  <option value="Policy">Política</option>
                  <option value="Manual">Manual</option>
                  <option value="Form">Formulário</option>
                  <option value="Regulation">Regimento</option>
                  <option value="Norm">Norma</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Responsável</label>
                <Input className="h-8 text-sm" placeholder="Nome do responsável" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 text-xs" onClick={() => setShowNovoForm(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                disabled={createMutation.isPending}
                onClick={() => {
                  if (!novoTitulo.trim()) { toast.error("Informe o título do documento."); return; }
                  createMutation.mutate({ title: novoTitulo, type: novoTipo, status: "draft", currentVersion: "1.0", reviewPeriodDays: 365, mandatoryReading: false } as any);
                }}
              >
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Título</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Unidade</th>
                  <th className="px-4 py-3 text-center font-semibold">Versão</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Validade</th>
                  <th className="px-4 py-3 text-center font-semibold">Leituras</th>
                  <th className="px-4 py-3 text-center font-semibold">ONA</th>
                  <th className="px-4 py-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(doc => {
                  const isExpired = doc.expired || doc.status === "Vencido";
                  return (
                    <tr
                      key={doc.id}
                      className={cn(
                        "hover:bg-slate-50 transition-colors",
                        isExpired && "bg-red-50/60"
                      )}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">{doc.code}</td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <span className={cn("font-medium", isExpired && "text-red-700")}>{doc.title}</span>
                        {isExpired && <AlertTriangle className="inline ml-1 w-3.5 h-3.5 text-red-500" />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded text-xs font-semibold", DOC_TYPE_COLORS[doc.type])}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{doc.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">{doc.version}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={doc.status} expired={doc.expired} />
                      </td>
                      <td className={cn("px-4 py-3 text-center text-xs font-medium", isExpired ? "text-red-600" : "text-slate-600")}>
                        {doc.expiry ?? "—"}
                        {isExpired && <span className="ml-1">❌</span>}
                        {doc.expiringSoon && !isExpired && <span className="ml-1 text-amber-500" title="Vence em breve">⚠️</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">{doc.reads.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {doc.ona ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs font-semibold">{doc.ona}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-slate-600 hover:text-blue-600" onClick={() => toast.info("Abrindo...")}>
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </Button>
                          {doc.status !== "Rascunho" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-slate-600 hover:text-amber-600" onClick={() => toast.info("Abrindo editor...")}>
                              <RefreshCw className="w-3.5 h-3.5" /> Revisar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum documento encontrado.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB 2: Workflow ──────────────────────────────────────────────────────────

function WorkflowAprovacao() {
  const { isAdmin } = useTenant();
  const displayWorkflowItems = isAdmin ? WORKFLOW_ITEMS : [];
  return (
    <div className="space-y-6">
      {/* Pipeline legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Pipeline de Aprovação de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {WORKFLOW_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div key={stage.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1 min-w-[110px]">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0", stage.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 text-center leading-tight">{stage.label}</span>
                  </div>
                  {i < WORKFLOW_STAGES.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 -mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document cards */}
      <div className="grid gap-4">
        {displayWorkflowItems.map(item => {
          const stage = WORKFLOW_STAGES[item.stage];
          const Icon  = stage.icon;
          return (
            <Card key={item.code} className={cn("border-l-4", `border-l-${item.stage === 0 ? "blue" : item.stage === 1 ? "amber" : item.stage === 2 ? "orange" : item.stage === 3 ? "purple" : "emerald"}-500`)}>
              <CardContent className="py-4 px-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Stage indicator */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", stage.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estágio atual</p>
                      <p className="text-sm font-semibold">{stage.label}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.code}</span>
                      <span className={cn("px-2 py-0.5 rounded text-xs font-semibold", DOC_TYPE_COLORS[item.type])}>{item.type}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 italic">"{item.comment}"</p>
                  </div>

                  <div className="flex flex-col gap-1 text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" /> Início: {item.startDate}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5" /> {item.responsible}
                    </div>
                  </div>

                  <div>
                    <Button size="sm" className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => toast.success("Operação realizada com sucesso!")}>
                      <Send className="w-3.5 h-3.5" /> Avançar etapa
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progresso do workflow</span>
                    <span>{Math.round(((item.stage) / (WORKFLOW_STAGES.length - 1)) * 100)}%</span>
                  </div>
                  <Progress value={Math.round(((item.stage) / (WORKFLOW_STAGES.length - 1)) * 100)} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB 3: Leituras Obrigatórias ────────────────────────────────────────────

function LeiturasObrigatorias() {
  const { isAdmin } = useTenant();
  const displayMandatoryReadings = isAdmin ? MANDATORY_READINGS : [];
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Controle de leitura obrigatória dos documentos vigentes.</p>
        <Button size="sm" className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs">
          <Plus className="w-3.5 h-3.5" /> Nova Atribuição
        </Button>
      </div>

      <div className="grid gap-4">
        {displayMandatoryReadings.map(item => {
          const pct = Math.round((item.completed / item.total) * 100);
          const isExpanded = expanded === item.docCode;
          return (
            <Card key={item.docCode}>
              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.docCode}</span>
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Público: {item.assignedTo}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{pct}%</p>
                      <p className="text-xs text-slate-400">concluído</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{item.completed}/{item.total}</p>
                      <p className="text-xs text-slate-400">leituras</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-amber-600">{item.deadline}</p>
                      <p className="text-xs text-slate-400">prazo</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progresso das leituras</span>
                    <span>{item.pending.length} pendente(s)</span>
                  </div>
                  <Progress
                    value={pct}
                    className={cn("h-2", pct === 100 ? "[&>div]:bg-emerald-500" : pct < 50 ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500")}
                  />
                </div>

                {item.pending.length > 0 && (
                  <div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.docCode)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? "Ocultar" : "Ver"} pendentes ({item.pending.length})
                      <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-90")} />
                    </button>
                    {isExpanded && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.pending.map(name => (
                          <span key={name} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB 4: Evidências ONA ────────────────────────────────────────────────────

function EvidenciasONA() {
  const { isAdmin } = useTenant();
  const displayOnaEvidence = isAdmin ? ONA_EVIDENCE : [];
  const atendido = displayOnaEvidence.filter(r => r.status === "Atendido").length;
  const parcial  = displayOnaEvidence.filter(r => r.status === "Parcial").length;
  const ausente  = displayOnaEvidence.filter(r => r.status === "Ausente").length;
  const pct = displayOnaEvidence.length > 0 ? Math.round((atendido / displayOnaEvidence.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total de Requisitos" value={displayOnaEvidence.length} color="border-l-blue-500" />
        <KpiCard label="Atendidos"  value={atendido} color="border-l-emerald-500" sub={`${pct}% de conformidade`} />
        <KpiCard label="Parcial"    value={parcial}  color="border-l-amber-500" />
        <KpiCard label="Ausentes"   value={ausente}  color="border-l-red-500" sub="requer documentação" />
      </div>

      {/* Compliance bar */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">Conformidade ONA — Cobertura Documental</span>
            <span className={cn("text-sm font-bold", pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600")}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-3 [&>div]:bg-emerald-500" />
          <p className="text-xs text-slate-400 mt-1">Meta de acreditação: 100% dos requisitos cobertos</p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Req. ONA</th>
                  <th className="px-4 py-3 text-left font-semibold">Descrição do Requisito</th>
                  <th className="px-4 py-3 text-center font-semibold">Documentos Vinculados</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayOnaEvidence.map(row => (
                  <tr
                    key={row.onaCode}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      row.status === "Ausente" && "bg-red-50/50",
                      row.status === "Parcial" && "bg-amber-50/40"
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{row.onaCode}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.description}</td>
                    <td className="px-4 py-3 text-center">
                      {row.docs.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {row.docs.map(d => (
                            <span key={d} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-mono">{d}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-400 text-xs font-medium">Nenhum documento</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.status === "Atendido" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Atendido
                        </span>
                      )}
                      {row.status === "Parcial" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-3 h-3" /> Parcial
                        </span>
                      )}
                      {row.status === "Ausente" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" /> Ausente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.status !== "Atendido" ? (
                        <Button variant="outline" size="sm" className="h-7 px-3 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => toast.info("Funcionalidade disponível em breve")}>
                          <Plus className="w-3 h-3" /> Vincular doc.
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs gap-1 text-slate-400" onClick={() => toast.info("Abrindo...")}>
                          <Eye className="w-3 h-3" /> Ver
                        </Button>
                      )}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Documentos() {
  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Documentos &amp; Evidências</h1>
              <p className="text-xs text-slate-500">Módulo 15 — Gestão documental e rastreabilidade ONA</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Shield className="w-3 h-3 text-indigo-500" /> ONA 2.1 · 3.2 · 5.1
          </Badge>
          <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
            <Bell className="w-3 h-3" /> Alertas 30/15/7 dias ativos
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="h-10">
          <TabsTrigger value="lista"    className="text-xs gap-1.5"><FileText className="w-3.5 h-3.5" /> Lista Mestra</TabsTrigger>
          <TabsTrigger value="workflow" className="text-xs gap-1.5"><Send className="w-3.5 h-3.5" /> Workflow de Aprovação</TabsTrigger>
          <TabsTrigger value="leituras" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Leituras Obrigatórias</TabsTrigger>
          <TabsTrigger value="ona"      className="text-xs gap-1.5"><Award className="w-3.5 h-3.5" /> Evidências ONA</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <ListaMestra />
        </TabsContent>
        <TabsContent value="workflow">
          <WorkflowAprovacao />
        </TabsContent>
        <TabsContent value="leituras">
          <LeiturasObrigatorias />
        </TabsContent>
        <TabsContent value="ona">
          <EvidenciasONA />
        </TabsContent>
      </Tabs>
    </div>
  );
}
