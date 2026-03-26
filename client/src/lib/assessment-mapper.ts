/**
 * assessment-mapper.ts
 * Maps ONA 2026 assessment answers → rich system data for all pages.
 * Used by the admin validation flow to auto-populate all modules.
 */

// ─── Public Interfaces ────────────────────────────────────────────────────────

export interface AssessmentCompanyInfo {
  companyName: string;
  evaluatorName: string;
  cnpj?: string;
  institutionType?: string; // "Hospital Geral" | "Hospital Especializado" | "UPA" | "Clínica" | "UBS" | "Ambulatório"
  beds?: string;
  specialties?: string;
  technicalManager?: string;
  contact?: string;
  address?: string;
}

export interface MappedIndicador {
  id: number;
  name: string;
  value: number;
  target: number;
  unit: string;
  status: "Dentro da Meta" | "Atenção" | "Abaixo da Meta";
  trend: "up" | "down" | "stable";
  category: string;
  layer: "ONA" | "Segurança" | "ANS" | "Qualidade Operacional" | "Experiência do Paciente";
  critical: boolean;
  description: string;
}

export interface MappedRisco {
  id: number;
  title: string;
  category: string;
  probability: "Muito Alta" | "Alta" | "Média" | "Baixa" | "Muito Baixa";
  impact: "Catastrófico" | "Crítico" | "Moderado" | "Menor" | "Insignificante";
  level: "Crítico" | "Alto" | "Médio" | "Baixo";
  status: "Identificado" | "Em Mitigação" | "Mitigado";
  owner: string;
  dueDate: string;
  mitigation: string;
  source: string;
  // Numeric fields for heatmap compatibility
  prob: number;
  impact_num: number;
  cat: "Assistencial" | "Operacional" | "Regulatório" | "Estratégico";
}

export interface MappedGutItem {
  id: number;
  title: string;
  unit: string;
  gravity: number;
  urgency: number;
  tendency: number;
  category: string;
  responsible: string;
  deadline: string;
  status: "Pendente" | "Em andamento" | "Concluído";
  answer: "nao" | "parcial";
  origin: string;
  originCode: string;
  chapter: string;
  aiJustification: string;
}

export interface MappedPolitica {
  id: number;
  title: string;
  category: string;
  version: string;
  status: "Vigente" | "Em revisão" | "Pendente";
  lastReview: string;
  nextReview: string;
  responsible: string;
  type: "Protocolo" | "Política" | "POP" | "Manual" | "Regulamento";
}

export interface MappedCapa {
  id: number;
  title: string;
  description: string;
  type: "Corretiva" | "Preventiva" | "Melhoria";
  status: "Aberta" | "Em andamento" | "Concluída";
  priority: "Crítica" | "Alta" | "Média" | "Baixa";
  responsible: string;
  dueDate: string;
  origin: string;
  questionId: string;
}

export interface ValidatedTenantData {
  assessmentId: string;
  companyInfo: AssessmentCompanyInfo;
  validatedAt: string;
  validatedBy: string;
  scores: { n1: number; n2: number; n3: number; overall: number };
  sectionScores: Record<string, number | null>;
  indicadores: MappedIndicador[];
  riscos: MappedRisco[];
  gutItems: MappedGutItem[];
  politicas: MappedPolitica[];
  capas: MappedCapa[];
  gaps: Array<{ id: string; text: string; weight: number; section: string }>;
  radarData: Array<{ subject: string; value: number; fullMark: number }>;
}

export const VALIDATED_DATA_KEY = "ona_validated_data";

// ─── Question Metadata ────────────────────────────────────────────────────────

interface QuestionMeta {
  policyTitle?: string;
  policyType?: "Protocolo" | "Política" | "POP" | "Manual" | "Regulamento";
  riskTitle?: string;
  capaTitle?: string;
  category: string;
  riskCat?: "Assistencial" | "Operacional" | "Regulatório" | "Estratégico";
  mandatory?: boolean;
  chapter?: string;
  responsible?: string;
}

const QUESTION_META: Record<string, QuestionMeta> = {
  gov1: { policyTitle: "Missão, Visão e Valores Institucionais", policyType: "Política", capaTitle: "Formalizar e divulgar Missão, Visão e Valores", category: "Governança", riskCat: "Estratégico", chapter: "Cap. 1 — Liderança" },
  gov2: { policyTitle: "Organograma Institucional", policyType: "Política", capaTitle: "Atualizar e aprovar estrutura organizacional", category: "Governança", riskCat: "Estratégico", chapter: "Cap. 1 — Liderança" },
  gov3: { policyTitle: "Regimento Interno Institucional", policyType: "Regulamento", riskTitle: "Ausência de Regimento Interno", capaTitle: "Elaborar e aprovar Regimento Interno Institucional", category: "Governança", riskCat: "Regulatório", chapter: "Cap. 1 — Liderança" },
  gov4: { riskTitle: "Ausência de Governança Corporativa", capaTitle: "Estruturar Conselho Administrativo ou equivalente", category: "Governança", riskCat: "Estratégico", chapter: "Cap. 1 — Liderança" },
  gov5: { riskTitle: "Falta de Atas de Reuniões de Liderança", capaTitle: "Implantar rotina de registros de reuniões da liderança", category: "Governança", riskCat: "Operacional", chapter: "Cap. 1 — Liderança" },
  gov7: { riskTitle: "Baixo Comprometimento da Liderança com Qualidade", capaTitle: "Desenvolver programa de engajamento da liderança com qualidade", category: "Governança", riskCat: "Estratégico", chapter: "Cap. 1 — Liderança" },
  plan1: { policyTitle: "Plano Estratégico Institucional", policyType: "Manual", riskTitle: "Ausência de Planejamento Estratégico", capaTitle: "Elaborar Plano Estratégico com horizonte de 3 anos", category: "Planejamento", riskCat: "Estratégico", chapter: "Cap. 1 — Liderança" },
  plan3: { riskTitle: "Análise SWOT não realizada", capaTitle: "Realizar Análise SWOT e documentar resultado", category: "Planejamento", riskCat: "Estratégico", chapter: "Cap. 1 — Liderança" },
  plan4: { policyTitle: "Mapa de Indicadores Estratégicos", policyType: "Política", riskTitle: "Objetivos sem métricas definidas", capaTitle: "Definir indicadores, metas e responsáveis para cada objetivo estratégico", category: "Planejamento", riskCat: "Estratégico", chapter: "Cap. 1 — Liderança" },
  seg1: { policyTitle: "Regimento do NSP", policyType: "Regulamento", riskTitle: "NSP não constituído — risco regulatório ANVISA", capaTitle: "Constituir Núcleo de Segurança do Paciente (RDC 36/2013)", category: "Segurança", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 5 — Segurança" },
  seg2: { policyTitle: "Protocolo de Identificação do Paciente", policyType: "Protocolo", riskTitle: "Risco de erro de identificação de paciente", capaTitle: "Implantar protocolo de identificação correta do paciente", category: "Segurança", riskCat: "Assistencial", mandatory: true, chapter: "Cap. 5 — Segurança" },
  seg3: { policyTitle: "Protocolo de Comunicação SBAR/ISBAR", policyType: "Protocolo", riskTitle: "Falha na comunicação entre profissionais", capaTitle: "Implantar SBAR/ISBAR nas passagens de plantão", category: "Segurança", riskCat: "Assistencial", chapter: "Cap. 5 — Segurança" },
  seg4: { policyTitle: "Protocolo de Cirurgia Segura (OMS)", policyType: "Protocolo", riskTitle: "Ausência de Checklist Cirúrgico", capaTitle: "Implantar checklist de cirurgia segura da OMS", category: "Segurança", riskCat: "Assistencial", mandatory: true, chapter: "Cap. 5 — Segurança" },
  seg5: { policyTitle: "Protocolo de Higienização das Mãos", policyType: "Protocolo", riskTitle: "Baixa adesão à higienização — risco IRAS", capaTitle: "Implantar bundles de higienização das mãos com monitoramento", category: "Segurança", riskCat: "Assistencial", mandatory: true, chapter: "Cap. 5 — Segurança" },
  seg6: { policyTitle: "Protocolo de Prevenção de Quedas", policyType: "Protocolo", riskTitle: "Risco de queda de paciente", capaTitle: "Implantar protocolo de prevenção de quedas com escala de risco", category: "Segurança", riskCat: "Assistencial", chapter: "Cap. 5 — Segurança" },
  seg7: { policyTitle: "Protocolo de Prevenção de LPP", policyType: "Protocolo", riskTitle: "Risco de lesão por pressão não identificada", capaTitle: "Implantar avaliação de risco LPP com escala validada (Braden)", category: "Segurança", riskCat: "Assistencial", chapter: "Cap. 5 — Segurança" },
  seg8: { policyTitle: "Sistema de Notificação de Eventos", policyType: "POP", riskTitle: "Eventos adversos não notificados", capaTitle: "Implantar sistema de notificação de incidentes e eventos adversos", category: "Segurança", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 5 — Segurança" },
  seg11: { policyTitle: "Protocolo de Administração de Medicamentos (6 Certos)", policyType: "Protocolo", riskTitle: "Risco de erro de medicação grave", capaTitle: "Implantar protocolo dos 6 certos na administração de medicamentos", category: "Segurança", riskCat: "Assistencial", mandatory: true, chapter: "Cap. 5 — Segurança" },
  seg12: { policyTitle: "Protocolo MAV", policyType: "Protocolo", riskTitle: "Medicamentos de Alta Vigilância sem controle especial", capaTitle: "Identificar e implantar controles específicos para MAV", category: "Segurança", riskCat: "Assistencial", mandatory: true, chapter: "Cap. 5 — Segurança" },
  inf1: { policyTitle: "Regimento da SCIH", policyType: "Regulamento", riskTitle: "SCIH não constituída — risco regulatório", capaTitle: "Constituir SCIH conforme Portaria MS 2616/1998", category: "Infecção", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 4 — Diagnóstico" },
  inf2: { policyTitle: "PPCI — Programa de Prevenção e Controle de Infecção", policyType: "Manual", riskTitle: "Ausência de PPCI", capaTitle: "Elaborar e implantar Programa de Prevenção e Controle de Infecção", category: "Infecção", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 4 — Diagnóstico" },
  inf5: { policyTitle: "PGRSS — Programa de Gerenciamento de Resíduos", policyType: "Manual", riskTitle: "Ausência de PGRSS", capaTitle: "Elaborar PGRSS conforme RDC ANVISA 222/2018", category: "Infecção", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 4 — Diagnóstico" },
  doc1: { policyTitle: "Política de Controle de Documentos", policyType: "Política", riskTitle: "Documentos sem controle formal", capaTitle: "Implantar sistema de controle e gestão de documentos", category: "Documentação", riskCat: "Operacional", chapter: "Cap. 2 — Pessoas" },
  doc2: { policyTitle: "Biblioteca de POPs Críticos", policyType: "POP", riskTitle: "POPs desatualizados ou inexistentes", capaTitle: "Elaborar e atualizar POPs críticos dos processos assistenciais", category: "Documentação", riskCat: "Operacional", chapter: "Cap. 2 — Pessoas" },
  farm1: { riskTitle: "Farmácia sem Responsável Técnico habilitado", capaTitle: "Contratar farmacêutico Responsável Técnico habilitado", category: "Farmácia", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 3 — Atenção" },
  farm4: { policyTitle: "Política de Controle de Medicamentos Controlados", policyType: "Protocolo", riskTitle: "Medicamentos controlados fora das normas", capaTitle: "Adequar controle de medicamentos controlados à RDC 204/2017", category: "Farmácia", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 3 — Atenção" },
  farm6: { policyTitle: "Protocolo de Medicamentos de Alta Vigilância (MAV)", policyType: "Protocolo", riskTitle: "MAV sem controles específicos", capaTitle: "Implantar identificação e controles especiais para MAV", category: "Farmácia", riskCat: "Assistencial", mandatory: true, chapter: "Cap. 3 — Atenção" },
  rh4: { policyTitle: "Plano de Capacitações Obrigatórias", policyType: "Manual", riskTitle: "Capacitações NR-32/LGPD em atraso", capaTitle: "Realizar capacitações obrigatórias (NR-32, incêndio, primeiros socorros, LGPD)", category: "RH", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 2 — Pessoas" },
  rh7: { policyTitle: "PCMSO e PGR", policyType: "Manual", riskTitle: "Saúde ocupacional não estruturada", capaTitle: "Elaborar PCMSO e PGR atualizados", category: "RH", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 2 — Pessoas" },
  cme1: { riskTitle: "CME sem RT habilitado", capaTitle: "Designar Responsável Técnico de Enfermagem para a CME", category: "CME", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 6 — Infraestrutura" },
  cme2: { policyTitle: "Protocolo de Processamento de Artigos", policyType: "Protocolo", riskTitle: "Esterilização fora das normas RDC 15/2012", capaTitle: "Adequar processamento de artigos à RDC ANVISA 15/2012", category: "CME", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 6 — Infraestrutura" },
  cme5: { riskTitle: "Validação biológica de esterilização não realizada", capaTitle: "Implantar uso rotineiro de indicadores biológicos na esterilização", category: "CME", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 6 — Infraestrutura" },
  cap2: { riskTitle: "Equipe sem treinamento em segurança do paciente", capaTitle: "Realizar treinamento em segurança do paciente para todos os colaboradores", category: "Capacitação", riskCat: "Assistencial", mandatory: true, chapter: "Cap. 2 — Pessoas" },
  inf2a: { riskTitle: "Alvará sanitário vencido — risco interdição", capaTitle: "Renovar alvará sanitário de funcionamento urgente", category: "Infraestrutura", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 6 — Infraestrutura" },
  inf2g: { riskTitle: "Gases medicinais sem certificação", capaTitle: "Regularizar certificação dos gases medicinais", category: "Infraestrutura", riskCat: "Regulatório", mandatory: true, chapter: "Cap. 6 — Infraestrutura" },
};

// ─── Section → Indicador Config ───────────────────────────────────────────────

const SECTION_INDICADOR_CONFIG: Record<string, {
  name: string;
  layer: MappedIndicador["layer"];
  category: string;
  critical_threshold?: number;
}> = {
  gov:  { name: "Conformidade em Governança e Liderança", layer: "ONA", category: "Governança" },
  plan: { name: "Conformidade em Planejamento Estratégico", layer: "ONA", category: "Planejamento" },
  seg:  { name: "Taxa de Conformidade em Segurança do Paciente", layer: "Segurança", category: "Segurança", critical_threshold: 80 },
  inf:  { name: "Taxa de Conformidade SCIH/IRAS", layer: "Segurança", category: "Infecção" },
  doc:  { name: "Conformidade em Documentação e Processos", layer: "Qualidade Operacional", category: "Documentação" },
  rh:   { name: "Conformidade em Gestão de Pessoas", layer: "Qualidade Operacional", category: "RH" },
  ass:  { name: "Conformidade em Atenção ao Paciente", layer: "Qualidade Operacional", category: "Assistência" },
  farm: { name: "Conformidade em Farmácia Hospitalar", layer: "Segurança", category: "Farmácia" },
  cme:  { name: "Conformidade em CME", layer: "Segurança", category: "CME" },
  cap:  { name: "Taxa de Cobertura de Capacitações", layer: "Qualidade Operacional", category: "Capacitação" },
  ind:  { name: "Maturidade de Indicadores e Melhoria", layer: "ONA", category: "Melhoria Contínua" },
  inf2: { name: "Conformidade em Infraestrutura", layer: "Qualidade Operacional", category: "Infraestrutura" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function scoreToStatus(score: number): MappedIndicador["status"] {
  if (score >= 80) return "Dentro da Meta";
  if (score >= 60) return "Atenção";
  return "Abaixo da Meta";
}

function scoreToTrend(score: number): MappedIndicador["trend"] {
  if (score >= 80) return "up";
  if (score >= 60) return "stable";
  return "down";
}

/** Probability levels from weight + answer */
function toProbability(weight: number, answer: "nao" | "parcial"): MappedRisco["probability"] {
  if (answer === "nao") {
    if (weight === 3) return "Muito Alta";
    if (weight === 2) return "Alta";
    return "Média";
  }
  // parcial
  if (weight === 3) return "Alta";
  if (weight === 2) return "Média";
  return "Baixa";
}

function toImpact(weight: number): MappedRisco["impact"] {
  if (weight === 3) return "Catastrófico";
  if (weight === 2) return "Crítico";
  return "Moderado";
}

function toRiskLevel(probability: MappedRisco["probability"], impact: MappedRisco["impact"]): MappedRisco["level"] {
  const probScore: Record<MappedRisco["probability"], number> = { "Muito Alta": 5, "Alta": 4, "Média": 3, "Baixa": 2, "Muito Baixa": 1 };
  const impScore: Record<MappedRisco["impact"], number> = { "Catastrófico": 5, "Crítico": 4, "Moderado": 3, "Menor": 2, "Insignificante": 1 };
  const score = probScore[probability] * impScore[impact];
  if (score >= 16) return "Crítico";
  if (score >= 9)  return "Alto";
  if (score >= 4)  return "Médio";
  return "Baixo";
}

function toProbNum(probability: MappedRisco["probability"]): number {
  const map: Record<MappedRisco["probability"], number> = { "Muito Alta": 5, "Alta": 4, "Média": 3, "Baixa": 2, "Muito Baixa": 1 };
  return map[probability];
}

function toImpactNum(impact: MappedRisco["impact"]): number {
  const map: Record<MappedRisco["impact"], number> = { "Catastrófico": 5, "Crítico": 4, "Moderado": 3, "Menor": 2, "Insignificante": 1 };
  return map[impact];
}

function toCapaPriority(weight: number, answer: "nao" | "parcial"): MappedCapa["priority"] {
  if (answer === "nao" && weight === 3) return "Crítica";
  if (answer === "nao" && weight === 2) return "Alta";
  if (answer === "parcial" && weight === 3) return "Alta";
  if (answer === "nao")  return "Média";
  return "Baixa";
}

function toCapaDueDays(priority: MappedCapa["priority"]): number {
  if (priority === "Crítica") return 30;
  if (priority === "Alta")    return 60;
  if (priority === "Média")   return 90;
  return 120;
}

function gutScores(weight: number, answer: "nao" | "parcial"): { gravity: number; urgency: number; tendency: number } {
  if (answer === "nao") {
    if (weight === 3) return { gravity: 5, urgency: 5, tendency: 4 };
    if (weight === 2) return { gravity: 4, urgency: 4, tendency: 3 };
    return { gravity: 3, urgency: 3, tendency: 2 };
  }
  // parcial
  if (weight === 3) return { gravity: 4, urgency: 3, tendency: 3 };
  if (weight === 2) return { gravity: 3, urgency: 3, tendency: 2 };
  return { gravity: 2, urgency: 2, tendency: 2 };
}

/** Compute section score from answers */
function calcSectionScore(
  answers: Record<string, string | null>,
  questionIds: string[],
  questionWeights: Record<string, number>
): number | null {
  let totalWeight = 0;
  let earnedWeight = 0;
  let answered = 0;

  for (const id of questionIds) {
    const ans = answers[id];
    const weight = questionWeights[id] ?? 1;
    if (ans === "na") continue;
    if (ans === null || ans === undefined) continue;
    answered++;
    totalWeight += weight;
    if (ans === "sim")     earnedWeight += weight;
    else if (ans === "parcial") earnedWeight += weight * 0.5;
    // "nao" adds 0
  }
  if (answered === 0 || totalWeight === 0) return null;
  return Math.round((earnedWeight / totalWeight) * 100);
}

// ─── Question IDs per section ─────────────────────────────────────────────────

const SECTION_QUESTIONS: Record<string, { ids: string[]; weights: Record<string, number> }> = {
  gov:  { ids: ["gov1","gov2","gov3","gov4","gov5","gov6","gov7","gov8"], weights: { gov1:2,gov2:2,gov3:2,gov4:1,gov5:1,gov6:1,gov7:2,gov8:1 } },
  plan: { ids: ["plan1","plan2","plan3","plan4","plan5","plan6","plan7","plan8"], weights: { plan1:2,plan2:2,plan3:1,plan4:2,plan5:1,plan6:1,plan7:2,plan8:1 } },
  seg:  { ids: ["seg1","seg2","seg3","seg4","seg5","seg6","seg7","seg8","seg9","seg10","seg11","seg12"], weights: { seg1:3,seg2:3,seg3:2,seg4:3,seg5:3,seg6:2,seg7:2,seg8:3,seg9:2,seg10:1,seg11:3,seg12:3 } },
  inf:  { ids: ["inf1","inf2","inf3","inf4","inf5","inf6","inf7","inf8"], weights: { inf1:3,inf2:3,inf3:2,inf4:2,inf5:3,inf6:2,inf7:2,inf8:1 } },
  doc:  { ids: ["doc1","doc2","doc3","doc4","doc5","doc6","doc7","doc8","doc9"], weights: { doc1:2,doc2:2,doc3:2,doc4:2,doc5:1,doc6:2,doc7:2,doc8:1,doc9:2 } },
  rh:   { ids: ["rh1","rh2","rh3","rh4","rh5","rh6","rh7","rh8","rh9","rh10"], weights: { rh1:2,rh2:2,rh3:2,rh4:3,rh5:1,rh6:2,rh7:3,rh8:1,rh9:1,rh10:1 } },
  ass:  { ids: ["ass1","ass2","ass3","ass4","ass5","ass6","ass7","ass8","ass9","ass10"], weights: { ass1:2,ass2:3,ass3:2,ass4:2,ass5:2,ass6:2,ass7:2,ass8:2,ass9:1,ass10:2 } },
  farm: { ids: ["farm1","farm2","farm3","farm4","farm5","farm6","farm7","farm8"], weights: { farm1:3,farm2:2,farm3:2,farm4:3,farm5:2,farm6:3,farm7:2,farm8:2 } },
  cme:  { ids: ["cme1","cme2","cme3","cme4","cme5","cme6","cme7"], weights: { cme1:3,cme2:3,cme3:2,cme4:2,cme5:3,cme6:2,cme7:2 } },
  cap:  { ids: ["cap1","cap2","cap3","cap4","cap5","cap6","cap7"], weights: { cap1:2,cap2:3,cap3:2,cap4:2,cap5:2,cap6:1,cap7:1 } },
  ind:  { ids: ["ind1","ind2","ind3","ind4","ind5","ind6","ind7","ind8"], weights: { ind1:2,ind2:2,ind3:2,ind4:2,ind5:2,ind6:1,ind7:2,ind8:2 } },
  inf2: { ids: ["inf2a","inf2b","inf2c","inf2d","inf2e","inf2f","inf2g","inf2h"], weights: { inf2a:3,inf2b:2,inf2c:2,inf2d:2,inf2e:2,inf2f:2,inf2g:3,inf2h:2 } },
};

// ─── Policy date helpers ──────────────────────────────────────────────────────

function buildPolicyDates(answer: string | null): { lastReview: string; nextReview: string; status: MappedPolitica["status"] } {
  if (answer === "sim") {
    const last = new Date();
    last.setMonth(last.getMonth() - 6);
    const next = new Date();
    next.setFullYear(next.getFullYear() + 2);
    return {
      lastReview: last.toISOString().split("T")[0],
      nextReview: next.toISOString().split("T")[0],
      status: "Vigente",
    };
  }
  // parcial
  const last = new Date();
  last.setFullYear(last.getFullYear() - 1);
  const next = new Date();
  next.setMonth(next.getMonth() + 6);
  return {
    lastReview: last.toISOString().split("T")[0],
    nextReview: next.toISOString().split("T")[0],
    status: "Em revisão",
  };
}

function categoryToResponsible(category: string, companyInfo: AssessmentCompanyInfo): string {
  const tm = companyInfo.technicalManager || "Responsável Técnico";
  const map: Record<string, string> = {
    "Governança": "Direção Geral",
    "Planejamento": "Direção Geral",
    "Segurança": "Núcleo de Segurança do Paciente",
    "Infecção": "SCIH",
    "Documentação": "Gestor da Qualidade",
    "RH": "Gestão de Pessoas",
    "Assistência": "Coordenação Assistencial",
    "Farmácia": "Farmácia Hospitalar",
    "CME": "CME",
    "Capacitação": "Educação Continuada",
    "Melhoria Contínua": "Gestor da Qualidade",
    "Infraestrutura": "Engenharia Clínica",
  };
  return map[category] || tm;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function mapAssessmentToSystemData(
  assessment: {
    id: string;
    companyName: string;
    evaluatorName: string;
    answers: Record<string, string | null>;
    scores: { n1: number; n2: number; n3: number; overall: number };
    submittedAt: string;
  },
  companyInfo: AssessmentCompanyInfo,
  validatedBy: string
): ValidatedTenantData {
  const { answers, scores } = assessment;

  // ── 1. Compute section scores ──────────────────────────────────────────────
  const sectionScores: Record<string, number | null> = {};
  for (const [section, { ids, weights }] of Object.entries(SECTION_QUESTIONS)) {
    sectionScores[section] = calcSectionScore(answers, ids, weights);
  }

  // ── 2. Generate Indicadores (one per section) ──────────────────────────────
  const indicadores: MappedIndicador[] = [];
  let indId = 1;
  for (const [section, config] of Object.entries(SECTION_INDICADOR_CONFIG)) {
    const score = sectionScores[section];
    if (score === null) continue;
    const status = scoreToStatus(score);
    const critical = config.critical_threshold !== undefined ? score < config.critical_threshold : false;
    indicadores.push({
      id: indId++,
      name: config.name,
      value: score,
      target: 80,
      unit: "%",
      status,
      trend: scoreToTrend(score),
      category: config.category,
      layer: config.layer,
      critical,
      description: `Score derivado da avaliação ONA 2026 — ${config.category}. Meta: ≥80%.`,
    });
  }

  // ── 3. Generate Riscos, GUT items, CAPAs, Políticas from answers ──────────
  const riscos: MappedRisco[] = [];
  const gutItems: MappedGutItem[] = [];
  const capas: MappedCapa[] = [];
  const politicas: MappedPolitica[] = [];
  const gaps: Array<{ id: string; text: string; weight: number; section: string }> = [];

  let riscoId = 1;
  let gutId = 1;
  let capaId = 1;
  let politicaId = 1;

  // Iterate all questions in order
  for (const [section, { ids, weights }] of Object.entries(SECTION_QUESTIONS)) {
    for (const qId of ids) {
      const ans = answers[qId];
      const weight = weights[qId] ?? 1;
      const meta = QUESTION_META[qId];

      // Track gap
      if (ans === "nao" || ans === "parcial") {
        gaps.push({ id: qId, text: meta?.capaTitle || qId, weight, section });
      }

      // Política from "sim" or "parcial" when policy title exists
      if (meta?.policyTitle && (ans === "sim" || ans === "parcial")) {
        const dates = buildPolicyDates(ans);
        politicas.push({
          id: politicaId++,
          title: meta.policyTitle,
          category: meta.category,
          version: ans === "sim" ? "2.0" : "1.0",
          status: dates.status,
          lastReview: dates.lastReview,
          nextReview: dates.nextReview,
          responsible: categoryToResponsible(meta.category, companyInfo),
          type: meta.policyType ?? "Protocolo",
        });
      }

      // Risco from "nao" or "parcial" when risk title exists
      if (meta?.riskTitle && (ans === "nao" || ans === "parcial")) {
        const prob = toProbability(weight, ans as "nao" | "parcial");
        const impact = toImpact(weight);
        const level = toRiskLevel(prob, impact);
        const daysToMitigate = ans === "nao" ? (weight === 3 ? 30 : weight === 2 ? 60 : 90) : 90;
        riscos.push({
          id: riscoId++,
          title: meta.riskTitle,
          category: meta.category,
          probability: prob,
          impact,
          level,
          status: ans === "nao" ? "Identificado" : "Em Mitigação",
          owner: categoryToResponsible(meta.category, companyInfo),
          dueDate: addDays(daysToMitigate),
          mitigation: meta.capaTitle || `Implementar controles para ${meta.riskTitle}`,
          source: qId,
          prob: toProbNum(prob),
          impact_num: toImpactNum(impact),
          cat: meta.riskCat ?? "Operacional",
        });
      }

      // GUT item from "nao" or "parcial"
      if ((ans === "nao" || ans === "parcial") && meta?.capaTitle) {
        const gs = gutScores(weight, ans as "nao" | "parcial");
        gutItems.push({
          id: gutId++,
          title: meta.capaTitle,
          unit: meta.category,
          gravity: gs.gravity,
          urgency: gs.urgency,
          tendency: gs.tendency,
          category: meta.category,
          responsible: categoryToResponsible(meta.category, companyInfo),
          deadline: addDays(ans === "nao" ? 60 : 90),
          status: ans === "nao" ? "Pendente" : "Em andamento",
          answer: ans as "nao" | "parcial",
          origin: "Avaliação ONA",
          originCode: `ONA-${qId.toUpperCase()}`,
          chapter: meta.chapter || "Cap. 1",
          aiJustification: `${ans === "nao" ? "Não conformidade identificada" : "Conformidade parcial"} na avaliação ONA 2026. ${weight === 3 ? "Requisito mandatório — impacto crítico na acreditação." : weight === 2 ? "Requisito crítico — risco regulatório." : "Requisito de melhoria."}`,
        });
      }

      // CAPA from "nao" or "parcial"
      if ((ans === "nao" || ans === "parcial") && meta?.capaTitle) {
        const priority = toCapaPriority(weight, ans as "nao" | "parcial");
        capas.push({
          id: capaId++,
          title: meta.capaTitle,
          description: `${ans === "nao" ? "Não conformidade" : "Conformidade parcial"} detectada na Avaliação Inicial ONA 2026 — questão ${qId}. ${meta.riskTitle ? `Risco associado: ${meta.riskTitle}.` : ""}`,
          type: ans === "nao" ? "Corretiva" : "Melhoria",
          status: "Aberta",
          priority,
          responsible: categoryToResponsible(meta.category, companyInfo),
          dueDate: addDays(toCapaDueDays(priority)),
          origin: `Avaliação ONA 2026 — ${section.toUpperCase()}`,
          questionId: qId,
        });
      }
    }
  }

  // ── 4. Radar data ──────────────────────────────────────────────────────────
  const radarSubjects: Array<{ subject: string; sections: string[] }> = [
    { subject: "Governança", sections: ["gov", "plan"] },
    { subject: "Segurança",  sections: ["seg"] },
    { subject: "Infecção",   sections: ["inf"] },
    { subject: "Documentação", sections: ["doc"] },
    { subject: "RH",         sections: ["rh", "cap"] },
    { subject: "Farmácia",   sections: ["farm", "cme"] },
    { subject: "Indicadores", sections: ["ind"] },
  ];

  const radarData = radarSubjects.map(({ subject, sections }) => {
    const vals = sections.map(s => sectionScores[s]).filter(v => v !== null) as number[];
    const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    return { subject, value: avg, fullMark: 100 };
  });

  return {
    assessmentId: assessment.id,
    companyInfo,
    validatedAt: new Date().toISOString(),
    validatedBy,
    scores,
    sectionScores,
    indicadores,
    riscos,
    gutItems,
    politicas,
    capas,
    gaps,
    radarData,
  };
}
