import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { mapAssessmentToSystemData, VALIDATED_DATA_KEY } from "@/lib/assessment-mapper";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck, ChevronRight, ChevronDown, CheckCircle2,
  AlertTriangle, XCircle, MinusCircle, Award, Building2,
  FileText, Users, Shield, Activity, Stethoscope, Pill,
  GraduationCap, Wrench, BarChart3, Star, Printer, Lock,
  ArrowRight, RefreshCw, Info, Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Answer = "sim" | "parcial" | "nao" | "na" | null;
type ONALevel = "N1" | "N2" | "N3";

interface Question {
  id: string;
  text: string;
  level: ONALevel;
  weight: number; // 1=normal, 2=crítico, 3=mandatório
  help?: string;
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  questions: Question[];
}

// ── ONA 2026 Questionnaire ─────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "gov",
    title: "Governança e Liderança",
    subtitle: "Estrutura organizacional, missão, visão e valores",
    icon: <Building2 className="w-5 h-5" />,
    color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200",
    questions: [
      { id: "gov1", text: "A instituição possui Missão, Visão e Valores formalizados e divulgados?", level: "N1", weight: 2 },
      { id: "gov2", text: "Existe estrutura organizacional (organograma) atualizada e aprovada pela direção?", level: "N1", weight: 2 },
      { id: "gov3", text: "O regimento interno institucional está elaborado, aprovado e vigente?", level: "N1", weight: 2, help: "Documento que define composição, atribuições e funcionamento da direção." },
      { id: "gov4", text: "Existe Conselho Administrativo ou estrutura equivalente de governança corporativa?", level: "N2", weight: 1 },
      { id: "gov5", text: "A liderança realiza reuniões periódicas com pautas e atas registradas?", level: "N1", weight: 1 },
      { id: "gov6", text: "Existe política de gestão de conflito de interesses para líderes?", level: "N2", weight: 1 },
      { id: "gov7", text: "A direção demonstra comprometimento visível com a qualidade e segurança do paciente?", level: "N1", weight: 2, help: "Evidenciado por participação em comitês, comunicados e ações concretas." },
      { id: "gov8", text: "Existe avaliação formal de desempenho da liderança com metas definidas?", level: "N3", weight: 1 },
    ],
  },
  {
    id: "plan",
    title: "Planejamento Estratégico",
    subtitle: "Planejamento, metas, BSC e indicadores estratégicos",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",
    questions: [
      { id: "plan1", text: "Existe Plano Estratégico formalizado com horizonte mínimo de 3 anos?", level: "N1", weight: 2 },
      { id: "plan2", text: "O planejamento estratégico é revisado anualmente com participação das lideranças?", level: "N1", weight: 2 },
      { id: "plan3", text: "Existe Análise SWOT (Forças, Fraquezas, Oportunidades e Ameaças) documentada?", level: "N2", weight: 1, help: "Análise situacional utilizada como base para o planejamento estratégico." },
      { id: "plan4", text: "Os objetivos estratégicos possuem indicadores, metas e responsáveis definidos?", level: "N1", weight: 2 },
      { id: "plan5", text: "Existe Balanced Scorecard (BSC) ou metodologia equivalente para acompanhamento?", level: "N2", weight: 1 },
      { id: "plan6", text: "Os resultados do planejamento são comunicados a todos os colaboradores?", level: "N2", weight: 1 },
      { id: "plan7", text: "Existe processo formal de análise crítica dos resultados estratégicos pela direção?", level: "N2", weight: 2 },
      { id: "plan8", text: "O planejamento considera análise de benchmarking com outras instituições de saúde?", level: "N3", weight: 1 },
    ],
  },
  {
    id: "seg",
    title: "Segurança do Paciente",
    subtitle: "NSP, protocolos de segurança e cultura de segurança",
    icon: <Shield className="w-5 h-5" />,
    color: "text-red-700", bg: "bg-red-50", border: "border-red-200",
    questions: [
      { id: "seg1", text: "O Núcleo de Segurança do Paciente (NSP) está constituído conforme RDC 36/2013?", level: "N1", weight: 3, help: "Mandatório pela ANVISA. O NSP deve ter regimento interno e responsável técnico designado." },
      { id: "seg2", text: "Existe protocolo de Identificação Correta do Paciente implantado e auditado?", level: "N1", weight: 3 },
      { id: "seg3", text: "Existe protocolo de Comunicação Efetiva entre profissionais (SBAR/ISBAR)?", level: "N1", weight: 2 },
      { id: "seg4", text: "O protocolo de Cirurgia Segura (checklist de cirurgia) está implantado?", level: "N1", weight: 3, help: "Baseado no checklist da OMS — obrigatório para unidades cirúrgicas." },
      { id: "seg5", text: "Existe protocolo de Higienização das Mãos com monitoramento de adesão?", level: "N1", weight: 3 },
      { id: "seg6", text: "Há protocolo para Prevenção de Quedas com avaliação de risco na admissão?", level: "N1", weight: 2 },
      { id: "seg7", text: "Existe protocolo para Prevenção de Lesão por Pressão (LPP) com escala validada?", level: "N1", weight: 2 },
      { id: "seg8", text: "O sistema de notificação de eventos adversos e incidentes está funcionando?", level: "N1", weight: 3, help: "Os eventos devem ser registrados, analisados e ter plano de ação corretiva." },
      { id: "seg9", text: "Existe análise de causa raiz (RCA) para eventos sentinela?", level: "N2", weight: 2 },
      { id: "seg10", text: "A cultura de segurança é avaliada periodicamente (ex: pesquisa HSOPSC/AHRQ)?", level: "N3", weight: 1 },
      { id: "seg11", text: "Existe protocolo de administração segura de medicamentos (6 certos)?", level: "N1", weight: 3 },
      { id: "seg12", text: "Há gestão de medicamentos de alta vigilância (MAV) com controles específicos?", level: "N1", weight: 3 },
    ],
  },
  {
    id: "inf",
    title: "Controle de Infecção Hospitalar (SCIH)",
    subtitle: "SCIH, IRAS, vigilância epidemiológica e PGRSS",
    icon: <Activity className="w-5 h-5" />,
    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",
    questions: [
      { id: "inf1", text: "A Subcomissão de Controle de Infecção Hospitalar (SCIH) está constituída (Portaria MS 2616/1998)?", level: "N1", weight: 3 },
      { id: "inf2", text: "O Programa de Prevenção e Controle de Infecção Hospitalar (PPCI/PCIH) está elaborado?", level: "N1", weight: 3 },
      { id: "inf3", text: "Existe vigilância ativa das Infecções Relacionadas à Assistência à Saúde (IRAS)?", level: "N1", weight: 2, help: "Taxas de IPCS, PAV, ITU-cateter, ISC devem ser monitoradas mensalmente." },
      { id: "inf4", text: "Os indicadores de IRAS são calculados e divulgados mensalmente às unidades?", level: "N1", weight: 2 },
      { id: "inf5", text: "Existe Programa de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS) aprovado?", level: "N1", weight: 3 },
      { id: "inf6", text: "Os profissionais recebem treinamento periódico em precauções e isolamento?", level: "N1", weight: 2 },
      { id: "inf7", text: "Existe controle de uso racional de antimicrobianos (Programa de Stewardship)?", level: "N2", weight: 2 },
      { id: "inf8", text: "As taxas de IRAS são comparadas com benchmarks nacionais (ANVISA/OPAS)?", level: "N3", weight: 1 },
    ],
  },
  {
    id: "doc",
    title: "Documentação e Processos",
    subtitle: "Controle de documentos, POPs e protocolos clínicos",
    icon: <FileText className="w-5 h-5" />,
    color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200",
    questions: [
      { id: "doc1", text: "Existe norma/política de controle de documentos e registros aprovada?", level: "N1", weight: 2, help: "Define criação, revisão, aprovação, distribuição e obsolescência de documentos." },
      { id: "doc2", text: "Todos os Procedimentos Operacionais Padrão (POPs) críticos estão elaborados e vigentes?", level: "N1", weight: 2 },
      { id: "doc3", text: "Os POPs possuem responsável, data de elaboração, vigência e aprovação registradas?", level: "N1", weight: 2 },
      { id: "doc4", text: "Existe lista mestra de documentos controlados atualizada?", level: "N1", weight: 2 },
      { id: "doc5", text: "Os documentos obsoletos são retirados de circulação tempestivamente?", level: "N1", weight: 1 },
      { id: "doc6", text: "Existe processo de revisão periódica de POPs (mínimo a cada 2 anos)?", level: "N1", weight: 2 },
      { id: "doc7", text: "Os protocolos clínicos baseados em evidências estão implantados e auditados?", level: "N2", weight: 2 },
      { id: "doc8", text: "Existe gestão eletrônica de documentos (GED) ou sistema equivalente?", level: "N2", weight: 1 },
      { id: "doc9", text: "A aderência aos protocolos clínicos é monitorada com indicador?", level: "N2", weight: 2 },
    ],
  },
  {
    id: "rh",
    title: "Gestão de Pessoas",
    subtitle: "Admissão, treinamento, competências e avaliação",
    icon: <Users className="w-5 h-5" />,
    color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200",
    questions: [
      { id: "rh1", text: "Existe processo formal de admissão com checklist de documentação e integração?", level: "N1", weight: 2 },
      { id: "rh2", text: "Há descrição de cargos com competências, atribuições e requisitos para todos os cargos?", level: "N1", weight: 2 },
      { id: "rh3", text: "Existe Plano Anual de Capacitação (PAC) elaborado com base no mapeamento de necessidades?", level: "N1", weight: 2 },
      { id: "rh4", text: "As capacitações obrigatórias (NR-32, incêndio, primeiros socorros, LGPD) estão em dia?", level: "N1", weight: 3 },
      { id: "rh5", text: "Existe controle de carga horária de treinamentos por colaborador?", level: "N1", weight: 1 },
      { id: "rh6", text: "Existe processo de avaliação de desempenho periódico dos colaboradores?", level: "N2", weight: 2 },
      { id: "rh7", text: "O Programa de Saúde Ocupacional (PCMSO e PPRA/PGR) está elaborado e atualizado?", level: "N1", weight: 3 },
      { id: "rh8", text: "Existe pesquisa de clima organizacional realizada periodicamente?", level: "N2", weight: 1 },
      { id: "rh9", text: "Existe plano de carreira ou política de desenvolvimento profissional?", level: "N3", weight: 1 },
      { id: "rh10", text: "O índice de turnover é monitorado com meta definida?", level: "N2", weight: 1 },
    ],
  },
  {
    id: "ass",
    title: "Atenção ao Paciente",
    subtitle: "Admissão, prontuário, plano de cuidados e alta",
    icon: <Stethoscope className="w-5 h-5" />,
    color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200",
    questions: [
      { id: "ass1", text: "Existe processo padronizado de triagem e classificação de risco (Manchester ou equivalente)?", level: "N1", weight: 2 },
      { id: "ass2", text: "O prontuário do paciente (físico ou eletrônico) está estruturado conforme CFM 1638/2002?", level: "N1", weight: 3 },
      { id: "ass3", text: "O plano de cuidados individualizado é elaborado e registrado no prontuário?", level: "N1", weight: 2 },
      { id: "ass4", text: "Existe processo de passagem de plantão estruturado (handoff/SBAR)?", level: "N1", weight: 2 },
      { id: "ass5", text: "O processo de alta hospitalar inclui orientações escritas ao paciente/familiar?", level: "N1", weight: 2 },
      { id: "ass6", text: "Existe avaliação de risco nutricional na admissão (triagem nutricional)?", level: "N1", weight: 2 },
      { id: "ass7", text: "Há avaliação de risco para Tromboembolismo Venoso (TEV) nos pacientes internados?", level: "N2", weight: 2 },
      { id: "ass8", text: "Existe monitoramento de desfechos clínicos (reinternação, mortalidade, complicações)?", level: "N2", weight: 2 },
      { id: "ass9", text: "O tempo de espera para atendimento é monitorado com meta definida?", level: "N2", weight: 1 },
      { id: "ass10", text: "Existe processo de consentimento informado documentado para procedimentos?", level: "N1", weight: 2 },
    ],
  },
  {
    id: "farm",
    title: "Farmácia Hospitalar",
    subtitle: "Gestão de medicamentos, dispensação e farmácia clínica",
    icon: <Pill className="w-5 h-5" />,
    color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200",
    questions: [
      { id: "farm1", text: "A farmácia hospitalar possui farmacêutico responsável técnico habilitado?", level: "N1", weight: 3 },
      { id: "farm2", text: "Existe padronização de medicamentos (Relação de Medicamentos Padronizados — REMUME)?", level: "N1", weight: 2 },
      { id: "farm3", text: "O processo de dispensação é unitarizado ou com dupla checagem?", level: "N1", weight: 2, help: "Dose unitária e/ou dupla conferência antes da dispensação reduz erros de medicação." },
      { id: "farm4", text: "Os medicamentos controlados são armazenados e controlados conforme RDC 204/2017?", level: "N1", weight: 3 },
      { id: "farm5", text: "Existe controle de validade e armazenamento adequado de medicamentos termolábeis?", level: "N1", weight: 2 },
      { id: "farm6", text: "Os Medicamentos de Alta Vigilância (MAV) estão identificados e com controles especiais?", level: "N1", weight: 3 },
      { id: "farm7", text: "Existe farmácia clínica com acompanhamento farmacoterapêutico dos pacientes?", level: "N2", weight: 2 },
      { id: "farm8", text: "Os indicadores de segurança de medicamentos são monitorados (erros, near-miss)?", level: "N2", weight: 2 },
    ],
  },
  {
    id: "cme",
    title: "CME — Central de Material e Esterilização",
    subtitle: "Processamento de artigos médico-hospitalares",
    icon: <Wrench className="w-5 h-5" />,
    color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200",
    questions: [
      { id: "cme1", text: "A CME possui responsável técnico de enfermagem habilitado?", level: "N1", weight: 3 },
      { id: "cme2", text: "Os processos de limpeza, desinfecção e esterilização seguem protocolos baseados em RDC 15/2012?", level: "N1", weight: 3 },
      { id: "cme3", text: "Existe rastreabilidade dos artigos processados por lote de esterilização?", level: "N1", weight: 2, help: "Permite identificar quais artigos foram utilizados em quais pacientes." },
      { id: "cme4", text: "Os autoclaves e equipamentos de esterilização passam por manutenção preventiva e qualificação?", level: "N1", weight: 2 },
      { id: "cme5", text: "Os indicadores biológicos são utilizados rotineiramente para validação da esterilização?", level: "N1", weight: 3 },
      { id: "cme6", text: "A área física da CME possui separação de área suja/limpa/estéril?", level: "N1", weight: 2 },
      { id: "cme7", text: "Os registros de processamento são arquivados por mínimo de 5 anos?", level: "N1", weight: 2 },
    ],
  },
  {
    id: "cap",
    title: "Capacitação e Educação Continuada",
    subtitle: "Treinamentos obrigatórios, integrações e avaliação de eficácia",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
    questions: [
      { id: "cap1", text: "Existe programa de integração estruturado para novos colaboradores (mínimo 40h)?", level: "N1", weight: 2 },
      { id: "cap2", text: "As capacitações em segurança do paciente são realizadas para todos os colaboradores?", level: "N1", weight: 3 },
      { id: "cap3", text: "Existe avaliação de eficácia dos treinamentos realizados?", level: "N2", weight: 2, help: "Validação se o treinamento gerou mudança de comportamento ou melhora de indicador." },
      { id: "cap4", text: "O índice de cobertura de treinamentos obrigatórios é ≥ 90%?", level: "N1", weight: 2 },
      { id: "cap5", text: "As capacitações são registradas com assinatura, conteúdo e carga horária?", level: "N1", weight: 2 },
      { id: "cap6", text: "Existe parceria com instituições de ensino para desenvolvimento de equipe?", level: "N3", weight: 1 },
      { id: "cap7", text: "Os líderes recebem capacitação em gestão, liderança e qualidade?", level: "N2", weight: 1 },
    ],
  },
  {
    id: "ind",
    title: "Indicadores e Melhoria Contínua",
    subtitle: "KPIs assistenciais, operacionais e ciclo PDCA",
    icon: <Activity className="w-5 h-5" />,
    color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200",
    questions: [
      { id: "ind1", text: "Existe conjunto de indicadores assistenciais e operacionais com metas definidas?", level: "N1", weight: 2 },
      { id: "ind2", text: "Os indicadores são coletados, calculados e analisados mensalmente?", level: "N1", weight: 2 },
      { id: "ind3", text: "Os resultados dos indicadores são divulgados para as equipes assistenciais?", level: "N1", weight: 2 },
      { id: "ind4", text: "Existe metodologia de melhoria contínua (PDCA, DMAIC ou equivalente) em uso?", level: "N2", weight: 2 },
      { id: "ind5", text: "Os planos de ação originados de não conformidades têm responsável e prazo definidos?", level: "N1", weight: 2 },
      { id: "ind6", text: "Existe processo de benchmark com hospitais de referência (nacional ou internacional)?", level: "N3", weight: 1 },
      { id: "ind7", text: "A satisfação do paciente é medida com instrumento validado (NPS, HCAHPS ou similar)?", level: "N2", weight: 2 },
      { id: "ind8", text: "Os resultados de indicadores são apresentados em reunião de análise crítica pela direção?", level: "N2", weight: 2 },
    ],
  },
  {
    id: "inf2",
    title: "Infraestrutura e Equipamentos",
    subtitle: "Manutenção, engenharia clínica e alvará sanitário",
    icon: <Wrench className="w-5 h-5" />,
    color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200",
    questions: [
      { id: "inf2a", text: "O alvará sanitário de funcionamento está vigente?", level: "N1", weight: 3 },
      { id: "inf2b", text: "Existe programa de manutenção preventiva e corretiva de equipamentos médicos?", level: "N1", weight: 2 },
      { id: "inf2c", text: "Os equipamentos críticos possuem calibração em dia com certificado rastreável ao INMETRO?", level: "N1", weight: 2 },
      { id: "inf2d", text: "Existe inventário atualizado de todos os equipamentos médico-hospitalares?", level: "N1", weight: 2 },
      { id: "inf2e", text: "O sistema elétrico possui gerador de emergência com manutenção e testes periódicos?", level: "N1", weight: 2 },
      { id: "inf2f", text: "Existe plano de resposta a emergências e desastres (incêndio, pane, inundação)?", level: "N1", weight: 2 },
      { id: "inf2g", text: "O sistema de gases medicinais é certificado e possui inspeção periódica?", level: "N1", weight: 3 },
      { id: "inf2h", text: "Existe engenharia clínica ou gestão tecnológica estruturada?", level: "N2", weight: 1 },
    ],
  },
];

// ── Score helpers ──────────────────────────────────────────────────────────────

const ANSWER_SCORE: Record<NonNullable<Answer>, number> = {
  sim: 1, parcial: 0.5, nao: 0, na: -1,
};

function calcSection(questions: Question[], answers: Record<string, Answer>) {
  let total = 0, earned = 0, applicable = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (a === null || a === undefined) continue;
    if (a === "na") continue;
    applicable++;
    total += q.weight;
    earned += (ANSWER_SCORE[a] ?? 0) * q.weight;
  }
  if (applicable === 0) return null;
  return Math.round((earned / total) * 100);
}

function calcLevel(sections: Section[], answers: Record<string, Answer>, level: ONALevel) {
  let total = 0, earned = 0;
  for (const sec of sections) {
    for (const q of sec.questions) {
      if (q.level !== level) continue;
      const a = answers[q.id];
      if (!a || a === "na") continue;
      total += q.weight;
      earned += (ANSWER_SCORE[a] ?? 0) * q.weight;
    }
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0;
}

function answeredCount(answers: Record<string, Answer>) {
  return Object.values(answers).filter(v => v !== null && v !== undefined).length;
}

function totalQuestions() {
  return SECTIONS.reduce((a, s) => a + s.questions.length, 0);
}

function levelLabel(pct: number) {
  if (pct >= 80) return { label: "Apto para N1", color: "text-emerald-700", bg: "bg-emerald-100" };
  if (pct >= 60) return { label: "Em preparação", color: "text-amber-700", bg: "bg-amber-100" };
  return { label: "Ações urgentes necessárias", color: "text-red-700", bg: "bg-red-100" };
}

// ── Answer button ──────────────────────────────────────────────────────────────

const ANSWERS: { value: Answer; label: string; icon: React.ReactNode; cls: string; active: string }[] = [
  { value: "sim", label: "Sim", icon: <CheckCircle2 className="w-4 h-4" />, cls: "border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700", active: "bg-emerald-500 border-emerald-500 text-white" },
  { value: "parcial", label: "Parcial", icon: <AlertTriangle className="w-4 h-4" />, cls: "border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700", active: "bg-amber-500 border-amber-500 text-white" },
  { value: "nao", label: "Não", icon: <XCircle className="w-4 h-4" />, cls: "border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-700", active: "bg-red-500 border-red-500 text-white" },
  { value: "na", label: "N/A", icon: <MinusCircle className="w-4 h-4" />, cls: "border-slate-200 text-slate-500 hover:border-slate-400", active: "bg-slate-400 border-slate-400 text-white" },
];

const LEVEL_COLORS: Record<ONALevel, string> = {
  N1: "bg-sky-100 text-sky-700",
  N2: "bg-violet-100 text-violet-700",
  N3: "bg-amber-100 text-amber-700",
};

// ── Main Component ─────────────────────────────────────────────────────────────

interface SavedAssessment {
  id: string;
  companyName: string;
  evaluatorName: string;
  institutionType?: string;
  beds?: string;
  technicalManager?: string;
  contact?: string;
  answers: Record<string, Answer>;
  scores: { n1: number; n2: number; n3: number; overall: number };
  answered: number;
  total: number;
  submittedAt: string;
}

const ONA_STORAGE_KEY = "ona_assessments";

export default function AvaliacaoInicial() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ gov: true });
  const [submitted, setSubmitted] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [evaluatorName, setEvaluatorName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [beds, setBeds] = useState("");
  const [technicalManager, setTechnicalManager] = useState("");
  const [contact, setContact] = useState("");
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>([]);
  const [viewingAssessment, setViewingAssessment] = useState<SavedAssessment | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Check if current user is admin
  const { data: currentUser } = useQuery<{ role?: string; name?: string }>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (!r.ok) return {};
      return r.json();
    },
    staleTime: 300_000,
  });
  const isAdmin = currentUser?.role === "admin";

  // Load saved assessments from localStorage (persisted across navigation)
  useEffect(() => {
    const stored = localStorage.getItem(ONA_STORAGE_KEY);
    if (stored) {
      try {
        setSavedAssessments(JSON.parse(stored));
      } catch {
        setSavedAssessments([]);
      }
    }
  }, []);

  const answered = answeredCount(answers);
  const total = totalQuestions();
  const progress = Math.round((answered / total) * 100);

  const n1 = calcLevel(SECTIONS, answers, "N1");
  const n2 = calcLevel(SECTIONS, answers, "N2");
  const n3 = calcLevel(SECTIONS, answers, "N3");
  const overall = Math.round((n1 * 0.5 + n2 * 0.3 + n3 * 0.2));

  const toggleSection = (id: string) =>
    setOpenSections(p => ({ ...p, [id]: !p[id] }));

  const setAnswer = (qId: string, val: Answer) =>
    setAnswers(p => ({ ...p, [qId]: val }));

  const handleSubmit = () => {
    if (answered < total * 0.8) {
      toast.error(`Responda pelo menos 80% das perguntas (faltam ${total - answered} respostas)`);
      return;
    }
    if (!companyName.trim()) {
      toast.error("Informe o nome da empresa antes de finalizar");
      return;
    }

    // Persist assessment so admin can view it later
    const assessment: SavedAssessment = {
      id: Date.now().toString(),
      companyName: companyName.trim(),
      evaluatorName: evaluatorName.trim(),
      institutionType: institutionType.trim() || undefined,
      beds: beds.trim() || undefined,
      technicalManager: technicalManager.trim() || undefined,
      contact: contact.trim() || undefined,
      answers,
      scores: { n1, n2, n3, overall },
      answered,
      total,
      submittedAt: new Date().toISOString(),
    };
    const existing: SavedAssessment[] = JSON.parse(localStorage.getItem(ONA_STORAGE_KEY) || "[]");
    existing.push(assessment);
    localStorage.setItem(ONA_STORAGE_KEY, JSON.stringify(existing));
    setSavedAssessments(existing);

    setSubmitted(true);
    toast.success("Avaliação salva! O administrador poderá consultá-la em Avaliação Inicial ONA 2026.");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
  };

  const handlePrint = () => window.print();

  const handleReset = () => {
    if (!window.confirm("Tem certeza que deseja limpar todas as respostas e recomeçar?")) return;
    setAnswers({});
    setSubmitted(false);
    setOpenSections({ gov: true });
    setCompanyName("");
    setEvaluatorName("");
    setInstitutionType("");
    setBeds("");
    setTechnicalManager("");
    setContact("");
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 print:border-b-2 print:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg print:hidden">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Avaliação Inicial ONA 2026</h1>
              <p className="text-sm text-slate-500">Diagnóstico de prontidão para acreditação · {total} critérios avaliados</p>
            </div>
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0 text-xs print:hidden">
              {progress}% respondido
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mt-3 print:hidden">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{answered} de {total} perguntas respondidas</span>
              <span className={cn(progress >= 80 ? "text-emerald-600 font-medium" : "")}>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Admin: Avaliações salvas ── */}
        {isAdmin && savedAssessments.length > 0 && !submitted && !viewingAssessment && (
          <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-emerald-100">
              <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Avaliações Recebidas ({savedAssessments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {savedAssessments.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border border-emerald-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.companyName}</p>
                    <p className="text-xs text-slate-500">
                      {a.evaluatorName ? `Avaliador: ${a.evaluatorName} · ` : ""}
                      {new Date(a.submittedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {" · "}{a.answered}/{a.total} critérios
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn("text-xs border-0", a.scores.overall >= 80 ? "bg-emerald-100 text-emerald-700" : a.scores.overall >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {a.scores.overall}%
                    </Badge>
                    <Button size="sm" variant="outline" className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => setViewingAssessment(a)}>
                      Ver Resultado
                    </Button>
                    <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => {
                      const data = mapAssessmentToSystemData(a, {
                        companyName: a.companyName,
                        evaluatorName: a.evaluatorName,
                        institutionType: a.institutionType,
                        beds: a.beds,
                        technicalManager: a.technicalManager,
                        contact: a.contact,
                      }, currentUser?.name || "Administrador");
                      localStorage.setItem(VALIDATED_DATA_KEY, JSON.stringify(data));
                      toast.success(`Sistema populado! ${data.indicadores.length} indicadores, ${data.riscos.length} riscos e ${data.politicas.length} políticas criados automaticamente.`);
                    }}>
                      <Zap className="w-3 h-3" />
                      Validar e Popular Sistema
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => {
                      if (!window.confirm("Excluir esta avaliação?")) return;
                      const updated = savedAssessments.filter(x => x.id !== a.id);
                      localStorage.setItem(ONA_STORAGE_KEY, JSON.stringify(updated));
                      setSavedAssessments(updated);
                    }}>
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Admin: Visualizar avaliação salva ── */}
        {isAdmin && viewingAssessment && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-bold text-slate-800">Resultado — {viewingAssessment.companyName}</h2>
                <Badge className="text-xs bg-slate-100 text-slate-600 border-0">
                  {new Date(viewingAssessment.submittedAt).toLocaleDateString("pt-BR")}
                </Badge>
              </div>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setViewingAssessment(null)}>
                ← Voltar à lista
              </Button>
            </div>

            {/* Overall score card */}
            <Card className={cn("border-2", viewingAssessment.scores.overall >= 80 ? "border-emerald-400 bg-emerald-50" : viewingAssessment.scores.overall >= 60 ? "border-amber-400 bg-amber-50" : "border-red-400 bg-red-50")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Score Geral de Prontidão ONA</p>
                    <p className="text-4xl font-extrabold text-slate-900 mt-1">{viewingAssessment.scores.overall}%</p>
                    <Badge className={cn("mt-2 text-sm border-0", levelLabel(viewingAssessment.scores.overall).bg, levelLabel(viewingAssessment.scores.overall).color)}>
                      {levelLabel(viewingAssessment.scores.overall).label}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-3">Score por Nível ONA</p>
                    {([["N1", viewingAssessment.scores.n1, "sky"], ["N2", viewingAssessment.scores.n2, "violet"], ["N3", viewingAssessment.scores.n3, "amber"]] as [string, number, string][]).map(([lv, sc, c]) => (
                      <div key={lv} className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold text-${c}-700 w-6`}>{lv}</span>
                        <div className="w-32 h-2 bg-white/60 rounded-full overflow-hidden">
                          <div className={`h-full bg-${c}-500 rounded-full`} style={{ width: `${sc}%` }} />
                        </div>
                        <span className={`text-sm font-bold text-${c}-700 w-10`}>{sc}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Avaliação realizada por <strong>{viewingAssessment.evaluatorName || "responsável da instituição"}</strong> em <strong>{new Date(viewingAssessment.submittedAt).toLocaleDateString("pt-BR")}</strong>.
                  Foram respondidos <strong>{viewingAssessment.answered}</strong> de <strong>{viewingAssessment.total}</strong> critérios.
                </p>
              </CardContent>
            </Card>

            {/* Score by section */}
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">Score por Setor</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {SECTIONS.map(sec => {
                  const sc = calcSection(sec.questions, viewingAssessment.answers);
                  if (sc === null) return null;
                  return (
                    <div key={sec.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-xs font-semibold", sec.color)}>{sec.title}</span>
                        <span className={cn("text-sm font-bold", sc >= 80 ? "text-emerald-600" : sc >= 50 ? "text-amber-600" : "text-red-600")}>{sc}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", sc >= 80 ? "bg-emerald-500" : sc >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${sc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Gap analysis */}
            <Card className="border border-red-200 bg-red-50 shadow-sm">
              <CardHeader className="px-5 pt-4 pb-3 border-b border-red-100">
                <CardTitle className="text-sm font-bold text-red-800">Gaps Críticos Identificados</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2">
                {SECTIONS.flatMap(sec =>
                  sec.questions.filter(q => q.weight >= 2 && (viewingAssessment.answers[q.id] === "nao" || viewingAssessment.answers[q.id] === null))
                    .map(q => (
                      <div key={q.id} className="flex items-start gap-2 text-sm text-red-800">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{q.text}</span>
                        {q.weight === 3 && <Badge className="ml-1 bg-red-200 text-red-800 border-0 text-xs flex-shrink-0">Mandatório</Badge>}
                      </div>
                    ))
                )}
                {SECTIONS.flatMap(sec => sec.questions.filter(q => q.weight >= 2 && (viewingAssessment.answers[q.id] === "nao" || viewingAssessment.answers[q.id] === null))).length === 0 && (
                  <p className="text-sm text-emerald-700 font-medium">Nenhum gap crítico identificado. Excelente!</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Company info ── */}
        {!submitted && !viewingAssessment && (
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                Identificação da Empresa
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Nome da Empresa *</label>
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Ex.: Hospital Geral São Lucas"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Avaliador / Responsável</label>
                  <input
                    value={evaluatorName}
                    onChange={e => setEvaluatorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Ex.: Dra. Ana Souza — Diretora de Qualidade"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Tipo de Instituição</label>
                  <select
                    value={institutionType}
                    onChange={e => setInstitutionType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="">Selecione...</option>
                    <option value="Hospital Geral">Hospital Geral</option>
                    <option value="Hospital Especializado">Hospital Especializado</option>
                    <option value="UPA">UPA</option>
                    <option value="Clínica">Clínica</option>
                    <option value="UBS">UBS</option>
                    <option value="Ambulatório">Ambulatório</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Número de Leitos (ou N/A)</label>
                  <input
                    value={beds}
                    onChange={e => setBeds(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Ex.: 120 leitos"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Responsável Técnico (nome + CRM/COREN)</label>
                  <input
                    value={technicalManager}
                    onChange={e => setTechnicalManager(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Ex.: Dr. João Silva — CRM 12345-SP"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">E-mail ou telefone de contato</label>
                  <input
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Ex.: qualidade@hospital.com.br"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Instructions ── */}
        {!submitted && !viewingAssessment && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 print:hidden">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Como preencher</p>
              <p className="text-sm text-blue-700">
                Para cada critério, selecione: <strong>Sim</strong> (cumpre totalmente), <strong>Parcial</strong> (cumpre em parte ou com ressalvas),
                <strong> Não</strong> (não cumpre ainda) ou <strong>N/A</strong> (não se aplica à sua instituição).
                O sistema calcula automaticamente o score ONA N1, N2 e N3.
              </p>
            </div>
          </div>
        )}

        {/* ── Sections ── */}
        {!submitted && !viewingAssessment && SECTIONS.map(sec => {
          const secScore = calcSection(sec.questions, answers);
          const secAnswered = sec.questions.filter(q => answers[q.id] !== null && answers[q.id] !== undefined).length;
          return (
            <Card key={sec.id} className={cn("border shadow-sm overflow-hidden", sec.border)}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(sec.id)}
                className={cn("w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:opacity-90", sec.bg)}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", sec.bg, sec.color, "border", sec.border)}>
                  {sec.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-bold text-sm", sec.color)}>{sec.title}</p>
                  <p className="text-xs text-slate-500 truncate">{sec.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{secAnswered}/{sec.questions.length}</span>
                  {secScore !== null && (
                    <Badge className={cn("text-xs border-0", secScore >= 80 ? "bg-emerald-100 text-emerald-700" : secScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                      {secScore}%
                    </Badge>
                  )}
                  {openSections[sec.id]
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Questions */}
              {openSections[sec.id] && (
                <CardContent className="p-0 divide-y divide-slate-100">
                  {sec.questions.map((q, idx) => {
                    const cur = answers[q.id] ?? null;
                    return (
                      <div key={q.id} className={cn("px-5 py-4 transition-colors", cur === "sim" ? "bg-emerald-50/40" : cur === "parcial" ? "bg-amber-50/40" : cur === "nao" ? "bg-red-50/40" : "bg-white")}>
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-slate-300 font-mono mt-1 w-5 flex-shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <p className="text-sm text-slate-800 leading-relaxed flex-1">{q.text}</p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge className={cn("text-[10px] border-0", LEVEL_COLORS[q.level])}>{q.level}</Badge>
                                {q.weight === 3 && <Badge className="text-[10px] border-0 bg-red-100 text-red-600">Crítico</Badge>}
                                {q.help && (
                                  <button onClick={() => setShowHelp(showHelp === q.id ? null : q.id)} className="text-slate-300 hover:text-blue-400 transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {showHelp === q.id && q.help && (
                              <div className="mb-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                💡 {q.help}
                              </div>
                            )}
                            {/* Answer buttons */}
                            <div className="flex gap-2 flex-wrap">
                              {ANSWERS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setAnswer(q.id, cur === opt.value ? null : opt.value)}
                                  className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                                    cur === opt.value ? opt.active : opt.cls
                                  )}
                                >
                                  {opt.icon}
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* ── Submit area ── */}
        {!submitted && !viewingAssessment && (
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-4 print:hidden">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Finalizar Avaliação</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {answered >= total * 0.8
                  ? "✅ Você respondeu o suficiente para gerar o relatório."
                  : `Responda mais ${Math.ceil(total * 0.8) - answered} perguntas para poder finalizar.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset} className="text-xs gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Recomeçar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={answered < total * 0.8 || !companyName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizar e Ver Resultado
              </Button>
            </div>
          </div>
        )}

        {/* ── RESULT — visible only to admin after submission ── */}
        {submitted && (
          <div ref={resultRef} className="space-y-5">
            {/* Lock message for non-admins */}
            {!isAdmin && (
              <div className="flex items-center gap-4 bg-slate-800 text-white rounded-xl px-6 py-5">
                <Lock className="w-8 h-8 text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-base">Avaliação registrada com sucesso!</p>
                  <p className="text-slate-300 text-sm mt-1">
                    O resultado desta avaliação está sendo analisado. O administrador do sistema entrará em contato com o relatório completo.
                  </p>
                </div>
                <a href="/setor-form">
                  <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white flex-shrink-0 gap-1.5">
                    <ArrowRight className="w-4 h-4" />
                    Preencher dados do setor
                  </Button>
                </a>
              </div>
            )}

            {/* Result — only for admins */}
            {isAdmin && (
              <>
                {/* Print header */}
                <div className="hidden print:block text-center mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">RELATÓRIO DE AVALIAÇÃO INICIAL ONA 2026</h1>
                  <p className="text-slate-600 mt-1">QHealth One — Sistema de Gestão da Qualidade em Saúde</p>
                  <p className="text-slate-500 text-sm mt-1">Empresa: {companyName} · Avaliador: {evaluatorName || "—"} · Data: {new Date().toLocaleDateString("pt-BR")}</p>
                  <hr className="mt-4 border-slate-300" />
                </div>

                <div className="flex items-center justify-between print:hidden">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-base font-bold text-slate-800">Resultado da Avaliação — {companyName}</h2>
                  </div>
                  <Button onClick={handlePrint} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white gap-1.5 text-xs">
                    <Printer className="w-4 h-4" /> Imprimir Relatório
                  </Button>
                </div>

                {/* Overall score */}
                <Card className={cn("border-2", overall >= 80 ? "border-emerald-400 bg-emerald-50" : overall >= 60 ? "border-amber-400 bg-amber-50" : "border-red-400 bg-red-50")}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-600">Score Geral de Prontidão ONA</p>
                        <p className="text-4xl font-extrabold text-slate-900 mt-1">{overall}%</p>
                        <Badge className={cn("mt-2 text-sm border-0", levelLabel(overall).bg, levelLabel(overall).color)}>
                          {levelLabel(overall).label}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-3">Score por Nível ONA</p>
                        {([["N1", n1, "sky"], ["N2", n2, "violet"], ["N3", n3, "amber"]] as [string, number, string][]).map(([lv, sc, c]) => (
                          <div key={lv} className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-bold text-${c}-700 w-6`}>{lv}</span>
                            <div className="w-32 h-2 bg-white/60 rounded-full overflow-hidden">
                              <div className={`h-full bg-${c}-500 rounded-full`} style={{ width: `${sc}%` }} />
                            </div>
                            <span className={`text-sm font-bold text-${c}-700 w-10`}>{sc}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Avaliação realizada por <strong>{evaluatorName || "responsável da instituição"}</strong> em <strong>{new Date().toLocaleDateString("pt-BR")}</strong>.
                      Foram respondidos <strong>{answered}</strong> de <strong>{total}</strong> critérios.
                    </p>
                  </CardContent>
                </Card>

                {/* Score by section */}
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-800">Score por Setor</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {SECTIONS.map(sec => {
                      const sc = calcSection(sec.questions, answers);
                      if (sc === null) return null;
                      return (
                        <div key={sec.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs font-semibold", sec.color)}>{sec.title}</span>
                            </div>
                            <span className={cn("text-sm font-bold", sc >= 80 ? "text-emerald-600" : sc >= 50 ? "text-amber-600" : "text-red-600")}>{sc}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", sc >= 80 ? "bg-emerald-500" : sc >= 50 ? "bg-amber-500" : "bg-red-500")}
                              style={{ width: `${sc}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Non-conformities */}
                <Card className="border border-red-200 bg-white shadow-sm">
                  <CardHeader className="px-5 pt-4 pb-3 border-b border-red-100">
                    <CardTitle className="text-sm font-bold text-red-800 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Itens Críticos — Ação Imediata Necessária
                    </CardTitle>
                    <p className="text-xs text-red-600 mt-0.5">Critérios marcados como "Não" com peso crítico (mandatórios para ONA)</p>
                  </CardHeader>
                  <CardContent className="p-5 space-y-2">
                    {SECTIONS.flatMap(sec =>
                      sec.questions.filter(q => answers[q.id] === "nao" && q.weight >= 2).map(q => (
                        <div key={q.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-red-800">{sec.title}</p>
                            <p className="text-sm text-red-700 mt-0.5">{q.text}</p>
                          </div>
                          <Badge className={cn("text-[10px] border-0 flex-shrink-0", LEVEL_COLORS[q.level])}>{q.level}</Badge>
                        </div>
                      ))
                    )}
                    {SECTIONS.flatMap(sec => sec.questions.filter(q => answers[q.id] === "nao" && q.weight >= 2)).length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">Nenhum item crítico identificado — excelente!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Parcial items */}
                <Card className="border border-amber-200 bg-white shadow-sm">
                  <CardHeader className="px-5 pt-4 pb-3 border-b border-amber-100">
                    <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Itens Parciais — Oportunidades de Melhoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-2">
                    {SECTIONS.flatMap(sec =>
                      sec.questions.filter(q => answers[q.id] === "parcial").map(q => (
                        <div key={q.id} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-800">{sec.title}</p>
                            <p className="text-sm text-amber-700 mt-0.5">{q.text}</p>
                          </div>
                          <Badge className={cn("text-[10px] border-0 flex-shrink-0", LEVEL_COLORS[q.level])}>{q.level}</Badge>
                        </div>
                      ))
                    )}
                    {SECTIONS.flatMap(sec => sec.questions.filter(q => answers[q.id] === "parcial")).length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">Nenhum item parcial identificado.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendation */}
                <Card className="border border-emerald-200 bg-emerald-50 shadow-sm">
                  <CardContent className="p-5 flex items-start gap-4">
                    <Zap className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900 mb-1">Recomendação da Avaliação</p>
                      <p className="text-sm text-emerald-800">
                        {overall >= 80
                          ? "A instituição demonstra maturidade suficiente para iniciar o processo formal de acreditação ONA. Recomenda-se agendar a visita de diagnóstico com a organização acreditadora."
                          : overall >= 60
                          ? "A instituição está em preparação para a acreditação. Recomenda-se elaborar plano de ação focado nos itens críticos identificados (marcados como Não) antes de solicitar a avaliação formal."
                          : "A instituição necessita de intervenções estruturais antes de iniciar o processo de acreditação. Recomenda-se iniciar pelos itens mandatórios (Nível 1) com prazo máximo de 6 meses."}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <ArrowRight className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-800">
                          Próximo passo: acesse <strong>Gestão Operacional → Planos de Ação</strong> para registrar as ações corretivas de cada não conformidade.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Print footer */}
                <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
                  Relatório gerado pelo QHealth One 2026 · {new Date().toLocaleString("pt-BR")} · Confidencial — uso exclusivo da Comissão de Qualidade
                </div>

                <div className="flex gap-3 print:hidden">
                  <Button onClick={handleReset} variant="outline" className="text-xs gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Nova Avaliação
                  </Button>
                  <Button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white text-xs gap-1.5">
                    <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
