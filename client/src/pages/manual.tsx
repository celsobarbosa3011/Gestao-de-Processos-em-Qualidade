import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookOpen, Search, Home, Activity, Award, Triangle, Building2,
  ClipboardList, AlertTriangle, BarChart3, CheckSquare, Stethoscope,
  Users, Map, Pill, Target, ScrollText, FileText, GraduationCap,
  Radio, Library, Siren, Bot, Link2, Settings, ChevronRight,
  ChevronDown, Play, Star, Zap, Shield, Eye, TrendingUp,
  Lightbulb, HelpCircle, ExternalLink, CheckCircle2, Info,
  Database, Lock, Workflow, LayoutTemplate, Tag, Palette,
  Store, Layers, CreditCard, SlidersHorizontal, ListTodo,
  KeyRound, ClipboardCheck, Grid2X2
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModuleDoc {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  grupo: string;
  tagColor: string;
  tagBg: string;
  resumo: string;
  paraQueServe: string;
  quemUsa: string[];
  funcionalidades: { titulo: string; descricao: string }[];
  fluxo: string[];
  dica: string;
  onaRelacao?: string;
}

// ── Módulos Documentados ───────────────────────────────────────────────────────

const modulos: ModuleDoc[] = [
  // ── CORE ONA ────────────────────────────────────────────────────────────────
  {
    id: "home",
    label: "Home Executiva",
    path: "/home",
    icon: <Home className="w-5 h-5" />,
    grupo: "Core ONA",
    tagColor: "text-sky-700", tagBg: "bg-sky-100",
    resumo: "Painel de controle 360° da instituição. A primeira tela que o gestor vê ao entrar no sistema.",
    paraQueServe: "Mostra em tempo real o status geral de acreditação ONA da instituição — score por nível (N1, N2, N3), semáforo institucional (verde/amarelo/vermelho), principais riscos, planos vencidos, indicadores críticos e evolução histórica. É o ponto de partida para qualquer tomada de decisão rápida.",
    quemUsa: ["Diretor Clínico", "Diretor Geral", "Gestor de Qualidade", "Gerente Administrativo"],
    funcionalidades: [
      { titulo: "Semáforo Institucional", descricao: "Indicador visual (verde/amarelo/vermelho) que representa o grau de prontidão ONA da instituição de forma imediata — sem necessidade de relatórios." },
      { titulo: "Score ONA por Nível", descricao: "Barra de progresso mostrando o percentual de aderência para Nível 1 (segurança básica), Nível 2 (gestão integrada) e Nível 3 (excelência)." },
      { titulo: "6 KPIs Críticos", descricao: "Cards com Score Global ONA, Planos em Atraso, Riscos Críticos, Eventos Adversos, Documentos Vencidos e Indicadores no Alvo — cada um com tendência em relação ao mês anterior." },
      { titulo: "Ranking de Unidades", descricao: "Comparativo de todas as unidades assistenciais (UTI, PS, CC, Lab...) por percentual de prontidão ONA, com seta de tendência (subindo/caindo)." },
      { titulo: "Top 5 Riscos Críticos", descricao: "Lista dos riscos com maior score GUT abertos na instituição, com link direto para o módulo de Riscos." },
      { titulo: "Radar de Maturidade", descricao: "Gráfico radar mostrando o nível de maturidade em 6 dimensões: Liderança, Assistencial, Diagnóstico, Segurança, Processos e Qualidade." },
      { titulo: "Agenda de Comissões", descricao: "Próximas reuniões de comissões (NSP, SCIH, Prontuários...) com data, tipo e status." },
      { titulo: "Resumo do IA Copilot", descricao: "Painel com análise automática da IA sobre gaps críticos, evidências faltantes e score previsto para 90 dias." },
    ],
    fluxo: ["Gestor abre o sistema → vê o semáforo e score ONA → identifica o que está em vermelho → clica no card correspondente → vai direto ao módulo com o problema"],
    dica: "O semáforo amarelo com 71% significa que a instituição está no caminho para o Nível 2 mas ainda tem gaps. Para virar verde, foque nos itens críticos que aparecem nos cards vermelhos.",
    onaRelacao: "Síntese de todos os requisitos ONA 2026",
  },
  {
    id: "diagnostico",
    label: "Diagnóstico",
    path: "/diagnostico",
    icon: <Search className="w-5 h-5" />,
    grupo: "Core ONA",
    tagColor: "text-indigo-700", tagBg: "bg-indigo-100",
    resumo: "Motor de avaliação: onde a equipe responde o questionário ONA e mede o grau de aderência de cada requisito.",
    paraQueServe: "Permite criar ciclos periódicos de diagnóstico institucional (mensal, trimestral, anual). A equipe responde item por item se a instituição é Aderente, Parcialmente Aderente ou Não Aderente a cada requisito ONA, adicionando comentários e evidências. O sistema calcula automaticamente o score de cada capítulo e do nível geral.",
    quemUsa: ["Gestor de Qualidade", "Coordenador de Unidade", "Equipe de Qualidade", "Consultor ONA"],
    funcionalidades: [
      { titulo: "Ciclos de Diagnóstico", descricao: "Crie um novo ciclo (ex: 'Diagnóstico Q1 2026') e acompanhe o progresso de resposta — quantos itens foram respondidos de 68 totais." },
      { titulo: "Formulário por Capítulo", descricao: "6 capítulos ONA (Liderança, Pessoas, Atenção ao Paciente, Diagnóstico, Segurança, Gestão de Risco) com todos os requisitos listados por nível N1/N2/N3." },
      { titulo: "Resposta com Justificativa", descricao: "Para cada requisito: botões Aderente / Parcialmente / Não Aderente + campo de texto para registrar comentários e ações necessárias." },
      { titulo: "Score Automático", descricao: "O sistema calcula em tempo real o percentual de aderência por capítulo e o score geral, atualizando o semáforo na Home Executiva." },
      { titulo: "Histórico de Ciclos", descricao: "Compare a evolução entre diferentes ciclos de diagnóstico: o que melhorou, o que piorou e o que está estagnado." },
    ],
    fluxo: ["Criar novo ciclo → Selecionar capítulo → Responder requisitos um a um → Salvar progresso → Finalizar ciclo → Score calculado → Compartilhar relatório com diretoria"],
    dica: "Recomenda-se fazer o diagnóstico completo a cada 3 meses. Comece pelo Capítulo de Segurança (Nível 1) pois tem os requisitos mais críticos para a visita ONA.",
    onaRelacao: "Avaliação direta dos 68 requisitos ONA 2026 Seção 1 e 2",
  },
  {
    id: "acreditacao",
    label: "Acreditação ONA 2026",
    path: "/acreditacao-ona",
    icon: <Award className="w-5 h-5" />,
    grupo: "Core ONA",
    tagColor: "text-amber-700", tagBg: "bg-amber-100",
    resumo: "Central de acreditação: todas as evidências, checklists e gaps em um só lugar para gerenciar a certificação ONA.",
    paraQueServe: "É o módulo mais completo para gestão da acreditação ONA 2026. Agrupa todos os requisitos em capítulos com critérios detalhados, permite cadastrar evidências (POPs, atas, protocolos, indicadores), gerar checklist para visita simulada, identificar gaps por unidade e usar o IA Copilot para recomendações específicas.",
    quemUsa: ["Gestor de Qualidade", "Diretoria", "Consultor ONA", "Líderes de Comissões"],
    funcionalidades: [
      { titulo: "Radar de Maturidade ONA", descricao: "Gráfico radar com 6 dimensões (Liderança, Pessoas, Paciente, Segurança, Diagnóstico, Infraestrutura) mostrando o percentual de aderência atual vs meta." },
      { titulo: "Score por Unidade", descricao: "Tabela comparativa mostrando N1, N2 e N3 por unidade assistencial (UTI, CC, PS, Lab...) com semáforo verde/amarelo/vermelho." },
      { titulo: "Gestão de Evidências", descricao: "Cadastre e vincule cada evidência ao requisito ONA correspondente — com tipo (POP, Protocolo, Ata, Indicador), unidade responsável e validade." },
      { titulo: "Checklist de Visita Simulada", descricao: "Lista completa de verificação para simular uma visita dos avaliadores ONA — marque o que está pronto e identifique o que ainda falta." },
      { titulo: "Análise de Gaps", descricao: "Painel com todos os gaps identificados por criticidade (crítico/alto/médio), nível ONA e unidade responsável pela regularização." },
      { titulo: "IA Copilot Integrado", descricao: "Chat com IA especializada em ONA 2026 que analisa os dados da instituição e sugere ações específicas para aumentar o score." },
    ],
    fluxo: ["Abrir módulo → Analisar radar de maturidade → Ver unidades com maior gap → Cadastrar evidências pendentes → Rodar checklist simulado → Consultar IA para sugestões → Exportar relatório para diretoria"],
    dica: "Antes de qualquer visita ONA, execute o Checklist de Visita Simulada completo. A IA vai identificar automaticamente os itens com maior risco de não-conformidade.",
    onaRelacao: "Gestão centralizada de todos os requisitos ONA 2026",
  },
  {
    id: "gut",
    label: "Matriz GUT",
    path: "/matriz-gut",
    icon: <Triangle className="w-5 h-5" />,
    grupo: "Core ONA",
    tagColor: "text-rose-700", tagBg: "bg-rose-100",
    resumo: "Ferramenta de priorização: ordena todos os problemas da instituição por Gravidade, Urgência e Tendência para saber onde agir primeiro.",
    paraQueServe: "A Matriz GUT (Gravidade × Urgência × Tendência) é uma técnica clássica de gestão da qualidade para priorizar problemas. O sistema coleta automaticamente problemas de todos os módulos (Riscos, ONA, Indicadores, Comissões, Auditorias) e gera um score de 1 a 125 para cada um. Os problemas com maior score devem ser endereçados primeiro.",
    quemUsa: ["Gestor de Qualidade", "Diretoria", "NSP (Núcleo de Segurança do Paciente)", "Comissão de Qualidade"],
    funcionalidades: [
      { titulo: "Score GUT Automático", descricao: "Cálculo automático: Gravidade (1-5) × Urgência (1-5) × Tendência (1-5) = Score máximo 125. Quanto maior o score, mais urgente." },
      { titulo: "Ranking de Problemas", descricao: "Lista ordenada do maior para o menor score — os 3 primeiros são os que devem receber ação imediata." },
      { titulo: "Origens Rastreáveis", descricao: "Cada item GUT tem uma origem identificada (Diagnóstico ONA, Notificação de Evento, Indicador Fora do Alvo, Comissão, Auditoria) para rastrear onde o problema foi identificado." },
      { titulo: "Justificativa IA", descricao: "Para cada problema, a IA gera uma justificativa explicando por que aquele score foi atribuído e qual o impacto potencial para a acreditação." },
      { titulo: "Gráfico de Ranking", descricao: "Gráfico de barras horizontais mostrando visualmente os 10 maiores scores para facilitar a apresentação para a diretoria." },
      { titulo: "Status de Endereçamento", descricao: "Acompanhe se cada item está aberto, em andamento ou resolvido — vinculado a um plano de ação no módulo de Gestão Operacional." },
    ],
    fluxo: ["Problemas são detectados nos módulos → Entram automaticamente na Matriz GUT → Equipe atribui G/U/T → Sistema calcula score e prioriza → Gestor abre plano de ação para os top 5"],
    dica: "Use a Matriz GUT em reuniões mensais de qualidade para priorizar o próximo sprint de melhorias. Imprima o gráfico de ranking e apresente para a diretoria.",
    onaRelacao: "Suporte à priorização de não-conformidades ONA",
  },

  // ── QUALIDADE ────────────────────────────────────────────────────────────────
  {
    id: "unidades",
    label: "Unidades de Negócio",
    path: "/unidades-negocio",
    icon: <Building2 className="w-5 h-5" />,
    grupo: "Qualidade",
    tagColor: "text-sky-700", tagBg: "bg-sky-100",
    resumo: "Visão individual de cada unidade assistencial com seu score ONA, POPs vigentes, protocolos, planos e pendências.",
    paraQueServe: "Cada unidade assistencial (UTI, Centro Cirúrgico, PS, Laboratório...) tem sua própria realidade de conformidade ONA. Este módulo permite visualizar o desempenho individual de cada unidade, comparar entre elas e identificar rapidamente qual precisa de mais atenção.",
    quemUsa: ["Diretor Clínico", "Coordenador de Unidade", "Gestor de Qualidade"],
    funcionalidades: [
      { titulo: "Cards por Unidade", descricao: "Card individual para cada unidade com: código, tipo, número de colaboradores, score ONA por nível (N1/N2/N3) e semáforo." },
      { titulo: "Ranking de Prontidão", descricao: "Unidades ordenadas do maior para o menor score — permite comparar rapidamente qual está mais preparada para a visita ONA." },
      { titulo: "Métricas por Unidade", descricao: "Cada card mostra: quantidade de POPs vigentes, protocolos ativos, planos de ação e planos vencidos." },
      { titulo: "Painel de Detalhes", descricao: "Clique em uma unidade para ver o painel expandido com links diretos para seus documentos, protocolos e planos de ação." },
    ],
    fluxo: ["Selecionar unidade → Ver score ONA por nível → Identificar planos vencidos → Clicar para ir direto ao módulo correspondente → Tomar ação"],
    dica: "Foque primeiro nas unidades com semáforo vermelho. Cada unidade vermelha é um risco direto para reprovar na visita ONA.",
  },
  {
    id: "processos",
    label: "Processos",
    path: "/processos",
    icon: <ClipboardList className="w-5 h-5" />,
    grupo: "Qualidade",
    tagColor: "text-violet-700", tagBg: "bg-violet-100",
    resumo: "Gestão de processos institucionais em kanban visual — desde a abertura até a conclusão com rastreabilidade total.",
    paraQueServe: "Centraliza todos os processos de qualidade, melhoria e conformidade da instituição em um quadro kanban visual. Cada processo tem um responsável, prazo, prioridade, status e pode ter anexos, comentários e checklists. Permite acompanhar o fluxo de trabalho de toda a equipe de qualidade.",
    quemUsa: ["Gestor de Qualidade", "Equipe de Qualidade", "Coordenadores de Unidade", "NSP"],
    funcionalidades: [
      { titulo: "Kanban Visual", descricao: "Quadro com colunas por status (A Fazer, Em Andamento, Revisão, Concluído) — arraste e solte os processos entre colunas." },
      { titulo: "Criação de Processo", descricao: "Crie um novo processo com: título, tipo, unidade, responsável, prioridade (Crítica/Alta/Média/Baixa), prazo e descrição detalhada." },
      { titulo: "Notificações", descricao: "Sistema de alertas automáticos quando um processo está próximo do vencimento ou foi atribuído para você." },
      { titulo: "Histórico e Comentários", descricao: "Cada processo tem um feed de atividades com todos os comentários, mudanças de status e anexos adicionados pela equipe." },
      { titulo: "Tipos de Processo", descricao: "Configure tipos personalizados (Não Conformidade, Melhoria, Ação Corretiva, Auditoria Interna...) com cores e ícones próprios." },
    ],
    fluxo: ["Identificar necessidade → Criar processo → Atribuir responsável → Acompanhar no kanban → Comentar atualizações → Marcar como concluído → Registrar evidência"],
    dica: "Use o filtro de 'Atrasados' para ver rapidamente quais processos precisam de atenção imediata. Processos em vermelho impactam diretamente o score ONA.",
  },
  {
    id: "riscos",
    label: "Riscos",
    path: "/riscos",
    icon: <AlertTriangle className="w-5 h-5" />,
    grupo: "Qualidade",
    tagColor: "text-orange-700", tagBg: "bg-orange-100",
    resumo: "Mapeamento completo dos riscos institucionais com análise HFMEA e planos de mitigação vinculados.",
    paraQueServe: "Identifica, avalia e monitora todos os riscos da instituição — assistenciais, operacionais, regulatórios e estratégicos. Cada risco tem probabilidade, impacto e score de risco residual. A análise HFMEA (Healthcare Failure Mode and Effects Analysis) permite mapear modos de falha em processos críticos.",
    quemUsa: ["NSP", "Gestor de Qualidade", "SCIH", "Diretoria", "Auditoria Interna"],
    funcionalidades: [
      { titulo: "Mapa de Riscos", descricao: "Matriz Probabilidade × Impacto com todos os riscos plotados visualmente — vermelho (alto), amarelo (médio), verde (baixo)." },
      { titulo: "Análise HFMEA", descricao: "Ferramenta para mapear modos de falha em processos críticos, calcular o Número de Prioridade de Risco (NPR) e definir barreiras de controle." },
      { titulo: "Planos de Mitigação", descricao: "Para cada risco crítico, vincule um plano de ação no módulo de Gestão Operacional com responsável e prazo." },
      { titulo: "Categorias de Risco", descricao: "Classificação em 4 categorias: Assistencial (segurança do paciente), Operacional, Regulatório (ANVISA, CFM) e Estratégico." },
      { titulo: "Vínculo ONA", descricao: "Cada risco pode ser vinculado ao requisito ONA correspondente, enriquecendo o diagnóstico de conformidade." },
    ],
    fluxo: ["Identificar risco → Avaliar probabilidade e impacto → Mapear no HFMEA se for processo crítico → Criar plano de mitigação → Monitorar risco residual → Fechar quando controlado"],
    dica: "Riscos classificados como 'Crítico' com NPR acima de 100 devem ter plano de ação aprovado pela diretoria em até 48h. São os mais propensos a gerar não-conformidades na visita ONA.",
    onaRelacao: "Requisito direto ONA 2026 — Gestão de Riscos",
  },
  {
    id: "indicadores",
    label: "Indicadores",
    path: "/indicadores",
    icon: <BarChart3 className="w-5 h-5" />,
    grupo: "Qualidade",
    tagColor: "text-emerald-700", tagBg: "bg-emerald-100",
    resumo: "Painel de indicadores assistenciais e operacionais com metas, tendências e semáforos por categoria.",
    paraQueServe: "Monitoramento contínuo de todos os indicadores de qualidade da instituição. Cada indicador tem meta definida, histórico de 6 meses e status semáforo. Indicadores críticos piscam em vermelho para chamar atenção. Categorias incluem: Assistenciais, Operacionais, Financeiros, RH e Segurança.",
    quemUsa: ["Diretor Clínico", "Gestor de Qualidade", "Coordenadores de Unidade", "Diretoria Administrativa"],
    funcionalidades: [
      { titulo: "Cards com Semáforo", descricao: "Cada indicador exibe: valor atual, meta, percentual de atingimento, tendência (subindo/caindo/estável) e status verde/amarelo/vermelho." },
      { titulo: "Gráfico Sparkline", descricao: "Mini-gráfico de linha mostrando a evolução dos últimos 6 meses diretamente no card do indicador — sem precisar abrir detalhes." },
      { titulo: "Filtro por Categoria", descricao: "Abas para filtrar: Assistenciais (IBPIH, Taxa de Infecção...), Operacionais (Ocupação, Tempo de Espera...), Financeiros, RH (Rotatividade...) e Segurança." },
      { titulo: "Indicadores Críticos", descricao: "Indicadores muito abaixo da meta ficam destacados com borda pulsante vermelha e badge 'Crítico' para não passarem despercebidos." },
      { titulo: "Atingimento vs Meta", descricao: "Barra de progresso mostrando percentualmente quanto a meta está sendo atingida — permite comparar indicadores de naturezas diferentes." },
    ],
    fluxo: ["Entrar no módulo → Filtrar por categoria → Identificar indicadores vermelhos → Analisar tendência no sparkline → Abrir plano de ação no Gestão Operacional"],
    dica: "Indicadores assistenciais (taxa de infecção, eventos adversos, IBPIH) são os mais verificados pelos avaliadores ONA. Mantenha todos eles no verde antes de qualquer visita.",
    onaRelacao: "Medição de desempenho — requisito ONA 2026",
  },
  {
    id: "gestao-op",
    label: "Gestão Operacional",
    path: "/gestao-operacional",
    icon: <CheckSquare className="w-5 h-5" />,
    grupo: "Qualidade",
    tagColor: "text-teal-700", tagBg: "bg-teal-100",
    resumo: "Central de planos de ação e projetos de melhoria — com responsáveis, prazos e acompanhamento de progresso.",
    paraQueServe: "Todo problema identificado — seja um gap ONA, um risco crítico, um indicador fora do alvo ou uma não conformidade — precisa de um plano de ação. Este módulo é onde esses planos vivem: quem vai fazer, o quê, quando e como está o andamento. É a ferramenta de execução do ciclo PDCA da instituição.",
    quemUsa: ["Gestor de Qualidade", "Coordenadores de Unidade", "NSP", "Toda a equipe de qualidade"],
    funcionalidades: [
      { titulo: "Planos de Ação (5W2H)", descricao: "Crie planos com: O quê (ação), Por quê (justificativa), Quem (responsável), Quando (prazo), Onde (unidade), Como (método) e Quanto (custo)." },
      { titulo: "Status de Execução", descricao: "Fluxo: Rascunho → Planejamento → Em Execução → Concluído. Cada etapa pode ter comentários e registros de avanço." },
      { titulo: "Vincular à Origem", descricao: "Cada plano de ação é vinculado à sua origem: gap ONA, risco, indicador, evento adverso ou item GUT — criando rastreabilidade completa." },
      { titulo: "Alertas de Vencimento", descricao: "O sistema notifica automaticamente o responsável e o gestor quando um plano está próximo do prazo ou já vencido." },
      { titulo: "Relatório de Andamento", descricao: "Exporte um relatório completo de todos os planos por status, unidade ou período — perfeito para apresentar em reuniões de diretoria." },
    ],
    fluxo: ["Gap/problema identificado → Criar plano de ação → Definir responsável e prazo → Equipe executa → Gestor acompanha → Evidência registrada → Marcar como concluído"],
    dica: "Mantenha o número de planos vencidos abaixo de 5. Os avaliadores ONA verificam especificamente se os planos de ação são executados dentro do prazo.",
  },

  // ── CLÍNICO ──────────────────────────────────────────────────────────────────
  {
    id: "governanca",
    label: "Governança Clínica",
    path: "/governanca-clinica",
    icon: <Stethoscope className="w-5 h-5" />,
    grupo: "Clínico",
    tagColor: "text-blue-700", tagBg: "bg-blue-100",
    resumo: "Monitoramento de indicadores clínicos críticos com análise de tendência e score de segurança por unidade.",
    paraQueServe: "Governança Clínica é o conjunto de mecanismos que garante que os cuidados prestados aos pacientes sejam seguros, eficazes e de alta qualidade. Este módulo monitora indicadores como Taxa de Infecção Hospitalar (IRAS), mortalidade, complicações cirúrgicas, reinternações e tempo de permanência — com alertas quando qualquer indicador sai do padrão.",
    quemUsa: ["Diretor Clínico", "SCIH", "NSP", "Comissão de Óbitos", "Gestor de Qualidade"],
    funcionalidades: [
      { titulo: "Indicadores Clínicos com Mini-gráfico", descricao: "Cards com Taxa de IRAS, Mortalidade Geral, Complicações Cirúrgicas, Reinternação 30d — cada um com mini-gráfico de tendência dos últimos 6 meses." },
      { titulo: "Score por Unidade", descricao: "Tabela comparando o desempenho clínico de cada unidade em 3 dimensões: Desfecho (mortalidade/reinternação), Segurança (IRAS/eventos) e Processo (protocolos/bundles)." },
      { titulo: "Alertas de Desvio", descricao: "Banner de alerta quando qualquer indicador clínico ultrapassa o threshold de segurança — com link direto para abrir uma investigação." },
      { titulo: "Gráfico de Tendência", descricao: "Visualização histórica dos indicadores com linha de referência mostrando a meta — permite identificar sazonalidade e tendências de piora." },
    ],
    fluxo: ["Monitorar indicadores diariamente → Identificar desvio → Alertar Diretor Clínico → Investigar causa → Abrir ação corretiva → Monitorar resultado"],
    dica: "A taxa de IRAS é o indicador mais crítico para a ONA Nível 1. Mantenha abaixo de 2% para não comprometer o processo de acreditação.",
    onaRelacao: "Requisito crítico ONA — Segurança do Paciente e Desfecho Clínico",
  },
  {
    id: "comissoes",
    label: "Comissões",
    path: "/comissoes",
    icon: <Users className="w-5 h-5" />,
    grupo: "Clínico",
    tagColor: "text-purple-700", tagBg: "bg-purple-100",
    resumo: "Gestão completa das comissões hospitalares obrigatórias (NSP, SCIH, CME, CPRON, COBIO, CEM) com calendário e deliberações.",
    paraQueServe: "As comissões hospitalares são exigidas pela ONA e pela legislação sanitária. Este módulo gerencia todas as comissões — membros, regulamentação, frequência de reuniões, atas, deliberações e pendências. Garante que nenhuma reunião seja perdida e que todas as deliberações tenham acompanhamento formal.",
    quemUsa: ["Presidentes de Comissões", "Gestor de Qualidade", "Diretoria", "Secretário de Comissão"],
    funcionalidades: [
      { titulo: "6 Comissões Configuradas", descricao: "NSP (Segurança do Paciente), SCIH (Controle de Infecção), CME (Material Esterilizado), CPRON (Prontuários), COBIO (Óbitos e Biópsias) e CEM (Ética Médica) — com regulamentação, sigla e frequência." },
      { titulo: "Calendário de Reuniões", descricao: "Calendário anual com todas as reuniões agendadas, distinguindo Ordinárias (regulares) de Extraordinárias (emergenciais)." },
      { titulo: "Gestão de Membros", descricao: "Lista de membros de cada comissão com cargo, titular/suplente e contato — exportável para o regimento." },
      { titulo: "Deliberações e Pendências", descricao: "Cada reunião gera deliberações. O sistema acompanha quais foram cumpridas e quais estão pendentes, gerando alertas automáticos." },
      { titulo: "Status da Comissão", descricao: "Indicador se a comissão está regularmente constituída (ativa) ou com alguma pendência de renovação/eleição." },
    ],
    fluxo: ["Agendar reunião → Convocar membros → Realizar reunião → Registrar ata → Lançar deliberações → Acompanhar cumprimento → Fechar na próxima reunião"],
    dica: "Os avaliadores ONA solicitam as atas das últimas 4 reuniões de cada comissão. Mantenha todas registradas no sistema com as deliberações e seus status.",
    onaRelacao: "Requisito ONA — Estrutura de Governança Clínica e Segurança",
  },
  {
    id: "jornada",
    label: "Jornada do Paciente",
    path: "/jornada-paciente",
    icon: <Map className="w-5 h-5" />,
    grupo: "Clínico",
    tagColor: "text-cyan-700", tagBg: "bg-cyan-100",
    resumo: "Mapeamento visual do fluxo do paciente desde a chegada até a alta — com tempos, rupturas e pontos de handoff.",
    paraQueServe: "Mapeia visualmente (em formato swimlane) como o paciente percorre a instituição em 3 tipos de jornada: Eletivo, Urgência e Emergência. Para cada etapa, mostra o tempo médio vs a meta, as rupturas identificadas (falhas no fluxo) e os pontos de transferência entre setores. Essencial para identificar onde o paciente 'fica parado' ou onde informações se perdem.",
    quemUsa: ["Diretor Clínico", "Gestor de Qualidade", "NSP", "Coordenadores de Unidade"],
    funcionalidades: [
      { titulo: "Swimlane Interativo", descricao: "Mapa visual por etapas — cada caixinha representa uma etapa da jornada com: setor, tempo médio, status (verde/amarelo/vermelho) e número de rupturas." },
      { titulo: "3 Tipos de Jornada", descricao: "Eletivo (consulta programada), Urgência (PA/UPA) e Emergência (casos críticos) — cada um com seu fluxo próprio e metas de tempo." },
      { titulo: "Análise de Rupturas", descricao: "Lista de falhas identificadas no fluxo (ex: resultado de exame que não volta ao médico, falta de leito) com nível de criticidade e ação corretiva sugerida." },
      { titulo: "Tabela de Handoffs", descricao: "Análise de cada ponto de transferência entre setores: tempo de espera atual vs meta e percentual de perda de informação clínica." },
      { titulo: "Tendência de Tempo", descricao: "Gráfico de linha mostrando a evolução do tempo total de cada tipo de jornada nos últimos 6 meses — comparado à meta." },
    ],
    fluxo: ["Selecionar tipo de jornada → Analisar swimlane → Identificar etapa mais lenta → Abrir análise de ruptura → Criar plano de melhoria → Medir resultado no próximo mês"],
    dica: "O tempo de espera 'Urgência → Internação' é o maior gargalo em 80% dos hospitais. Resolva primeiro esse handoff para reduzir o tempo total da jornada de urgência.",
  },
  {
    id: "protocolos",
    label: "Protocolos Gerenciados",
    path: "/protocolos",
    icon: <Pill className="w-5 h-5" />,
    grupo: "Clínico",
    tagColor: "text-pink-700", tagBg: "bg-pink-100",
    resumo: "Biblioteca de protocolos clínicos com controle de aderência, alertas de vencimento e histórico por unidade.",
    paraQueServe: "Protocolos clínicos são procedimentos padronizados que garantem a segurança e qualidade do cuidado. Este módulo centraliza todos os protocolos (Sepse, PCR, AVC, Prevenção de Quedas, Identificação do Paciente...) com controle de versão, aderência por unidade, alertas de vencimento e treinamento vinculado.",
    quemUsa: ["Diretor Clínico", "Equipe de Enfermagem", "Médicos", "Gestor de Qualidade"],
    funcionalidades: [
      { titulo: "Biblioteca de Protocolos", descricao: "Lista com todos os protocolos institucionais: nome, categoria, versão, unidade responsável, validade e percentual de aderência atual." },
      { titulo: "Aderência por Unidade", descricao: "Tabela e gráfico de barras mostrando em qual unidade cada protocolo está sendo mais e menos seguido — com meta de 85%." },
      { titulo: "Alertas de Vencimento", descricao: "Protocolos com data de validade próxima ou vencida são destacados em vermelho — exigindo revisão e nova aprovação." },
      { titulo: "Tendência Histórica", descricao: "Gráfico de linha mostrando a evolução da aderência ao protocolo nos últimos 6 meses por unidade." },
      { titulo: "Vínculo ONA", descricao: "Protocolos marcados como 'ONA' são aqueles exigidos diretamente pela norma de acreditação — recebem destaque especial." },
    ],
    fluxo: ["Cadastrar protocolo → Definir unidades responsáveis → Treinar equipe → Monitorar aderência mensalmente → Revisar protocolo vencido → Republicar versão atualizada"],
    dica: "Protocolo de Sepse, Identificação do Paciente, Prevenção de Quedas e Cirurgia Segura são os mais verificados na visita ONA Nível 1. Mantenha aderência acima de 85% em todas as unidades.",
    onaRelacao: "Metas Internacionais de Segurança do Paciente — ONA Nível 1",
  },

  // ── ESTRATÉGICO ──────────────────────────────────────────────────────────────
  {
    id: "swot",
    label: "Análise SWOT",
    path: "/swot",
    icon: <Grid2X2 className="w-5 h-5" />,
    grupo: "Estratégico",
    tagColor: "text-violet-700", tagBg: "bg-violet-100",
    resumo: "Ferramenta de planejamento estratégico que mapeia Forças, Fraquezas, Oportunidades e Ameaças da instituição — com análise cruzada e estratégias geradas automaticamente.",
    paraQueServe: "A Análise SWOT é o ponto de partida do planejamento estratégico institucional. Permite identificar os pontos fortes internos (Forças), os pontos a melhorar (Fraquezas), os fatores externos favoráveis (Oportunidades) e os riscos externos (Ameaças). O sistema vai além do preenchimento da matriz: gera automaticamente as 4 estratégias cruzadas — SO (crescimento), WO (desenvolvimento), ST (manutenção) e WT (sobrevivência) — e conecta os resultados com os requisitos da Acreditação ONA 2026.",
    quemUsa: ["Diretor Geral", "Gestor de Qualidade", "Diretoria Clínica", "Consultores ONA", "Equipe de Planejamento Estratégico"],
    funcionalidades: [
      { titulo: "Matriz 2×2 Interativa", descricao: "Interface visual com os 4 quadrantes coloridos: Forças (verde), Fraquezas (vermelho), Oportunidades (azul) e Ameaças (amarelo). Adicione, edite e remova itens diretamente na matriz." },
      { titulo: "Priorização por Impacto", descricao: "Cada item recebe classificação de impacto: Alta (vermelho), Média (âmbar) ou Baixa (verde). Os itens de alta prioridade aparecem primeiro automaticamente." },
      { titulo: "Múltiplas Análises", descricao: "Crie análises SWOT separadas por unidade (UTI, CC, PS), por processo, por período ou por objetivo estratégico. Todas ficam salvas e acessíveis com um clique." },
      { titulo: "Estratégias Cruzadas (SO, WO, ST, WT)", descricao: "A aba 'Estratégias Cruzadas' combina os quadrantes e apresenta as 4 estratégias derivadas: SO (usar Forças para capturar Oportunidades), WO (superar Fraquezas com Oportunidades), ST (usar Forças contra Ameaças) e WT (minimizar Fraquezas e evitar Ameaças)." },
      { titulo: "Balanço Institucional", descricao: "Indicador automático que calcula o balanço entre fatores positivos (Forças + Oportunidades) e negativos (Fraquezas + Ameaças) — mostrando se a instituição está em posição favorável ou desfavorável." },
      { titulo: "Conexão com ONA 2026", descricao: "Painel explicando como a SWOT fundamenta o diagnóstico situacional e a gestão de riscos estratégicos exigidos pela ONA — tornando a análise uma evidência documental para o processo de acreditação." },
      { titulo: "Impressão", descricao: "Botão de impressão otimizado para gerar a matriz SWOT em formato de relatório para apresentação à diretoria ou entrega ao avaliador ONA." },
    ],
    fluxo: [
      "Criar nova análise com nome e contexto (ex: SWOT Institucional 2026)",
      "Preencher os 4 quadrantes com os itens identificados pela equipe",
      "Classificar o impacto de cada item (Alta/Média/Baixa)",
      "Acessar a aba Estratégias Cruzadas para gerar as recomendações SO/WO/ST/WT",
      "Imprimir ou exportar o resultado para apresentação à diretoria",
      "Vincular as estratégias geradas ao Planejamento BSC e ao Plano de Ação",
    ],
    dica: "Na apresentação ao cliente, comece pela Análise SWOT Institucional que já vem com dados de exemplo. Mostre o balanço (positivo/negativo), depois clique em 'Estratégias Cruzadas' — o cliente vai se impressionar quando ver que o sistema gera automaticamente os 4 tipos de estratégia. Por fim, destaque que esta análise é uma evidência ONA.",
    onaRelacao: "Diagnóstico Situacional e Gestão de Riscos Estratégicos — ONA 2026 Gestão Organizacional",
  },
  {
    id: "bsc",
    label: "Planejamento BSC",
    path: "/planejamento-bsc",
    icon: <Target className="w-5 h-5" />,
    grupo: "Estratégico",
    tagColor: "text-indigo-700", tagBg: "bg-indigo-100",
    resumo: "Balanced Scorecard institucional com 4 perspectivas, objetivos estratégicos, metas e monitoramento de progresso.",
    paraQueServe: "O Balanced Scorecard (BSC) é a ferramenta de gestão estratégica mais utilizada em hospitais de excelência. Traduz a missão e visão da instituição em objetivos mensuráveis organizados em 4 perspectivas: Financeira, Clientes/Pacientes, Processos Internos e Aprendizado & Crescimento. A ONA verifica se a instituição tem planejamento estratégico formalizado e monitorado.",
    quemUsa: ["Diretoria", "Conselho", "Gestor de Qualidade", "Líderes Estratégicos"],
    funcionalidades: [
      { titulo: "Mapa Estratégico", descricao: "Visualização dos objetivos estratégicos organizados nas 4 perspectivas BSC com indicadores de progresso — verde (no alvo), amarelo (atenção), vermelho (crítico)." },
      { titulo: "4 Perspectivas BSC", descricao: "Financeira (sustentabilidade, receita), Clientes/Pacientes (satisfação, segurança), Processos Internos (eficiência, qualidade) e Aprendizado & Crescimento (capacitação, inovação)." },
      { titulo: "Tabela de Objetivos", descricao: "Todos os objetivos estratégicos com: responsável, indicador, meta, valor atual e percentual de atingimento — filtrável por perspectiva." },
      { titulo: "Painel de Controle", descricao: "Gráfico radar mostrando o equilíbrio entre perspectivas + gráfico de barras comparando meta vs realizado por perspectiva." },
    ],
    fluxo: ["Diretoria define objetivos → Cadastra no BSC → Define metas e responsáveis → Monitora mensalmente → Ajusta estratégia se necessário → Apresenta resultado no board"],
    dica: "A ONA 2026 exige que a instituição demonstre que tem planejamento estratégico documentado, monitorado e revisado periodicamente. O BSC é a evidência perfeita para isso.",
    onaRelacao: "Requisito ONA — Liderança Estratégica e Planejamento",
  },
  {
    id: "politicas",
    label: "Políticas & Regimentos",
    path: "/politicas",
    icon: <ScrollText className="w-5 h-5" />,
    grupo: "Estratégico",
    tagColor: "text-slate-700", tagBg: "bg-slate-100",
    resumo: "Repositório de documentos normativos institucionais (políticas, regimentos, manuais, normas) com controle de validade.",
    paraQueServe: "Toda instituição acreditada precisa ter sua estrutura normativa formalizada: Política Institucional, Regimento Interno, Manual de Qualidade, Normas Operacionais. Este módulo centraliza todos esses documentos com controle de versão, data de publicação e validade — gerando alertas quando a revisão periódica é necessária.",
    quemUsa: ["Diretoria", "Recursos Humanos", "Gestor de Qualidade", "Jurídico"],
    funcionalidades: [
      { titulo: "Tabela de Documentos", descricao: "Listagem com código, nome, tipo (Política/Regimento/Manual/Norma), versão, status (Vigente/Em Revisão/Vencido) e próxima data de revisão." },
      { titulo: "Alertas de Vencimento", descricao: "Banner de alerta para documentos vencidos ou com revisão iminente — o número aparece em vermelho no sidebar." },
      { titulo: "Vínculo ONA", descricao: "Documentos marcados como 'ONA' são aqueles exigidos diretamente pela norma de acreditação — ficam destacados com badge especial." },
      { titulo: "Painel de Detalhes", descricao: "Clique em qualquer documento para ver: descrição completa, histórico de versões, responsável, aprovador e status de publicação." },
    ],
    fluxo: ["Criar documento → Revisar → Aprovar → Publicar → Monitorar validade → Revisar quando vencer → Republicar nova versão"],
    dica: "Regimento Interno, Política de Segurança do Paciente e Política de Qualidade são os 3 documentos mais solicitados pelos avaliadores ONA na primeira visita.",
    onaRelacao: "Estrutura Normativa — requisito ONA Nível 1",
  },
  {
    id: "documentos",
    label: "Documentos & Evidências",
    path: "/documentos",
    icon: <FileText className="w-5 h-5" />,
    grupo: "Estratégico",
    tagColor: "text-blue-700", tagBg: "bg-blue-100",
    resumo: "GED completo: POPs, protocolos, formulários e evidências com versionamento, workflow de aprovação e leitura obrigatória.",
    paraQueServe: "O Gerenciamento Eletrônico de Documentos (GED) é o coração da acreditação ONA. Aqui vivem todos os POPs (Procedimentos Operacionais Padrão), protocolos, formulários e evidências que comprovam que a instituição faz o que diz que faz. O workflow de aprovação garante que nenhum documento é publicado sem a validação adequada.",
    quemUsa: ["Toda a equipe clínica e administrativa", "Gestor de Qualidade", "Aprovadores", "Auditores ONA"],
    funcionalidades: [
      { titulo: "Repositório por Tipo", descricao: "Organize por tipo: POP, Protocolo, Política, Manual, Formulário, Regimento, Norma — com filtro e busca por palavra-chave." },
      { titulo: "Status e Validade", descricao: "Documentos com status: Vigente (válido e publicado), Em Revisão (sendo atualizado), Vencido (expirou) e Rascunho (em elaboração)." },
      { titulo: "Workflow de Aprovação 4 Etapas", descricao: "Cada documento passa por: Elaboração → Revisão Técnica → Aprovação pelo Responsável → Publicação. Com comentários em cada etapa." },
      { titulo: "Leitura Obrigatória", descricao: "Marque documentos como de leitura obrigatória, atribua para equipes ou indivíduos e acompanhe quem já leu — gerando evidência para a ONA." },
      { titulo: "Versionamento", descricao: "Todo documento tem versão (V1.0, V2.0...) e histórico de mudanças. Versões anteriores ficam arquivadas e acessíveis." },
    ],
    fluxo: ["Elaborar documento → Enviar para revisão técnica → Aprovador valida → Publicar → Notificar equipes → Monitorar leitura → Revisar quando vencer → Nova versão"],
    dica: "Os avaliadores ONA pedem para ver os últimos 3 documentos aprovados com o workflow completo. Certifique-se de que o processo de aprovação está registrado para cada POP publicado.",
    onaRelacao: "Evidências documentais — requisito central de todos os níveis ONA",
  },
  {
    id: "treinamentos",
    label: "Treinamentos",
    path: "/treinamentos",
    icon: <GraduationCap className="w-5 h-5" />,
    grupo: "Estratégico",
    tagColor: "text-green-700", tagBg: "bg-green-100",
    resumo: "Gestão de capacitações institucionais com controle de carga horária, percentual de conclusão e histórico por unidade.",
    paraQueServe: "A ONA exige que a instituição tenha um programa estruturado de educação permanente. Este módulo centraliza todos os treinamentos — obrigatórios e complementares — com controle de quem foi treinado, quantas horas foram realizadas e qual o percentual de conclusão por unidade. Gera relatórios para evidenciar o programa de capacitação.",
    quemUsa: ["RH", "Educação Continuada", "Gestor de Qualidade", "Coordenadores de Unidade"],
    funcionalidades: [
      { titulo: "Catálogo de Treinamentos", descricao: "Lista todos os treinamentos com: nome, categoria (Segurança/Clínico/Operacional/Obrigatório), modalidade (Presencial/EAD/Híbrido), carga horária e status." },
      { titulo: "Progresso por Unidade", descricao: "Barras de progresso mostrando o percentual de conclusão de cada treinamento por unidade assistencial — com meta de 90%." },
      { titulo: "Histórico Mensal", descricao: "Gráfico de barras duplo mostrando horas de treinamento realizadas vs meta por mês — excelente para relatórios de diretoria." },
      { titulo: "Treinamentos ONA", descricao: "Treinamentos marcados com badge ONA são aqueles exigidos diretamente pela norma — têm prioridade e alertas reforçados." },
    ],
    fluxo: ["Planejar calendário anual → Cadastrar treinamentos → Realizar → Registrar participantes e carga horária → Gerar relatório → Evidenciar para ONA"],
    dica: "Os treinamentos obrigatórios ONA incluem: Identificação do Paciente, Prevenção de Quedas, Lavagem das Mãos, Comunicação Efetiva e Manejo de Medicamentos de Alta Vigilância. Mantenha 100% de conclusão nesses.",
    onaRelacao: "Educação Permanente — requisito ONA Nível 1 e 2",
  },

  // ── REGULATÓRIO ──────────────────────────────────────────────────────────────
  {
    id: "comunicacao",
    label: "Comunicação Interna",
    path: "/comunicacao",
    icon: <Radio className="w-5 h-5" />,
    grupo: "Regulatório",
    tagColor: "text-violet-700", tagBg: "bg-violet-100",
    resumo: "Mural de comunicados institucionais e agenda de reuniões — centralizando toda a comunicação interna da equipe.",
    paraQueServe: "A comunicação interna eficaz é um requisito ONA e determinante para a segurança do paciente. Este módulo funciona como um 'mural digital' onde a gestão publica avisos, alertas, normas atualizadas e convocações. A equipe acessa pelo sistema e confirma a leitura, gerando evidência de comunicação efetiva.",
    quemUsa: ["Gestão de Qualidade", "RH", "Diretoria", "Líderes de Unidade", "Toda a equipe"],
    funcionalidades: [
      { titulo: "Mural de Comunicados", descricao: "Feed de comunicados em ordem cronológica — com tipos: Aviso, Alerta (urgente), Norma, Convocação — e indicador de % de leitura da equipe." },
      { titulo: "Comunicados Fixados", descricao: "Comunicados urgentes são fixados no topo do mural com banner vermelho para garantir que toda a equipe veja." },
      { titulo: "Controle de Leitura", descricao: "Cada comunicado mostra quantas pessoas da equipe já leram (ex: 34/45 lidas = 76%). Gestores podem ver quem não leu." },
      { titulo: "Agenda de Reuniões", descricao: "Calendário com todas as reuniões agendadas (comissões, staff, capacitações) com local, participantes esperados e link de videoconferência." },
    ],
    fluxo: ["Publicar comunicado → Equipe recebe notificação → Lê e confirma → Gestor verifica % de leitura → Garantir 100% antes de visitas ONA"],
    dica: "Antes da visita ONA, publique um comunicado de alerta ('Visita ONA em X dias — verifique seus protocolos') e confirme que 100% da equipe leu.",
  },
  {
    id: "referencias",
    label: "Referências Normativas",
    path: "/referencias",
    icon: <Library className="w-5 h-5" />,
    grupo: "Regulatório",
    tagColor: "text-amber-700", tagBg: "bg-amber-100",
    resumo: "Biblioteca centralizada de normas, resoluções, RDCs e manuais regulatórios (ANVISA, CFM, COFEN, ONA, MS).",
    paraQueServe: "A instituição precisa demonstrar que conhece e cumpre a legislação sanitária vigente. Este módulo reúne todas as referências normativas relevantes — ONA, ANVISA/RDC, CFM, COFEN, MS, ANS, ABNT — com informações sobre vigência, categoria e relação com os requisitos ONA. Permite favoritar as normas mais consultadas e filtrar por tipo.",
    quemUsa: ["Gestor de Qualidade", "Auditoria Interna", "Jurídico", "Líderes de Comissões"],
    funcionalidades: [
      { titulo: "Biblioteca por Categoria", descricao: "Normas organizadas por emissor: ONA, ANVISA, CFM, COFEN, ANS, Ministério da Saúde, ABNT e Internacional." },
      { titulo: "Busca e Filtro", descricao: "Busque por palavra-chave no título, filtre por tipo (RDC, Resolução, Portaria, Manual...) e status (vigente/revogada)." },
      { titulo: "Favoritos", descricao: "Marque as normas mais consultadas como favoritos para acesso rápido — cada membro da equipe tem seus próprios favoritos." },
      { titulo: "Relação com ONA", descricao: "Cada norma mostra a quais requisitos ONA ela está relacionada — facilitando o alinhamento regulatório." },
      { titulo: "Status de Vigência", descricao: "Indicador se a norma está vigente, revogada (não se aplica mais) ou em processo de revisão — evitando uso de documentos desatualizados." },
    ],
    fluxo: ["Identificar requisito ONA → Buscar a norma relacionada → Verificar vigência → Favoritar → Usar como base para elaborar documentos internos"],
    dica: "Mantenha as RDCs da ANVISA sobre resíduos, medicamentos e estrutura física sempre favoritas. São as mais verificadas em visitas de vigilância sanitária que antecipam a ONA.",
  },
  {
    id: "eventos",
    label: "Notificação de Eventos",
    path: "/eventos",
    icon: <Siren className="w-5 h-5" />,
    grupo: "Regulatório",
    tagColor: "text-red-700", tagBg: "bg-red-100",
    resumo: "Notificação de eventos adversos, sentinelas e quasi-erros com análise de causa, CAPA e relatórios para a ANVISA.",
    paraQueServe: "Todo serviço de saúde é obrigado por lei a notificar eventos adversos graves à ANVISA (pelo NOTIVISA) e ao Núcleo de Segurança do Paciente (NSP). Este módulo gerencia todo o ciclo de um evento: notificação inicial, análise de causa raiz (usando RCA ou Protocolo de Londres), plano de ação CAPA e relatório final. A ONA verifica se a instituição tem sistema de notificação funcionando.",
    quemUsa: ["NSP", "Equipe Assistencial", "Diretor Clínico", "Gestor de Qualidade", "ANVISA (relatórios)"],
    funcionalidades: [
      { titulo: "Formulário NSP FOR SN-003", descricao: "Formulário oficial do NSP para notificação de eventos adversos — com todos os campos obrigatórios: paciente, data, tipo, descrição, gravidade e imediatismo." },
      { titulo: "3 Tipos de Evento", descricao: "Evento Sentinela (morte evitável, dano grave), Evento Adverso (dano menor) e Quasi-erro (sem dano, mas poderia ter causado) — com fluxo de resposta diferente para cada." },
      { titulo: "Análise de Causa Raiz", descricao: "Ferramentas para análise: diagrama de Ishikawa (espinha de peixe), Protocolo de Londres e Técnica dos 5 Porquês — com registro estruturado." },
      { titulo: "Plano CAPA", descricao: "Ações Corretivas e Preventivas vinculadas ao evento: o que vai ser feito, por quem, quando e como vai ser medida a efetividade." },
      { titulo: "Relatório NOTIVISA", descricao: "Geração automática do relatório no formato exigido pela ANVISA para submissão ao sistema NOTIVISA — com todos os campos preenchidos." },
    ],
    fluxo: ["Evento ocorre → Profissional notifica (até 24h para sentinela) → NSP recebe e investiga → Análise de causa → Plano CAPA → Relatório para ANVISA → Follow-up → Fechamento"],
    dica: "A subnotificação é um dos critérios mais negativos na avaliação ONA. Um hospital que nunca notificou eventos pode ser questionado sobre a cultura de segurança. Incentive a notificação.",
    onaRelacao: "Requisito ONA Nível 1 — Sistema de Notificação e Aprendizado com Erros",
  },

  // ── IA & SISTEMA ─────────────────────────────────────────────────────────────
  {
    id: "ia",
    label: "IA ONA Copilot",
    path: "/ia-copilot",
    icon: <Bot className="w-5 h-5" />,
    grupo: "IA & Sistema",
    tagColor: "text-sky-700", tagBg: "bg-sky-100",
    resumo: "Assistente de inteligência artificial especializado em ONA 2026 — analisa dados da instituição e gera recomendações personalizadas.",
    paraQueServe: "O IA ONA Copilot é o diferencial competitivo do QHealth One. É um assistente de IA treinado especificamente na norma ONA 2026 que analisa todos os dados da instituição (score, indicadores, documentos, eventos) e responde perguntas em linguagem natural. Gera relatórios automáticos, sugere prioridades e simula visitas ONA.",
    quemUsa: ["Gestor de Qualidade", "Diretor Clínico", "Consultor ONA", "Diretoria"],
    funcionalidades: [
      { titulo: "Chat em Linguagem Natural", descricao: "Faça perguntas como: 'Quais são os 3 maiores gaps do Nível 2?', 'Como está a UTI comparada às outras unidades?', 'O que preciso fazer para atingir o Nível 3?' — e receba respostas precisas." },
      { titulo: "Prompts Prontos", descricao: "Botões de ação rápida: Gaps Críticos, Evidências Faltantes na UTI, Relatório de Prontidão, Checklist para Visita Simulada, Riscos de Não-Conformidade, Análise de Protocolo de Sepse." },
      { titulo: "Relatórios Automáticos", descricao: "Geração automática de: Relatório Executivo (PDF), Análise de Gaps por Nível, Plano de Ação Prioritário, Relatório de Indicadores e Checklist de Visita." },
      { titulo: "Score Previsto 90 Dias", descricao: "Com base nos planos de ação abertos e progresso atual, a IA projeta qual será o score ONA em 90 dias — se os planos forem executados." },
    ],
    fluxo: ["Abrir copilot → Digitar pergunta ou usar prompt pronto → IA analisa dados → Responde com recomendações específicas → Exportar relatório → Compartilhar com diretoria"],
    dica: "Use o prompt 'Gerar relatório de prontidão' antes de qualquer reunião de diretoria. Em 30 segundos você tem uma análise completa e profissional de toda a situação ONA da instituição.",
  },
  {
    id: "integracoes",
    label: "Integrações & API",
    path: "/integracoes",
    icon: <Link2 className="w-5 h-5" />,
    grupo: "IA & Sistema",
    tagColor: "text-purple-700", tagBg: "bg-purple-100",
    resumo: "Conectores com HIS, LIS, PACS e sistemas externos — catálogo de integrações, log de eventos e gerenciamento de chaves API.",
    paraQueServe: "Conecta o QHealth One com os outros sistemas da instituição. Quando integrado ao HIS (ex: Tasy, MV Soul), os dados de admissão e internação chegam automaticamente. A integração com LIS traz resultados de laboratório e a integração com PACS traz laudos de imagem. O módulo API permite que outros sistemas consumam dados do QHealth One.",
    quemUsa: ["TI Hospitalar", "Administração de Sistemas", "Gestor de Qualidade"],
    funcionalidades: [
      { titulo: "Catálogo de Conectores", descricao: "10 integrações pré-configuradas: HIS (Tasy, MV), LIS (Roche, Sysmex), PACS (Carestream), RIS (Agfa), SAP e FHIR R4 — com status de conexão em tempo real." },
      { titulo: "Log de Webhooks", descricao: "Histórico de todos os eventos recebidos e enviados: quando um resultado chega do laboratório, quando uma admissão é registrada no HIS, etc." },
      { titulo: "Gerenciamento de Chaves API", descricao: "Crie e gerencie chaves de acesso para sistemas externos que precisam consumir dados do QHealth One (BI, painéis de TV, apps mobile)." },
    ],
    fluxo: ["TI configura conexão → Testa endpoint → Valida recebimento de dados → Monitora log de eventos → Reage a erros de conexão"],
    dica: "A integração com o LIS é a mais impactante — quando resultados críticos chegam automaticamente, a equipe de qualidade recebe alertas em tempo real sem precisar consultar outro sistema.",
  },
  {
    id: "admin",
    label: "Administração",
    path: "/administracao",
    icon: <Settings className="w-5 h-5" />,
    grupo: "IA & Sistema",
    tagColor: "text-gray-700", tagBg: "bg-gray-100",
    resumo: "Painel administrativo: usuários, perfis de acesso, integrações, log de auditoria e configurações do sistema.",
    paraQueServe: "Configura e controla o ambiente da instituição dentro do QHealth One. Aqui o administrador gerencia os usuários (quem pode acessar o quê), configura integrações com sistemas externos, monitora a saúde do sistema, acessa o log de todas as ações realizadas e define configurações globais como backup e alertas.",
    quemUsa: ["Administrador do Sistema", "TI Hospitalar", "Gestor de Qualidade (acesso parcial)"],
    funcionalidades: [
      { titulo: "Gestão de Usuários", descricao: "Cadastre usuários com nome, email, unidade, perfil de acesso (Admin/Gestor/Operador/Visualizador) e controle de autenticação em 2 fatores." },
      { titulo: "Perfis e Permissões", descricao: "4 perfis pré-configurados: Administrador (acesso total), Gestor (gestão de qualidade e operacional), Operador (lançamento de dados), Visualizador (somente leitura)." },
      { titulo: "Integrações (painel resumo)", descricao: "Visão consolidada de todas as integrações com sistemas externos — status de conexão, última sincronização e botões de reconectar." },
      { titulo: "Log de Auditoria", descricao: "Registro de todas as ações realizadas no sistema: quem fez, o quê, quando e de qual IP — incluindo criações, edições e exclusões." },
      { titulo: "Status do Sistema", descricao: "Monitoramento de saúde: servidor API, banco de dados, WebSocket, armazenamento e serviço de backup — com percentual de uptime." },
      { titulo: "Configurações Gerais", descricao: "Toggles para: 2FA obrigatório, alertas por email, backup diário automático, modo de manutenção e log de auditoria detalhado." },
    ],
    fluxo: ["Onboarding de novo usuário → Configurar perfil → Definir unidade de acesso → Usuário recebe email → Primeiro acesso → Definir nova senha → Acesso ao sistema"],
    dica: "Nunca conceda perfil de Administrador para usuários operacionais. Apenas o gestor de TI e o responsável pela qualidade precisam de acesso de Administrador.",
  },
];

// ── Grupo Config ───────────────────────────────────────────────────────────────

const grupoConfig: Record<string, { color: string; bg: string }> = {
  "Core ONA": { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  "Qualidade": { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "Clínico": { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "Estratégico": { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  "Regulatório": { color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
  "IA & Sistema": { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

const grupos = [...new Set(modulos.map(m => m.grupo))];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Manual() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("home");
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null);

  const moduloSelecionado = modulos.find(m => m.id === selectedId);

  const modulosFiltrados = search.trim()
    ? modulos.filter(m =>
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.resumo.toLowerCase().includes(search.toLowerCase()) ||
        m.paraQueServe.toLowerCase().includes(search.toLowerCase())
      )
    : modulos;

  const gruposFiltrados = grupos.filter(g => modulosFiltrados.some(m => m.grupo === g));

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── Painel Esquerdo: Lista de Módulos ──────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">Manual do Sistema</h2>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setGrupoAberto(null); }}
              placeholder="Buscar módulo..."
              className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {gruposFiltrados.map(grupo => {
            const itens = modulosFiltrados.filter(m => m.grupo === grupo);
            const gc = grupoConfig[grupo];
            const isOpen = search || grupoAberto === grupo || itens.some(m => m.id === selectedId);
            return (
              <div key={grupo} className="mb-1">
                <button
                  onClick={() => setGrupoAberto(isOpen && !search ? null : grupo)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700"
                >
                  <span>{grupo}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen ? "rotate-180" : "")} />
                </button>
                {isOpen && itens.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedId(mod.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                      selectedId === mod.id
                        ? "bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <span className={selectedId === mod.id ? "text-blue-600" : "text-gray-400"}>
                      {mod.icon}
                    </span>
                    <span className="truncate">{mod.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-400 text-center">{modulos.length} módulos documentados · QHealth One 2026</p>
        </div>
      </aside>

      {/* ── Painel Direito: Detalhes do Módulo ─────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {!moduloSelecionado ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecione um módulo para ver a documentação</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-3 rounded-xl", moduloSelecionado.tagBg)}>
                    <span className={moduloSelecionado.tagColor}>{moduloSelecionado.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900">{moduloSelecionado.label}</h1>
                      <Badge className={cn("text-xs", moduloSelecionado.tagColor, moduloSelecionado.tagBg)}>
                        {moduloSelecionado.grupo}
                      </Badge>
                      {moduloSelecionado.onaRelacao && (
                        <Badge className="text-xs bg-amber-100 text-amber-700">
                          <Award className="w-3 h-3 mr-1" /> ONA
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{moduloSelecionado.resumo}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate(moduloSelecionado.path)}
                className="flex-shrink-0 gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                <Play className="w-4 h-4" />
                Abrir Módulo
              </Button>
            </div>

            {/* Para que serve */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-2">Para que serve este módulo?</p>
                    <p className="text-blue-800 text-sm leading-relaxed">{moduloSelecionado.paraQueServe}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relação ONA */}
            {moduloSelecionado.onaRelacao && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-amber-800 text-sm">Relação com ONA 2026:</span>
                    <span className="text-amber-700 text-sm">{moduloSelecionado.onaRelacao}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quem usa */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Quem usa este módulo
              </h2>
              <div className="flex flex-wrap gap-2">
                {moduloSelecionado.quemUsa.map(perfil => (
                  <Badge key={perfil} className="bg-gray-100 text-gray-700 text-sm px-3 py-1">
                    {perfil}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Funcionalidades */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-600" />
                Funcionalidades
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {moduloSelecionado.funcionalidades.map((func, idx) => (
                  <Card key={idx} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{func.titulo}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{func.descricao}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Fluxo de uso */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-gray-600" />
                Fluxo de Uso Recomendado
              </h2>
              {moduloSelecionado.fluxo.map((linha, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{linha}</p>
                </div>
              ))}
            </div>

            {/* Dica de Apresentação */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-900 mb-1">💡 Dica para a Apresentação</p>
                    <p className="text-emerald-800 text-sm leading-relaxed">{moduloSelecionado.dica}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de acesso */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-400">Caminho: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{moduloSelecionado.path}</code></p>
              <Button
                onClick={() => navigate(moduloSelecionado.path)}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                <ExternalLink className="w-4 h-4" />
                Ir para {moduloSelecionado.label}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
