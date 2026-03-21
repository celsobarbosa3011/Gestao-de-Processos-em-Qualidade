import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Plug, Webhook, Database, Stethoscope,
  FlaskConical, Scan, Code2, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle,
  Key, Activity, RefreshCw, Copy, Eye, EyeOff,
  Zap, Globe, Lock, Filter
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type IntegrationStatus = "connected" | "partial" | "error" | "planned";
type IntegrationCategory = "api" | "his" | "lab" | "image" | "standard" | "event";

interface Integration {
  id: string;
  name: string;
  descricao: string;
  categoria: IntegrationCategory;
  status: IntegrationStatus;
  versao: string;
  lastSync: string | null;
  endpoint: string | null;
  eventos: number;
  erros: number;
  uptime: number | null;
}

interface WebhookEvent {
  id: string;
  evento: string;
  origem: string;
  timestamp: string;
  status: "success" | "error" | "pending";
  payload: string;
}

interface ApiKey {
  id: string;
  nome: string;
  prefixo: string;
  permissoes: string[];
  criada: string;
  ultimoUso: string | null;
  ativa: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusMeta(s: IntegrationStatus) {
  const map: Record<IntegrationStatus, { label: string; color: string; bg: string; dot: string; icon: React.ReactNode }> = {
    connected: { label: "Conectado", color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
    partial: { label: "Parcial", color: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    error: { label: "Erro", color: "text-red-700", bg: "bg-red-100", dot: "bg-red-500", icon: <XCircle className="w-4 h-4 text-red-500" /> },
    planned: { label: "Planejado", color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400", icon: <Clock className="w-4 h-4 text-gray-400" /> },
  };
  return map[s];
}

function categoryMeta(c: IntegrationCategory) {
  const map: Record<IntegrationCategory, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    api: { label: "API", color: "text-purple-700", bg: "bg-purple-100", icon: <Code2 className="w-4 h-4" /> },
    his: { label: "HIS/ERP", color: "text-blue-700", bg: "bg-blue-100", icon: <Database className="w-4 h-4" /> },
    lab: { label: "Laboratório", color: "text-emerald-700", bg: "bg-emerald-100", icon: <FlaskConical className="w-4 h-4" /> },
    image: { label: "Imagem", color: "text-violet-700", bg: "bg-violet-100", icon: <Scan className="w-4 h-4" /> },
    standard: { label: "Padrão", color: "text-sky-700", bg: "bg-sky-100", icon: <Stethoscope className="w-4 h-4" /> },
    event: { label: "Eventos", color: "text-orange-700", bg: "bg-orange-100", icon: <Webhook className="w-4 h-4" /> },
  };
  return map[c];
}

function eventStatusMeta(s: "success" | "error" | "pending") {
  return {
    success: { label: "Sucesso", color: "text-emerald-700", bg: "bg-emerald-100" },
    error: { label: "Erro", color: "text-red-700", bg: "bg-red-100" },
    pending: { label: "Pendente", color: "text-amber-700", bg: "bg-amber-100" },
  }[s];
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const integrations: Integration[] = [
  { id: "I001", name: "API QHealth One", descricao: "API REST documentada (Swagger/OpenAPI 3.0) para acesso externo a dados do sistema", categoria: "api", status: "planned", versao: "V3", lastSync: null, endpoint: null, eventos: 0, erros: 0, uptime: null },
  { id: "I002", name: "Webhooks", descricao: "Eventos em tempo real — novo processo, indicador crítico, aprovação de documento", categoria: "event", status: "planned", versao: "V3", lastSync: null, endpoint: null, eventos: 0, erros: 0, uptime: null },
  { id: "I003", name: "FHIR R4", descricao: "Interoperabilidade com prontuários eletrônicos conforme padrão HL7 FHIR R4", categoria: "standard", status: "planned", versao: "V3", lastSync: null, endpoint: null, eventos: 0, erros: 0, uptime: null },
  { id: "I004", name: "HIS — Tasy", descricao: "Sincronização bidirecional com HIS Tasy (Philips) — pacientes, internações, prescrições", categoria: "his", status: "error", versao: "V2", lastSync: "2026-03-19 14:32", endpoint: "https://tasy.hospital.local/api/v2", eventos: 1847, erros: 23, uptime: 94.2 },
  { id: "I005", name: "HIS — MV Soul", descricao: "Integração com sistema MV (Soul MV) para dados assistenciais e faturamento", categoria: "his", status: "planned", versao: "V3", lastSync: null, endpoint: null, eventos: 0, erros: 0, uptime: null },
  { id: "I006", name: "LIS — Roche Cobas", descricao: "Importação automática de resultados laboratoriais e alertas de valores críticos", categoria: "lab", status: "connected", versao: "V2", lastSync: "2026-03-21 08:15", endpoint: "https://lis.hospital.local/cobas/fhir", eventos: 4312, erros: 2, uptime: 99.7 },
  { id: "I007", name: "LIS — Sysmex", descricao: "Resultados de hemograma e coagulação — integração via HL7 v2.5", categoria: "lab", status: "partial", versao: "V2", lastSync: "2026-03-21 07:58", endpoint: "hl7://sysmex.hospital.local:2575", eventos: 982, erros: 18, uptime: 91.3 },
  { id: "I008", name: "PACS — Carestream", descricao: "Consulta de laudos radiológicos e imagens DICOM nos processos clínicos", categoria: "image", status: "connected", versao: "V1", lastSync: "2026-03-21 09:02", endpoint: "https://pacs.hospital.local/wado", eventos: 2156, erros: 0, uptime: 99.9 },
  { id: "I009", name: "RIS — Agfa", descricao: "Agendamento e resultados de radiologia integrados ao fluxo de Jornada do Paciente", categoria: "image", status: "partial", versao: "V2", lastSync: "2026-03-20 22:45", endpoint: "https://ris.hospital.local/api", eventos: 567, erros: 31, uptime: 87.6 },
  { id: "I010", name: "SAP S/4HANA", descricao: "Dados de faturamento, contratos e fornecedores para relatórios executivos", categoria: "his", status: "planned", versao: "V3", lastSync: null, endpoint: null, eventos: 0, erros: 0, uptime: null },
];

const webhookEvents: WebhookEvent[] = [
  { id: "WH001", evento: "lab.result.critical", origem: "LIS — Roche Cobas", timestamp: "2026-03-21 09:14:22", status: "success", payload: '{ "patient_id": "P-8821", "exam": "Troponina", "value": 2.4, "unit": "ng/mL" }' },
  { id: "WH002", evento: "image.report.ready", origem: "PACS — Carestream", timestamp: "2026-03-21 09:02:11", status: "success", payload: '{ "exam_id": "DX-00441", "modality": "TC", "report_status": "signed" }' },
  { id: "WH003", evento: "his.admission.new", origem: "HIS — Tasy", timestamp: "2026-03-21 08:55:03", status: "error", payload: '{ "patient_id": "P-8823", "unit": "UTI Adulto", "bed": "12B" }' },
  { id: "WH004", evento: "lab.result.ready", origem: "LIS — Sysmex", timestamp: "2026-03-21 08:41:55", status: "success", payload: '{ "patient_id": "P-8819", "exam": "Hemograma", "status": "completed" }' },
  { id: "WH005", evento: "his.discharge.planned", origem: "HIS — Tasy", timestamp: "2026-03-21 08:30:17", status: "error", payload: '{ "error": "connection_timeout", "patient_id": "P-8812" }' },
  { id: "WH006", evento: "ris.appointment.confirmed", origem: "RIS — Agfa", timestamp: "2026-03-21 08:22:40", status: "success", payload: '{ "appointment_id": "IMG-2219", "modality": "RM", "slot": "10:30" }' },
  { id: "WH007", evento: "lab.result.critical", origem: "LIS — Roche Cobas", timestamp: "2026-03-21 08:11:09", status: "pending", payload: '{ "patient_id": "P-8808", "exam": "Potássio", "value": 6.8, "unit": "mEq/L" }' },
];

const apiKeys: ApiKey[] = [
  { id: "K001", nome: "Painel Executivo BI", prefixo: "qh_live_8x2k", permissoes: ["indicadores:read", "processos:read", "relatorios:read"], criada: "2026-01-15", ultimoUso: "2026-03-21", ativa: true },
  { id: "K002", nome: "Integração LIS Roche", prefixo: "qh_live_r9j4", permissoes: ["eventos:write", "lab:read"], criada: "2026-02-03", ultimoUso: "2026-03-21", ativa: true },
  { id: "K003", nome: "App Mobile Equipe", prefixo: "qh_live_m3p1", permissoes: ["processos:read", "notificacoes:read"], criada: "2026-02-20", ultimoUso: "2026-03-18", ativa: true },
  { id: "K004", nome: "Teste DEV (Staging)", prefixo: "qh_test_d5z9", permissoes: ["*:read", "*:write"], criada: "2026-03-01", ultimoUso: "2026-03-14", ativa: false },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Integracoes() {
  const [categoryFilter, setCategoryFilter] = useState<IntegrationCategory | "todos">("todos");
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus | "todos">("todos");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showPayload, setShowPayload] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);

  const filteredIntegrations = integrations.filter(i => {
    const catOk = categoryFilter === "todos" || i.categoria === categoryFilter;
    const statusOk = statusFilter === "todos" || i.status === statusFilter;
    return catOk && statusOk;
  });

  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const partialCount = integrations.filter(i => i.status === "partial").length;
  const errorCount = integrations.filter(i => i.status === "error").length;
  const totalEvents = integrations.reduce((a, i) => a + i.eventos, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações & API</h1>
          <p className="text-sm text-gray-500 mt-1">Módulo 20 — Conectores, webhooks e gerenciamento de chaves de API</p>
        </div>
        <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0">
          <Plug className="w-4 h-4" />
          Nova Integração
        </Button>
      </div>

      {/* Error banner */}
      {errorCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {errorCount} integração{errorCount > 1 ? "ões" : ""} com erro ativo. Verifique conectividade e credenciais.
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Conectadas</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{connectedCount}</p>
                <p className="text-xs text-gray-400 mt-1">de {integrations.length} integrações</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Parcial / Erro</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{partialCount + errorCount}</p>
                <p className="text-xs text-gray-400 mt-1">{partialCount} parciais · {errorCount} com erro</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Eventos Processados</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalEvents.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-gray-400 mt-1">últimos 30 dias</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Chaves de API Ativas</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{apiKeys.filter(k => k.ativa).length}</p>
                <p className="text-xs text-gray-400 mt-1">{apiKeys.length} total</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Catálogo de Integrações</TabsTrigger>
          <TabsTrigger value="webhooks">Log de Eventos</TabsTrigger>
          <TabsTrigger value="keys">Chaves de API</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Catalog ──────────────────────────────────────────────── */}
        <TabsContent value="catalog" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Categoria:</span>
              {(["todos", "api", "his", "lab", "image", "standard", "event"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setCategoryFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    categoryFilter === f
                      ? "bg-gray-800 text-white border-gray-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {f === "todos" ? "Todos" : categoryMeta(f).label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-gray-600">Status:</span>
              {(["todos", "connected", "partial", "error", "planned"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    statusFilter === f
                      ? "bg-gray-800 text-white border-gray-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {f === "todos" ? "Todos" : statusMeta(f).label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {/* Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredIntegrations.map(intg => {
                const sm = statusMeta(intg.status);
                const cm = categoryMeta(intg.categoria);
                const isSelected = selectedIntegration?.id === intg.id;
                return (
                  <button
                    key={intg.id}
                    onClick={() => setSelectedIntegration(isSelected ? null : intg)}
                    className={cn(
                      "text-left bg-white border rounded-lg p-4 transition-all",
                      isSelected ? "border-purple-500 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", cm.bg)}>
                          <span className={cm.color}>{cm.icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{intg.name}</p>
                          <Badge className={cn("text-xs mt-0.5", cm.color, cm.bg)}>{cm.label}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={cn("w-2 h-2 rounded-full", sm.dot)} />
                        <Badge className={cn("text-xs", sm.color, sm.bg)}>{sm.label}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{intg.descricao}</p>
                    {intg.status !== "planned" ? (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 rounded p-1.5 text-center">
                          <p className="font-semibold text-gray-800">{intg.eventos.toLocaleString("pt-BR")}</p>
                          <p className="text-gray-400">eventos</p>
                        </div>
                        <div className="bg-gray-50 rounded p-1.5 text-center">
                          <p className={cn("font-semibold", intg.erros > 10 ? "text-red-600" : intg.erros > 0 ? "text-amber-600" : "text-emerald-600")}>{intg.erros}</p>
                          <p className="text-gray-400">erros</p>
                        </div>
                        <div className="bg-gray-50 rounded p-1.5 text-center">
                          <p className={cn("font-semibold", (intg.uptime ?? 0) >= 99 ? "text-emerald-600" : (intg.uptime ?? 0) >= 95 ? "text-amber-600" : "text-red-600")}>
                            {intg.uptime}%
                          </p>
                          <p className="text-gray-400">uptime</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Disponível na {intg.versao} — Em planejamento</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detail Panel */}
            {selectedIntegration && (
              <div className="w-80 flex-shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Plug className="w-5 h-5 text-purple-500" />
                      <CardTitle className="text-base">{selectedIntegration.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge className={cn("text-xs", statusMeta(selectedIntegration.status).color, statusMeta(selectedIntegration.status).bg)}>
                        {statusMeta(selectedIntegration.status).label}
                      </Badge>
                      <Badge className={cn("text-xs", categoryMeta(selectedIntegration.categoria).color, categoryMeta(selectedIntegration.categoria).bg)}>
                        {categoryMeta(selectedIntegration.categoria).label}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs mb-1">Descrição</p>
                      <p className="text-gray-800 text-xs">{selectedIntegration.descricao}</p>
                    </div>

                    {selectedIntegration.endpoint && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Endpoint</p>
                        <div className="flex items-center gap-2 bg-gray-50 rounded p-2">
                          <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <code className="text-xs text-gray-700 truncate">{selectedIntegration.endpoint}</code>
                          <button className="ml-auto">
                            <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedIntegration.lastSync && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Última Sincronização</p>
                        <p className="text-xs font-medium text-gray-800">{selectedIntegration.lastSync}</p>
                      </div>
                    )}

                    {selectedIntegration.status !== "planned" && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="font-bold text-gray-900">{selectedIntegration.eventos.toLocaleString("pt-BR")}</p>
                          <p className="text-xs text-gray-400">Eventos</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className={cn("font-bold", selectedIntegration.erros > 0 ? "text-red-600" : "text-emerald-600")}>{selectedIntegration.erros}</p>
                          <p className="text-xs text-gray-400">Erros</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="font-bold text-gray-900">{selectedIntegration.uptime}%</p>
                          <p className="text-xs text-gray-400">Uptime</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {selectedIntegration.status !== "planned" ? (
                        <>
                          <Button size="sm" variant="outline" className="flex-1 text-xs gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Sincronizar
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs gap-1">
                            <Zap className="w-3 h-3" />
                            Testar
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full text-xs text-purple-600 border-purple-200 gap-1">
                          <ChevronRight className="w-3 h-3" />
                          Ver Roadmap V3
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Webhook Event Log ────────────────────────────────────── */}
        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Últimos eventos recebidos de todas as integrações ativas</p>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <RefreshCw className="w-3 h-3" />
              Atualizar
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {webhookEvents.map(ev => {
                  const sm = eventStatusMeta(ev.status);
                  const isExpanded = showPayload === ev.id;
                  return (
                    <div key={ev.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5 text-gray-700">{ev.evento}</code>
                            <Badge className={cn("text-xs", sm.color, sm.bg)}>{sm.label}</Badge>
                          </div>
                          <p className="text-xs text-gray-500">{ev.origem} · {ev.timestamp}</p>
                        </div>
                        <button
                          onClick={() => setShowPayload(isExpanded ? null : ev.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          {isExpanded ? "Ocultar" : "Payload"}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 bg-gray-900 rounded-lg p-3">
                          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{ev.payload}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Event type summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sucesso", count: webhookEvents.filter(e => e.status === "success").length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Erro", count: webhookEvents.filter(e => e.status === "error").length, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              { label: "Pendente", count: webhookEvents.filter(e => e.status === "pending").length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            ].map(item => (
              <div key={item.label} className={cn("border rounded-lg p-4 text-center", item.bg)}>
                <p className={cn("text-2xl font-bold", item.color)}>{item.count}</p>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab 3: API Keys ─────────────────────────────────────────────── */}
        <TabsContent value="keys" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Gerencie as chaves de API para acesso externo ao QHealth One</p>
            <Button size="sm" className="gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white border-0">
              <Key className="w-3 h-3" />
              Nova Chave
            </Button>
          </div>

          <div className="space-y-3">
            {apiKeys.map(key => (
              <Card key={key.id} className={cn(!key.ativa && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-sm text-gray-900">{key.nome}</span>
                        {key.ativa ? (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700">Ativa</Badge>
                        ) : (
                          <Badge className="text-xs bg-gray-100 text-gray-600">Inativa</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs font-mono bg-gray-100 rounded px-2 py-1 text-gray-600">
                          {showKey === key.id ? `${key.prefixo}_••••••••••••••••` : `${key.prefixo}••••••••••••••••`}
                        </code>
                        <button onClick={() => setShowKey(showKey === key.id ? null : key.id)}>
                          {showKey === key.id ? (
                            <EyeOff className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        <button>
                          <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {key.permissoes.map(p => (
                          <code key={p} className="text-xs bg-purple-50 text-purple-700 rounded px-1.5 py-0.5 border border-purple-100">{p}</code>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Criada: {key.criada}
                        </span>
                        {key.ultimoUso && (
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Último uso: {key.ultimoUso}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="text-xs h-7">Editar</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50">
                        {key.ativa ? "Revogar" : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700">
              <p className="font-semibold mb-1">Segurança das Chaves</p>
              <p>Nunca exponha chaves de API em código-fonte ou repositórios públicos. Utilize variáveis de ambiente. Chaves com permissão <code className="bg-amber-100 rounded px-1">*:write</code> devem ser usadas apenas em ambientes controlados.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
