import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useTenant } from "@/hooks/use-tenant";
import { EmptyState } from "@/components/empty-state";
import {
  Workflow, Plus, Search, Download, Eye,
  FileText, Building2, Users, Layers, ArrowRight, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProcessStatus = "Publicado" | "Em revisão" | "Em mapeamento" | "Obsoleto";
type ProcessType = "POP" | "Protocolo" | "Fluxo" | "Instrução de Trabalho";

interface HospitalProcess {
  id: number;
  code: string;
  name: string;
  sector: string;
  type: ProcessType;
  status: ProcessStatus;
  version: string;
  responsible: string;
  onaRef: string;
  lastReview: string;
  nextReview: string;
  sipoc: {
    suppliers: string[];
    inputs: string[];
    process: string[];
    outputs: string[];
    customers: string[];
  };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const processes: HospitalProcess[] = [
  {
    id: 1, code: "POP-ADM-001", name: "Admissão Hospitalar", sector: "Recepção",
    type: "POP", status: "Publicado", version: "3.2", responsible: "Coord. Recepção",
    onaRef: "3.1.1", lastReview: "Jan/2026", nextReview: "Jan/2027",
    sipoc: {
      suppliers: ["Pronto-Socorro", "Ambulatório", "Médico Assistente"],
      inputs: ["Guia de internação", "Pedido médico", "Documentos do paciente"],
      process: ["Verificar indicação", "Registrar dados", "Classificar leito", "Emitir pulseira", "Orientar paciente"],
      outputs: ["Paciente admitido", "Prontuário aberto", "Comunicação à unidade"],
      customers: ["Paciente / Família", "Unidade de internação", "Equipe médica"],
    },
  },
  {
    id: 2, code: "POP-ALT-001", name: "Alta Hospitalar", sector: "Internação",
    type: "POP", status: "Publicado", version: "2.1", responsible: "Enf. Coordenadora",
    onaRef: "3.1.2", lastReview: "Dez/2025", nextReview: "Dez/2026",
    sipoc: {
      suppliers: ["Médico", "Equipe multidisciplinar", "Financeiro"],
      inputs: ["Pedido de alta médica", "Relatório de alta", "Prescrições domiciliares"],
      process: ["Confirmar alta médica", "Orientar paciente", "Entregar relatório", "Faturar internação", "Liberar leito"],
      outputs: ["Paciente orientado", "Leito desocupado", "Sumário de alta"],
      customers: ["Paciente", "Família", "UBS de referência"],
    },
  },
  {
    id: 3, code: "POP-SEG-001", name: "Identificação do Paciente", sector: "Todas as Unidades",
    type: "POP", status: "Em revisão", version: "4.0", responsible: "NSP",
    onaRef: "4.1.1 / 4.1.2", lastReview: "Fev/2026", nextReview: "Fev/2027",
    sipoc: {
      suppliers: ["Admissão", "SCIH", "Farmácia"],
      inputs: ["Dados do paciente", "Pulseira de identificação", "Protocolo NSP"],
      process: ["Conferir nome e data nasc.", "Aplicar pulseira", "Checagem dupla em procedimentos", "Verificar alergias", "Registrar no sistema"],
      outputs: ["Paciente identificado", "Risco reduzido", "Registro auditável"],
      customers: ["Paciente", "Equipe assistencial", "NSP"],
    },
  },
  {
    id: 4, code: "POP-CCH-001", name: "Higienização das Mãos", sector: "Todas as Unidades",
    type: "POP", status: "Publicado", version: "2.3", responsible: "SCIH",
    onaRef: "4.2.1", lastReview: "Mar/2026", nextReview: "Mar/2027",
    sipoc: {
      suppliers: ["SCIH", "Vigilância Sanitária", "Almoxarifado"],
      inputs: ["Álcool gel", "Sabão antisséptico", "Treinamento da equipe"],
      process: ["Friccionar as mãos", "Cobrir superfícies", "Enxaguar", "Secar", "Registrar adesão"],
      outputs: ["Mãos higienizadas", "Redução de IRAS", "Taxa de adesão"],
      customers: ["Paciente", "Equipe assistencial", "SCIH"],
    },
  },
  {
    id: 5, code: "PRO-SEP-001", name: "Protocolo de Sepse", sector: "Pronto-Socorro",
    type: "Protocolo", status: "Publicado", version: "5.1", responsible: "Dir. Médica",
    onaRef: "4.3.2", lastReview: "Jan/2026", nextReview: "Jan/2027",
    sipoc: {
      suppliers: ["Triagem", "Laboratório", "Farmácia"],
      inputs: ["Sinais de alerta SIRS", "Resultados laboratoriais", "Antibióticos"],
      process: ["Reconhecer sinais de sepse", "Acionar protocolo", "Coletar culturas", "Antibiótico em 1h", "Monitorar resposta"],
      outputs: ["Tratamento iniciado", "Redução de mortalidade", "Registro documentado"],
      customers: ["Paciente", "UTI", "Auditoria clínica"],
    },
  },
  {
    id: 6, code: "POP-FAR-001", name: "Dispensação de Medicamentos", sector: "Farmácia",
    type: "POP", status: "Publicado", version: "3.0", responsible: "Farm. Responsável",
    onaRef: "5.1.1", lastReview: "Fev/2026", nextReview: "Fev/2027",
    sipoc: {
      suppliers: ["Médico prescritor", "Estoque farmácia", "Distribuidores"],
      inputs: ["Prescrição médica", "Estoque de medicamentos", "Ficha do paciente"],
      process: ["Receber prescrição", "Checar interações", "Separar medicamentos", "Rotular e conferir", "Dispensar à unidade"],
      outputs: ["Medicamento dispensado", "Rastreabilidade garantida", "Registro de dispensação"],
      customers: ["Paciente", "Enfermagem", "Auditoria"],
    },
  },
  {
    id: 7, code: "POP-CME-001", name: "Processamento de Material (CME)", sector: "CME",
    type: "POP", status: "Publicado", version: "2.8", responsible: "Coord. CME",
    onaRef: "5.2.1", lastReview: "Dez/2025", nextReview: "Dez/2026",
    sipoc: {
      suppliers: ["Centro Cirúrgico", "UTI", "Enfermagem"],
      inputs: ["Artigos contaminados", "Produtos de limpeza", "Embalagens de esterilização"],
      process: ["Receber e classificar", "Lavar e descontaminar", "Embalar", "Esterilizar", "Armazenar e distribuir"],
      outputs: ["Material esterilizado", "Rastreabilidade por lote", "Garantia de segurança"],
      customers: ["Centro Cirúrgico", "UTI", "Unidades assistenciais"],
    },
  },
  {
    id: 8, code: "PRO-CIR-001", name: "Cirurgia Segura (Checklist OMS)", sector: "Centro Cirúrgico",
    type: "Protocolo", status: "Em mapeamento", version: "1.5", responsible: "Coord. CC",
    onaRef: "4.1.3", lastReview: "Mar/2026", nextReview: "Set/2026",
    sipoc: {
      suppliers: ["Internação", "Anestesiologia", "Instrumentação"],
      inputs: ["Prontuário do paciente", "Checklist OMS", "Consentimento informado"],
      process: ["Sign In (pré-anestesia)", "Time Out (pré-incisão)", "Sign Out (pós-cirurgia)", "Registrar checklist", "Comunicar intercorrências"],
      outputs: ["Cirurgia documentada", "Evento adverso prevenido", "Checklist assinado"],
      customers: ["Paciente", "Equipe cirúrgica", "NSP / ONA"],
    },
  },
  {
    id: 9, code: "POP-TRI-001", name: "Triagem de Urgência — Manchester", sector: "Pronto-Socorro",
    type: "Protocolo", status: "Publicado", version: "4.2", responsible: "Enf. Urgência",
    onaRef: "3.2.1", lastReview: "Jan/2026", nextReview: "Jan/2027",
    sipoc: {
      suppliers: ["Recepção PS", "SAMU / Transferência"],
      inputs: ["Paciente", "Queixa principal", "Sinais vitais"],
      process: ["Acolher paciente", "Avaliar queixa", "Classificar cor", "Encaminhar para área", "Monitorar fila"],
      outputs: ["Paciente classificado", "Atendimento priorizado", "Registro de triagem"],
      customers: ["Paciente", "Médico PS", "Auditoria"],
    },
  },
  {
    id: 10, code: "POP-LAB-001", name: "Coleta de Exames Laboratoriais", sector: "Laboratório",
    type: "POP", status: "Publicado", version: "2.5", responsible: "Biomédico Resp.",
    onaRef: "5.3.1", lastReview: "Fev/2026", nextReview: "Fev/2027",
    sipoc: {
      suppliers: ["Médico solicitante", "Almoxarifado", "Enfermagem"],
      inputs: ["Pedido médico", "Tubos e agulhas", "Identificação do paciente"],
      process: ["Verificar pedido", "Identificar amostra", "Coletar material", "Processar/centrifugar", "Liberar resultado"],
      outputs: ["Resultado laboratorial", "Laudo assinado", "Registro no sistema"],
      customers: ["Médico", "Paciente", "UTI / Internação"],
    },
  },
  {
    id: 11, code: "POP-HD-001", name: "Sessão de Hemodiálise", sector: "Hemodiálise",
    type: "POP", status: "Em revisão", version: "3.1", responsible: "Enf. Nefrologia",
    onaRef: "5.4.1", lastReview: "Mar/2026", nextReview: "Set/2026",
    sipoc: {
      suppliers: ["Nefrologia", "Farmácia", "Engenharia"],
      inputs: ["Prescrição de diálise", "Máquina de HD", "Acesso vascular"],
      process: ["Preparar máquina", "Conectar acesso", "Monitorar sessão", "Desconectar e comprimir", "Registrar parâmetros"],
      outputs: ["Sessão realizada", "Parâmetros registrados", "Paciente estável"],
      customers: ["Paciente", "Médico nefrologista", "Auditoria"],
    },
  },
  {
    id: 12, code: "POP-IMG-001", name: "Realização de Exame de Imagem", sector: "Diagnóstico por Imagem",
    type: "POP", status: "Publicado", version: "1.9", responsible: "Coord. Imagem",
    onaRef: "5.5.1", lastReview: "Jan/2026", nextReview: "Jan/2027",
    sipoc: {
      suppliers: ["Médico solicitante", "Manutenção de equipamentos"],
      inputs: ["Pedido de exame", "Paciente identificado", "Equipamento calibrado"],
      process: ["Agendar exame", "Preparar paciente", "Executar exame", "Laudar", "Liberar resultado"],
      outputs: ["Laudo radiológico", "Imagens digitais", "Relatório entregue"],
      customers: ["Médico", "Paciente", "Internação"],
    },
  },
  {
    id: 13, code: "POP-MED-001", name: "Medicamentos Potencialmente Perigosos", sector: "Farmácia",
    type: "POP", status: "Em revisão", version: "2.0", responsible: "Farm. Responsável",
    onaRef: "4.1.3", lastReview: "Mar/2026", nextReview: "Set/2026",
    sipoc: {
      suppliers: ["Farmácia", "SCIH", "NSP"],
      inputs: ["Lista MPP ISMP", "Protocolos de segregação", "Equipe treinada"],
      process: ["Identificar MPPs", "Segregar com etiqueta", "Dupla checagem na dispensação", "Registro obrigatório", "Auditoria mensal"],
      outputs: ["MPPs identificados e seguros", "Erros prevenidos", "Conformidade ONA"],
      customers: ["Paciente", "NSP", "SCIH"],
    },
  },
  {
    id: 14, code: "POP-UTI-001", name: "Prevenção de IPCS em UTI", sector: "UTI",
    type: "Protocolo", status: "Publicado", version: "3.5", responsible: "Intensivista Chefe",
    onaRef: "4.2.3", lastReview: "Fev/2026", nextReview: "Fev/2027",
    sipoc: {
      suppliers: ["SCIH", "Farmácia", "Enfermagem"],
      inputs: ["Cateter venoso central", "Bundle IPCS", "EPIs"],
      process: ["Higienizar mãos", "Barreira máxima na inserção", "Clorexidina para antissepsia", "Curativo estéril", "Avaliação diária de retirada"],
      outputs: ["IPCS prevenida", "Taxa de infecção reduzida", "Conformidade bundle"],
      customers: ["Paciente UTI", "SCIH", "NSP"],
    },
  },
  {
    id: 15, code: "PRO-QUE-001", name: "Prevenção de Quedas", sector: "Internação",
    type: "Protocolo", status: "Publicado", version: "2.7", responsible: "NSP",
    onaRef: "4.3.1", lastReview: "Jan/2026", nextReview: "Jan/2027",
    sipoc: {
      suppliers: ["Triagem", "Fisioterapia", "Enfermagem"],
      inputs: ["Escala de Morse", "Leito com grades", "Pulseira de risco"],
      process: ["Avaliar risco na admissão", "Aplicar escala Morse", "Implementar medidas preventivas", "Orientar paciente/família", "Reavaliação diária"],
      outputs: ["Risco estratificado", "Queda prevenida", "Registro documentado"],
      customers: ["Paciente", "Família", "NSP"],
    },
  },
];

const sectors = [
  "Todas as Unidades", "Recepção", "Internação", "Pronto-Socorro",
  "Centro Cirúrgico", "UTI", "Farmácia", "CME", "Laboratório",
  "Hemodiálise", "Diagnóstico por Imagem", "SCIH", "NSP",
];

const statusConfig: Record<ProcessStatus, { label: string; color: string; dot: string }> = {
  "Publicado": { label: "Publicado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "Em revisão": { label: "Em Revisão", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  "Em mapeamento": { label: "Em Mapeamento", color: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  "Obsoleto": { label: "Obsoleto", color: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

const typeConfig: Record<ProcessType, string> = {
  "POP": "bg-blue-100 text-blue-700",
  "Protocolo": "bg-purple-100 text-purple-700",
  "Fluxo": "bg-indigo-100 text-indigo-700",
  "Instrução de Trabalho": "bg-teal-100 text-teal-700",
};

const sipocCols = [
  { key: "suppliers" as const, label: "S — Fornecedores", colClass: "bg-slate-50 border-slate-200", headerClass: "text-slate-400", tagClass: "bg-slate-100 text-slate-600 border-slate-200" },
  { key: "inputs" as const, label: "I — Entradas", colClass: "bg-sky-50 border-sky-200", headerClass: "text-sky-400", tagClass: "bg-sky-100 text-sky-700 border-sky-200" },
  { key: "process" as const, label: "P — Processo", colClass: "bg-blue-600 border-blue-600 text-white", headerClass: "text-blue-100", tagClass: "bg-blue-500 text-blue-100 border-blue-400" },
  { key: "outputs" as const, label: "O — Saídas", colClass: "bg-indigo-50 border-indigo-200", headerClass: "text-indigo-400", tagClass: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { key: "customers" as const, label: "C — Clientes", colClass: "bg-violet-50 border-violet-200", headerClass: "text-violet-400", tagClass: "bg-violet-100 text-violet-700 border-violet-200" },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProcessosPage() {
  const [, navigate] = useLocation();
  const { isAdmin } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("Todas as Unidades");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoProcesso, setNovoProcesso] = useState({ name: "", sector: "", type: "POP", responsible: "" });
  const [extraProcesses, setExtraProcesses] = useState<HospitalProcess[]>([]);

  // LGPD: mock data visível apenas para admin — usuário regular começa com lista vazia
  const baseMock: HospitalProcess[] = isAdmin ? processes : [];
  const allProcesses = [...baseMock, ...extraProcesses];
  const [selectedProcess, setSelectedProcess] = useState<HospitalProcess | null>(
    allProcesses.length > 0 ? allProcesses[0] : null
  );

  const filtered = allProcesses.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = filterSector === "Todas as Unidades" || p.sector === filterSector;
    const matchStatus = filterStatus === "Todos" || p.status === filterStatus;
    return matchSearch && matchSector && matchStatus;
  });

  const totalPublicados = allProcesses.filter((p) => p.status === "Publicado").length;
  const totalRevisao = allProcesses.filter((p) => p.status === "Em revisão").length;
  const totalMapeamento = allProcesses.filter((p) => p.status === "Em mapeamento").length;

  function saveNovoProcesso() {
    if (!novoProcesso.name || !novoProcesso.sector) {
      toast.error("Preencha nome e setor do processo");
      return;
    }
    const newId = allProcesses.length + 1;
    const prefix = novoProcesso.sector.toUpperCase().replace(/\s/g, "").slice(0, 3);
    const novo: HospitalProcess = {
      id: newId,
      code: `POP-${prefix}-${String(newId).padStart(3, "0")}`,
      name: novoProcesso.name,
      sector: novoProcesso.sector,
      type: novoProcesso.type as ProcessType,
      status: "Em mapeamento",
      version: "1.0",
      responsible: novoProcesso.responsible || "A definir",
      onaRef: "—",
      lastReview: "Mar/2026",
      nextReview: "Mar/2027",
      sipoc: {
        suppliers: ["A definir"],
        inputs: ["A definir"],
        process: ["Etapa 1", "Etapa 2", "Etapa 3"],
        outputs: ["A definir"],
        customers: ["A definir"],
      },
    };
    setExtraProcesses((prev) => [...prev, novo]);
    setNovoProcesso({ name: "", sector: "", type: "POP", responsible: "" });
    setShowNovoForm(false);
    toast.success(`Processo "${novo.name}" criado com sucesso!`);
  }

  const bySector = allProcesses.reduce<Record<string, HospitalProcess[]>>((acc, p) => {
    if (!acc[p.sector]) acc[p.sector] = [];
    acc[p.sector].push(p);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Processos</h1>
          </div>
          <p className="text-slate-500 text-sm">Mapeamento e governança de processos institucionais — POPs, Protocolos e Fluxos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => toast.info("Exportando lista de processos...")}>
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/kanban")}>
            <Layers className="w-3.5 h-3.5" />
            Ver Kanban
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0" onClick={() => setShowNovoForm((v) => !v)}>
            <Plus className="w-3.5 h-3.5" />
            Novo Processo
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de Processos", value: allProcesses.length, color: "text-slate-700", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" },
          { label: "Publicados", value: totalPublicados, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
          { label: "Em Revisão", value: totalRevisao, color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
          { label: "Em Mapeamento", value: totalMapeamento, color: "text-sky-700", bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800" },
        ].map((k) => (
          <Card key={k.label} className={cn("border", k.bg)}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className={cn("text-3xl font-bold", k.color)}>{k.value}</p>
              <p className="text-xs text-slate-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Novo Processo Form */}
      {showNovoForm && (
        <Card className="border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-300">Cadastrar Novo Processo</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nome do Processo *</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Ex.: Prevenção de Úlcera por Pressão"
                  value={novoProcesso.name}
                  onChange={(e) => setNovoProcesso((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Setor / Unidade *</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={novoProcesso.sector}
                  onChange={(e) => setNovoProcesso((p) => ({ ...p, sector: e.target.value }))}
                >
                  <option value="">Selecione...</option>
                  {sectors.filter((s) => s !== "Todas as Unidades").map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Tipo</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={novoProcesso.type}
                  onChange={(e) => setNovoProcesso((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="POP">POP</option>
                  <option value="Protocolo">Protocolo</option>
                  <option value="Fluxo">Fluxo</option>
                  <option value="Instrução de Trabalho">Instrução de Trabalho</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Responsável</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Nome do responsável"
                  value={novoProcesso.responsible}
                  onChange={(e) => setNovoProcesso((p) => ({ ...p, responsible: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowNovoForm(false)}>Cancelar</Button>
              <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={saveNovoProcesso}>Salvar Processo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lista">
        <TabsList className="h-9">
          <TabsTrigger value="lista" className="text-xs">Lista de Processos</TabsTrigger>
          <TabsTrigger value="setor" className="text-xs">Por Setor</TabsTrigger>
          <TabsTrigger value="sipoc" className="text-xs">SIPOC Visual</TabsTrigger>
        </TabsList>

        {/* ── TAB: Lista ── */}
        <TabsContent value="lista" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar processo, código, setor..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
            >
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Todos">Todos os Status</option>
              <option value="Publicado">Publicado</option>
              <option value="Em revisão">Em Revisão</option>
              <option value="Em mapeamento">Em Mapeamento</option>
              <option value="Obsoleto">Obsoleto</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            allProcesses.length === 0 ? (
              <EmptyState
                title="Nenhum processo cadastrado"
                description="Cadastre os processos da sua empresa para começar o mapeamento e análise SIPOC."
                actionLabel="Novo Processo"
                onAction={() => setShowNovoForm(true)}
                showLgpdNote={!isAdmin}
              />
            ) : (
              <Card className="border-dashed border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <FileText className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">Nenhum processo encontrado com os filtros selecionados</p>
                </CardContent>
              </Card>
            )
          ) : (
            <div className="space-y-3">
              {filtered.map((proc) => {
                const st = statusConfig[proc.status];
                return (
                  <Card
                    key={proc.id}
                    className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedProcess(proc)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono text-slate-400">{proc.code}</span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", typeConfig[proc.type])}>{proc.type}</Badge>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 flex items-center gap-1", st.color)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />{st.label}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{proc.name}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Building2 className="w-3 h-3" />{proc.sector}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Users className="w-3 h-3" />{proc.responsible}
                            </span>
                            <span className="text-xs text-slate-400">v{proc.version}</span>
                            <span className="text-xs text-slate-400">ONA {proc.onaRef}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400">Próx. revisão</p>
                            <p className="text-xs font-medium text-slate-600">{proc.nextReview}</p>
                          </div>
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={(e) => { e.stopPropagation(); setSelectedProcess(proc); toast.info(`Abrindo SIPOC: ${proc.name}`); }}
                          >
                            <Eye className="w-3 h-3" /> SIPOC
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: Por Setor ── */}
        <TabsContent value="setor" className="mt-4 space-y-4">
          {Object.entries(bySector).map(([sector, procs]) => {
            const publicados = procs.filter((p) => p.status === "Publicado").length;
            const pct = Math.round((publicados / procs.length) * 100);
            return (
              <Card key={sector} className="border border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      {sector}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{procs.length} processos</Badge>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        {publicados} publicados
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {procs.map((p) => {
                      const st = statusConfig[p.status];
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProcess(p); toast.info(`SIPOC: ${p.name}`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", st.dot)} />
                          {p.name}
                          <span className="text-slate-400 ml-1">v{p.version}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Publicados</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── TAB: SIPOC ── */}
        <TabsContent value="sipoc" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Selector */}
            <div className="xl:col-span-1">
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Selecionar Processo</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
                    {allProcesses.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProcess(p)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                          selectedProcess?.id === p.id
                            ? "bg-blue-600 text-white"
                            : "hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        <p className="font-medium truncate">{p.name}</p>
                        <p className={cn("text-[10px]", selectedProcess?.id === p.id ? "text-blue-200" : "text-slate-400")}>
                          {p.sector}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SIPOC Visual */}
            <div className="xl:col-span-3">
              {selectedProcess ? (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400 font-mono">{selectedProcess.code}</p>
                        <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">{selectedProcess.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className={cn("text-[10px]", typeConfig[selectedProcess.type])}>{selectedProcess.type}</Badge>
                          <Badge variant="outline" className={cn("text-[10px]", statusConfig[selectedProcess.status].color)}>{selectedProcess.status}</Badge>
                          <span className="text-[10px] text-slate-400">v{selectedProcess.version} • ONA {selectedProcess.onaRef}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.info("Exportando SIPOC como PDF...")}>
                          <Download className="w-3 h-3" /> PDF
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.success("Revisão iniciada! Processo movido para 'Em revisão'.")}>
                          Iniciar Revisão
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 overflow-x-auto">
                    <div className="grid grid-cols-5 gap-2 min-w-[640px]">
                      {sipocCols.map((col, i) => (
                        <div key={i} className={cn("rounded-xl border p-3", col.colClass)}>
                          <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", col.headerClass)}>{col.label}</p>
                          <div className="space-y-1.5">
                            {selectedProcess.sipoc[col.key].map((item, j) => (
                              <div key={j} className={cn("text-[11px] rounded-lg px-2 py-1.5 font-medium leading-snug border", col.tagClass)}>
                                {col.key === "process" && <span className="text-[9px] opacity-60 block mb-0.5">{j + 1}.</span>}
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Responsável: <strong className="text-slate-700 dark:text-slate-300">{selectedProcess.responsible}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Última revisão: <strong className="text-slate-700 dark:text-slate-300">{selectedProcess.lastReview}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5" /> Próx. revisão: <strong className="text-slate-700 dark:text-slate-300">{selectedProcess.nextReview}</strong>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-slate-200">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Workflow className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm">Selecione um processo para visualizar o SIPOC</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
