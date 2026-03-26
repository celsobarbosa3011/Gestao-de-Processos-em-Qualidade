import { useState } from "react";
import { toast } from "sonner";
import { printReport } from "@/lib/print-pdf";
import { useTenant } from "@/hooks/use-tenant";
import {
  Shield, AlertTriangle, CheckCircle2, Clock, FileText,
  Users, Lock, Eye, Download, Plus, Search, AlertCircle,
  Database, Key, UserCheck, Bell, ChevronRight, Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DataCategory = "Pessoal" | "Sensível" | "Anônimo" | "Pseudônimo";
type LegalBasis = "Consentimento" | "Contrato" | "Obrigação Legal" | "Tutela da Saúde" | "Interesse Legítimo" | "Execução de Políticas Públicas";
type IncidentStatus = "Aberto" | "Em análise" | "Notificado ANPD" | "Encerrado";
type RequestStatus = "Pendente" | "Em análise" | "Atendido" | "Indeferido";

interface DataMapping {
  id: number;
  category: string;
  dataType: DataCategory;
  description: string;
  legalBasis: LegalBasis;
  retention: string;
  controller: string;
  sensitive: boolean;
  sector: string;
}

interface Incident {
  id: number;
  date: string;
  description: string;
  affectedData: string;
  titulares: number;
  status: IncidentStatus;
  severity: "Alta" | "Média" | "Baixa";
  notifiedANPD: boolean;
}

interface SubjectRequest {
  id: number;
  date: string;
  type: string;
  titular: string;
  status: RequestStatus;
  deadline: string;
  sector: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const dataMappings: DataMapping[] = [
  { id: 1, category: "Prontuário Eletrônico", dataType: "Sensível", description: "Dados de saúde, diagnóstico, exames, tratamentos e histórico clínico do paciente", legalBasis: "Tutela da Saúde", retention: "20 anos (CFM 1.638/2002)", controller: "Diretor Clínico", sensitive: true, sector: "Todos" },
  { id: 2, category: "Cadastro de Pacientes", dataType: "Pessoal", description: "Nome, CPF, data de nascimento, endereço, contato de emergência", legalBasis: "Contrato", retention: "5 anos após alta", controller: "Admissão", sensitive: false, sector: "Recepção" },
  { id: 3, category: "Dados de Colaboradores", dataType: "Pessoal", description: "Dados pessoais, contracheque, férias, afastamentos e dados bancários", legalBasis: "Obrigação Legal", retention: "5 anos (CLT)", controller: "RH", sensitive: false, sector: "RH" },
  { id: 4, category: "Dados Genéticos e Biométricos", dataType: "Sensível", description: "Exames genéticos, biometria para acesso e identificação", legalBasis: "Consentimento", retention: "Enquanto necessário + 5 anos", controller: "Laboratório", sensitive: true, sector: "Laboratório" },
  { id: 5, category: "Imagens Médicas (PACS)", dataType: "Sensível", description: "Radiografias, tomografias, ressonâncias e laudos de imagem", legalBasis: "Tutela da Saúde", retention: "10 anos (CFM)", controller: "Coord. Imagem", sensitive: true, sector: "Diagnóstico por Imagem" },
  { id: 6, category: "Dados de Pesquisa Clínica", dataType: "Sensível", description: "Dados coletados em estudos e pesquisas aprovados pelo CEP", legalBasis: "Consentimento", retention: "10 anos (Res. CNS 466)", controller: "CEP", sensitive: true, sector: "Pesquisa" },
  { id: 7, category: "Notificações Compulsórias", dataType: "Pessoal", description: "Dados reportados à Vigilância Sanitária e Epidemiológica", legalBasis: "Obrigação Legal", retention: "Permanente (interesse público)", controller: "SCIH", sensitive: false, sector: "SCIH" },
  { id: 8, category: "Câmeras de Segurança (CCTV)", dataType: "Pessoal", description: "Imagens de monitoramento de áreas hospitalares", legalBasis: "Interesse Legítimo", retention: "30 dias", controller: "Segurança", sensitive: false, sector: "Administração" },
  { id: 9, category: "Dados de Saúde Ocupacional", dataType: "Sensível", description: "Atestados, exames admissionais, periódicos e demissionais (PCMSO)", legalBasis: "Obrigação Legal", retention: "20 anos (NR-7)", controller: "Médico do Trabalho", sensitive: true, sector: "SESMT" },
  { id: 10, category: "Comunicações Eletrônicas", dataType: "Pessoal", description: "E-mails institucionais, chat interno e logs de acesso ao sistema", legalBasis: "Contrato", retention: "1 ano", controller: "TI", sensitive: false, sector: "TI" },
];

const incidents: Incident[] = [
  { id: 1, date: "2026-02-14", description: "Acesso indevido a prontuários por usuário externo ao setor", affectedData: "Prontuários de pacientes da UTI", titulares: 12, status: "Notificado ANPD", severity: "Alta", notifiedANPD: true },
  { id: 2, date: "2026-01-08", description: "Extravio de folha de anotações de enfermagem com dados pessoais", affectedData: "Nomes, leitos e diagnósticos", titulares: 5, status: "Encerrado", severity: "Baixa", notifiedANPD: false },
  { id: 3, date: "2026-03-10", description: "Envio de laudo laboratorial para e-mail incorreto (phishing interno)", affectedData: "Resultado de exame de paciente", titulares: 1, status: "Em análise", severity: "Média", notifiedANPD: false },
];

const subjectRequests: SubjectRequest[] = [
  { id: 1, date: "2026-03-01", type: "Acesso aos dados", titular: "Paciente — Internação", status: "Atendido", deadline: "2026-04-01", sector: "Prontuário" },
  { id: 2, date: "2026-03-08", type: "Correção de dados", titular: "Colaborador — RH", status: "Em análise", deadline: "2026-04-08", sector: "RH" },
  { id: 3, date: "2026-03-12", type: "Portabilidade", titular: "Ex-paciente — Alta 2025", status: "Pendente", deadline: "2026-04-12", sector: "Admissão" },
  { id: 4, date: "2026-02-20", type: "Revogação de consentimento", titular: "Participante de pesquisa", status: "Atendido", deadline: "2026-03-22", sector: "CEP" },
  { id: 5, date: "2026-03-15", type: "Eliminação de dados", titular: "Fornecedor — Contrato encerrado", status: "Pendente", deadline: "2026-04-15", sector: "Contratos" },
];

const ripdItems = [
  { area: "Sistema de Prontuário Eletrônico (PEP)", risk: "Alta", impact: "Crítico", measure: "Controle de acesso por perfil, log de auditoria, criptografia em repouso", status: "Implementado" },
  { area: "PACS — Imagens Médicas", risk: "Média", impact: "Alto", measure: "VPN, autenticação dupla, auditoria de acesso", status: "Em implementação" },
  { area: "Sistema de RH e Folha de Pagamento", risk: "Média", impact: "Alto", measure: "Acesso restrito ao RH, backup diário, criptografia de transmissão", status: "Implementado" },
  { area: "Câmeras CCTV", risk: "Baixa", impact: "Médio", measure: "Sinalização obrigatória, retenção de 30 dias, acesso restrito", status: "Implementado" },
  { area: "Pesquisa Clínica — Banco de Dados", risk: "Alta", impact: "Alto", measure: "Anonimização pós-pesquisa, TCLE digital, acesso somente pesquisadores", status: "Em implementação" },
];

// ─── Helper components ─────────────────────────────────────────────────────────

const statusColors: Record<IncidentStatus, string> = {
  "Aberto": "bg-red-100 text-red-700 border-red-200",
  "Em análise": "bg-amber-100 text-amber-700 border-amber-200",
  "Notificado ANPD": "bg-violet-100 text-violet-700 border-violet-200",
  "Encerrado": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const requestStatusColors: Record<RequestStatus, string> = {
  "Pendente": "bg-amber-100 text-amber-700 border-amber-200",
  "Em análise": "bg-sky-100 text-sky-700 border-sky-200",
  "Atendido": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Indeferido": "bg-red-100 text-red-700 border-red-200",
};

const legalBasisColors: Record<LegalBasis, string> = {
  "Consentimento": "bg-blue-100 text-blue-700",
  "Contrato": "bg-indigo-100 text-indigo-700",
  "Obrigação Legal": "bg-orange-100 text-orange-700",
  "Tutela da Saúde": "bg-emerald-100 text-emerald-700",
  "Interesse Legítimo": "bg-slate-100 text-slate-600",
  "Execução de Políticas Públicas": "bg-violet-100 text-violet-700",
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function LGPDPage() {
  const { isAdmin } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNovoIncidente, setShowNovoIncidente] = useState(false);
  const [novoIncidente, setNovoIncidente] = useState({ descricao: "", dados: "", titulares: "", severidade: "Média" });

  const displayDataMappings = isAdmin ? dataMappings : [];
  const displayIncidents = isAdmin ? incidents : [];
  const displaySubjectRequests = isAdmin ? subjectRequests : [];
  const displayRipdItems = isAdmin ? ripdItems : [];

  const totalSensiveis = displayDataMappings.filter((d) => d.sensitive).length;
  const totalMapeados = displayDataMappings.length;
  const incidentesAbertos = displayIncidents.filter((i) => i.status === "Aberto" || i.status === "Em análise").length;
  const requisicoesAbertas = displaySubjectRequests.filter((r) => r.status === "Pendente" || r.status === "Em análise").length;
  const conformidade = isAdmin ? 78 : 0;

  const filteredData = displayDataMappings.filter(
    (d) =>
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function salvarIncidente() {
    if (!novoIncidente.descricao) {
      toast.error("Descreva o incidente antes de registrar");
      return;
    }
    toast.success("Incidente registrado! DPO notificado automaticamente.");
    setNovoIncidente({ descricao: "", dados: "", titulares: "", severidade: "Média" });
    setShowNovoIncidente(false);
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">LGPD — Proteção de Dados</h1>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Lei 13.709/2018</Badge>
          </div>
          <p className="text-slate-500 text-sm">Conformidade com a Lei Geral de Proteção de Dados · Gestão de dados pessoais e sensíveis em saúde</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => printReport({ title: "Relatório de Conformidade LGPD", subtitle: "Lei Geral de Proteção de Dados — Lei 13.709/2018", module: "LGPD — Proteção de Dados", kpis: [{ label: "Dados Mapeados", value: "10", color: "#1d4ed8" }, { label: "Dados Sensíveis", value: "7", color: "#dc2626" }, { label: "Incidentes Abertos", value: "2", color: "#f59e0b" }, { label: "Conformidade", value: "78%", color: "#10b981" }], columns: [{ label: "Dado / Sistema", key: "dado" }, { label: "Finalidade", key: "fin" }, { label: "Base Legal", key: "base" }, { label: "Sensível", key: "sens", align: "center" }, { label: "Status", key: "status" }], rows: [{ dado: "Prontuário Eletrônico", fin: "Assistência à Saúde", base: "Tutela da Saúde", sens: "Sim", status: "✓ Adequado" }, { dado: "Cadastro de Pacientes", fin: "Identificação e agendamento", base: "Contrato", sens: "Não", status: "✓ Adequado" }, { dado: "Dados de Colaboradores", fin: "Gestão de RH", base: "Obrigação Legal", sens: "Parcial", status: "✓ Adequado" }, { dado: "Imagens PACS", fin: "Diagnóstico por Imagem", base: "Tutela da Saúde", sens: "Sim", status: "⚠ Revisar" }, { dado: "CCTV / Vigilância", fin: "Segurança Patrimonial", base: "Interesse Legítimo", sens: "Não", status: "⚠ Revisar" }] })}>
            <Download className="w-3.5 h-3.5" />
            Relatório LGPD
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white border-0" onClick={() => setShowNovoIncidente((v) => !v)}>
            <Plus className="w-3.5 h-3.5" />
            Registrar Incidente
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Dados Mapeados", value: totalMapeados, color: "text-slate-700", bg: "bg-slate-50 border-slate-200", icon: <Database className="w-4 h-4 text-slate-400" /> },
          { label: "Dados Sensíveis", value: totalSensiveis, color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: <Lock className="w-4 h-4 text-violet-400" /> },
          { label: "Incidentes Abertos", value: incidentesAbertos, color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
          { label: "Req. Titulares", value: requisicoesAbertas, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <UserCheck className="w-4 h-4 text-amber-400" /> },
          { label: "Conformidade Geral", value: `${conformidade}%`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
        ].map((k) => (
          <Card key={k.label} className={cn("border", k.bg)}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-1">
                {k.icon}
              </div>
              <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DPO Alert */}
      <Card className="bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="py-3 px-5 flex items-center gap-3">
          <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">DPO Designado — </span>
            <span className="text-sm text-blue-700 dark:text-blue-400">{isAdmin ? "Dr.ª Ana Paula Ferreira · E-mail: dpo@hospital.com.br · Tel.: (11) 9 8888-7777" : "Nenhum DPO designado. Cadastre um DPO em Administração."}</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 flex-shrink-0" onClick={() => toast.info("Abrindo canal do DPO...")}>
            <Bell className="w-3 h-3 mr-1" /> Contatar DPO
          </Button>
        </CardContent>
      </Card>

      {/* Novo Incidente Form */}
      {showNovoIncidente && (
        <Card className="border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Registrar Incidente de Segurança de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Descrição do Incidente *</label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  rows={2}
                  placeholder="Descreva o que ocorreu, como foi identificado e medidas imediatas tomadas..."
                  value={novoIncidente.descricao}
                  onChange={(e) => setNovoIncidente((p) => ({ ...p, descricao: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Dados Afetados</label>
                <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="Ex.: Prontuários, dados de exame..." value={novoIncidente.dados} onChange={(e) => setNovoIncidente((p) => ({ ...p, dados: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nº Estimado de Titulares</label>
                <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="Ex.: 50" value={novoIncidente.titulares} onChange={(e) => setNovoIncidente((p) => ({ ...p, titulares: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Severidade</label>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-300" value={novoIncidente.severidade} onChange={(e) => setNovoIncidente((p) => ({ ...p, severidade: e.target.value }))}>
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Incidentes de alta severidade serão automaticamente reportados ao DPO para avaliação da obrigação de notificação à ANPD (prazo: 72h).
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowNovoIncidente(false)}>Cancelar</Button>
              <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={salvarIncidente}>Registrar Incidente</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="mapeamento">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="mapeamento" className="text-xs">Mapeamento de Dados</TabsTrigger>
          <TabsTrigger value="titulares" className="text-xs">Direitos dos Titulares</TabsTrigger>
          <TabsTrigger value="incidentes" className="text-xs">
            Incidentes
            {incidentesAbertos > 0 && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">{incidentesAbertos}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ripd" className="text-xs">RIPD / DPIA</TabsTrigger>
          <TabsTrigger value="bases" className="text-xs">Bases Legais</TabsTrigger>
        </TabsList>

        {/* ── TAB: Mapeamento ── */}
        <TabsContent value="mapeamento" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Buscar dados, setor, responsável..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => printReport({ title: "Mapeamento de Dados Pessoais", subtitle: "Registro de atividades de tratamento de dados — Art. 37 LGPD", module: "LGPD / Mapeamento", columns: [{ label: "Dado / Sistema", key: "dado" }, { label: "Finalidade", key: "fin" }, { label: "Base Legal", key: "base" }, { label: "Controlador", key: "ctrl" }, { label: "Sensível", key: "sens" }], rows: [{ dado: "Prontuário Eletrônico", fin: "Assistência à Saúde", base: "Tutela da Saúde", ctrl: "Hospital", sens: "Sim" }, { dado: "Cadastro de Pacientes", fin: "Identificação", base: "Contrato", ctrl: "Hospital", sens: "Não" }, { dado: "Dados de Colaboradores", fin: "Gestão de RH", base: "Obrigação Legal", ctrl: "Hospital", sens: "Parcial" }, { dado: "Imagens PACS", fin: "Diagnóstico", base: "Tutela da Saúde", ctrl: "Hospital", sens: "Sim" }, { dado: "CCTV", fin: "Segurança", base: "Interesse Legítimo", ctrl: "Hospital", sens: "Não" }] })}>
              <Download className="w-3.5 h-3.5" /> Exportar
            </Button>
          </div>

          <div className="space-y-3">
            {filteredData.map((d) => (
              <Card key={d.id} className="border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{d.category}</h3>
                        {d.sensitive && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 h-4 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Dado Sensível
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", legalBasisColors[d.legalBasis])}>
                          {d.legalBasis}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{d.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{d.sector}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{d.controller}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Retenção: {d.retention}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 flex-shrink-0" onClick={() => toast.info(`Visualizando mapeamento: ${d.category}`)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: Titulares ── */}
        <TabsContent value="titulares" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">Requisições de direitos dos titulares — Art. 17 a 22 da LGPD</p>
            <Button size="sm" className="h-8 gap-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white" onClick={() => toast.success("Nova requisição de titular registrada!")}>
              <Plus className="w-3.5 h-3.5" /> Nova Requisição
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Pendentes", value: displaySubjectRequests.filter(r => r.status === "Pendente").length, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
              { label: "Em Análise", value: displaySubjectRequests.filter(r => r.status === "Em análise").length, color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
              { label: "Atendidas", value: displaySubjectRequests.filter(r => r.status === "Atendido").length, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Total", value: displaySubjectRequests.length, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
            ].map(k => (
              <Card key={k.label} className={cn("border", k.bg)}>
                <CardContent className="pt-3 pb-3 px-4">
                  <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
                  <p className="text-xs text-slate-500">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Titular</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Setor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prazo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displaySubjectRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500">{r.date}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">{r.type}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{r.titular}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.sector}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.deadline}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", requestStatusColors[r.status])}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1" onClick={() => toast.info(`Abrindo requisição de ${r.type}...`)}>
                            <Eye className="w-3 h-3" /> Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Incidentes ── */}
        <TabsContent value="incidentes" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">Registro de incidentes de segurança · Notificação ANPD (Art. 48 LGPD)</p>
          </div>
          <div className="space-y-3">
            {displayIncidents.map((inc) => (
              <Card key={inc.id} className={cn("border", inc.status === "Aberto" || inc.status === "Em análise" ? "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/10" : "border-slate-200 dark:border-slate-800")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", statusColors[inc.status])}>{inc.status}</Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", inc.severity === "Alta" ? "bg-red-100 text-red-700 border-red-200" : inc.severity === "Média" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                          Severidade: {inc.severity}
                        </Badge>
                        {inc.notifiedANPD && (
                          <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-1.5 py-0 h-4">Notificado ANPD</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">{inc.description}</p>
                      <p className="text-xs text-slate-500">Dados afetados: {inc.affectedData}</p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-400">
                        <span>Data: {inc.date}</span>
                        <span>Titulares afetados: <strong className="text-slate-600">{inc.titulares}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => toast.info(`Abrindo detalhes do incidente #${inc.id}...`)}>
                        <Eye className="w-3 h-3" /> Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: RIPD ── */}
        <TabsContent value="ripd" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Relatório de Impacto à Proteção de Dados (RIPD / DPIA)</p>
              <p className="text-xs text-slate-500">Avaliação de risco por sistema e operação de tratamento — Art. 38 LGPD</p>
            </div>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => printReport({ title: "RIPD — Relatório de Impacto à Proteção de Dados", subtitle: "Avaliação de risco por sistema — Art. 38 LGPD / DPIA", module: "LGPD / RIPD", columns: [{ label: "Sistema / Operação", key: "sistema" }, { label: "Volume", key: "vol" }, { label: "Risco", key: "risco" }, { label: "Controlado", key: "ctrl", align: "center" }, { label: "Status RIPD", key: "status" }], rows: [{ sistema: "Prontuário Eletrônico (PEP)", vol: "> 50.000 registros", risco: "Alto", ctrl: "Sim", status: "✓ RIPD aprovado" }, { sistema: "Sistema de Imagens PACS", vol: "~ 20.000 exames/ano", risco: "Alto", ctrl: "Sim", status: "⚠ Em elaboração" }, { sistema: "RH / Folha de Pagamento", vol: "~ 800 colaboradores", risco: "Médio", ctrl: "Sim", status: "✓ RIPD aprovado" }, { sistema: "CCTV / Vigilância", vol: "Contínuo 24h", risco: "Médio", ctrl: "Parcial", status: "⚠ Em elaboração" }, { sistema: "Pesquisa Clínica", vol: "Variável", risco: "Alto", ctrl: "Sim", status: "✓ RIPD aprovado" }] })}>
              <Download className="w-3.5 h-3.5" /> Exportar RIPD
            </Button>
          </div>
          <div className="space-y-3">
            {displayRipdItems.map((item, i) => (
              <Card key={i} className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.area}</h3>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", item.risk === "Alta" ? "bg-red-100 text-red-700 border-red-200" : item.risk === "Média" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                          Risco: {item.risk}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", item.status === "Implementado" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-sky-100 text-sky-700 border-sky-200")}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{item.measure}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-slate-400">Impacto</p>
                      <p className="text-xs font-semibold text-slate-600">{item.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB: Bases Legais ── */}
        <TabsContent value="bases" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(legalBasisColors) as LegalBasis[]).map((basis) => {
              const items = displayDataMappings.filter((d) => d.legalBasis === basis);
              return (
                <Card key={basis} className="border border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-500" />
                        {basis}
                      </CardTitle>
                      <Badge variant="outline" className={cn("text-[10px]", legalBasisColors[basis])}>{items.length} operações</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhuma operação mapeada</p>
                    ) : (
                      <div className="space-y-1">
                        {items.map((d) => (
                          <div key={d.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            <span>{d.category}</span>
                            {d.sensitive && <Lock className="w-3 h-3 text-red-400 flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <Progress value={items.length > 0 ? 100 : 0} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
