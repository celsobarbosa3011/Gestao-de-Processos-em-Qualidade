/**
 * audit-intelligence.ts
 * Motor de inteligência para auditoria ONA 2026 automatizada.
 * Mapeia dados do sistema (ValidatedTenantData, histórico, localStorage)
 * para respostas de conformidade com rastreabilidade e pontuação de confiança.
 */

import { ValidatedTenantData } from "@/lib/assessment-mapper";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Conformidade =
  | "Conforme Total"
  | "Conforme Parcial"
  | "Não Conforme"
  | "Não Aplicável"
  | "";

export type AutoFillSource =
  | "indicadores"
  | "riscos"
  | "politicas"
  | "capas"
  | "gut"
  | "avaliacao_inicial"
  | "historico"
  | "manual";

export interface AuditEntry {
  /** Código do requisito ONA */
  codigo: string;
  /** Conformidade detectada ou atribuída */
  conformidade: Conformidade;
  /** Observação automática ou manual */
  observacao: string;
  /** Fonte que originou o preenchimento */
  source: AutoFillSource;
  /** 0–100: quão confiante é o preenchimento automático */
  confidence: number;
  /** Sugestão de melhoria gerada pela IA */
  suggestion?: string;
  /** Alerta quando diverge do histórico anterior */
  alert?: string;
  /** true = campo foi preenchido automaticamente, false = revisado manualmente */
  autoFilled: boolean;
  /** Rastreabilidade: quando foi preenchido/alterado */
  changedAt?: string;
  /** Rastreabilidade: quem alterou (userId ou "sistema") */
  changedBy?: string;
  /** Rastreabilidade: motivo da alteração manual */
  changeReason?: string;
}

export interface AuditChangeLog {
  codigo: string;
  previousConformidade: Conformidade;
  newConformidade: Conformidade;
  changedAt: string;
  changedBy: string;
  reason: string;
}

export interface AuditSession {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  userId: string;
  unitId?: string;
  entries: Record<string, AuditEntry>;
  changelog: AuditChangeLog[];
  summary: AuditSummary;
}

export interface AuditSummary {
  totalRequisitos: number;
  autoPreenchidos: number;
  revisadosManuais: number;
  conformeTotal: number;
  conformeParcial: number;
  naoConforme: number;
  naoAplicavel: number;
  semResposta: number;
  scoreN1: number;
  scoreN2: number;
  scoreN3: number;
  alertas: string[];
  sugestoes: string[];
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

export const AUDIT_SESSION_KEY = "ona_audit_session";
export const AUDIT_HISTORY_KEY = "ona_audit_history";

// ─── Mapeamento de Requisitos → Dados do Sistema ──────────────────────────────

/**
 * Para cada código de requisito ONA, define quais dados do sistema
 * são relevantes para determinar a conformidade automaticamente.
 */
interface RequisitoMapping {
  /** Prefixos de categoria de indicadores relacionados */
  indicadorCategories?: string[];
  /** Títulos de políticas/protocolos relacionados (contains match) */
  politicaKeywords?: string[];
  /** Títulos de riscos relacionados (contains match) */
  riscoKeywords?: string[];
  /** Títulos de CAPAs relacionados */
  capaKeywords?: string[];
  /** IDs de seção da avaliação inicial relacionados */
  avaliacaoSections?: string[];
  /** Lógica de confiança base */
  baseConfidence: number;
}

// Mapeamento baseado nos códigos ONA dos grupos
const REQUISITO_MAPPINGS: Record<string, RequisitoMapping> = {
  // 1.1 – Liderança Organizacional: Planejamento Estratégico
  "1.1.1.1-N1": { politicaKeywords: ["missão", "visão", "valores", "estratégi"], avaliacaoSections: ["gov", "plan"], baseConfidence: 85 },
  "1.1.1.2-N2": { indicadorCategories: ["Planejamento", "Governança", "Estratégico"], politicaKeywords: ["plano estratégico", "bsc", "mapa estratégico"], avaliacaoSections: ["plan"], baseConfidence: 80 },
  "1.1.1.3-N3": { indicadorCategories: ["Planejamento"], avaliacaoSections: ["plan"], baseConfidence: 60 },

  // 1.1 – Diretrizes Estratégicas
  "1.1.2.1-N1": { politicaKeywords: ["organograma", "estrutura organizacional", "regimento"], avaliacaoSections: ["gov"], baseConfidence: 80 },
  "1.1.2.2-N2": { avaliacaoSections: ["gov"], politicaKeywords: ["regimento interno"], baseConfidence: 75 },
  "1.1.2.3-N3": { avaliacaoSections: ["gov"], baseConfidence: 55 },

  // 1.1 – Comprometimento da Alta Liderança
  "1.1.3.1-N1": { avaliacaoSections: ["gov"], capaKeywords: ["liderança", "governança"], baseConfidence: 70 },
  "1.1.3.2-N2": { avaliacaoSections: ["gov", "plan"], baseConfidence: 65 },
  "1.1.3.3-N3": { avaliacaoSections: ["gov"], baseConfidence: 50 },

  // 1.2 – Gestão de Pessoas
  "1.2.1.1-N1": { avaliacaoSections: ["rh"], indicadorCategories: ["RH"], politicaKeywords: ["dimensionamento", "quadro de pessoal"], baseConfidence: 80 },
  "1.2.1.2-N2": { avaliacaoSections: ["rh"], politicaKeywords: ["educação continuada", "capacitação", "treinamento"], baseConfidence: 75 },
  "1.2.1.3-N3": { avaliacaoSections: ["rh"], indicadorCategories: ["RH"], baseConfidence: 55 },

  // 1.2 – Saúde Ocupacional
  "1.2.2.1-N1": { avaliacaoSections: ["rh"], politicaKeywords: ["pcmso", "saúde ocupacional", "pgr"], baseConfidence: 80 },
  "1.2.2.2-N2": { avaliacaoSections: ["rh"], indicadorCategories: ["RH"], baseConfidence: 70 },
  "1.2.2.3-N3": { avaliacaoSections: ["rh"], baseConfidence: 50 },

  // 1.3 – Atenção ao Paciente
  "1.3.1.1-N1": { avaliacaoSections: ["ass"], indicadorCategories: ["Segurança", "Assistencial"], politicaKeywords: ["fluxo de atendimento", "processo assistencial"], baseConfidence: 85 },
  "1.3.1.2-N2": { avaliacaoSections: ["ass"], politicaKeywords: ["protocolo clínico", "evidência"], baseConfidence: 80 },
  "1.3.1.3-N3": { avaliacaoSections: ["ass"], indicadorCategories: ["Segurança"], baseConfidence: 60 },

  // 1.3 – Segurança do Paciente
  "1.3.2.1-N1": { avaliacaoSections: ["seg"], politicaKeywords: ["nsp", "núcleo de segurança"], riscoKeywords: ["nsp"], baseConfidence: 90 },
  "1.3.2.2-N2": { avaliacaoSections: ["seg"], politicaKeywords: ["identificação do paciente", "pulseira"], baseConfidence: 85 },
  "1.3.2.3-N3": { avaliacaoSections: ["seg"], baseConfidence: 65 },

  // 1.3 – Farmácia
  "1.3.3.1-N1": { avaliacaoSections: ["farm"], politicaKeywords: ["farmácia", "medicamento"], riscoKeywords: ["farmácia", "medicamento"], baseConfidence: 85 },
  "1.3.3.2-N2": { avaliacaoSections: ["farm"], politicaKeywords: ["mav", "alta vigilância", "psicotrópico"], baseConfidence: 80 },
  "1.3.3.3-N3": { avaliacaoSections: ["farm"], indicadorCategories: ["Farmácia"], baseConfidence: 60 },

  // 1.3 – CME
  "1.3.4.1-N1": { avaliacaoSections: ["cme"], politicaKeywords: ["cme", "central de materiais", "esterilização"], riscoKeywords: ["cme", "esterilização"], baseConfidence: 85 },
  "1.3.4.2-N2": { avaliacaoSections: ["cme"], politicaKeywords: ["rdc 15", "processamento"], baseConfidence: 80 },
  "1.3.4.3-N3": { avaliacaoSections: ["cme"], indicadorCategories: ["CME"], baseConfidence: 55 },

  // 1.4 – Infraestrutura e Apoio
  "1.4.1.1-N1": { avaliacaoSections: ["inf", "inf2"], indicadorCategories: ["Infraestrutura"], baseConfidence: 75 },
  "1.4.1.2-N2": { avaliacaoSections: ["inf"], politicaKeywords: ["manutenção", "preventiva"], baseConfidence: 70 },
  "1.4.1.3-N3": { avaliacaoSections: ["inf"], baseConfidence: 50 },

  // 1.4 – Controle de Infecções (SCIH)
  "1.4.2.1-N1": { avaliacaoSections: ["inf"], politicaKeywords: ["scih", "infecção hospitalar", "iras", "ppci"], riscoKeywords: ["infecção", "scih"], baseConfidence: 90 },
  "1.4.2.2-N2": { avaliacaoSections: ["inf"], politicaKeywords: ["ppci", "bundles"], indicadorCategories: ["Infecção"], baseConfidence: 85 },
  "1.4.2.3-N3": { avaliacaoSections: ["inf"], indicadorCategories: ["Infecção"], baseConfidence: 65 },

  // 1.4 – Gestão de Documentos
  "1.4.3.1-N1": { avaliacaoSections: ["doc"], politicaKeywords: ["controle de documento", "pop", "protocolo"], baseConfidence: 80 },
  "1.4.3.2-N2": { avaliacaoSections: ["doc"], politicaKeywords: ["biblioteca", "revisão", "versão"], baseConfidence: 75 },
  "1.4.3.3-N3": { avaliacaoSections: ["doc"], baseConfidence: 55 },

  // 1.4 – Indicadores e Qualidade
  "1.4.4.1-N1": { avaliacaoSections: ["ind"], indicadorCategories: ["Qualidade", "ONA", "Segurança"], baseConfidence: 85 },
  "1.4.4.2-N2": { avaliacaoSections: ["ind"], indicadorCategories: ["Qualidade", "ONA"], baseConfidence: 80 },
  "1.4.4.3-N3": { avaliacaoSections: ["ind"], indicadorCategories: ["Qualidade"], baseConfidence: 60 },
};

// ─── Motor de Inteligência ────────────────────────────────────────────────────

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

/**
 * Avalia a conformidade de um requisito baseado nos dados do sistema.
 * Retorna conformidade, observação, confiança e sugestão.
 */
function avaliarRequisito(
  codigo: string,
  validatedData: ValidatedTenantData,
  avaliacaoData: Record<string, any> | null
): Omit<AuditEntry, "autoFilled" | "changedAt" | "changedBy" | "changeReason"> {
  const mapping = REQUISITO_MAPPINGS[codigo];

  if (!mapping) {
    return {
      codigo,
      conformidade: "",
      observacao: "",
      source: "avaliacao_inicial",
      confidence: 0,
      autoFilled: false,
    };
  }

  const evidencias: string[] = [];
  let pontuacao = 0;
  let totalCriteria = 0;
  const sugestoes: string[] = [];
  const alertas: string[] = [];

  // 1. Verificar políticas/documentos
  if (mapping.politicaKeywords && mapping.politicaKeywords.length > 0) {
    totalCriteria++;
    const politicasRelacionadas = validatedData.politicas.filter(p =>
      containsAny(p.title, mapping.politicaKeywords!)
    );
    if (politicasRelacionadas.length > 0) {
      const vigentes = politicasRelacionadas.filter(p => p.status === "Vigente");
      const emRevisao = politicasRelacionadas.filter(p => p.status === "Em revisão");
      if (vigentes.length > 0) {
        pontuacao += 1;
        evidencias.push(`${vigentes.length} documento(s) vigente(s): ${vigentes.map(p => p.title).join(", ")}`);
      } else if (emRevisao.length > 0) {
        pontuacao += 0.5;
        evidencias.push(`${emRevisao.length} documento(s) em revisão: ${emRevisao.map(p => p.title).join(", ")}`);
        sugestoes.push("Concluir revisão dos documentos identificados");
      } else {
        sugestoes.push(`Atualizar documentação: ${politicasRelacionadas[0]?.title}`);
      }
    } else {
      sugestoes.push(`Criar documentação relacionada a: ${mapping.politicaKeywords.join(", ")}`);
    }
  }

  // 2. Verificar indicadores
  if (mapping.indicadorCategories && mapping.indicadorCategories.length > 0) {
    totalCriteria++;
    const indicadoresRelacionados = validatedData.indicadores.filter(i =>
      mapping.indicadorCategories!.includes(i.category) || mapping.indicadorCategories!.includes(i.layer)
    );
    if (indicadoresRelacionados.length > 0) {
      const dentroMeta = indicadoresRelacionados.filter(i => i.status === "Dentro da Meta");
      const atencao = indicadoresRelacionados.filter(i => i.status === "Atenção");
      const abaixo = indicadoresRelacionados.filter(i => i.status === "Abaixo da Meta");
      if (dentroMeta.length >= Math.ceil(indicadoresRelacionados.length * 0.7)) {
        pontuacao += 1;
        evidencias.push(`${indicadoresRelacionados.length} indicador(es) monitorado(s), ${dentroMeta.length} dentro da meta`);
      } else if (atencao.length > 0 || dentroMeta.length > 0) {
        pontuacao += 0.5;
        evidencias.push(`Indicadores com atenção: ${atencao.map(i => i.name).join(", ")}`);
        sugestoes.push("Implementar planos de ação para indicadores abaixo da meta");
      } else {
        evidencias.push(`${abaixo.length} indicador(es) abaixo da meta`);
        alertas.push("Indicadores críticos fora da meta identificados");
        sugestoes.push("Revisar e tratar indicadores com resultados adversos");
      }
    } else {
      sugestoes.push("Definir e monitorar indicadores para esta área");
    }
  }

  // 3. Verificar riscos
  if (mapping.riscoKeywords && mapping.riscoKeywords.length > 0) {
    const riscosRelacionados = validatedData.riscos.filter(r =>
      containsAny(r.title, mapping.riscoKeywords!) || containsAny(r.mitigation, mapping.riscoKeywords!)
    );
    if (riscosRelacionados.length > 0) {
      const criticos = riscosRelacionados.filter(r => r.level === "Crítico" || r.level === "Alto");
      if (criticos.length > 0) {
        alertas.push(`${criticos.length} risco(s) crítico(s) identificado(s): ${criticos.map(r => r.title).join(", ")}`);
        sugestoes.push("Priorizar mitigação de riscos críticos mapeados");
      } else {
        evidencias.push(`Riscos mapeados e sob controle: ${riscosRelacionados.map(r => r.title).join(", ")}`);
      }
    }
  }

  // 4. Verificar CAPAs
  if (mapping.capaKeywords && mapping.capaKeywords.length > 0) {
    const capasRelacionadas = validatedData.capas.filter(c =>
      containsAny(c.title, mapping.capaKeywords!) || containsAny(c.description, mapping.capaKeywords!)
    );
    if (capasRelacionadas.length > 0) {
      const concluidas = capasRelacionadas.filter(c => c.status === "Concluída");
      const emAndamento = capasRelacionadas.filter(c => c.status === "Em andamento");
      if (concluidas.length > 0) {
        pontuacao += 0.5;
        evidencias.push(`${concluidas.length} ação(ões) corretiva(s) concluída(s)`);
      } else if (emAndamento.length > 0) {
        evidencias.push(`${emAndamento.length} ação(ões) corretiva(s) em andamento`);
      }
    }
  }

  // 5. Verificar dados da avaliação inicial
  if (mapping.avaliacaoSections && mapping.avaliacaoSections.length > 0 && avaliacaoData) {
    totalCriteria++;
    let sectionsOk = 0;
    let sectionsPartial = 0;
    for (const sectionId of mapping.avaliacaoSections) {
      const sectionData = avaliacaoData[sectionId];
      if (sectionData) {
        const answers = Object.values(sectionData as Record<string, string>);
        const simCount = answers.filter(a => a === "sim").length;
        const naoCount = answers.filter(a => a === "nao").length;
        const total = answers.length;
        if (total > 0) {
          const ratio = simCount / total;
          if (ratio >= 0.7) sectionsOk++;
          else if (ratio >= 0.4) sectionsPartial++;
        }
      }
    }
    if (sectionsOk > 0) {
      pontuacao += 1;
    } else if (sectionsPartial > 0) {
      pontuacao += 0.5;
    }
  }

  // Calcular conformidade final
  const score = totalCriteria > 0 ? pontuacao / totalCriteria : 0;
  let conformidade: Conformidade;
  let confidence: number;

  if (score >= 0.75) {
    conformidade = "Conforme Total";
    confidence = Math.round(mapping.baseConfidence + (score - 0.75) * 40);
  } else if (score >= 0.4) {
    conformidade = "Conforme Parcial";
    confidence = Math.round(mapping.baseConfidence * 0.85);
  } else if (evidencias.length === 0 && sugestoes.length > 0) {
    conformidade = "Não Conforme";
    confidence = Math.round(mapping.baseConfidence * 0.7);
  } else if (totalCriteria === 0) {
    conformidade = "";
    confidence = 0;
  } else {
    conformidade = "Não Conforme";
    confidence = Math.round(mapping.baseConfidence * 0.75);
  }

  // Garantir que confidence não ultrapasse 97
  confidence = Math.min(97, Math.max(0, confidence));

  const observacao = evidencias.length > 0 ? evidencias.join(" | ") : "";
  const suggestion = sugestoes.length > 0 ? sugestoes[0] : undefined;
  const alert = alertas.length > 0 ? alertas[0] : undefined;

  return {
    codigo,
    conformidade,
    observacao,
    source: evidencias.length > 0 ? detectPrimarySource(mapping) : "avaliacao_inicial",
    confidence,
    suggestion,
    alert,
    autoFilled: false, // será definido pelo motor principal
  };
}

function detectPrimarySource(mapping: RequisitoMapping): AutoFillSource {
  if (mapping.politicaKeywords?.length) return "politicas";
  if (mapping.indicadorCategories?.length) return "indicadores";
  if (mapping.riscoKeywords?.length) return "riscos";
  if (mapping.capaKeywords?.length) return "capas";
  return "avaliacao_inicial";
}

// ─── API Pública ──────────────────────────────────────────────────────────────

interface RequisitONA {
  codigo: string;
  descricao: string;
  nivel: "N1" | "N2" | "N3";
  isCore: boolean;
  orientacao: string;
}

interface GrupoONA {
  id: string;
  titulo: string;
  subsecao: string;
  requisitos: RequisitONA[];
}

/**
 * Executa o motor de inteligência para preencher automaticamente
 * todos os requisitos com base nos dados disponíveis do sistema.
 */
export function runAuditIntelligence(
  grupos: GrupoONA[],
  validatedData: ValidatedTenantData | null,
  userId: string
): Record<string, AuditEntry> {
  if (!validatedData) return {};

  // Ler dados da avaliação inicial do localStorage
  let avaliacaoData: Record<string, any> | null = null;
  try {
    const raw = localStorage.getItem("ona_assessments");
    if (raw) {
      const arr = JSON.parse(raw) as any[];
      if (arr.length > 0) {
        avaliacaoData = arr[arr.length - 1]?.answers ?? null;
      }
    }
  } catch {
    avaliacaoData = null;
  }

  const entries: Record<string, AuditEntry> = {};
  const now = new Date().toISOString();

  for (const grupo of grupos) {
    for (const req of grupo.requisitos) {
      const result = avaliarRequisito(req.codigo, validatedData, avaliacaoData);
      entries[req.codigo] = {
        ...result,
        autoFilled: result.conformidade !== "",
        changedAt: result.conformidade !== "" ? now : undefined,
        changedBy: result.conformidade !== "" ? "sistema" : undefined,
      };
    }
  }

  return entries;
}

/**
 * Calcula scores por nível (N1, N2, N3) a partir das entradas de auditoria.
 */
export function calcularScores(
  grupos: GrupoONA[],
  entries: Record<string, AuditEntry>
): { n1: number; n2: number; n3: number } {
  const count = { N1: 0, N2: 0, N3: 0 };
  const conformes = { N1: 0, N2: 0, N3: 0 };

  for (const grupo of grupos) {
    for (const req of grupo.requisitos) {
      const nivel = req.nivel as "N1" | "N2" | "N3";
      const entry = entries[req.codigo];
      count[nivel]++;
      if (!entry) continue;
      if (entry.conformidade === "Conforme Total") conformes[nivel] += 1;
      else if (entry.conformidade === "Conforme Parcial") conformes[nivel] += 0.5;
    }
  }

  return {
    n1: count.N1 > 0 ? Math.round((conformes.N1 / count.N1) * 100) : 0,
    n2: count.N2 > 0 ? Math.round((conformes.N2 / count.N2) * 100) : 0,
    n3: count.N3 > 0 ? Math.round((conformes.N3 / count.N3) * 100) : 0,
  };
}

/**
 * Registra uma alteração manual em um requisito com rastreabilidade.
 */
export function registrarAlteracaoManual(
  entries: Record<string, AuditEntry>,
  changelog: AuditChangeLog[],
  codigo: string,
  novaConformidade: Conformidade,
  novaObservacao: string,
  userId: string,
  motivo: string
): { entries: Record<string, AuditEntry>; changelog: AuditChangeLog[] } {
  const now = new Date().toISOString();
  const anterior = entries[codigo];

  const newChangelog: AuditChangeLog = {
    codigo,
    previousConformidade: anterior?.conformidade ?? "",
    newConformidade: novaConformidade,
    changedAt: now,
    changedBy: userId,
    reason: motivo,
  };

  const updated: Record<string, AuditEntry> = {
    ...entries,
    [codigo]: {
      ...(anterior ?? { codigo, source: "manual", confidence: 100, suggestion: undefined, alert: undefined }),
      conformidade: novaConformidade,
      observacao: novaObservacao,
      autoFilled: false,
      changedAt: now,
      changedBy: userId,
      changeReason: motivo,
    },
  };

  return {
    entries: updated,
    changelog: [...changelog, newChangelog],
  };
}

/**
 * Compara sessão atual com histórico para detectar regressões ou melhorias.
 */
export function compararComHistorico(
  codigoRequisito: string,
  conformidadeAtual: Conformidade,
  history: AuditSession[]
): { trend: "melhora" | "regresso" | "estavel" | "novo"; previousConformidade?: Conformidade } | null {
  const ORDER: Record<Conformidade, number> = {
    "Conforme Total": 3,
    "Conforme Parcial": 2,
    "Não Conforme": 1,
    "Não Aplicável": 0,
    "": -1,
  };

  const previousSessions = history
    .filter(s => s.entries[codigoRequisito])
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  if (previousSessions.length === 0) return { trend: "novo" };

  const prevConformidade = previousSessions[0].entries[codigoRequisito].conformidade;
  const prevScore = ORDER[prevConformidade];
  const currScore = ORDER[conformidadeAtual];

  if (currScore > prevScore) return { trend: "melhora", previousConformidade: prevConformidade };
  if (currScore < prevScore) return { trend: "regresso", previousConformidade: prevConformidade };
  return { trend: "estavel", previousConformidade: prevConformidade };
}

/**
 * Salva a sessão de auditoria no localStorage.
 */
export function salvarSessaoAuditoria(session: AuditSession): void {
  try {
    localStorage.setItem(AUDIT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignorar erros de quota
  }
}

/**
 * Carrega a sessão de auditoria em andamento do localStorage.
 */
export function carregarSessaoAuditoria(): AuditSession | null {
  try {
    const raw = localStorage.getItem(AUDIT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuditSession) : null;
  } catch {
    return null;
  }
}

/**
 * Finaliza e arquiva a sessão no histórico.
 */
export function finalizarSessaoAuditoria(session: AuditSession): void {
  try {
    const historyRaw = localStorage.getItem(AUDIT_HISTORY_KEY);
    const history: AuditSession[] = historyRaw ? JSON.parse(historyRaw) : [];
    const completed: AuditSession = { ...session, completedAt: new Date().toISOString() };
    history.unshift(completed); // mais recente primeiro
    // Manter apenas últimas 10 sessões
    const trimmed = history.slice(0, 10);
    localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(trimmed));
    localStorage.removeItem(AUDIT_SESSION_KEY);
  } catch {
    // Ignorar
  }
}

/**
 * Carrega o histórico de sessões finalizadas.
 */
export function carregarHistoricoAuditoria(): AuditSession[] {
  try {
    const raw = localStorage.getItem(AUDIT_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AuditSession[]) : [];
  } catch {
    return [];
  }
}

/**
 * Gera sumário de uma sessão de auditoria.
 */
export function gerarSumario(
  grupos: GrupoONA[],
  entries: Record<string, AuditEntry>
): AuditSummary {
  const scores = calcularScores(grupos, entries);
  const allReqs = grupos.flatMap(g => g.requisitos);

  const totals = allReqs.reduce(
    (acc, req) => {
      const e = entries[req.codigo];
      if (!e || e.conformidade === "") { acc.semResposta++; return acc; }
      if (e.conformidade === "Conforme Total") acc.conformeTotal++;
      else if (e.conformidade === "Conforme Parcial") acc.conformeParcial++;
      else if (e.conformidade === "Não Conforme") acc.naoConforme++;
      else if (e.conformidade === "Não Aplicável") acc.naoAplicavel++;
      if (e.autoFilled) acc.autoPreenchidos++;
      else acc.revisadosManuais++;
      return acc;
    },
    { conformeTotal: 0, conformeParcial: 0, naoConforme: 0, naoAplicavel: 0, semResposta: 0, autoPreenchidos: 0, revisadosManuais: 0 }
  );

  const alertas = Object.values(entries)
    .filter(e => e.alert)
    .map(e => `[${e.codigo}] ${e.alert!}`);

  const sugestoes = Object.values(entries)
    .filter(e => e.suggestion && e.conformidade !== "Conforme Total")
    .map(e => `[${e.codigo}] ${e.suggestion!}`)
    .slice(0, 10);

  return {
    totalRequisitos: allReqs.length,
    ...totals,
    scoreN1: scores.n1,
    scoreN2: scores.n2,
    scoreN3: scores.n3,
    alertas,
    sugestoes,
  };
}
