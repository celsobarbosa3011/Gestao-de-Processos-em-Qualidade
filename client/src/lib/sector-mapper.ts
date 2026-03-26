/**
 * sector-mapper.ts
 * Maps sectorial form answers → ValidatedTenantData for all 8 healthcare sectors.
 * Pure data/logic file — no JSX or React imports.
 */

import {
  ValidatedTenantData,
  MappedIndicador,
  MappedRisco,
  MappedGutItem,
  MappedPolitica,
  MappedCapa,
  VALIDATED_DATA_KEY,
} from "./assessment-mapper";

// ─── Storage Key ─────────────────────────────────────────────────────────────

export const SECTOR_STORAGE_KEY = "sector_submissions";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SectorQuestion {
  id: string;
  text: string;
  type: "metric" | "compliance";
  // Metric fields
  metricUnit?: string;
  metricTarget?: number;
  metricTargetDirection?: "lower" | "higher";
  metricLabel?: string;
  metricLayer?: string;
  // Compliance fields
  weight?: 1 | 2 | 3;
  riskTitle?: string;
  policyTitle?: string;
  capaTitle?: string;
  category?: string;
  help?: string;
}

export interface Sector {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
  gradientFrom: string;
  gradientTo: string;
  iconName: string; // Maps to Lucide icon in components
  questions: SectorQuestion[];
}

export interface SectorSubmission {
  id: string;
  sectorId: string;
  sectorName: string;
  companyName: string;
  submittedBy: string;
  submittedAt: string;
  answers: Record<string, string>;
}

// ─── Sector Definitions ───────────────────────────────────────────────────────

export const SECTORS: Sector[] = [
  // 1. Farmácia
  {
    id: "farmacia",
    name: "Farmácia Hospitalar",
    subtitle: "Gestão de medicamentos, dispensação e farmácia clínica",
    color: "pink",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
    badgeColor: "bg-pink-100 text-pink-700",
    gradientFrom: "from-pink-500",
    gradientTo: "to-rose-600",
    iconName: "Pill",
    questions: [
      { id: "farm_rt", type: "compliance", text: "A farmácia possui Farmacêutico Responsável Técnico habilitado?", weight: 3, riskTitle: "Farmácia sem Responsável Técnico habilitado", policyTitle: "Responsável Técnico da Farmácia Hospitalar", capaTitle: "Designar e registrar RT da Farmácia", category: "Farmácia", help: "Obrigatório pela legislação federal — RDC 204/2017 e CFM." },
      { id: "farm_remume", type: "compliance", text: "Existe Relação de Medicamentos Padronizados (REMUME) elaborada e vigente?", weight: 2, riskTitle: "Ausência de padronização de medicamentos (REMUME)", policyTitle: "REMUME — Relação de Medicamentos Padronizados", capaTitle: "Elaborar e aprovar REMUME institucional", category: "Farmácia" },
      { id: "farm_dupla", type: "compliance", text: "A dispensação é unitarizada ou possui dupla checagem antes da entrega?", weight: 2, riskTitle: "Dispensação sem dupla checagem — risco de erro de medicação", policyTitle: "Protocolo de Dispensação com Dupla Checagem", capaTitle: "Implantar dupla checagem na dispensação", category: "Farmácia", help: "Dupla conferência antes de dispensar reduz erros de medicação em até 70%." },
      { id: "farm_controlados", type: "compliance", text: "Os medicamentos controlados são armazenados conforme RDC 204/2017?", weight: 3, riskTitle: "Medicamentos controlados fora das normas RDC 204/2017", policyTitle: "Política de Controle de Medicamentos Controlados", capaTitle: "Adequar armazenamento de medicamentos controlados", category: "Farmácia" },
      { id: "farm_mav", type: "compliance", text: "Os Medicamentos de Alta Vigilância (MAV) estão identificados com controles especiais?", weight: 3, riskTitle: "MAV sem identificação e controles especiais — risco grave", policyTitle: "Protocolo de Medicamentos de Alta Vigilância (MAV)", capaTitle: "Implantar controles especiais para MAV", category: "Farmácia" },
      { id: "farm_validade", type: "compliance", text: "Existe controle sistemático de validade e armazenamento de termolábeis?", weight: 2, riskTitle: "Medicamentos vencidos ou mal armazenados em uso", capaTitle: "Implantar controle de validade e temperatura", category: "Farmácia" },
      { id: "farm_clinica", type: "compliance", text: "Existe farmácia clínica com acompanhamento farmacoterapêutico dos pacientes?", weight: 2, policyTitle: "Programa de Farmácia Clínica", category: "Farmácia" },
      { id: "farm_erros", type: "metric", text: "Taxa de erros de medicação notificados (por 1.000 dispensações):", metricUnit: "/1000 disp.", metricTarget: 0.5, metricTargetDirection: "lower", metricLabel: "Taxa de Erros de Medicação", metricLayer: "Segurança" },
      { id: "farm_unitarizada", type: "metric", text: "% de dispensações com dupla checagem ou dose unitária:", metricUnit: "%", metricTarget: 80, metricTargetDirection: "higher", metricLabel: "Conformidade na Dispensação", metricLayer: "Segurança" },
      { id: "farm_intervencao", type: "metric", text: "% de prescrições com intervenção farmacêutica documentada:", metricUnit: "%", metricTarget: 15, metricTargetDirection: "higher", metricLabel: "Taxa de Intervenção Farmacêutica", metricLayer: "Qualidade Operacional" },
    ],
  },
  // 2. SCIH/CCIH
  {
    id: "scih",
    name: "SCIH — Controle de Infecção",
    subtitle: "IRAS, vigilância epidemiológica e CCIH",
    color: "orange",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    badgeColor: "bg-orange-100 text-orange-700",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-600",
    iconName: "Activity",
    questions: [
      { id: "scih_ccih", type: "compliance", text: "A CCIH (Subcomissão de Controle de Infecção) está constituída conforme Portaria MS 2616/1998?", weight: 3, riskTitle: "CCIH não constituída — risco regulatório Portaria 2616", policyTitle: "Regimento da CCIH", capaTitle: "Constituir CCIH conforme legislação", category: "Infecção Hospitalar" },
      { id: "scih_ppci", type: "compliance", text: "O PPCI (Programa de Prevenção e Controle de Infecção Hospitalar) está elaborado?", weight: 3, riskTitle: "Ausência de PPCI — programa de controle de infecção", policyTitle: "PPCI — Programa de Prevenção e Controle de Infecção", capaTitle: "Elaborar e aprovar PPCI", category: "Infecção Hospitalar" },
      { id: "scih_vigilancia", type: "compliance", text: "Existe vigilância ativa das IRAS (Infecções Relacionadas à Assistência à Saúde)?", weight: 2, riskTitle: "Ausência de vigilância ativa das IRAS", policyTitle: "Protocolo de Vigilância Epidemiológica de IRAS", category: "Infecção Hospitalar" },
      { id: "scih_pgrss", type: "compliance", text: "O PGRSS (Programa de Gerenciamento de Resíduos de Serviços de Saúde) está aprovado?", weight: 3, riskTitle: "PGRSS ausente — risco ambiental e sanitário", policyTitle: "PGRSS — Gerenciamento de Resíduos de Saúde", capaTitle: "Elaborar e aprovar PGRSS", category: "Infecção Hospitalar" },
      { id: "scih_treinamento", type: "compliance", text: "Os profissionais recebem treinamento periódico em precauções e isolamento?", weight: 2, riskTitle: "Profissionais sem treinamento em precauções padrão", capaTitle: "Implementar treinamento em precauções padrão", category: "Infecção Hospitalar" },
      { id: "scih_stewardship", type: "compliance", text: "Existe programa de uso racional de antimicrobianos (Stewardship)?", weight: 2, policyTitle: "Programa de Stewardship de Antimicrobianos", category: "Infecção Hospitalar" },
      { id: "scih_higiene", type: "metric", text: "Taxa de adesão à higienização das mãos (%):", metricUnit: "%", metricTarget: 85, metricTargetDirection: "higher", metricLabel: "Adesão à Higienização das Mãos", metricLayer: "Segurança" },
      { id: "scih_ipcs", type: "metric", text: "Taxa de IPCS (infecção primária corrente sanguínea) por 1.000 CVC-dia:", metricUnit: "/1000 CVC-dia", metricTarget: 0.8, metricTargetDirection: "lower", metricLabel: "Taxa de IPCS (Corrente Sanguínea)", metricLayer: "Segurança" },
      { id: "scih_pav", type: "metric", text: "Taxa de PAV (pneumonia associada ao ventilador) por 1.000 VM-dia:", metricUnit: "/1000 VM-dia", metricTarget: 1.5, metricTargetDirection: "lower", metricLabel: "Taxa de PAV (Pneumonia Ventilador)", metricLayer: "Segurança" },
      { id: "scih_itu", type: "metric", text: "Taxa de ITU-cateter por 1.000 SVD-dia:", metricUnit: "/1000 SVD-dia", metricTarget: 1.5, metricTargetDirection: "lower", metricLabel: "Taxa de ITU-Cateter", metricLayer: "Segurança" },
      { id: "scih_isc", type: "metric", text: "Taxa de ISC (infecção de sítio cirúrgico) (%):", metricUnit: "%", metricTarget: 2, metricTargetDirection: "lower", metricLabel: "Taxa de Infecção Sítio Cirúrgico (ISC)", metricLayer: "Segurança" },
    ],
  },
  // 3. NSP / Segurança do Paciente
  {
    id: "nsp",
    name: "NSP — Segurança do Paciente",
    subtitle: "Eventos adversos, protocolos e cultura de segurança",
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeColor: "bg-red-100 text-red-700",
    gradientFrom: "from-red-500",
    gradientTo: "to-rose-600",
    iconName: "Shield",
    questions: [
      { id: "nsp_nucleo", type: "compliance", text: "O NSP está constituído conforme RDC 36/2013 com regimento interno aprovado?", weight: 3, riskTitle: "NSP não constituído — não conformidade RDC 36/2013", policyTitle: "Regimento do Núcleo de Segurança do Paciente", capaTitle: "Constituir NSP e elaborar regimento interno", category: "Segurança" },
      { id: "nsp_identificacao", type: "compliance", text: "O protocolo de Identificação Correta do Paciente está implantado e auditado?", weight: 3, riskTitle: "Risco de erro por falha na identificação do paciente", policyTitle: "Protocolo de Identificação Correta do Paciente", capaTitle: "Implantar e auditar protocolo de identificação", category: "Segurança" },
      { id: "nsp_cirurgia", type: "compliance", text: "O protocolo de Cirurgia Segura (checklist OMS) está implantado?", weight: 3, riskTitle: "Ausência de Checklist Cirúrgico — risco intraoperatório", policyTitle: "Protocolo de Cirurgia Segura — Checklist OMS", capaTitle: "Implantar checklist de cirurgia segura", category: "Segurança" },
      { id: "nsp_medicamentos", type: "compliance", text: "O protocolo de administração segura de medicamentos (6 certos) está implantado?", weight: 3, riskTitle: "Ausência de protocolo dos 6 certos — erro de medicação", policyTitle: "Protocolo de Medicação Segura — 6 Certos", capaTitle: "Implantar protocolo de 6 certos", category: "Segurança" },
      { id: "nsp_notificacao", type: "compliance", text: "O sistema de notificação de eventos adversos está funcionando?", weight: 3, riskTitle: "Eventos adversos não notificados — subnotificação", policyTitle: "Sistema de Notificação de Eventos Adversos (SISNEP)", capaTitle: "Estruturar e divulgar sistema de notificação", category: "Segurança" },
      { id: "nsp_quedas", type: "compliance", text: "O protocolo de Prevenção de Quedas com avaliação de risco na admissão está implantado?", weight: 2, riskTitle: "Risco de queda de paciente sem protocolo preventivo", policyTitle: "Protocolo de Prevenção de Quedas", category: "Segurança" },
      { id: "nsp_lpp", type: "compliance", text: "O protocolo de Prevenção de LPP (Lesão por Pressão) com escala validada está implantado?", weight: 2, riskTitle: "Risco de lesão por pressão sem protocolo preventivo", policyTitle: "Protocolo de Prevenção de LPP — Escala Braden", category: "Segurança" },
      { id: "nsp_eventos", type: "metric", text: "Total de eventos adversos notificados no último mês:", metricUnit: "notificações", metricTarget: 5, metricTargetDirection: "higher", metricLabel: "Volume de Notificações — Cultura de Segurança", metricLayer: "Segurança", help: "Mais notificações indica cultura de segurança mais madura, não mais problemas." },
      { id: "nsp_quedas_taxa", type: "metric", text: "Taxa de quedas com dano por 1.000 pacientes-dia:", metricUnit: "/1000 pac-dia", metricTarget: 0.1, metricTargetDirection: "lower", metricLabel: "Taxa de Quedas com Dano", metricLayer: "Segurança" },
      { id: "nsp_lpp_taxa", type: "metric", text: "Prevalência de LPP (%):", metricUnit: "%", metricTarget: 1, metricTargetDirection: "lower", metricLabel: "Prevalência de Lesão por Pressão (LPP)", metricLayer: "Segurança" },
      { id: "nsp_cirurgia_conf", type: "metric", text: "% de conformidade com checklist cirúrgico (aplicado/total de cirurgias):", metricUnit: "%", metricTarget: 95, metricTargetDirection: "higher", metricLabel: "Conformidade com Checklist Cirúrgico", metricLayer: "Segurança" },
    ],
  },
  // 4. Enfermagem
  {
    id: "enfermagem",
    name: "Enfermagem",
    subtitle: "Assistência de enfermagem, protocolos e indicadores clínicos",
    color: "teal",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-700",
    badgeColor: "bg-teal-100 text-teal-700",
    gradientFrom: "from-teal-500",
    gradientTo: "to-emerald-600",
    iconName: "Heart",
    questions: [
      { id: "enf_plantao", type: "compliance", text: "Existe processo de passagem de plantão estruturado (SBAR/ISBAR)?", weight: 2, riskTitle: "Falha na comunicação na passagem de plantão", policyTitle: "Protocolo de Passagem de Plantão — SBAR", capaTitle: "Implantar protocolo de passagem de plantão SBAR", category: "Assistencial" },
      { id: "enf_admissao", type: "compliance", text: "A avaliação de risco na admissão (quedas, LPP, TEV, nutricional) é realizada?", weight: 2, riskTitle: "Avaliação de risco na admissão não realizada sistematicamente", policyTitle: "Protocolo de Avaliação de Risco na Admissão", category: "Assistencial" },
      { id: "enf_cuidados", type: "compliance", text: "O plano de cuidados individualizado é elaborado e registrado em prontuário?", weight: 2, riskTitle: "Ausência de plano de cuidados individualizado", policyTitle: "Protocolo de Elaboração de Plano de Cuidados", category: "Assistencial" },
      { id: "enf_alta", type: "compliance", text: "O processo de alta inclui orientações escritas ao paciente/familiar?", weight: 2, riskTitle: "Alta hospitalar sem orientações escritas ao paciente", policyTitle: "Protocolo de Alta Hospitalar com Orientações", category: "Assistencial" },
      { id: "enf_tev", type: "compliance", text: "Existe avaliação de risco para Tromboembolismo Venoso (TEV) nos pacientes internados?", weight: 2, riskTitle: "TEV não avaliado sistematicamente nos internados", policyTitle: "Protocolo de Prevenção de TEV", category: "Assistencial" },
      { id: "enf_proporcao", type: "metric", text: "Proporção média de pacientes por enfermeiro no turno da noite:", metricUnit: "pac/enf", metricTarget: 8, metricTargetDirection: "lower", metricLabel: "Proporção Pacientes/Enfermeiro (plantão noturno)", metricLayer: "Qualidade Operacional" },
      { id: "enf_quedas", type: "metric", text: "Taxa de quedas de pacientes por 1.000 pacientes-dia:", metricUnit: "/1000 pac-dia", metricTarget: 0.3, metricTargetDirection: "lower", metricLabel: "Taxa de Quedas de Pacientes", metricLayer: "Segurança" },
      { id: "enf_lpp", type: "metric", text: "% de pacientes com LPP graus 3 e 4 (adquirida na instituição):", metricUnit: "%", metricTarget: 0.5, metricTargetDirection: "lower", metricLabel: "LPP Graus 3 e 4 Adquirida na Instituição", metricLayer: "Segurança" },
      { id: "enf_plano_cuidados", type: "metric", text: "% de prontuários com plano de cuidados documentado:", metricUnit: "%", metricTarget: 80, metricTargetDirection: "higher", metricLabel: "Completude do Plano de Cuidados", metricLayer: "Qualidade Operacional" },
      { id: "enf_treinamento", type: "metric", text: "Horas de treinamento/colaborador enfermagem/ano:", metricUnit: "horas", metricTarget: 20, metricTargetDirection: "higher", metricLabel: "Carga de Treinamento — Equipe de Enfermagem", metricLayer: "Qualidade Operacional" },
    ],
  },
  // 5. CME
  {
    id: "cme",
    name: "CME — Central de Esterilização",
    subtitle: "Processamento de artigos médico-hospitalares",
    color: "slate",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
    badgeColor: "bg-slate-100 text-slate-700",
    gradientFrom: "from-slate-500",
    gradientTo: "to-gray-600",
    iconName: "Wrench",
    questions: [
      { id: "cme_rt", type: "compliance", text: "A CME possui Responsável Técnico de enfermagem habilitado?", weight: 3, riskTitle: "CME sem RT habilitado — risco regulatório e clínico", policyTitle: "Responsabilidade Técnica da CME", capaTitle: "Designar e qualificar RT da CME", category: "CME" },
      { id: "cme_protocolo", type: "compliance", text: "Os processos de limpeza, desinfecção e esterilização seguem protocolos RDC 15/2012?", weight: 3, riskTitle: "Esterilização fora dos padrões normativos RDC 15/2012", policyTitle: "Protocolo de Processamento de Artigos — RDC 15/2012", capaTitle: "Adequar protocolo de processamento à RDC 15/2012", category: "CME" },
      { id: "cme_rastreabilidade", type: "compliance", text: "Existe rastreabilidade dos artigos processados por lote de esterilização?", weight: 2, riskTitle: "Artigos processados sem rastreabilidade por lote", policyTitle: "Sistema de Rastreabilidade de Artigos CME", capaTitle: "Implantar rastreabilidade de lotes CME", category: "CME", help: "Permite identificar quais artigos foram usados em quais pacientes." },
      { id: "cme_bioindicadores", type: "compliance", text: "Os indicadores biológicos são utilizados rotineiramente para validação da esterilização?", weight: 3, riskTitle: "Esterilização sem validação biológica rotineira", capaTitle: "Implantar uso rotineiro de bioindicadores", category: "CME" },
      { id: "cme_separacao", type: "compliance", text: "A área física possui separação de área suja/limpa/estéril?", weight: 2, riskTitle: "Ausência de separação de áreas na CME — contaminação cruzada", capaTitle: "Adequar área física da CME", category: "CME" },
      { id: "cme_registros", type: "compliance", text: "Os registros de processamento são arquivados por mínimo de 5 anos?", weight: 2, riskTitle: "Registros de CME sem arquivo adequado (mínimo 5 anos)", capaTitle: "Implementar arquivamento de registros CME", category: "CME" },
      { id: "cme_manutencao", type: "compliance", text: "Os autoclaves e equipamentos passam por manutenção preventiva e qualificação?", weight: 2, riskTitle: "Autoclaves sem manutenção preventiva programada", policyTitle: "Plano de Manutenção e Qualificação de Autoclaves", category: "CME" },
      { id: "cme_reprovados", type: "metric", text: "% de artigos reprovados no controle de qualidade do processamento:", metricUnit: "%", metricTarget: 0.5, metricTargetDirection: "lower", metricLabel: "Taxa de Artigos Reprovados — CME", metricLayer: "Qualidade Operacional" },
      { id: "cme_tempo", type: "metric", text: "Tempo médio de processamento de artigos críticos (horas):", metricUnit: "horas", metricTarget: 4, metricTargetDirection: "lower", metricLabel: "Tempo Médio de Processamento CME", metricLayer: "Qualidade Operacional" },
    ],
  },
  // 6. RH / Gestão de Pessoas
  {
    id: "rh",
    name: "RH — Gestão de Pessoas",
    subtitle: "Treinamentos, competências e saúde ocupacional",
    color: "sky",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    textColor: "text-sky-700",
    badgeColor: "bg-sky-100 text-sky-700",
    gradientFrom: "from-sky-500",
    gradientTo: "to-blue-600",
    iconName: "Users",
    questions: [
      { id: "rh_pac", type: "compliance", text: "Existe Plano Anual de Capacitação (PAC) elaborado com base no mapeamento de necessidades?", weight: 2, riskTitle: "Ausência de Plano Anual de Capacitação", policyTitle: "Plano Anual de Capacitação Institucional (PAC)", capaTitle: "Elaborar PAC baseado em mapeamento de necessidades", category: "RH" },
      { id: "rh_obrigatorios", type: "compliance", text: "As capacitações obrigatórias (NR-32, incêndio, primeiros socorros, LGPD) estão em dia?", weight: 3, riskTitle: "Capacitações obrigatórias NR-32/LGPD em atraso — risco legal", policyTitle: "Plano de Capacitações Obrigatórias", capaTitle: "Regularizar capacitações obrigatórias em atraso", category: "RH" },
      { id: "rh_pcmso", type: "compliance", text: "O PCMSO e o PGR (saúde ocupacional) estão elaborados e atualizados?", weight: 3, riskTitle: "PCMSO/PGR desatualizado — risco legal e trabalhista", policyTitle: "PCMSO e PGR — Saúde Ocupacional", capaTitle: "Atualizar PCMSO e PGR com empresa especializada", category: "RH" },
      { id: "rh_descricao", type: "compliance", text: "Existe descrição de cargos com competências e atribuições definidas?", weight: 2, riskTitle: "Cargos sem descrição formal de competências", policyTitle: "Manual de Descrição de Cargos e Competências", category: "RH" },
      { id: "rh_desempenho", type: "compliance", text: "Existe processo de avaliação de desempenho periódico dos colaboradores?", weight: 2, policyTitle: "Processo de Avaliação de Desempenho", category: "RH" },
      { id: "rh_clima", type: "compliance", text: "Existe pesquisa de clima organizacional realizada periodicamente?", weight: 1, policyTitle: "Programa de Pesquisa de Clima Organizacional", category: "RH" },
      { id: "rh_turnover", type: "metric", text: "Taxa de turnover anual (%):", metricUnit: "%", metricTarget: 12, metricTargetDirection: "lower", metricLabel: "Taxa de Turnover Anual", metricLayer: "Qualidade Operacional" },
      { id: "rh_cobertura", type: "metric", text: "% de cobertura de treinamentos obrigatórios:", metricUnit: "%", metricTarget: 90, metricTargetDirection: "higher", metricLabel: "Cobertura de Treinamentos Obrigatórios", metricLayer: "Qualidade Operacional" },
      { id: "rh_horas", type: "metric", text: "Horas de treinamento por colaborador no último ano:", metricUnit: "horas", metricTarget: 24, metricTargetDirection: "higher", metricLabel: "Horas de Treinamento/Colaborador/Ano", metricLayer: "Qualidade Operacional" },
      { id: "rh_absenteismo", type: "metric", text: "Taxa de absenteísmo mensal (%):", metricUnit: "%", metricTarget: 4, metricTargetDirection: "lower", metricLabel: "Taxa de Absenteísmo Mensal", metricLayer: "Qualidade Operacional" },
      { id: "rh_total", type: "metric", text: "Total de colaboradores ativos na instituição:", metricUnit: "colaboradores", metricTarget: 0, metricTargetDirection: "higher", metricLabel: "Total de Colaboradores Instituição", metricLayer: "Qualidade Operacional" },
    ],
  },
  // 7. Qualidade / Gestão da Qualidade
  {
    id: "qualidade",
    name: "Gestão da Qualidade",
    subtitle: "Indicadores, auditorias, melhoria contínua e PDCA",
    color: "indigo",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    badgeColor: "bg-indigo-100 text-indigo-700",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-violet-600",
    iconName: "BarChart3",
    questions: [
      { id: "qual_indicadores", type: "compliance", text: "Existe conjunto de indicadores com metas definidas e monitorados mensalmente?", weight: 2, riskTitle: "Indicadores não monitorados ou sem metas definidas", policyTitle: "Manual de Indicadores Institucionais", category: "Qualidade" },
      { id: "qual_pdca", type: "compliance", text: "Existe metodologia de melhoria contínua (PDCA, DMAIC) em uso?", weight: 2, riskTitle: "Ausência de metodologia de melhoria contínua", policyTitle: "Metodologia PDCA para Melhoria Contínua", category: "Qualidade" },
      { id: "qual_auditoria", type: "compliance", text: "Auditorias internas de qualidade são realizadas periodicamente?", weight: 2, riskTitle: "Ausência de auditorias internas de qualidade", policyTitle: "Programa de Auditoria Interna de Qualidade", capaTitle: "Elaborar cronograma e realizar auditorias internas", category: "Qualidade" },
      { id: "qual_nao_conf", type: "compliance", text: "Os planos de ação de não conformidades têm responsável, prazo e monitoramento?", weight: 2, riskTitle: "Não conformidades sem acompanhamento formal de ações", category: "Qualidade" },
      { id: "qual_divulgacao", type: "compliance", text: "Os resultados de indicadores são divulgados para as equipes assistenciais?", weight: 2, policyTitle: "Política de Divulgação de Indicadores", category: "Qualidade" },
      { id: "qual_direcao", type: "compliance", text: "Existe análise crítica dos resultados pela direção periodicamente?", weight: 2, policyTitle: "Processo de Análise Crítica pela Direção", category: "Qualidade" },
      { id: "qual_total_ind", type: "metric", text: "Total de indicadores assistenciais e operacionais monitorados:", metricUnit: "indicadores", metricTarget: 30, metricTargetDirection: "higher", metricLabel: "Total de Indicadores Monitorados", metricLayer: "ONA" },
      { id: "qual_meta_pct", type: "metric", text: "% de indicadores dentro da meta no último período:", metricUnit: "%", metricTarget: 70, metricTargetDirection: "higher", metricLabel: "% Indicadores Dentro da Meta", metricLayer: "ONA" },
      { id: "qual_auditorias", type: "metric", text: "Total de auditorias internas realizadas no último ano:", metricUnit: "auditorias", metricTarget: 4, metricTargetDirection: "higher", metricLabel: "Total de Auditorias Internas Realizadas", metricLayer: "Qualidade Operacional" },
      { id: "qual_nc_abertas", type: "metric", text: "Total de não conformidades abertas (pendentes de ação):", metricUnit: "NCs", metricTarget: 0, metricTargetDirection: "lower", metricLabel: "Não Conformidades Abertas Pendentes", metricLayer: "Qualidade Operacional" },
      { id: "qual_planos_prazo", type: "metric", text: "% de planos de ação concluídos dentro do prazo:", metricUnit: "%", metricTarget: 80, metricTargetDirection: "higher", metricLabel: "Planos de Ação Concluídos no Prazo", metricLayer: "Qualidade Operacional" },
    ],
  },
  // 8. Assistência Médica
  {
    id: "assistencial",
    name: "Assistência Médica",
    subtitle: "Protocolos clínicos, prontuário e jornada do paciente",
    color: "emerald",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    badgeColor: "bg-emerald-100 text-emerald-700",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-600",
    iconName: "Stethoscope",
    questions: [
      { id: "ass_triagem", type: "compliance", text: "Existe processo padronizado de triagem com classificação de risco (Manchester ou similar)?", weight: 2, riskTitle: "Triagem sem classificação de risco padronizada", policyTitle: "Protocolo de Triagem com Classificação de Risco", category: "Assistencial" },
      { id: "ass_prontuario", type: "compliance", text: "O prontuário (físico ou eletrônico) está estruturado conforme CFM 1638/2002?", weight: 3, riskTitle: "Prontuário não conforme CFM 1638/2002", policyTitle: "Política de Prontuário do Paciente", category: "Assistencial" },
      { id: "ass_consentimento", type: "compliance", text: "Existe consentimento informado documentado para procedimentos invasivos?", weight: 2, riskTitle: "Procedimentos sem consentimento informado documentado", policyTitle: "Protocolo de Consentimento Informado", category: "Assistencial" },
      { id: "ass_protocolos", type: "compliance", text: "Os protocolos clínicos baseados em evidências estão implantados e auditados?", weight: 2, policyTitle: "Protocolos Clínicos Baseados em Evidências", category: "Assistencial" },
      { id: "ass_desfechos", type: "compliance", text: "Existe monitoramento de desfechos clínicos (reinternação, mortalidade, complicações)?", weight: 2, riskTitle: "Desfechos clínicos não monitorados sistematicamente", policyTitle: "Programa de Monitoramento de Desfechos Clínicos", category: "Assistencial" },
      { id: "ass_satisfacao", type: "compliance", text: "A satisfação do paciente é medida com instrumento validado (NPS ou HCAHPS)?", weight: 2, policyTitle: "Programa de Avaliação da Satisfação do Paciente", category: "Assistencial" },
      { id: "ass_tempo_espera", type: "metric", text: "Tempo médio de espera para atendimento (minutos):", metricUnit: "minutos", metricTarget: 30, metricTargetDirection: "lower", metricLabel: "Tempo Médio de Espera para Atendimento", metricLayer: "Experiência do Paciente" },
      { id: "ass_reinternacao", type: "metric", text: "Taxa de reinternação em 30 dias (%):", metricUnit: "%", metricTarget: 5, metricTargetDirection: "lower", metricLabel: "Taxa de Reinternação em 30 Dias", metricLayer: "Qualidade Operacional" },
      { id: "ass_nps", type: "metric", text: "NPS Hospitalar (Net Promoter Score, 0-100):", metricUnit: "NPS", metricTarget: 70, metricTargetDirection: "higher", metricLabel: "NPS Hospitalar — Satisfação do Paciente", metricLayer: "Experiência do Paciente" },
      { id: "ass_mortalidade", type: "metric", text: "Taxa de mortalidade hospitalar (por 100 internações):", metricUnit: "/100 int.", metricTarget: 2, metricTargetDirection: "lower", metricLabel: "Taxa de Mortalidade Hospitalar", metricLayer: "Segurança" },
      { id: "ass_ocupacao", type: "metric", text: "Taxa de ocupação hospitalar (%):", metricUnit: "%", metricTarget: 85, metricTargetDirection: "higher", metricLabel: "Taxa de Ocupação Hospitalar", metricLayer: "Qualidade Operacional" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function computeMetricStatus(
  value: number,
  target: number,
  direction: "lower" | "higher"
): MappedIndicador["status"] {
  if (direction === "higher") {
    if (value >= target) return "Dentro da Meta";
    if (value >= target * 0.75) return "Atenção";
    return "Abaixo da Meta";
  } else {
    if (value <= target) return "Dentro da Meta";
    if (value <= target * 1.5) return "Atenção";
    return "Abaixo da Meta";
  }
}

function weightToGravity(weight: 1 | 2 | 3 | undefined): number {
  if (weight === 3) return 5;
  if (weight === 2) return 3;
  return 2;
}

function weightToPriority(weight: 1 | 2 | 3 | undefined): MappedCapa["priority"] {
  if (weight === 3) return "Crítica";
  if (weight === 2) return "Alta";
  return "Média";
}

function weightToRiskLevel(weight: 1 | 2 | 3 | undefined): MappedRisco["level"] {
  if (weight === 3) return "Crítico";
  if (weight === 2) return "Alto";
  return "Médio";
}

function weightToProb(weight: 1 | 2 | 3 | undefined): number {
  if (weight === 3) return 5;
  if (weight === 2) return 4;
  return 3;
}

// ─── Core mapping function ────────────────────────────────────────────────────

export function mapSectorFormToValidatedData(
  submission: SectorSubmission,
  existingData: ValidatedTenantData | null
): ValidatedTenantData {
  const sector = SECTORS.find((s) => s.id === submission.sectorId);
  if (!sector) {
    throw new Error(`Sector not found: ${submission.sectorId}`);
  }

  const today = new Date().toISOString().split("T")[0];
  const newIndicadores: MappedIndicador[] = [];
  const newRiscos: MappedRisco[] = [];
  const newGutItems: MappedGutItem[] = [];
  const newPoliticas: MappedPolitica[] = [];
  const newCapas: MappedCapa[] = [];

  // ID counters (start above existing items to avoid collision)
  const baseId = Date.now();
  let idxInd = 0;
  let idxRisco = 0;
  let idxGut = 0;
  let idxPol = 0;
  let idxCapa = 0;

  // Existing name/title sets for deduplication
  const existingIndNames = new Set(
    (existingData?.indicadores ?? []).map((i) => i.name.toLowerCase())
  );
  const existingRiscoTitles = new Set(
    (existingData?.riscos ?? []).map((r) => r.title.toLowerCase())
  );
  const existingPolTitles = new Set(
    (existingData?.politicas ?? []).map((p) => p.title.toLowerCase())
  );
  const existingCapaTitles = new Set(
    (existingData?.capas ?? []).map((c) => c.title.toLowerCase())
  );
  const existingGutTitles = new Set(
    (existingData?.gutItems ?? []).map((g) => g.title.toLowerCase())
  );

  for (const q of sector.questions) {
    const answer = submission.answers[q.id];
    if (!answer || answer === "") continue;

    if (q.type === "metric") {
      const numVal = parseFloat(answer);
      if (!isNaN(numVal) && numVal > 0 && q.metricLabel) {
        const labelLower = q.metricLabel.toLowerCase();
        if (!existingIndNames.has(labelLower)) {
          existingIndNames.add(labelLower);
          const layer = (q.metricLayer ?? "Qualidade Operacional") as MappedIndicador["layer"];
          const target = q.metricTarget ?? 0;
          const direction = q.metricTargetDirection ?? "higher";
          const status = computeMetricStatus(numVal, target, direction);
          newIndicadores.push({
            id: baseId + idxInd++,
            name: q.metricLabel,
            value: numVal,
            target,
            unit: q.metricUnit ?? "",
            status,
            trend: "stable",
            category: sector.name,
            layer,
            critical: (q.metricTargetDirection === "lower" ? numVal > target * 1.5 : numVal < target * 0.5),
            description: `${q.text} — Setor: ${sector.name}`,
          });
        }
      }
    } else {
      // compliance question
      if (answer === "nao" || answer === "parcial") {
        // Generate risco if "nao" and riskTitle is defined
        if (answer === "nao" && q.riskTitle) {
          const titleLower = q.riskTitle.toLowerCase();
          if (!existingRiscoTitles.has(titleLower)) {
            existingRiscoTitles.add(titleLower);
            newRiscos.push({
              id: baseId + idxRisco++,
              title: q.riskTitle,
              category: q.category ?? sector.name,
              probability: answer === "nao" ? "Alta" : "Média",
              impact: q.weight === 3 ? "Catastrófico" : q.weight === 2 ? "Crítico" : "Moderado",
              level: weightToRiskLevel(q.weight),
              status: "Identificado",
              owner: submission.submittedBy || "Setor",
              dueDate: addDays(30),
              mitigation: q.capaTitle ? `Ação: ${q.capaTitle}` : `Verificar conformidade — ${sector.name}`,
              source: `Formulário Setorial — ${sector.name}`,
              prob: weightToProb(q.weight),
              impact_num: q.weight === 3 ? 5 : q.weight === 2 ? 4 : 3,
              cat: q.category === "Segurança" || q.category === "Infecção Hospitalar"
                ? "Assistencial"
                : q.category === "RH" || q.category === "CME" || q.category === "Farmácia"
                ? "Regulatório"
                : "Operacional",
            });
          }
        }

        // Generate GUT item for "nao" or "parcial"
        const gutTitle = q.riskTitle ?? q.capaTitle ?? q.text.substring(0, 60);
        const gutLower = gutTitle.toLowerCase();
        if (!existingGutTitles.has(gutLower)) {
          existingGutTitles.add(gutLower);
          newGutItems.push({
            id: baseId + idxGut++,
            title: gutTitle,
            unit: sector.name,
            gravity: weightToGravity(q.weight),
            urgency: answer === "nao" ? 4 : 3,
            tendency: answer === "nao" ? 4 : 3,
            category: q.category ?? sector.name,
            responsible: submission.submittedBy || "Responsável do Setor",
            deadline: addDays(answer === "nao" ? 30 : 60),
            status: "Pendente",
            answer: answer as "nao" | "parcial",
            origin: `Formulário Setorial — ${sector.name}`,
            originCode: q.id,
            chapter: sector.name,
            aiJustification: `Item identificado via formulário setorial do setor ${sector.name}. Resposta: ${answer === "nao" ? "Não atende" : "Atende parcialmente"}.`,
          });
        }

        // Generate CAPA for "nao" or "parcial"
        if (q.capaTitle) {
          const capaLower = q.capaTitle.toLowerCase();
          if (!existingCapaTitles.has(capaLower)) {
            existingCapaTitles.add(capaLower);
            newCapas.push({
              id: baseId + idxCapa++,
              title: q.capaTitle,
              description: `${q.text} — Resposta: ${answer === "nao" ? "Não atende" : "Atende parcialmente"}.`,
              type: answer === "nao" ? "Corretiva" : "Preventiva",
              status: "Aberta",
              priority: weightToPriority(q.weight),
              responsible: submission.submittedBy || "Responsável do Setor",
              dueDate: addDays(answer === "nao" ? 30 : 60),
              origin: `Formulário Setorial — ${sector.name}`,
              questionId: q.id,
            });
          }
        }
      }

      // Generate politica for "sim" or "parcial"
      if ((answer === "sim" || answer === "parcial") && q.policyTitle) {
        const polLower = q.policyTitle.toLowerCase();
        if (!existingPolTitles.has(polLower)) {
          existingPolTitles.add(polLower);
          newPoliticas.push({
            id: baseId + idxPol++,
            title: q.policyTitle,
            category: q.category ?? sector.name,
            version: "1.0",
            status: answer === "sim" ? "Vigente" : "Em revisão",
            lastReview: today,
            nextReview: addDays(365),
            responsible: submission.submittedBy || "Responsável do Setor",
            type: "Protocolo",
          });
        }
      }
    }
  }

  // ─── Merge with existing data ───────────────────────────────────────────────

  const mergedIndicadores = [
    ...(existingData?.indicadores ?? []),
    ...newIndicadores,
  ];
  const mergedRiscos = [
    ...(existingData?.riscos ?? []),
    ...newRiscos,
  ];
  const mergedGutItems = [
    ...(existingData?.gutItems ?? []),
    ...newGutItems,
  ];
  const mergedPoliticas = [
    ...(existingData?.politicas ?? []),
    ...newPoliticas,
  ];
  const mergedCapas = [
    ...(existingData?.capas ?? []),
    ...newCapas,
  ];

  // Compute sector score based on compliance answers
  const complianceQs = sector.questions.filter((q) => q.type === "compliance");
  const answered = complianceQs.filter((q) => {
    const a = submission.answers[q.id];
    return a && a !== "" && a !== "na";
  });
  const simCount = answered.filter((q) => submission.answers[q.id] === "sim").length;
  const sectorScore = answered.length > 0 ? Math.round((simCount / answered.length) * 100) : null;

  const existingSectionScores = existingData?.sectionScores ?? {};
  const mergedSectionScores: Record<string, number | null> = {
    ...existingSectionScores,
    [`setor_${submission.sectorId}`]: sectorScore,
  };

  // Rebuild radar data
  const radarSubjects: Record<string, string> = {
    setor_farmacia: "Farmácia",
    setor_scih: "SCIH",
    setor_nsp: "Segurança",
    setor_enfermagem: "Enfermagem",
    setor_cme: "CME",
    setor_rh: "RH",
    setor_qualidade: "Qualidade",
    setor_assistencial: "Assistência",
  };
  const existingRadar = (existingData?.radarData ?? []).filter(
    (r) => !Object.values(radarSubjects).includes(r.subject)
  );
  const newRadarEntries = Object.entries(mergedSectionScores)
    .filter(([k]) => k.startsWith("setor_") && radarSubjects[k])
    .map(([k, v]) => ({
      subject: radarSubjects[k],
      value: v ?? 0,
      fullMark: 100,
    }));
  const mergedRadar = [...existingRadar, ...newRadarEntries];

  // Build the final ValidatedTenantData
  const base = existingData ?? {
    assessmentId: `sector-${Date.now()}`,
    companyInfo: {
      companyName: submission.companyName,
      evaluatorName: submission.submittedBy,
    },
    validatedAt: new Date().toISOString(),
    validatedBy: submission.submittedBy,
    scores: { n1: 0, n2: 0, n3: 0, overall: 0 },
    sectionScores: {},
    indicadores: [],
    riscos: [],
    gutItems: [],
    politicas: [],
    capas: [],
    gaps: [],
    radarData: [],
  };

  return {
    ...base,
    validatedAt: new Date().toISOString(),
    indicadores: mergedIndicadores,
    riscos: mergedRiscos,
    gutItems: mergedGutItems,
    politicas: mergedPoliticas,
    capas: mergedCapas,
    sectionScores: mergedSectionScores,
    radarData: mergedRadar,
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export function saveSectorSubmission(submission: SectorSubmission): void {
  const existing: SectorSubmission[] = JSON.parse(
    localStorage.getItem(SECTOR_STORAGE_KEY) || "[]"
  );
  const filtered = existing.filter(
    (s) =>
      !(
        s.sectorId === submission.sectorId &&
        s.companyName === submission.companyName
      )
  );
  filtered.push(submission);
  localStorage.setItem(SECTOR_STORAGE_KEY, JSON.stringify(filtered));
}

export function getSectorSubmissions(): SectorSubmission[] {
  return JSON.parse(localStorage.getItem(SECTOR_STORAGE_KEY) || "[]");
}

export function populateSystemFromSector(
  submission: SectorSubmission,
  _companyName: string
): ValidatedTenantData {
  // 1. Get existing validated data
  const existingRaw = localStorage.getItem(VALIDATED_DATA_KEY);
  const existing: ValidatedTenantData | null = existingRaw
    ? JSON.parse(existingRaw)
    : null;

  // 2. Map sector form to data
  const newData = mapSectorFormToValidatedData(submission, existing);

  // 3. Save to localStorage (triggers all pages to update)
  localStorage.setItem(VALIDATED_DATA_KEY, JSON.stringify(newData));

  // 4. Dispatch event for reactivity
  window.dispatchEvent(new Event("ona-validated"));

  return newData;
}
