# PRD Completo por Módulo — QHealth One 2026
## Plataforma de Qualidade em Saúde, Governança Assistencial e Acreditação ONA com IA
### Documento de construção para Antigravity + Claude

---

# 1. Resumo Executivo

O **QHealth One 2026** é uma plataforma SaaS enterprise para **qualidade em saúde, acreditação ONA, governança clínica, gestão por unidade de negócio, processos, riscos, protocolos, indicadores, documentos, treinamentos, comunicação institucional e gestão operacional**, com **automação nativa por IA orientada ao Manual ONA 2026**.

Este documento consolida todo o raciocínio construído desde o início do projeto, incluindo:

- benchmark estratégico do mercado de qualidade em saúde;
- visão de produto para superar as soluções atuais do Brasil;
- arquitetura funcional do sistema;
- requisitos do cliente presentes nos anexos manuscritos;
- necessidade de separação por unidade de negócio;
- governança clínica e institucional;
- workflows, regras, backlog e visão de construção em Antigravity com Claude.

A meta do produto é direta:

**ser o sistema mais completo, mais inteligente e mais operacional do mercado brasileiro para qualidade em saúde e acreditação ONA.**

---

# 2. Problema que o Produto Resolve

As instituições de saúde normalmente operam a qualidade de forma fragmentada:

- documentos em uma ferramenta;
- indicadores em planilhas;
- atas em pastas soltas;
- riscos em controles manuais;
- protocolos sem governança integrada;
- requisitos de acreditação desconectados da operação;
- treinamentos sem rastreabilidade;
- planos de ação sem visão executiva;
- ausência de camada inteligente para apoiar ONA 2026.

O QHealth One 2026 nasce para unificar tudo isso em uma única plataforma.

---

# 3. Objetivos do Produto

## 3.1 Objetivos de negócio
- tornar-se referência nacional em software de qualidade em saúde;
- vender para hospitais, clínicas, laboratórios e redes multiunidade;
- competir acima das suites tradicionais de SGQ e das soluções hospitalares genéricas;
- ser percebido como sistema premium, profundo e extremamente operacional.

## 3.2 Objetivos funcionais
- suportar acreditação ONA 2026 de ponta a ponta;
- suportar gestão por unidade de negócio;
- transformar diagnóstico em plano de execução;
- unificar requisitos, documentos, evidências, processos, riscos, protocolos, indicadores, atas e treinamentos;
- permitir acompanhamento executivo por dashboards e scorecards;
- criar uma camada de IA realmente útil e contextual.

## 3.3 Objetivos de experiência
- UX premium enterprise;
- navegação rápida e contextual;
- baixa fricção operacional;
- alta rastreabilidade;
- alto valor para diretoria, qualidade, governança clínica e operação.

---

# 4. Perfis de Usuário

- diretor executivo;
- superintendência hospitalar;
- diretoria técnica;
- diretoria assistencial;
- gerente da qualidade;
- coordenador da qualidade;
- analista da qualidade;
- equipe de acreditação;
- governança clínica;
- líderes de comissão;
- gestores de unidade;
- gestores de processo;
- auditor interno;
- equipe de risco;
- RH/educação corporativa;
- comunicação institucional;
- jurídico/compliance;
- usuário operacional com acesso restrito;
- administrador técnico;
- auditor externo somente leitura.

---

# 5. Escopo Macro do Produto

## 5.1 Sidebar principal
1. Home Executiva
2. Diagnóstico
3. Acreditação ONA 2026
4. Unidades de Negócio
5. Processos
6. Riscos
7. Governança Clínica
8. Comissões
9. Indicadores
10. Jornada do Paciente
11. Protocolos Gerenciados
12. Planejamento Estratégico
13. Políticas & Regimentos
14. Documentos & Evidências
15. Treinamentos
16. Gestão Operacional
17. Comunicação Interna
18. Referências Normativas
19. Notificação de Eventos
20. IA ONA Copilot
21. Integrações
22. Administração

## 5.2 Topbar global
- busca global;
- notificações;
- tarefas pendentes;
- troca de empresa/unidade;
- filtro de período;
- favoritos;
- atalhos rápidos;
- acesso rápido ao copiloto de IA;
- perfil do usuário.

---

# 6. Princípios de Produto

1. **ONA-native**: acreditação é eixo estrutural, não um módulo periférico.
2. **Saúde-first**: modelagem real para hospitais, clínicas e laboratórios.
3. **Multiunidade de verdade**: consolidação corporativa com segregação rigorosa.
4. **Executável**: o sistema deve transformar gap em ação.
5. **Contextual**: tudo precisa conversar com tudo.
6. **Rastreável**: toda decisão e mudança importante deve ficar auditável.
7. **Inteligência útil**: IA para acelerar análise, não para enfeitar o produto.
8. **Premium**: o visual precisa transmitir robustez, confiança e sofisticação.

---

# 7. Requisitos Globais da Plataforma

## 7.1 Requisitos funcionais transversais
- autenticação segura;
- SSO opcional;
- MFA opcional;
- multiempresa;
- multiunidade;
- multissetor;
- perfis e permissões granulares;
- logs de auditoria;
- anexos;
- notificações;
- relatórios e exportações;
- filtros avançados;
- busca global;
- dashboard engine;
- workflow engine;
- trilha histórica;
- API e integrações;
- IA contextual.

## 7.2 Requisitos não funcionais
- arquitetura SaaS cloud-native;
- segregação por cliente;
- LGPD by design;
- criptografia em trânsito e em repouso;
- alta disponibilidade;
- observabilidade;
- escalabilidade;
- logs e monitoramento;
- backup;
- versionamento de objetos críticos;
- performance para uso corporativo.

---

# 8. Estrutura Padrão dos PRDs por Módulo

Cada módulo abaixo segue a mesma lógica:
- objetivo;
- problema que resolve;
- usuários principais;
- escopo funcional;
- telas;
- regras de negócio;
- automações com IA;
- integrações;
- métricas;
- backlog resumido;
- prompt para Antigravity + Claude.

---

# 9. PRD POR MÓDULO

---

# MÓDULO 1 — Home Executiva

## Objetivo
Entregar visão executiva consolidada da qualidade, acreditação, risco, indicadores, ações críticas e maturidade institucional.

## Problema que resolve
Diretoria e lideranças perdem tempo navegando em múltiplos controles para entender a situação real da instituição.

## Usuários principais
- diretoria;
- superintendência;
- gerente da qualidade;
- governança clínica;
- gestores de unidade.

## Escopo funcional
- cards de KPIs principais;
- score institucional;
- score ONA;
- top pendências;
- top riscos;
- planos vencidos;
- semáforo institucional;
- ranking de unidades;
- comunicação crítica;
- atalhos para ações urgentes.

## Telas
- home executiva global;
- home por unidade;
- painel de alertas;
- visão consolidada corporativa.

## Regras de negócio
- a home deve variar conforme perfil do usuário;
- o conteúdo deve respeitar empresa/unidade autorizada;
- alertas críticos devem ser ordenados por criticidade;
- painéis devem refletir filtros globais de período e unidade.

## Automações com IA
- resumo executivo do dia/semana/mês;
- destaque automático de anomalias;
- sugestão de prioridade institucional;
- leitura executiva de riscos e pendências.

## Integrações
- motor de indicadores;
- planos de ação;
- risco;
- acreditação;
- comissões.

## Métricas
- frequência de acesso da liderança;
- tempo médio até ação corretiva;
- redução de pendências vencidas;
- taxa de uso de atalhos críticos.

## Backlog resumido
- widgets configuráveis;
- scorecards;
- alertas;
- ranking;
- favoritos;
- drill-down contextual.

## Prompt para Antigravity + Claude
Crie a Home Executiva do QHealth One 2026 com visual enterprise premium, dashboards de alta densidade, cards executivos, ranking de pendências, top riscos, score ONA, score institucional, semáforo geral e navegação contextual para módulos internos. A home precisa parecer software hospitalar de altíssimo padrão, com leitura rápida para diretoria e filtros por unidade e período.

---

# MÓDULO 2 — Diagnóstico

## Objetivo
Permitir diagnóstico institucional e por unidade, transformando avaliação inicial em base objetiva de implantação.

## Problema que resolve
Sem diagnóstico estruturado, a instituição não sabe onde está, o que está mais frágil e por onde começar.

## Usuários principais
- qualidade;
- consultoria;
- acreditação;
- diretoria.

## Escopo funcional
- formulário de diagnóstico institucional;
- diagnóstico por unidade;
- diagnóstico por requisito;
- status aderente/parcial/não aderente/não aplicável;
- observações técnicas;
- anexos;
- relatório automático;
- histórico por ciclo.

## Telas
- lista de ciclos de diagnóstico;
- formulário de diagnóstico;
- score por unidade;
- relatório consolidado.

## Regras de negócio
- diagnóstico deve possuir ciclo e responsável;
- só pode ser concluído com itens obrigatórios respondidos;
- deve permitir rascunho;
- versão concluída deve ser preservada em histórico.

## Automações com IA
- sugestão inicial de classificação de lacunas;
- leitura analítica de gaps recorrentes;
- geração de sumário executivo do diagnóstico;
- pré-priorização para GUT.

## Integrações
- módulo ONA;
- unidades;
- GUT;
- planos de ação.

## Métricas
- tempo para concluir diagnóstico;
- cobertura do diagnóstico por unidade;
- quantidade de gaps por categoria;
- taxa de evolução entre ciclos.

## Backlog resumido
- ciclo de diagnóstico;
- rascunho;
- classificação;
- anexos;
- score;
- exportação.

## Prompt para Antigravity + Claude
Crie o módulo Diagnóstico do QHealth One 2026. Ele deve suportar avaliação institucional e por unidade, com status aderente, parcialmente aderente, não aderente e não aplicável, comentários técnicos, anexos, score por unidade, relatório automático e integração com matriz GUT. O visual deve ser corporativo, limpo e muito forte para times de qualidade e acreditação.

---

# MÓDULO 3 — Relatório de Diagnóstico + Matriz GUT

## Objetivo
Transformar gaps em prioridades práticas de execução.

## Problema que resolve
Mesmo quando a instituição conhece seus problemas, ela normalmente não possui um método objetivo de priorização.

## Usuários principais
- qualidade;
- diretoria;
- coordenação de implantação;
- governança.

## Escopo funcional
- classificação GUT;
- score automático;
- ranking de gaps;
- agrupamento por unidade;
- plano de ação gerado da GUT;
- justificativa da prioridade.

## Telas
- matriz GUT;
- ranking de prioridades;
- detalhe do item;
- criação de ação.

## Regras de negócio
- score GUT = Gravidade x Urgência x Tendência;
- item deve ser classificado por pessoa autorizada;
- item da GUT pode originar um ou vários planos;
- vínculo com gap original deve ser preservado.

## Automações com IA
- sugestão de pontuação inicial;
- justificativa textual da prioridade;
- agrupamento inteligente de problemas similares;
- proposta inicial de sequência de implantação.

## Integrações
- diagnóstico;
- gestão operacional;
- unidade de negócio;
- relatórios.

## Métricas
- tempo entre gap identificado e ação criada;
- percentual de gaps priorizados;
- taxa de execução dos itens de maior GUT.

## Backlog resumido
- pontuação;
- ranking;
- criação de ação;
- filtros;
- vínculo com origem;
- IA de priorização.

## Prompt para Antigravity + Claude
Crie o módulo de Matriz GUT do QHealth One 2026 com ranking de prioridades, cálculo automático, filtros por unidade e origem, possibilidade de gerar plano de ação direto do item priorizado e justificativa automática por IA. O layout deve transmitir análise estratégica e não apenas tabela simples.

---

# MÓDULO 4 — Acreditação ONA 2026

## Objetivo
Gerenciar requisitos, evidências, aderência, pendências, prontidão e preparação para visita de acreditação.

## Problema que resolve
A acreditação costuma ser gerida em múltiplas planilhas, checklists, documentos e memórias dispersas.

## Usuários principais
- equipe de acreditação;
- qualidade;
- diretoria;
- auditores internos;
- consultoria.

## Escopo funcional
- árvore de requisitos;
- requisitos por capítulo;
- requisitos por unidade;
- status de aderência;
- evidências;
- análise por requisito;
- dashboard de prontidão;
- simulação de visita;
- dossiê;
- vínculo com processo, risco, documento, indicador, comissão e protocolo.

## Telas
- dashboard ONA;
- árvore do manual;
- detalhe do requisito;
- evidências do requisito;
- simulação de visita;
- prontidão por unidade;
- dossiê final.

## Regras de negócio
- requisito deve ter hierarquia estruturada;
- evidências só podem ser vinculadas a requisito válido;
- aderência sugerida por IA não fecha requisito automaticamente;
- dossiê deve usar apenas evidências válidas e vigentes.

## Automações com IA
- leitura semântica do Manual ONA 2026;
- sugestão de aderência;
- sugestão de evidências;
- identificação de gaps críticos;
- score de prontidão;
- perguntas e respostas sobre requisitos;
- checklist inteligente para simulação de visita.

## Integrações
- documentos;
- planos de ação;
- risco;
- processos;
- protocolos;
- comissões;
- treinamentos.

## Métricas
- percentual de requisitos aderentes;
- percentual de evidências validadas;
- score de prontidão;
- tempo médio para adequação;
- reincidência de fragilidade por requisito.

## Backlog resumido
- árvore;
- evidências;
- status;
- dashboard;
- dossiê;
- IA ONA.

## Prompt para Antigravity + Claude
Crie o módulo Acreditação ONA 2026 do QHealth One 2026. Ele precisa ser o coração da plataforma. Estruture árvore de requisitos, evidências, aderência, simulação de visita, prontidão por unidade, dossiê final e copiloto de IA do Manual ONA 2026. O módulo deve parecer mais profundo e mais premium do que qualquer solução de acreditação existente no mercado brasileiro.

---

# MÓDULO 5 — Unidades de Negócio

## Objetivo
Separar a gestão por unidade de negócio, com visão individual e consolidada.

## Problema que resolve
Instituições multiunidade ou multisserviço não conseguem separar claramente requisitos, documentos, protocolos, indicadores e ações.

## Usuários principais
- qualidade;
- diretoria;
- gestores de unidade;
- operação.

## Escopo funcional
Cada unidade deve possuir:
- requisitos próprios;
- POPs;
- protocolos;
- fluxos;
- indicadores;
- PDCA;
- atas;
- planos de ação;
- score de maturidade;
- semáforo operacional.

## Telas
- lista de unidades;
- painel da unidade;
- score da unidade;
- objetos vinculados;
- histórico da unidade.

## Regras de negócio
- toda unidade deve ter empresa e tipo;
- objetos podem ser corporativos ou específicos da unidade;
- o painel da unidade só exibe objetos permitidos e vinculados;
- semáforo deve atualizar com base no status das ações.

## Automações com IA
- resumo executivo da unidade;
- comparação entre unidades;
- priorização de gaps por unidade;
- recomendação de foco por unidade.

## Integrações
- diagnóstico;
- ONA;
- indicadores;
- documentos;
- planos;
- atas.

## Métricas
- score médio por unidade;
- número de gaps críticos por unidade;
- taxa de execução de planos por unidade;
- aderência documental por unidade.

## Backlog resumido
- cadastro de unidade;
- painel;
- vínculos;
- filtros;
- score;
- semáforo.

## Prompt para Antigravity + Claude
Crie o módulo Unidades de Negócio do QHealth One 2026. Cada unidade precisa ter visão própria de requisitos, POPs, protocolos, fluxos, indicadores, PDCA, atas e planos de ação, além de score e semáforo. O módulo deve transmitir organização operacional de alto nível e suportar visão consolidada corporativa.

---

# MÓDULO 6 — Processos

## Objetivo
Mapear macroprocessos, processos e subprocessos, conectando SIPOC, fluxo, indicadores, riscos e documentos.

## Problema que resolve
Processos críticos ficam sem dono, sem padronização e sem vínculo com risco e acreditação.

## Usuários principais
- qualidade;
- processos;
- gestores de unidade;
- governança clínica.

## Escopo funcional
- mapa de processos;
- macroprocesso > processo > subprocesso > atividade;
- SIPOC;
- fluxo vinculado;
- dono do processo;
- documentos vinculados;
- riscos vinculados;
- indicadores vinculados;
- protocolo vinculado;
- unidade vinculada.

## Telas
- mapa de processos;
- lista de processos;
- detalhe do processo;
- SIPOC;
- fluxo do processo;
- painel de relacionamento.

## Regras de negócio
- processo deve ter dono e unidade;
- SIPOC deve estar vinculado a processo existente;
- processo pode ter múltiplos riscos e indicadores;
- nova versão do fluxo deve manter histórico.

## Automações com IA
- sugestão de riscos por processo;
- resumo do processo para auditoria;
- sugestão de evidências relacionadas;
- detecção de processos sem documentação mínima.

## Integrações
- unidade;
- risco;
- indicador;
- documentos;
- ONA;
- protocolo.

## Métricas
- percentual de processos mapeados;
- percentual com SIPOC completo;
- percentual com riscos vinculados;
- percentual com indicadores ativos.

## Backlog resumido
- cadastro;
- SIPOC;
- fluxo;
- vínculos;
- versionamento;
- painel.

## Prompt para Antigravity + Claude
Crie o módulo Processos do QHealth One 2026 com mapa de macroprocessos, detalhe do processo, SIPOC, vínculo com fluxos, indicadores, riscos, documentos, protocolos e requisitos ONA. O layout deve ser visualmente sofisticado e muito claro para gestão hospitalar.

---

# MÓDULO 7 — Riscos

## Objetivo
Gerenciar riscos assistenciais, operacionais, estratégicos e regulatórios, incluindo HFMEA.

## Problema que resolve
Riscos são tratados de forma reativa, sem vínculo com processo, indicador, protocolo e ação.

## Usuários principais
- qualidade;
- risco;
- diretoria;
- governança clínica;
- gestores.

## Escopo funcional
- cadastro de risco;
- matriz probabilidade x impacto;
- criticidade;
- heatmap;
- risco inerente e residual;
- controles existentes;
- plano de mitigação;
- HFMEA;
- vínculo com processo, protocolo, unidade e requisito ONA.

## Telas
- lista de riscos;
- heatmap;
- detalhe do risco;
- HFMEA;
- painel de riscos críticos.

## Regras de negócio
- risco deve ter responsável;
- criticidade deve seguir regra configurada;
- risco crítico deve aparecer em painéis executivos;
- HFMEA deve referenciar processo/fluxo crítico;
- mitigação deve poder gerar plano operacional.

## Automações com IA
- priorização de riscos;
- sugestão de mitigação;
- leitura comparativa de riscos por unidade;
- detecção de risco recorrente por incidentes e falhas de protocolo.

## Integrações
- processos;
- ações;
- protocolos;
- ONA;
- eventos notificáveis;
- indicadores.

## Métricas
- percentual de riscos avaliados;
- riscos críticos sem plano;
- tempo médio de mitigação;
- risco residual médio.

## Backlog resumido
- cadastro;
- heatmap;
- HFMEA;
- mitigação;
- filtros;
- IA.

## Prompt para Antigravity + Claude
Crie o módulo Riscos do QHealth One 2026 com matriz, heatmap, risco detalhado, risco residual, plano de mitigação e HFMEA. O módulo deve transmitir robustez corporativa e inteligência assistencial, com forte navegação contextual para processo, protocolo, unidade e requisito ONA.

---

# MÓDULO 8 — Governança Clínica

## Objetivo
Criar camada institucional de monitoramento clínico, desfechos, protocolos prioritários e aderência assistencial.

## Problema que resolve
A gestão clínica costuma ficar desconectada da qualidade, dos protocolos e da jornada do paciente.

## Usuários principais
- diretoria clínica;
- governança clínica;
- qualidade;
- liderança assistencial.

## Escopo funcional
- painel clínico;
- indicadores clínicos;
- aderência a protocolos;
- desvios assistenciais;
- desfechos por linha de cuidado;
- vínculo com jornada;
- vínculo com risco assistencial.

## Telas
- painel clínico;
- protocolos prioritários;
- desvios assistenciais;
- desfechos;
- linha de cuidado.

## Regras de negócio
- indicadores clínicos devem ter dono institucional;
- governança clínica deve refletir apenas unidades elegíveis;
- desvio assistencial crítico deve poder gerar plano de ação.

## Automações com IA
- leitura executiva da governança clínica;
- sugestão de prioridades assistenciais;
- alerta de protocolo com baixa aderência;
- resumo de desfechos críticos.

## Integrações
- indicadores;
- protocolos;
- jornada;
- risco;
- planos.

## Métricas
- aderência a protocolos prioritários;
- desfechos clínicos acompanhados;
- taxa de ação corretiva em desvio assistencial.

## Prompt para Antigravity + Claude
Crie o módulo Governança Clínica do QHealth One 2026 com painel clínico executivo, protocolos prioritários, desfechos, aderência clínica e vínculo com jornada do paciente e riscos assistenciais. O visual precisa ser elegante, altamente técnico e executivo.

---

# MÓDULO 9 — Comissões

## Objetivo
Organizar comissões, membros, calendário, regimentos, legislações, atas, deliberações e planos.

## Problema que resolve
As comissões existem formalmente, mas a execução das decisões, normas e atas costuma ser muito fraca.

## Usuários principais
- governança;
- qualidade;
- secretaria institucional;
- líderes de comissão.

## Escopo funcional
- cadastro de comissão;
- membros;
- calendário;
- regimento;
- legislação vinculada;
- atas;
- deliberações;
- plano de ação da comissão;
- histórico.

## Telas
- lista de comissões;
- detalhe da comissão;
- calendário;
- ata;
- painel de pendências;
- documentos vinculados.

## Regras de negócio
- comissão deve ter escopo e membros mínimos;
- ata só pode existir para comissão cadastrada;
- deliberação pode gerar ação;
- regimentos e normas devem ser vinculáveis sem perda de histórico.

## Automações com IA
- sumário da reunião;
- consolidação de deliberações;
- sugestão de pendências críticas;
- resumo executivo da comissão.

## Integrações
- documentos;
- referências normativas;
- gestão operacional;
- comunicação interna.

## Métricas
- frequência de reuniões;
- percentual de deliberações executadas;
- tempo médio para fechamento de pendências.

## Prompt para Antigravity + Claude
Crie o módulo Comissões do QHealth One 2026 com cadastro, agenda, atas, regimentos, legislações, deliberações e planos derivados. O módulo deve ter cara de governança institucional robusta, com histórico, rastreabilidade e visão clara de pendências.

---

# MÓDULO 10 — Indicadores

## Objetivo
Centralizar indicadores institucionais, estratégicos, assistenciais, operacionais e setoriais.

## Problema que resolve
Os indicadores geralmente ficam espalhados em planilhas e não conversam com o restante do sistema.

## Usuários principais
- diretoria;
- qualidade;
- controladoria;
- gestores de unidade;
- governança clínica.

## Escopo funcional
- biblioteca de indicadores;
- indicadores por categoria;
- metas;
- semáforo;
- coleta manual ou integrada;
- scorecards;
- dashboards;
- BSC;
- benchmark interno;
- comentário gerencial;
- abertura de ação por desvio.

## Telas
- catálogo de indicadores;
- detalhe do indicador;
- scorecards;
- dashboards;
- painéis por unidade;
- BSC.

## Regras de negócio
- todo indicador deve ter fórmula ou método de apuração;
- indicador deve ter meta e periodicidade;
- semáforo deve seguir regra configurada;
- indicador fora da meta pode abrir ação.

## Automações com IA
- resumo gerencial automático;
- detecção de tendência negativa;
- sugestão de análise executiva;
- recomendação de foco por unidade.

## Integrações
- BSC;
- unidades;
- governança clínica;
- protocolos;
- ações;
- home executiva.

## Métricas
- indicadores atualizados no prazo;
- indicadores fora da meta;
- percentual com comentário gerencial;
- tempo médio para ação corretiva.

## Prompt para Antigravity + Claude
Crie o módulo Indicadores do QHealth One 2026 com biblioteca de indicadores, scorecards, dashboards, BSC, metas, semáforos e abertura de ação por desvio. O módulo deve ter aparência de BI executivo premium, sem parecer ferramenta genérica de gráficos.

---

# MÓDULO 11 — Jornada do Paciente

## Objetivo
Mapear a experiência assistencial do paciente e identificar rupturas, gargalos e falhas de continuidade.

## Problema que resolve
A organização geralmente mede setores isolados, mas não mede a jornada real do paciente.

## Usuários principais
- governança clínica;
- qualidade;
- diretoria assistencial;
- gestores assistenciais.

## Escopo funcional
- jornada por linha de cuidado;
- etapas;
- tempos esperados;
- rupturas;
- gargalos;
- handoffs;
- vínculo com protocolo;
- vínculo com desfecho;
- vínculo com risco.

## Telas
- mapa da jornada;
- detalhe por linha de cuidado;
- lista de rupturas;
- análise de gargalos;
- visão por unidade.

## Regras de negócio
- jornada deve ter ordem sequencial;
- ruptura deve estar vinculada a etapa;
- ruptura crítica pode gerar ação;
- jornada pode ser corporativa ou por unidade.

## Automações com IA
- análise de gargalos recorrentes;
- resumo da jornada por linha de cuidado;
- sugestão de pontos críticos;
- recomendação de ação para ruptura recorrente.

## Integrações
- protocolos;
- governança clínica;
- riscos;
- ações;
- eventos.

## Métricas
- número de rupturas por jornada;
- tempo médio por etapa;
- taxa de ruptura crítica;
- ações geradas por jornada.

## Prompt para Antigravity + Claude
Crie o módulo Jornada do Paciente do QHealth One 2026 com mapa visual da jornada, etapas, handoffs, rupturas, gargalos e relação com protocolos e riscos. O módulo deve parecer plataforma moderna de orquestração assistencial, com visual premium e muita clareza.

---

# MÓDULO 12 — Protocolos Gerenciados

## Objetivo
Controlar protocolos institucionais prioritários e sua aderência operacional.

## Problema que resolve
Protocolos costumam existir no papel, sem monitoramento real de uso, treinamento e falha de adesão.

## Usuários principais
- governança clínica;
- qualidade;
- liderança assistencial;
- educação corporativa.

## Escopo funcional
- biblioteca de protocolos;
- versão;
- vigência;
- fluxos;
- indicadores do protocolo;
- treinamento do protocolo;
- falhas de adesão;
- vínculo com evento, risco e ação.

## Protocolos iniciais sugeridos
- sepse;
- AVC;
- dor torácica;
- TEV;
- contenção;
- protocolo institucional de manejo de risco de autoagressão.

## Telas
- lista de protocolos;
- detalhe do protocolo;
- aderência;
- falhas;
- treinamentos vinculados;
- indicadores.

## Regras de negócio
- protocolo deve ter responsável e vigência;
- protocolo vencido não pode seguir como vigente sem revisão;
- falha de adesão pode gerar ação;
- treinamento pode ser obrigatório por unidade.

## Automações com IA
- alerta de protocolo com baixa aderência;
- recomendação de evidências relacionadas ao protocolo;
- resumo de falhas recorrentes;
- sugestão de melhoria operacional.

## Integrações
- governança clínica;
- treinamentos;
- indicadores;
- risco;
- jornada;
- documentos.

## Métricas
- aderência por protocolo;
- número de falhas de adesão;
- cobertura de treinamento por protocolo;
- revisão no prazo.

## Prompt para Antigravity + Claude
Crie o módulo Protocolos Gerenciados do QHealth One 2026 com biblioteca, detalhes, indicadores, treinamentos e aderência operacional. Inclua os protocolos prioritários definidos pelo projeto e permita falhas de adesão vinculadas a ações, riscos e eventos. O módulo deve ter aparência clínica premium e extremamente organizada.

---

# MÓDULO 13 — Planejamento Estratégico

## Objetivo
Executar a estratégia institucional dentro da plataforma usando BSC e desdobramento.

## Problema que resolve
O planejamento estratégico costuma ficar isolado da operação e da qualidade.

## Usuários principais
- diretoria;
- planejamento;
- qualidade;
- controladoria.

## Escopo funcional
- mapa estratégico;
- perspectivas do BSC;
- objetivos;
- iniciativas;
- indicadores estratégicos;
- desdobramento por unidade;
- planos estratégicos;
- semáforo.

## Telas
- mapa estratégico;
- objetivos;
- iniciativas;
- scorecard estratégico;
- desdobramento por unidade.

## Regras de negócio
- objetivo estratégico deve poder ter indicador vinculado;
- iniciativa deve ter responsável e prazo;
- desdobramento deve preservar vínculo com objetivo central.

## Automações com IA
- resumo do desempenho estratégico;
- leitura de desvios do BSC;
- sugestão de prioridade estratégica;
- síntese para reunião de diretoria.

## Integrações
- indicadores;
- home executiva;
- gestão operacional.

## Métricas
- percentual de objetivos com indicadores ativos;
- execução das iniciativas;
- evolução do score estratégico.

## Prompt para Antigravity + Claude
Crie o módulo Planejamento Estratégico do QHealth One 2026 com BSC, mapa estratégico, objetivos, iniciativas, desdobramento para unidades e scorecards. O módulo deve parecer ferramenta executiva de alta governança e não um planner simples.

---

# MÓDULO 14 — Políticas & Regimentos

## Objetivo
Organizar políticas institucionais, políticas setoriais, regimentos e base documental de governança.

## Problema que resolve
A base institucional costuma ser desorganizada, pouco rastreável e distante da execução.

## Usuários principais
- governança;
- qualidade;
- jurídico/compliance;
- líderes institucionais.

## Escopo funcional
- biblioteca institucional;
- categorização;
- políticas;
- políticas setoriais;
- regimentos;
- revisão;
- aprovação;
- leitura;
- vínculos com comissão, processo e treinamento.

## Telas
- biblioteca institucional;
- detalhe da política;
- fluxo de aprovação;
- histórico de versões.

## Regras de negócio
- item deve seguir workflow documental;
- pode ser corporativo ou por unidade;
- deve possuir responsável e vigência.

## Automações com IA
- resumo da política;
- identificação de política desatualizada;
- sugestão de vínculos institucionais.

## Integrações
- documentos;
- comissões;
- treinamentos;
- referências normativas.

## Métricas
- políticas vigentes;
- revisões vencidas;
- taxa de leitura;
- tempo médio de aprovação.

## Prompt para Antigravity + Claude
Crie o módulo Políticas & Regimentos do QHealth One 2026 com biblioteca institucional, versionamento, revisão, aprovação, leitura obrigatória e vínculos com comissões, treinamentos e documentos. O visual deve transmitir governança forte e organização institucional.

---

# MÓDULO 15 — Documentos & Evidências

## Objetivo
Controlar documentos, POPs, evidências, assinatura digital, leitura obrigatória e rastreabilidade.

## Problema que resolve
A gestão documental é um dos grandes gargalos da qualidade em saúde e da acreditação.

## Usuários principais
- gestão documental;
- qualidade;
- acreditação;
- gestores;
- aprovadores.

## Escopo funcional
- lista mestra;
- documentos;
- POPs;
- versionamento;
- workflow de aprovação;
- assinatura digital;
- leitura obrigatória;
- obsolescência;
- evidências ONA;
- histórico.

## Telas
- lista mestra;
- detalhe do documento;
- fluxo de aprovação;
- leituras pendentes;
- evidências vinculadas.

## Regras de negócio
- documento vigente só após aprovação final;
- só uma versão vigente por vez, salvo regra especial;
- assinatura deve ser auditável;
- leitura obrigatória deve registrar usuário e data.

## Automações com IA
- resumo documental;
- sugestão de vínculo com requisito ONA;
- detecção de documento possivelmente desatualizado;
- recomendação de leitura por contexto.

## Integrações
- ONA;
- unidades;
- processos;
- protocolos;
- treinamentos;
- comissões.

## Métricas
- percentual de documentos vigentes;
- revisões vencidas;
- leitura obrigatória concluída;
- tempo médio de aprovação.

## Prompt para Antigravity + Claude
Crie o módulo Documentos & Evidências do QHealth One 2026 com lista mestra, workflow de aprovação, assinatura digital, leitura obrigatória, evidências ONA, histórico de versões e rastreabilidade total. O módulo deve ser extremamente robusto, elegante e pronto para contexto hospitalar enterprise.

---

# MÓDULO 16 — Treinamentos

## Objetivo
Gerenciar trilhas de capacitação, vídeo-aulas, testes, recertificação e vínculo com documentos e protocolos.

## Problema que resolve
Treinamento institucional geralmente é pouco rastreável e não comprova competência real.

## Usuários principais
- RH;
- educação corporativa;
- qualidade;
- governança clínica;
- liderança setorial.

## Escopo funcional
- trilhas de aprendizagem;
- vídeo-aulas;
- pré-teste;
- pós-teste;
- nota mínima;
- certificado;
- recertificação;
- vínculo com documento e protocolo;
- acompanhamento por unidade.

## Telas
- catálogo de trilhas;
- detalhe da trilha;
- player de vídeo;
- testes;
- dashboard de conclusão;
- recertificação.

## Regras de negócio
- trilha deve ter público-alvo;
- nota mínima pode ser obrigatória;
- pré e pós-teste podem ser opcionais ou obrigatórios;
- recertificação deve gerar alerta antes do vencimento.

## Automações com IA
- resumo de treinamento;
- criação inicial de quiz a partir de documento/protocolo;
- recomendação de trilhas por contexto;
- alerta de baixa cobertura de treinamento.

## Integrações
- documentos;
- protocolos;
- ONA;
- unidades;
- comunicação interna.

## Métricas
- taxa de conclusão;
- nota média;
- evolução entre pré e pós-teste;
- recertificações vencidas.

## Prompt para Antigravity + Claude
Crie o módulo Treinamentos do QHealth One 2026 com trilhas, vídeo-aulas, pré e pós-teste, notas mínimas, recertificação e vínculo com documentos e protocolos. O módulo deve ser premium, simples de usar e muito forte em rastreabilidade.

---

# MÓDULO 17 — Gestão Operacional

## Objetivo
Executar planos de ação detalhados com responsáveis definidos, semáforo e validação de efetividade.

## Problema que resolve
Planos de ação normalmente são abertos, mas não acompanhados com rigor institucional.

## Usuários principais
- qualidade;
- diretoria;
- gestores;
- líderes de comissão;
- governança.

## Escopo funcional
- plano de ação;
- origem do plano;
- responsável;
- prazo;
- subtarefas;
- dependências;
- evidências de conclusão;
- semáforo verde/amarelo/vermelho;
- backlog;
- efetividade;
- reabertura.

## Telas
- backlog de ações;
- detalhe da ação;
- painel por responsável;
- painel por unidade;
- semáforo institucional.

## Regras de negócio
- ação deve ter origem e responsável;
- semáforo deve atualizar automaticamente;
- ação crítica pode exigir validação de efetividade;
- ação deve preservar vínculo com item de origem.

## Automações com IA
- priorização de backlog;
- resumo do plano;
- sugestão de subtarefas;
- alerta de atraso crítico.

## Integrações
- diagnóstico;
- GUT;
- ONA;
- risco;
- indicadores;
- atas;
- jornada;
- protocolos.

## Métricas
- ações no prazo;
- ações vencidas;
- ações por origem;
- taxa de efetividade;
- backlog crítico.

## Prompt para Antigravity + Claude
Crie o módulo Gestão Operacional do QHealth One 2026 com backlog de planos de ação, semáforo verde/amarelo/vermelho, detalhe completo da ação, subtarefas, responsáveis, evidências e validação de efetividade. O módulo deve parecer centro operacional premium de execução institucional.

---

# MÓDULO 18 — Comunicação Interna

## Objetivo
Distribuir comunicados, campanhas e atualizações institucionais com confirmação de leitura.

## Problema que resolve
A informação institucional se perde e não chega corretamente aos colaboradores.

## Usuários principais
- comunicação;
- RH;
- qualidade;
- governança.

## Escopo funcional
- mural institucional;
- comunicados;
- campanhas;
- segmentação por unidade/setor/perfil;
- prioridade;
- leitura obrigatória;
- vigência.

## Telas
- mural;
- detalhe do comunicado;
- gerenciamento de campanhas;
- relatório de leitura.

## Regras de negócio
- comunicado deve ter escopo e vigência;
- comunicado crítico pode exigir leitura confirmada;
- usuário só vê comunicados do seu contexto ou corporativos.

## Automações com IA
- resumo de comunicado;
- sugestão de título e texto institucional;
- recomendação de público-alvo.

## Integrações
- home;
- treinamentos;
- documentos;
- unidades.

## Métricas
- taxa de leitura;
- alcance por comunicado;
- tempo médio de leitura;
- campanhas ativas.

## Prompt para Antigravity + Claude
Crie o módulo Comunicação Interna do QHealth One 2026 com mural, comunicados, campanhas, segmentação por unidade e confirmação de leitura. O visual deve ser corporativo, sofisticado e muito fácil para comunicação institucional.

---

# MÓDULO 19 — Referências Normativas

## Objetivo
Manter biblioteca viva de RDCs, normas, atualizações e referências técnicas vinculadas ao contexto da instituição.

## Problema que resolve
A base regulatória costuma ficar dispersa e sem conexão com os processos e protocolos.

## Usuários principais
- qualidade;
- compliance;
- comissões;
- governança;
- jurídico.

## Escopo funcional
- biblioteca regulatória;
- biblioteca bibliográfica;
- busca por tema;
- vínculo com requisito ONA;
- vínculo com protocolo;
- vínculo com documento;
- vínculo com comissão;
- histórico de atualização.

## Telas
- biblioteca;
- detalhe da referência;
- vínculos;
- atualizações recentes.

## Regras de negócio
- referência deve ter tipo e categoria;
- atualização deve preservar histórico;
- vínculos devem ser múltiplos e contextuais.

## Automações com IA
- resumo técnico da referência;
- sugestão de vínculo institucional;
- alerta de referência potencialmente impactada por atualização cadastrada manualmente pela equipe.

## Integrações
- documentos;
- comissões;
- protocolos;
- ONA.

## Métricas
- referências cadastradas;
- referências com vínculos ativos;
- atualizações recentes registradas.

## Prompt para Antigravity + Claude
Crie o módulo Referências Normativas do QHealth One 2026 com biblioteca de RDCs, normas, atualizações e referências técnicas, com vínculos contextuais para comissões, protocolos, documentos e requisitos ONA. O módulo deve ser muito organizado, pesquisável e elegante.

---

# MÓDULO 20 — Notificação de Eventos

## Objetivo
Registrar, acompanhar e tratar eventos notificáveis e conformidade regulatória.

## Problema que resolve
Eventos notificáveis e fluxos regulatórios costumam ser manuais e pouco rastreáveis.

## Usuários principais
- qualidade;
- comissões;
- compliance;
- risco;
- diretoria assistencial.

## Escopo funcional
- cadastro de evento;
- classificação;
- responsável;
- prazos;
- fila de análise;
- tratativa;
- histórico;
- vínculo com comissão, protocolo, risco e ação.

## Telas
- fila de eventos;
- detalhe do evento;
- timeline;
- pendências regulatórias;
- painel de prazos.

## Regras de negócio
- evento deve ter categoria e responsável;
- prazo regulatório deve ser rastreado quando aplicável;
- histórico deve ser preservado;
- evento pode gerar ação e risco.

## Automações com IA
- resumo do evento;
- sugestão de classificação inicial;
- alerta de prazo crítico;
- consolidação de eventos recorrentes.

## Integrações
- comissões;
- risco;
- planos de ação;
- home executiva.

## Métricas
- eventos abertos;
- eventos com prazo vencido;
- tempo médio de tratativa;
- eventos recorrentes.

## Prompt para Antigravity + Claude
Crie o módulo Notificação de Eventos do QHealth One 2026 com fila de eventos, detalhe completo, prazos, histórico, tratativa e vínculo com riscos, comissões e ações. O módulo deve transmitir rigor regulatório e rastreabilidade forte.

---

# MÓDULO 21 — IA ONA Copilot

## Objetivo
Criar o grande diferencial da plataforma: um copiloto institucional orientado ao Manual ONA 2026 e ao contexto real da organização.

## Problema que resolve
As equipes gastam muito tempo interpretando requisitos, organizando evidências, cruzando informações e escrevendo relatórios.

## Usuários principais
- qualidade;
- acreditação;
- diretoria;
- governança clínica;
- auditoria interna.

## Escopo funcional
- chat contextual;
- base semântica do ONA 2026;
- pergunta e resposta;
- sugestão de aderência;
- sugestão de evidência;
- gap analysis;
- sugestão de prioridade GUT;
- resumo executivo;
- geração de checklist de auditoria;
- resumo de unidade.

## Telas
- chat central;
- biblioteca de prompts rápidos;
- resultados por contexto;
- sugestões de evidência;
- relatórios gerados;
- análises por unidade.

## Regras de negócio
- IA só acessa módulos permitidos ao usuário;
- IA atua como assistente, não decisor final;
- toda sugestão precisa estar identificada como gerada por IA;
- relatórios críticos devem ser revisáveis antes da consolidação.

## Automações com IA
- todas as listadas no escopo;
- copiloto de diagnóstico;
- copiloto de acreditação;
- copiloto executivo;
- copiloto de auditoria;
- copiloto de risco;
- copiloto de plano de ação.

## Integrações
- todos os módulos principais.

## Métricas
- taxa de uso do copiloto;
- tempo economizado por análise;
- quantidade de relatórios gerados;
- quantidade de sugestões convertidas em ação;
- aderência entre sugestão e validação humana.

## Prompt para Antigravity + Claude
Crie o módulo IA ONA Copilot do QHealth One 2026. Ele deve ser um assistente institucional de alto nível com chat contextual, leitura semântica do Manual ONA 2026, sugestão de aderência, evidências, gaps, prioridades GUT, checklists de auditoria e relatórios executivos. A IA deve parecer parte central do produto e não um recurso periférico. O design deve ser premium e extremamente confiável.

---

# MÓDULO 22 — Integrações

## Objetivo
Conectar o sistema a ERPs, HIS, planilhas, serviços externos e APIs institucionais.

## Problema que resolve
Sem integração, o sistema vira mais um lugar de digitação manual.

## Usuários principais
- administração técnica;
- implantação;
- TI;
- produtos.

## Escopo funcional
- catálogo de integrações;
- configuração por API;
- status;
- logs;
- importação de arquivos;
- validação de esquema;
- monitoramento de falhas.

## Telas
- catálogo de integrações;
- detalhe da integração;
- logs;
- fila de importação;
- monitoramento.

## Regras de negócio
- integração deve respeitar segregação por cliente;
- falhas devem gerar log detalhado;
- importação deve validar formato antes de confirmar.

## Automações com IA
- resumo de erro técnico em linguagem mais legível;
- classificação de falha recorrente.

## Integrações esperadas
- HIS;
- ERP;
- prontuário eletrônico;
- planilhas corporativas;
- armazenamento documental;
- SSO.

## Métricas
- integrações ativas;
- taxa de sucesso;
- falhas por período;
- tempo de resolução.

## Prompt para Antigravity + Claude
Crie o módulo Integrações do QHealth One 2026 com catálogo, status, logs, importação e monitoramento, preparado para ambiente SaaS enterprise hospitalar. O módulo deve ser claro para implantação e técnico o suficiente para administração corporativa.

---

# MÓDULO 23 — Administração

## Objetivo
Gerenciar usuários, permissões, unidades, taxonomias, parâmetros e configurações globais.

## Problema que resolve
Sem base administrativa forte, o sistema perde segurança, governança e escalabilidade.

## Usuários principais
- administração do sistema;
- TI;
- implantação;
- product ops.

## Escopo funcional
- usuários;
- perfis;
- permissões;
- empresas;
- unidades;
- setores;
- taxonomias;
- parâmetros;
- auditoria de acesso;
- templates globais.

## Telas
- lista de usuários;
- perfil/permissão;
- empresas e unidades;
- taxonomias;
- auditoria;
- configurações.

## Regras de negócio
- todo usuário deve ter contexto mínimo;
- permissão deve ser granular;
- alterações críticas devem gerar trilha de auditoria;
- exclusões sensíveis devem respeitar vínculos.

## Automações com IA
- nenhuma automação decisória;
- apenas auxílio textual opcional em descrição de perfis/templates.

## Integrações
- SSO;
- logs;
- notificações;
- todos os módulos.

## Métricas
- usuários ativos;
- perfis configurados;
- auditorias registradas;
- incidentes de acesso evitados.

## Prompt para Antigravity + Claude
Crie o módulo Administração do QHealth One 2026 com usuários, empresas, unidades, perfis, permissões granulares, taxonomias, parâmetros do sistema e trilha de auditoria. O módulo deve ter cara de console enterprise robusto e seguro.

---

# 10. Roadmap de Construção Recomendado no Antigravity + Claude

## Fase 1 — Fundação vendável
- Administração
- Home Executiva
- Diagnóstico
- GUT
- Acreditação ONA 2026
- Unidades de Negócio
- Processos
- Riscos
- Documentos & Evidências
- Gestão Operacional
- Indicadores

## Fase 2 — Profundidade institucional
- Comissões
- Políticas & Regimentos
- Planejamento Estratégico
- Treinamentos
- Comunicação Interna
- Referências Normativas
- Notificação de Eventos

## Fase 3 — Diferenciação brutal
- Governança Clínica
- Jornada do Paciente
- Protocolos Gerenciados
- IA ONA Copilot avançado
- Integrações profundas

---

# 11. Regras Gerais para Construção no Antigravity com Claude

1. Cada módulo deve ser construído como subproduto claro, mas conectado aos demais.
2. A linguagem visual deve ser premium, enterprise, limpa, sofisticada e hospitalar.
3. Nenhum módulo deve parecer template genérico.
4. As tabelas devem ser fortes, filtráveis e com boas ações rápidas.
5. Os dashboards precisam misturar leitura executiva e operacional.
6. Os vínculos entre módulos devem ser visíveis e navegáveis.
7. O Claude deve receber sempre contexto de:
   - objetivo do módulo;
   - usuários;
   - regras de negócio;
   - telas;
   - dados principais;
   - diferenciais esperados.
8. A IA deve ser desenhada como parte central do produto, com validação humana obrigatória em decisões sensíveis.

---

# 12. Prompt Mestre Final para o Claude no Antigravity

Você vai construir a plataforma **QHealth One 2026**, um sistema SaaS enterprise premium para **qualidade em saúde, acreditação ONA 2026, governança clínica, gestão por unidade de negócio, processos, riscos, protocolos, indicadores, documentos, treinamentos, comunicação institucional e gestão operacional**, com **IA nativa orientada ao Manual ONA 2026**.

A plataforma precisa ser superior aos sistemas atuais do mercado brasileiro, com aparência sofisticada, arquitetura forte, navegação contextual, dashboards executivos, tabelas robustas, workflows rastreáveis e experiência premium.

Construa os módulos seguindo o PRD deste documento. Cada módulo deve parecer software enterprise pronto para venda a hospitais, clínicas, laboratórios e redes de saúde. Priorize clareza, profundidade funcional, UX executiva e integração real entre os módulos.

Regras obrigatórias:
- multiempresa e multiunidade;
- permissões granulares;
- logs e rastreabilidade;
- dashboards premium;
- workflows claros;
- IA contextual e útil;
- forte aderência à acreditação ONA 2026;
- estrutura operacional por unidade de negócio;
- conexão entre requisito, documento, evidência, risco, processo, protocolo, indicador, ata, treinamento e ação.

O produto não deve ser apenas bonito. Ele deve parecer e funcionar como o melhor sistema de qualidade em saúde do Brasil.

---

# 13. Entregáveis Esperados do Claude por Módulo

Para cada módulo, o Claude deve entregar:
- arquitetura da página;
- componentes principais;
- estrutura de navegação;
- estados da interface;
- hierarquia visual;
- comportamento das tabelas e filtros;
- ações rápidas;
- visão desktop first enterprise;
- lógica de relacionamento com outros módulos.

---

# 14. Fechamento

Este documento é a versão consolidada do **PRD completo por módulo** para construção do QHealth One 2026 no **Antigravity com Claude**.

Ele já está pronto para servir como base de:
- arquitetura de produto;
- design de interface;
- desenvolvimento;
- IA aplicada;
- backlog de construção;
- narrativa comercial do produto.

O próximo artefato ideal, após este documento, é gerar:
- wireframes funcionais por módulo;
- prompts por tela;
- ou especificação técnica por entidade e banco de dados.

