/**
 * auditoria-inteligente.tsx
 * Assistente de Auditoria em Saúde Inteligente — QHealth One 2026
 * Preenche automaticamente o questionário ONA com base nos dados do sistema.
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTenant } from "@/hooks/use-tenant";
import { useStore } from "@/lib/store";
import { printReport } from "@/lib/print-pdf";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Bot, Zap, CheckCircle2, AlertCircle, XCircle, MinusCircle,
  ChevronDown, ChevronRight, FileText, TrendingUp, TrendingDown,
  AlertTriangle, History, Download, RefreshCw, Pencil,
  Shield, Star, Info, Clock, User, CheckSquare, BarChart3,
} from "lucide-react";
import {
  type AuditEntry,
  type AuditSession,
  type AuditChangeLog,
  type Conformidade,
  runAuditIntelligence,
  calcularScores,
  gerarSumario,
  registrarAlteracaoManual,
  salvarSessaoAuditoria,
  carregarSessaoAuditoria,
  finalizarSessaoAuditoria,
  carregarHistoricoAuditoria,
  compararComHistorico,
} from "@/lib/audit-intelligence";

// ─── ONA Groups ───────────────────────────────────────────────────────────────

type ONALevel = "N1" | "N2" | "N3";

interface RequisitONA {
  codigo: string;
  descricao: string;
  nivel: ONALevel;
  isCore: boolean;
  orientacao: string;
}

interface GrupoONA {
  id: string;
  titulo: string;
  subsecao: string;
  requisitos: RequisitONA[];
}

const GRUPOS_ONA_2026: GrupoONA[] = [
  {
    id: "1.1.1", titulo: "Planejamento Estratégico", subsecao: "1.1 – Liderança Organizacional",
    requisitos: [
      { codigo: "1.1.1.1-N1", descricao: "Estabelecer a Estratégia Organizacional com missão, visão e valores formalizados", nivel: "N1", isCore: true, orientacao: "A organização deve definir e implantar um planejamento estratégico estruturado, alinhado às necessidades institucionais, cenários interno e externo e partes interessadas." },
      { codigo: "1.1.1.2-N2", descricao: "Plano estratégico com indicadores, metas e responsáveis definidos e monitorados", nivel: "N2", isCore: false, orientacao: "O planejamento deve conter indicadores estratégicos com metas e ser monitorado periodicamente pela liderança." },
      { codigo: "1.1.1.3-N3", descricao: "Ciclo de revisão do PE com aprendizado organizacional e envolvimento das partes interessadas", nivel: "N3", isCore: false, orientacao: "A organização demonstra aprendizado com os resultados do PE e integra feedbacks de pacientes, colaboradores e sociedade." },
    ],
  },
  {
    id: "1.1.2", titulo: "Diretrizes Estratégicas", subsecao: "1.1 – Liderança Organizacional",
    requisitos: [
      { codigo: "1.1.2.1-N1", descricao: "Estrutura organizacional documentada com definição de papéis e responsabilidades", nivel: "N1", isCore: true, orientacao: "A organização deve possuir organograma e regimento interno aprovados e divulgados." },
      { codigo: "1.1.2.2-N2", descricao: "Regimento interno com atribuições, rotinas e fluxos de decisão formalizados", nivel: "N2", isCore: false, orientacao: "O regimento deve ser revisado periodicamente e estar acessível a todos os colaboradores." },
      { codigo: "1.1.2.3-N3", descricao: "Integração e alinhamento da estrutura organizacional aos objetivos estratégicos", nivel: "N3", isCore: false, orientacao: "A estrutura organizacional é revisada à luz dos objetivos estratégicos e resultados institucionais." },
    ],
  },
  {
    id: "1.1.3", titulo: "Comprometimento da Alta Liderança", subsecao: "1.1 – Liderança Organizacional",
    requisitos: [
      { codigo: "1.1.3.1-N1", descricao: "Alta liderança comprometida com a melhoria contínua da qualidade e segurança", nivel: "N1", isCore: true, orientacao: "A liderança deve demonstrar comprometimento ativo com a cultura de qualidade e segurança do paciente." },
      { codigo: "1.1.3.2-N2", descricao: "Programas de engajamento da liderança com indicadores e metas de qualidade", nivel: "N2", isCore: false, orientacao: "A liderança participa ativamente de reuniões de análise crítica e tomadas de decisão baseadas em indicadores." },
      { codigo: "1.1.3.3-N3", descricao: "Alta liderança como referência de cultura de excelência no cuidado ao paciente", nivel: "N3", isCore: false, orientacao: "A liderança é reconhecida como modelo de cultura voltada ao paciente e à excelência operacional." },
    ],
  },
  {
    id: "1.2.1", titulo: "Dimensionamento e Qualificação de Pessoas", subsecao: "1.2 – Gestão de Pessoas",
    requisitos: [
      { codigo: "1.2.1.1-N1", descricao: "Dimensionamento de pessoal baseado em critérios técnicos e regulatórios", nivel: "N1", isCore: true, orientacao: "A organização deve possuir critérios documentados para dimensionamento de pessoal, respeitando normas regulatórias." },
      { codigo: "1.2.1.2-N2", descricao: "Programa de educação continuada implantado com cronograma e registros", nivel: "N2", isCore: false, orientacao: "A organização deve ter programa estruturado de treinamento com registros de participação e avaliação de eficácia." },
      { codigo: "1.2.1.3-N3", descricao: "Avaliação de competências e gestão por desempenho com impacto na qualidade do cuidado", nivel: "N3", isCore: false, orientacao: "A avaliação de desempenho é vinculada a resultados de qualidade e segurança do paciente." },
    ],
  },
  {
    id: "1.2.2", titulo: "Saúde Ocupacional", subsecao: "1.2 – Gestão de Pessoas",
    requisitos: [
      { codigo: "1.2.2.1-N1", descricao: "Programa de saúde do trabalhador (PCMSO e PGR) implementado e atualizado", nivel: "N1", isCore: true, orientacao: "A organização deve possuir PCMSO e PGR elaborados por profissional habilitado, com registros de execução." },
      { codigo: "1.2.2.2-N2", descricao: "Monitoramento de indicadores de saúde ocupacional com ações corretivas", nivel: "N2", isCore: false, orientacao: "A organização monitora taxas de absenteísmo, acidentes de trabalho e doenças ocupacionais com planos de melhoria." },
      { codigo: "1.2.2.3-N3", descricao: "Programas de bem-estar e qualidade de vida no trabalho com evidências de resultado", nivel: "N3", isCore: false, orientacao: "A organização implementa programas de qualidade de vida com indicadores de impacto mensuráveis." },
    ],
  },
  {
    id: "1.3.1", titulo: "Processo Assistencial", subsecao: "1.3 – Atenção ao Paciente",
    requisitos: [
      { codigo: "1.3.1.1-N1", descricao: "Fluxo de atendimento ao paciente documentado e amplamente conhecido pela equipe", nivel: "N1", isCore: true, orientacao: "Os processos assistenciais principais devem estar documentados, divulgados e acessíveis à equipe." },
      { codigo: "1.3.1.2-N2", descricao: "Protocolos clínicos baseados em evidências implantados e monitorados", nivel: "N2", isCore: false, orientacao: "Os protocolos clínicos devem ser baseados em evidências científicas, revisados periodicamente e com indicadores de adesão." },
      { codigo: "1.3.1.3-N3", descricao: "Integração dos processos assistenciais com gestão de leitos e fluxo hospitalar", nivel: "N3", isCore: false, orientacao: "A organização integra os processos assistenciais com indicadores de eficiência como tempo de permanência e taxa de ocupação." },
    ],
  },
  {
    id: "1.3.2", titulo: "Segurança do Paciente", subsecao: "1.3 – Atenção ao Paciente",
    requisitos: [
      { codigo: "1.3.2.1-N1", descricao: "Núcleo de Segurança do Paciente (NSP) constituído e em funcionamento (RDC 36/2013)", nivel: "N1", isCore: true, orientacao: "O NSP deve ser formalmente constituído com portaria, regimento e reuniões periódicas registradas." },
      { codigo: "1.3.2.2-N2", descricao: "Protocolos dos 6 metas internacionais de segurança do paciente implantados", nivel: "N2", isCore: false, orientacao: "A organização deve implementar os protocolos de identificação, comunicação, medicamento, cirurgia segura, quedas e LPP." },
      { codigo: "1.3.2.3-N3", descricao: "Cultura de segurança estabelecida com análise proativa de riscos e aprendizado", nivel: "N3", isCore: false, orientacao: "A organização promove cultura justa, realiza análise proativa de riscos (FMEA) e aprende com incidentes." },
    ],
  },
  {
    id: "1.3.3", titulo: "Assistência Farmacêutica", subsecao: "1.3 – Atenção ao Paciente",
    requisitos: [
      { codigo: "1.3.3.1-N1", descricao: "Farmácia com Responsável Técnico habilitado e processos regulatórios adequados", nivel: "N1", isCore: true, orientacao: "A farmácia deve possuir RT farmacêutico habilitado e cumprir requisitos da RDC ANVISA vigente." },
      { codigo: "1.3.3.2-N2", descricao: "Programa de farmácia clínica com conciliação medicamentosa e farmacovigilância", nivel: "N2", isCore: false, orientacao: "A organização implementa farmácia clínica com atividades de conciliação e monitoramento de reações adversas." },
      { codigo: "1.3.3.3-N3", descricao: "Gestão integrada do uso de medicamentos com análise de resultados clínicos", nivel: "N3", isCore: false, orientacao: "A farmácia clínica contribui para resultados assistenciais mensuráveis com indicadores de outcome." },
    ],
  },
  {
    id: "1.3.4", titulo: "Central de Material e Esterilização (CME)", subsecao: "1.3 – Atenção ao Paciente",
    requisitos: [
      { codigo: "1.3.4.1-N1", descricao: "CME com Responsável Técnico e processamento conforme RDC ANVISA 15/2012", nivel: "N1", isCore: true, orientacao: "A CME deve possuir RT de enfermagem habilitado e processar artigos conforme normas ANVISA vigentes." },
      { codigo: "1.3.4.2-N2", descricao: "Controle de qualidade do processamento com rastreabilidade e indicadores", nivel: "N2", isCore: false, orientacao: "A organização realiza controles biológicos, químicos e físicos dos processos de esterilização com registros." },
      { codigo: "1.3.4.3-N3", descricao: "CME integrada ao sistema de qualidade com benchmarking e melhoria contínua", nivel: "N3", isCore: false, orientacao: "A CME participa do sistema de gestão da qualidade com indicadores comparativos e planos de melhoria." },
    ],
  },
  {
    id: "1.4.1", titulo: "Gestão de Infraestrutura", subsecao: "1.4 – Infraestrutura e Apoio Técnico",
    requisitos: [
      { codigo: "1.4.1.1-N1", descricao: "Infraestrutura física adequada e em conformidade com normas regulatórias", nivel: "N1", isCore: true, orientacao: "A organização deve manter suas instalações em conformidade com RDC ANVISA 50/2002 e normas vigentes." },
      { codigo: "1.4.1.2-N2", descricao: "Programa de manutenção preventiva de equipamentos e instalações com registros", nivel: "N2", isCore: false, orientacao: "A organização deve possuir plano de manutenção preventiva com cronograma, registros de execução e indicadores." },
      { codigo: "1.4.1.3-N3", descricao: "Planejamento de infraestrutura alinhado ao crescimento e estratégia institucional", nivel: "N3", isCore: false, orientacao: "A organização planeja investimentos em infraestrutura alinhados ao planejamento estratégico com projeções de capacidade." },
    ],
  },
  {
    id: "1.4.2", titulo: "Controle de Infecções Relacionadas à Assistência (IRAS)", subsecao: "1.4 – Infraestrutura e Apoio Técnico",
    requisitos: [
      { codigo: "1.4.2.1-N1", descricao: "SCIH constituída e em funcionamento com PPCI implantado (Portaria MS 2616/1998)", nivel: "N1", isCore: true, orientacao: "A organização deve possuir SCIH formalmente constituída com PPCI implantado e reuniões periódicas documentadas." },
      { codigo: "1.4.2.2-N2", descricao: "Monitoramento de IRAS com taxas comparadas a benchmarks nacionais e planos de melhoria", nivel: "N2", isCore: false, orientacao: "A organização monitora taxas de IRAS e compara com benchmarks, implementando bundles de prevenção com comprovada eficácia." },
      { codigo: "1.4.2.3-N3", descricao: "Programa de prevenção de IRAS integrado à cultura de segurança com resultados mensuráveis", nivel: "N3", isCore: false, orientacao: "A organização demonstra redução sustentada de IRAS com evidências de resultados e publicação de casos de melhoria." },
    ],
  },
  {
    id: "1.4.3", titulo: "Gestão de Documentos e Informações", subsecao: "1.4 – Infraestrutura e Apoio Técnico",
    requisitos: [
      { codigo: "1.4.3.1-N1", descricao: "Sistema de gestão documental com controle de versões, aprovações e distribuição", nivel: "N1", isCore: true, orientacao: "A organização deve possuir política de gestão de documentos com controle de versão, aprovação e distribuição controlada." },
      { codigo: "1.4.3.2-N2", descricao: "POPs críticos atualizados, disponíveis nos pontos de uso e com registros de treinamento", nivel: "N2", isCore: false, orientacao: "Os POPs devem estar acessíveis, atualizados com periodicidade definida e equipes treinadas com registro." },
      { codigo: "1.4.3.3-N3", descricao: "Gestão do conhecimento integrada com aprendizado organizacional e inovação", nivel: "N3", isCore: false, orientacao: "A organização usa a gestão documental como ferramenta de aprendizado e disseminação de boas práticas." },
    ],
  },
  {
    id: "1.4.4", titulo: "Indicadores e Resultados", subsecao: "1.4 – Infraestrutura e Apoio Técnico",
    requisitos: [
      { codigo: "1.4.4.1-N1", descricao: "Conjunto de indicadores de qualidade e segurança implantados e monitorados", nivel: "N1", isCore: true, orientacao: "A organização deve possuir painel de indicadores com metas, responsáveis e periodicidade de análise definidos." },
      { codigo: "1.4.4.2-N2", descricao: "Indicadores comparados com benchmarks nacionais e internacionais com análise de tendência", nivel: "N2", isCore: false, orientacao: "A organização realiza benchmarking externo e análise de tendências de seus indicadores estratégicos." },
      { codigo: "1.4.4.3-N3", descricao: "Resultados dos indicadores integrados à tomada de decisão estratégica e operacional", nivel: "N3", isCore: false, orientacao: "Os resultados de indicadores são usados para tomada de decisão em todos os níveis gerenciais com impacto mensurado." },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONFORMIDADE_CONFIG: Record<
  NonNullable<Conformidade>,
  { label: string; textColor: string; bgClass: string; icon: React.ReactNode }
> = {
  "Conforme Total":  { label: "Conforme Total",  textColor: "text-emerald-700", bgClass: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  "Conforme Parcial":{ label: "Conforme Parcial", textColor: "text-amber-700",   bgClass: "bg-amber-50 border-amber-200 text-amber-700",     icon: <AlertCircle  className="w-4 h-4 text-amber-500" /> },
  "Não Conforme":    { label: "Não Conforme",     textColor: "text-rose-700",    bgClass: "bg-rose-50 border-rose-200 text-rose-700",        icon: <XCircle      className="w-4 h-4 text-rose-500" /> },
  "Não Aplicável":   { label: "Não Aplicável",    textColor: "text-slate-500",   bgClass: "bg-slate-100 border-slate-200 text-slate-500",    icon: <MinusCircle  className="w-4 h-4 text-slate-400" /> },
  "":                { label: "Não avaliado",     textColor: "text-slate-400",   bgClass: "bg-slate-50 border-slate-200 text-slate-400",     icon: <MinusCircle  className="w-4 h-4 text-slate-300" /> },
};

const NIVEL_BADGE: Record<ONALevel, { label: string; className: string }> = {
  N1: { label: "N1", className: "bg-sky-100 text-sky-700 border-sky-200" },
  N2: { label: "N2", className: "bg-violet-100 text-violet-700 border-violet-200" },
  N3: { label: "N3", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

const SOURCE_LABELS: Record<string, string> = {
  indicadores: "Indicadores",
  riscos: "Matriz de Riscos",
  politicas: "Documentos/Políticas",
  capas: "Planos de Ação",
  gut: "Matriz GUT",
  avaliacao_inicial: "Avaliação Inicial",
  historico: "Histórico",
  manual: "Revisão Manual",
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8">{value}%</span>
    </div>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

interface EditDialogProps {
  open: boolean;
  entry: AuditEntry | null;
  requisito: RequisitONA | null;
  onSave: (conformidade: Conformidade, observacao: string, motivo: string) => void;
  onClose: () => void;
}

function EditDialog({ open, entry, requisito, onSave, onClose }: EditDialogProps) {
  const [conformidade, setConformidade] = useState<Conformidade>(entry?.conformidade ?? "");
  const [observacao, setObservacao] = useState(entry?.observacao ?? "");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open && entry) {
      setConformidade(entry.conformidade);
      setObservacao(entry.observacao);
      setMotivo("");
    }
  }, [open, entry]);

  const handleSave = () => {
    if (!motivo.trim()) {
      toast.error("Informe o motivo da alteração para manter a rastreabilidade");
      return;
    }
    onSave(conformidade, observacao, motivo);
    onClose();
  };

  if (!requisito) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-white border-slate-200 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Pencil className="w-4 h-4 text-sky-600" />
            Revisão Manual — {requisito.codigo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700 leading-relaxed">{requisito.descricao}</p>
          </div>

          {entry?.autoFilled && entry.confidence > 0 && (
            <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg">
              <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-sky-700 font-medium">Preenchido automaticamente pelo sistema</p>
                <p className="text-xs text-sky-600 mt-0.5">Fonte: {SOURCE_LABELS[entry.source]} · Confiança: {entry.confidence}%</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Conformidade</label>
            <Select value={conformidade} onValueChange={v => setConformidade(v as Conformidade)}>
              <SelectTrigger className="bg-white border-slate-300 text-slate-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                {(["Conforme Total", "Conforme Parcial", "Não Conforme", "Não Aplicável"] as Conformidade[]).map(c => (
                  <SelectItem key={c} value={c} className="text-slate-700">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Observação / Evidência</label>
            <Textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Descreva as evidências encontradas..."
              className="bg-white border-slate-300 text-slate-700 placeholder:text-slate-400 resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
              Motivo da alteração <span className="text-rose-500">*</span>
            </label>
            <Input
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: Documento revisado em visita técnica de 15/03/2026..."
              className="bg-white border-slate-300 text-slate-700 placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">Obrigatório para rastreabilidade da auditoria.</p>
          </div>

          {entry?.suggestion && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">{entry.suggestion}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-600">Cancelar</Button>
          <Button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 text-white">
            <CheckSquare className="w-4 h-4 mr-2" />
            Salvar Revisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditoriaInteligente() {
  const { validatedData, companyName } = useTenant();
  const { currentUser } = useStore();

  const [entries, setEntries] = useState<Record<string, AuditEntry>>({});
  const [changelog, setChangelog] = useState<AuditChangeLog[]>([]);
  const [sessionId] = useState(() => `audit_${Date.now()}`);
  const [startedAt] = useState(() => new Date().toISOString());
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("questionario");
  const [filterNivel, setFilterNivel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editDialog, setEditDialog] = useState<{ open: boolean; codigo: string | null }>({ open: false, codigo: null });
  const [history, setHistory] = useState<AuditSession[]>([]);

  useEffect(() => {
    setHistory(carregarHistoricoAuditoria());
    const existing = carregarSessaoAuditoria();
    if (existing) {
      setEntries(existing.entries);
      setChangelog(existing.changelog);
      setHasRun(true);
      toast.info("Sessão de auditoria anterior restaurada");
    }
  }, []);

  useEffect(() => {
    if (!hasRun) return;
    const session: AuditSession = {
      sessionId,
      startedAt,
      userId: currentUser?.email ?? "usuario",
      unitId: currentUser?.unit ?? undefined,
      entries,
      changelog,
      summary: gerarSumario(GRUPOS_ONA_2026, entries),
    };
    salvarSessaoAuditoria(session);
  }, [entries, changelog, hasRun, sessionId, startedAt, currentUser]);

  const handleRunIntelligence = useCallback(() => {
    if (!validatedData) {
      toast.error("Nenhum dado validado encontrado. Complete a Avaliação Inicial ONA primeiro.");
      return;
    }
    setIsRunning(true);
    setTimeout(() => {
      const result = runAuditIntelligence(GRUPOS_ONA_2026, validatedData, currentUser?.email ?? "sistema");
      setEntries(result);
      setHasRun(true);
      setIsRunning(false);
      setExpandedGroups(new Set(GRUPOS_ONA_2026.map(g => g.id)));
      const summary = gerarSumario(GRUPOS_ONA_2026, result);
      toast.success(`Auditoria automática concluída! ${summary.autoPreenchidos} requisitos preenchidos automaticamente.`);
    }, 800);
  }, [validatedData, currentUser]);

  const handleSaveEdit = (conformidade: Conformidade, observacao: string, motivo: string) => {
    if (!editDialog.codigo) return;
    const { entries: newEntries, changelog: newChangelog } = registrarAlteracaoManual(
      entries, changelog, editDialog.codigo, conformidade, observacao,
      currentUser?.email ?? "usuario", motivo
    );
    setEntries(newEntries);
    setChangelog(newChangelog);
    toast.success("Revisão registrada com rastreabilidade");
  };

  const handleFinalize = () => {
    const session: AuditSession = {
      sessionId, startedAt,
      completedAt: new Date().toISOString(),
      userId: currentUser?.email ?? "usuario",
      unitId: currentUser?.unit ?? undefined,
      entries, changelog,
      summary: gerarSumario(GRUPOS_ONA_2026, entries),
    };
    finalizarSessaoAuditoria(session);
    setHistory(carregarHistoricoAuditoria());
    setHasRun(false);
    setEntries({});
    setChangelog([]);
    toast.success("Auditoria finalizada e arquivada no histórico!");
  };

  const handleExportPDF = () => {
    const summary = gerarSumario(GRUPOS_ONA_2026, entries);
    const naoConformes = GRUPOS_ONA_2026.flatMap(g =>
      g.requisitos.filter(r => {
        const e = entries[r.codigo];
        return e?.conformidade === "Não Conforme" || e?.conformidade === "Conforme Parcial";
      }).map(r => ({ ...r, entry: entries[r.codigo] }))
    );
    printReport({
      title: "Relatório de Auditoria Inteligente ONA 2026",
      subtitle: `${companyName} | Gerado em ${formatDateTime(new Date().toISOString())} | Score N1: ${summary.scoreN1}% | N2: ${summary.scoreN2}% | N3: ${summary.scoreN3}%`,
      kpis: [
        { label: "Score N1", value: `${summary.scoreN1}%`, color: summary.scoreN1 >= 80 ? "#10b981" : summary.scoreN1 >= 60 ? "#f59e0b" : "#ef4444" },
        { label: "Score N2", value: `${summary.scoreN2}%`, color: summary.scoreN2 >= 80 ? "#10b981" : summary.scoreN2 >= 60 ? "#f59e0b" : "#ef4444" },
        { label: "Score N3", value: `${summary.scoreN3}%`, color: summary.scoreN3 >= 80 ? "#10b981" : summary.scoreN3 >= 60 ? "#f59e0b" : "#ef4444" },
        { label: "Auto-preenchidos", value: String(summary.autoPreenchidos), color: "#0ea5e9" },
        { label: "Revisados", value: String(summary.revisadosManuais), color: "#8b5cf6" },
        { label: "Não Conformes", value: String(summary.naoConforme), color: "#ef4444" },
      ],
      columns: [
        { label: "Código", key: "codigo" },
        { label: "Descrição", key: "descricao" },
        { label: "Nível", key: "nivel" },
        { label: "Conformidade", key: "conformidade" },
        { label: "Fonte", key: "fonte" },
        { label: "Confiança", key: "confianca" },
        { label: "Observação", key: "observacao" },
      ],
      rows: naoConformes.map(r => ({
        codigo: r.codigo, descricao: r.descricao, nivel: r.nivel,
        conformidade: r.entry?.conformidade ?? "",
        fonte: SOURCE_LABELS[r.entry?.source ?? ""] ?? r.entry?.source ?? "",
        confianca: r.entry ? `${r.entry.confidence}%` : "",
        observacao: r.entry?.observacao ?? "",
      })),
    });
  };

  const summary = gerarSumario(GRUPOS_ONA_2026, entries);
  const scores = calcularScores(GRUPOS_ONA_2026, entries);

  const editingRequisito = editDialog.codigo
    ? GRUPOS_ONA_2026.flatMap(g => g.requisitos).find(r => r.codigo === editDialog.codigo) ?? null : null;
  const editingEntry = editDialog.codigo ? entries[editDialog.codigo] ?? null : null;

  const gruposFiltrados = GRUPOS_ONA_2026.map(grupo => ({
    ...grupo,
    requisitos: grupo.requisitos.filter(req => {
      if (filterNivel !== "all" && req.nivel !== filterNivel) return false;
      if (filterStatus !== "all") {
        const e = entries[req.codigo];
        const c = e?.conformidade ?? "";
        if (filterStatus === "auto" && !e?.autoFilled) return false;
        if (filterStatus === "manual" && (e?.autoFilled !== false || !e?.changedAt)) return false;
        if (filterStatus === "pending" && c !== "") return false;
        if (filterStatus === "conforme" && c !== "Conforme Total") return false;
        if (filterStatus === "naoconforme" && c !== "Não Conforme") return false;
        if (filterStatus === "parcial" && c !== "Conforme Parcial") return false;
      }
      return true;
    }),
  })).filter(g => g.requisitos.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shadow">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Assistente de Auditoria Inteligente</h1>
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">IA</Badge>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Preenche automaticamente o questionário ONA 2026 com base nos dados do sistema — com rastreabilidade completa.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasRun && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 gap-2">
                    <Download className="w-4 h-4" /> Exportar PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleFinalize}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2">
                    <CheckSquare className="w-4 h-4" /> Finalizar Auditoria
                  </Button>
                </>
              )}
              <Button onClick={handleRunIntelligence} disabled={isRunning || !validatedData}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                {isRunning ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</>
                ) : hasRun ? (
                  <><RefreshCw className="w-4 h-4" /> Re-analisar</>
                ) : (
                  <><Zap className="w-4 h-4" /> Iniciar Auditoria IA</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">
        {/* No data warning */}
        {!validatedData && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="flex items-start gap-3 pt-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Dados insuficientes para análise automática</p>
                <p className="text-xs text-amber-700 mt-1">
                  Complete a <strong>Avaliação Inicial ONA</strong> e solicite a validação ao administrador para habilitar o preenchimento automático.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Cards */}
        {hasRun && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Score N1", value: `${scores.n1}%`, ok: scores.n1 >= 80, warn: scores.n1 >= 60 },
              { label: "Score N2", value: `${scores.n2}%`, ok: scores.n2 >= 80, warn: scores.n2 >= 60 },
              { label: "Score N3", value: `${scores.n3}%`, ok: scores.n3 >= 80, warn: scores.n3 >= 60 },
              { label: "Auto-preenchidos", value: String(summary.autoPreenchidos), ok: true, warn: false },
              { label: "Revisados", value: String(summary.revisadosManuais), ok: true, warn: false },
              { label: "Não Conformes", value: String(summary.naoConforme), ok: summary.naoConforme === 0, warn: false },
            ].map(kpi => (
              <Card key={kpi.label} className={cn(
                "border shadow-sm",
                kpi.ok ? "bg-emerald-50 border-emerald-200" :
                kpi.warn ? "bg-amber-50 border-amber-200" :
                "bg-rose-50 border-rose-200"
              )}>
                <CardContent className="pt-3 pb-3 px-4">
                  <p className="text-xs text-slate-500 mb-0.5">{kpi.label}</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    kpi.ok ? "text-emerald-700" : kpi.warn ? "text-amber-700" : "text-rose-700"
                  )}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 rounded-lg p-1 gap-1 h-auto">
            <TabsTrigger value="questionario" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2 gap-1.5">
              <FileText className="w-4 h-4" /> Questionário
            </TabsTrigger>
            <TabsTrigger value="sumario" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2 gap-1.5">
              <BarChart3 className="w-4 h-4" /> Sumário
            </TabsTrigger>
            <TabsTrigger value="rastreabilidade" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2 gap-1.5">
              <Shield className="w-4 h-4" /> Rastreabilidade
              {changelog.length > 0 && (
                <Badge className="ml-1 bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5">{changelog.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-600 text-sm rounded-md px-4 py-2 gap-1.5">
              <History className="w-4 h-4" /> Histórico
              {history.length > 0 && (
                <Badge className="ml-1 bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-1.5">{history.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab: Questionário ─── */}
          <TabsContent value="questionario" className="mt-4 space-y-3">
            {/* Filters */}
            {hasRun && (
              <div className="flex flex-wrap gap-2">
                <Select value={filterNivel} onValueChange={setFilterNivel}>
                  <SelectTrigger className="w-36 h-8 bg-white border-slate-300 text-slate-700 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-slate-700 text-xs">Todos os níveis</SelectItem>
                    <SelectItem value="N1" className="text-slate-700 text-xs">N1 somente</SelectItem>
                    <SelectItem value="N2" className="text-slate-700 text-xs">N2 somente</SelectItem>
                    <SelectItem value="N3" className="text-slate-700 text-xs">N3 somente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 h-8 bg-white border-slate-300 text-slate-700 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="all" className="text-slate-700 text-xs">Todos os status</SelectItem>
                    <SelectItem value="auto" className="text-slate-700 text-xs">Auto-preenchidos</SelectItem>
                    <SelectItem value="manual" className="text-slate-700 text-xs">Revisados manualmente</SelectItem>
                    <SelectItem value="pending" className="text-slate-700 text-xs">Sem resposta</SelectItem>
                    <SelectItem value="conforme" className="text-slate-700 text-xs">Conformes Total</SelectItem>
                    <SelectItem value="parcial" className="text-slate-700 text-xs">Conformes Parcial</SelectItem>
                    <SelectItem value="naoconforme" className="text-slate-700 text-xs">Não Conformes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Empty state */}
            {!hasRun && (
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-violet-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-800 font-semibold mb-1">Assistente pronto para iniciar</p>
                    <p className="text-sm text-slate-500 max-w-md">
                      Clique em <strong className="text-violet-700">Iniciar Auditoria IA</strong> para percorrer todos os requisitos ONA 2026,
                      preencher automaticamente com base nos dados do sistema e gerar recomendações.
                    </p>
                  </div>
                  <Button onClick={handleRunIntelligence} disabled={!validatedData || isRunning}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                    <Zap className="w-4 h-4" /> Iniciar Auditoria IA
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Groups */}
            {gruposFiltrados.map(grupo => {
              const isExpanded = expandedGroups.has(grupo.id);
              const groupEntries = grupo.requisitos.map(r => entries[r.codigo]).filter(Boolean);
              const conforme = groupEntries.filter(e => e.conformidade === "Conforme Total").length;
              const total = grupo.requisitos.length;
              const pct = total > 0 ? Math.round((conforme / total) * 100) : 0;

              return (
                <Card key={grupo.id} className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedGroups(prev => {
                      const n = new Set(prev);
                      n.has(grupo.id) ? n.delete(grupo.id) : n.add(grupo.id);
                      return n;
                    })}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{grupo.id}</span>
                          <span className="font-semibold text-slate-800">{grupo.titulo}</span>
                        </div>
                        <span className="text-xs text-slate-500">{grupo.subsecao}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      {hasRun && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-400")} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{pct}%</span>
                        </div>
                      )}
                      <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">{total} req.</Badge>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                      {grupo.requisitos.map(req => {
                        const entry = entries[req.codigo];
                        const cfg = CONFORMIDADE_CONFIG[entry?.conformidade ?? ""];
                        const nivelCfg = NIVEL_BADGE[req.nivel];
                        const trend = hasRun ? compararComHistorico(req.codigo, entry?.conformidade ?? "", history) : null;

                        return (
                          <div key={req.codigo} className={cn(
                            "px-5 py-4 hover:bg-slate-50/80 transition-colors",
                            entry?.autoFilled && entry.conformidade !== "" && "border-l-4 border-sky-400",
                            !entry?.autoFilled && entry?.changedAt && "border-l-4 border-violet-400",
                          )}>
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-0.5">{cfg.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{req.codigo}</span>
                                  <Badge className={cn("text-[10px] px-1.5 border font-semibold", nivelCfg.className)}>{nivelCfg.label}</Badge>
                                  {req.isCore && <Badge className="text-[10px] px-1.5 bg-rose-100 text-rose-700 border-rose-200 font-semibold">Core</Badge>}
                                  {entry?.autoFilled && entry.conformidade !== "" && (
                                    <Badge className="text-[10px] px-1.5 bg-sky-100 text-sky-700 border-sky-200">
                                      <Bot className="w-2.5 h-2.5 mr-1" /> IA · {SOURCE_LABELS[entry.source]}
                                    </Badge>
                                  )}
                                  {!entry?.autoFilled && entry?.changedAt && (
                                    <Badge className="text-[10px] px-1.5 bg-violet-100 text-violet-700 border-violet-200">
                                      <User className="w-2.5 h-2.5 mr-1" /> Manual
                                    </Badge>
                                  )}
                                  {trend?.trend === "melhora" && (
                                    <Badge className="text-[10px] px-1.5 bg-emerald-100 text-emerald-700 border-emerald-200">
                                      <TrendingUp className="w-2.5 h-2.5 mr-1" /> Melhora
                                    </Badge>
                                  )}
                                  {trend?.trend === "regresso" && (
                                    <Badge className="text-[10px] px-1.5 bg-rose-100 text-rose-700 border-rose-200">
                                      <TrendingDown className="w-2.5 h-2.5 mr-1" /> Regresso
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-sm text-slate-700 leading-relaxed mb-2">{req.descricao}</p>

                                {entry?.conformidade && (
                                  <div className={cn("text-xs px-3 py-2 rounded border mb-2 font-medium", cfg.bgClass)}>
                                    {cfg.label}
                                    {entry.observacao && <span className="ml-2 font-normal text-slate-600">— {entry.observacao}</span>}
                                  </div>
                                )}

                                {entry?.autoFilled && entry.confidence > 0 && (
                                  <div className="flex items-center gap-4 mb-2">
                                    <div className="flex-1 max-w-48">
                                      <p className="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">Confiança automática</p>
                                      <ConfidenceBar value={entry.confidence} />
                                    </div>
                                    {entry.changedAt && (
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <Clock className="w-3 h-3" /> {formatDateTime(entry.changedAt)}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {entry?.alert && (
                                  <div className="flex items-start gap-2 p-2 bg-rose-50 border border-rose-200 rounded mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-rose-700">{entry.alert}</p>
                                  </div>
                                )}

                                {entry?.suggestion && entry.conformidade !== "Conforme Total" && (
                                  <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded mb-2">
                                    <Star className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-700">{entry.suggestion}</p>
                                  </div>
                                )}

                                {entry?.changeReason && (
                                  <div className="flex items-start gap-2 p-2 bg-violet-50 border border-violet-200 rounded">
                                    <Info className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-xs text-violet-700 font-medium">Motivo: {entry.changeReason}</p>
                                      <p className="text-[10px] text-violet-500 mt-0.5">Por {entry.changedBy} em {entry.changedAt ? formatDateTime(entry.changedAt) : ""}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {hasRun && (
                                <Button variant="ghost" size="sm"
                                  onClick={() => setEditDialog({ open: true, codigo: req.codigo })}
                                  className="shrink-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* ─── Tab: Sumário ─── */}
          <TabsContent value="sumario" className="mt-4 space-y-4">
            {!hasRun ? (
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center text-slate-400 text-sm">
                  Execute a auditoria para visualizar o sumário.
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { nivel: "N1", score: scores.n1, desc: "Requisitos básicos — exigidos para acreditação nível 1" },
                    { nivel: "N2", score: scores.n2, desc: "Requisitos plenos — exigidos para acreditação nível 2" },
                    { nivel: "N3", score: scores.n3, desc: "Requisitos de excelência — exigidos para acreditação nível 3" },
                  ].map(({ nivel, score, desc }) => {
                    const ok = score >= 80; const warn = score >= 60;
                    return (
                      <Card key={nivel} className={cn("border shadow-sm", ok ? "bg-emerald-50 border-emerald-200" : warn ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200")}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-700">Nível {nivel}</span>
                            <span className={cn("text-2xl font-bold", ok ? "text-emerald-700" : warn ? "text-amber-700" : "text-rose-700")}>{score}%</span>
                          </div>
                          <Progress value={score} className="h-2 mb-2" />
                          <p className="text-xs text-slate-500">{desc}</p>
                          <Badge className={cn("mt-2 text-[10px]", ok ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200")}>
                            {ok ? `Pronto para ${nivel}` : "Requer atenção"}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card className="bg-white border border-slate-200 shadow-sm">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-slate-800">Distribuição de Conformidade</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Conforme Total",  value: summary.conformeTotal,  color: "bg-emerald-500", textColor: "text-emerald-700" },
                        { label: "Conforme Parcial",value: summary.conformeParcial, color: "bg-amber-500",   textColor: "text-amber-700" },
                        { label: "Não Conforme",    value: summary.naoConforme,    color: "bg-rose-500",    textColor: "text-rose-700" },
                        { label: "Não Aplicável",   value: summary.naoAplicavel,   color: "bg-slate-400",   textColor: "text-slate-500" },
                        { label: "Sem resposta",    value: summary.semResposta,    color: "bg-slate-200",   textColor: "text-slate-400" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-32 shrink-0">{item.label}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", item.color)}
                              style={{ width: `${summary.totalRequisitos > 0 ? (item.value / summary.totalRequisitos) * 100 : 0}%` }} />
                          </div>
                          <span className={cn("text-sm font-bold w-8 text-right", item.textColor)}>{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border border-slate-200 shadow-sm">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-slate-800">Origem dos Preenchimentos</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { label: "Preenchidos automaticamente", value: summary.autoPreenchidos, icon: <Bot className="w-4 h-4 text-sky-600" />, color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
                        { label: "Revisados manualmente",       value: summary.revisadosManuais, icon: <User className="w-4 h-4 text-violet-600" />, color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
                        { label: "Sem resposta",                value: summary.semResposta,      icon: <MinusCircle className="w-4 h-4 text-slate-400" />, color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
                      ].map(item => (
                        <div key={item.label} className={cn("flex items-center justify-between p-3 rounded-lg border", item.bg)}>
                          <div className="flex items-center gap-2">{item.icon}<span className="text-xs text-slate-700 font-medium">{item.label}</span></div>
                          <span className={cn("text-xl font-bold", item.color)}>{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {summary.alertas.length > 0 && (
                  <Card className="bg-rose-50 border-rose-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-rose-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Alertas Críticos ({summary.alertas.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {summary.alertas.map((a, i) => (
                        <p key={i} className="text-xs text-rose-700 p-2 bg-white rounded border border-rose-200">{a}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {summary.sugestoes.length > 0 && (
                  <Card className="bg-amber-50 border-amber-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                        <Star className="w-4 h-4" /> Principais Recomendações de Melhoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {summary.sugestoes.map((s, i) => (
                        <p key={i} className="text-xs text-amber-700 p-2 bg-white rounded border border-amber-200">{s}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ─── Tab: Rastreabilidade ─── */}
          <TabsContent value="rastreabilidade" className="mt-4">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm text-slate-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-violet-600" /> Log de Alterações Manuais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {changelog.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">
                    Nenhuma alteração manual registrada. Todas as respostas são automáticas.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...changelog].reverse().map((log, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5">{log.codigo}</span>
                            <div className="flex items-center gap-1">
                              <span className={cn("text-xs", CONFORMIDADE_CONFIG[log.previousConformidade].textColor)}>
                                {CONFORMIDADE_CONFIG[log.previousConformidade].label || "Sem resposta"}
                              </span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                              <span className={cn("text-xs font-semibold", CONFORMIDADE_CONFIG[log.newConformidade].textColor)}>
                                {CONFORMIDADE_CONFIG[log.newConformidade].label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                            <Clock className="w-3 h-3" /> {formatDateTime(log.changedAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <User className="w-3 h-3 text-violet-500" />
                          <span className="font-medium">{log.changedBy}</span>
                          <span className="text-slate-400">·</span>
                          <span className="italic text-slate-500">{log.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab: Histórico ─── */}
          <TabsContent value="historico" className="mt-4 space-y-4">
            {history.length === 0 ? (
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center text-slate-400 text-sm">
                  Nenhuma auditoria finalizada ainda. Complete e finalize uma auditoria para ver o histórico comparativo.
                </CardContent>
              </Card>
            ) : (
              history.map((session, i) => (
                <Card key={session.sessionId} className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-800">Auditoria #{history.length - i}</span>
                          {i === 0 && <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[10px]">Mais recente</Badge>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {session.completedAt ? formatDateTime(session.completedAt) : formatDateTime(session.startedAt)} · {session.userId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">N1 / N2 / N3</p>
                        <p className="text-sm font-bold text-slate-700">
                          {session.summary.scoreN1}% / {session.summary.scoreN2}% / {session.summary.scoreN3}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Conformes",  value: session.summary.conformeTotal,  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                        { label: "Parciais",   value: session.summary.conformeParcial, color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
                        { label: "Não Conf.",  value: session.summary.naoConforme,    color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
                      ].map(stat => (
                        <div key={stat.label} className={cn("rounded-lg p-2 border", stat.bg)}>
                          <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                          <p className="text-[10px] text-slate-500">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EditDialog
        open={editDialog.open}
        entry={editingEntry}
        requisito={editingRequisito}
        onSave={handleSaveEdit}
        onClose={() => setEditDialog({ open: false, codigo: null })}
      />
    </div>
  );
}
