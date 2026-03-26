import { useState } from "react";
import { toast } from "sonner";
import {
  Cable, Plus, Trash2, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Eye, EyeOff, Copy, ExternalLink, Zap,
  Activity, Clock, Shield, ChevronDown, ChevronRight, Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type AuthType = "api_key" | "oauth2" | "basic" | "bearer" | "none";
type IntegStatus = "active" | "inactive" | "error" | "testing";
type SystemCategory =
  | "HIS" | "LIS" | "PACS" | "Prontuário" | "Faturamento"
  | "RIS" | "Farmácia" | "BI/Analytics" | "WhatsApp" | "Outro";

interface ApiIntegration {
  id: string;
  name: string;
  description: string;
  category: SystemCategory;
  baseUrl: string;
  authType: AuthType;
  apiKey?: string;
  username?: string;
  password?: string;
  bearerToken?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthTokenUrl?: string;
  headers: { key: string; value: string }[];
  status: IntegStatus;
  lastTest?: string;
  lastTestMs?: number;
  webhookEnabled: boolean;
  webhookUrl?: string;
  notes: string;
  createdAt: string;
  endpoints: ApiEndpoint[];
}

interface ApiEndpoint {
  id: string;
  label: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  active: boolean;
}

interface TestLog {
  id: string;
  integrationId: string;
  integrationName: string;
  timestamp: string;
  status: "success" | "error";
  statusCode?: number;
  durationMs: number;
  message: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTH_LABELS: Record<AuthType, string> = {
  api_key: "API Key",
  oauth2: "OAuth 2.0",
  basic: "Basic Auth",
  bearer: "Bearer Token",
  none: "Sem autenticação",
};

const CATEGORY_PRESETS: Record<SystemCategory, { desc: string; color: string }> = {
  HIS:         { desc: "Hospital Information System",    color: "bg-blue-100 text-blue-700" },
  LIS:         { desc: "Laboratory Information System",  color: "bg-violet-100 text-violet-700" },
  PACS:        { desc: "Picture Archiving & Communication", color: "bg-sky-100 text-sky-700" },
  "Prontuário":{ desc: "Sistema de Prontuário Eletrônico", color: "bg-emerald-100 text-emerald-700" },
  Faturamento: { desc: "Sistema de Faturamento",         color: "bg-amber-100 text-amber-700" },
  RIS:         { desc: "Radiology Information System",   color: "bg-indigo-100 text-indigo-700" },
  "Farmácia":  { desc: "Sistema de Farmácia Hospitalar", color: "bg-teal-100 text-teal-700" },
  "BI/Analytics":{ desc: "Business Intelligence",        color: "bg-rose-100 text-rose-700" },
  WhatsApp:    { desc: "Comunicação via WhatsApp",        color: "bg-green-100 text-green-700" },
  Outro:       { desc: "Integração personalizada",        color: "bg-slate-100 text-slate-600" },
};

const STATUS_META: Record<IntegStatus, { label: string; dot: string; badge: string }> = {
  active:   { label: "Ativo",       dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inativo",     dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600 border-slate-200" },
  error:    { label: "Erro",        dot: "bg-red-500",     badge: "bg-red-100 text-red-700 border-red-200" },
  testing:  { label: "Testando…",   dot: "bg-amber-400 animate-pulse", badge: "bg-amber-100 text-amber-700 border-amber-200" },
};

const SAMPLE_INTEGRATIONS: ApiIntegration[] = [
  {
    id: "integ-001",
    name: "Tasy — HIS Principal",
    description: "Integração com Tasy para sincronização de pacientes, internações e alta hospitalar",
    category: "HIS",
    baseUrl: "https://tasy.hospital.com.br/api/v2",
    authType: "api_key",
    apiKey: "tasy_prod_••••••••••••••••",
    headers: [{ key: "Accept", value: "application/json" }],
    status: "active",
    lastTest: "2026-03-22T08:12:00",
    lastTestMs: 214,
    webhookEnabled: true,
    webhookUrl: "https://qhealth.hospital.com.br/webhooks/tasy",
    notes: "Atualização de pacientes a cada 5 minutos via polling",
    createdAt: "2026-01-10",
    endpoints: [
      { id: "e1", label: "Listar Pacientes", method: "GET", path: "/patients", description: "Retorna lista de pacientes ativos", active: true },
      { id: "e2", label: "Detalhes do Paciente", method: "GET", path: "/patients/{id}", description: "Dados completos do paciente", active: true },
      { id: "e3", label: "Internações Ativas", method: "GET", path: "/admissions?status=active", description: "AIH ativas", active: true },
      { id: "e4", label: "Atualizar Alta", method: "POST", path: "/admissions/{id}/discharge", description: "Registrar alta médica", active: false },
    ],
  },
  {
    id: "integ-002",
    name: "LabNet — LIS Laboratório",
    description: "Recebimento automático de resultados de exames do laboratório clínico",
    category: "LIS",
    baseUrl: "https://labnet.local/api",
    authType: "basic",
    username: "qhealth_api",
    password: "••••••••",
    headers: [],
    status: "active",
    lastTest: "2026-03-22T07:55:00",
    lastTestMs: 98,
    webhookEnabled: false,
    notes: "Polling a cada 10 minutos. Resultados críticos disparam alerta imediato.",
    createdAt: "2026-02-01",
    endpoints: [
      { id: "e5", label: "Resultados Pendentes", method: "GET", path: "/results?status=pending", description: "Exames com resultado ainda não entregue ao médico", active: true },
      { id: "e6", label: "Resultado por Solicitação", method: "GET", path: "/results/{requestId}", description: "Resultado específico", active: true },
    ],
  },
  {
    id: "integ-003",
    name: "RX Cloud — PACS Imagem",
    description: "Integração DICOM/HL7 para laudos de imagem e tomografias",
    category: "PACS",
    baseUrl: "https://rxcloud.saude.com.br/fhir/r4",
    authType: "oauth2",
    oauthClientId: "qhealth-prod",
    oauthClientSecret: "••••••••••••",
    oauthTokenUrl: "https://rxcloud.saude.com.br/oauth/token",
    headers: [{ key: "Content-Type", value: "application/fhir+json" }],
    status: "error",
    lastTest: "2026-03-21T23:45:00",
    lastTestMs: 0,
    webhookEnabled: false,
    notes: "OAuth token expirou. Renovar credenciais com equipe de TI do PACS.",
    createdAt: "2026-02-15",
    endpoints: [
      { id: "e7", label: "Laudos (ImagingStudy)", method: "GET", path: "/ImagingStudy?patient={id}", description: "Estudos de imagem por paciente", active: true },
    ],
  },
];

const SAMPLE_LOGS: TestLog[] = [
  { id: "l1", integrationId: "integ-001", integrationName: "Tasy — HIS Principal", timestamp: "2026-03-22T08:12:00", status: "success", statusCode: 200, durationMs: 214, message: "Conexão OK — 342 pacientes sincronizados" },
  { id: "l2", integrationId: "integ-002", integrationName: "LabNet — LIS Laboratório", timestamp: "2026-03-22T07:55:00", status: "success", statusCode: 200, durationMs: 98, message: "Conexão OK — 18 resultados pendentes recebidos" },
  { id: "l3", integrationId: "integ-003", integrationName: "RX Cloud — PACS Imagem", timestamp: "2026-03-21T23:45:00", status: "error", statusCode: 401, durationMs: 0, message: "Unauthorized — OAuth token expirado. Renovar credenciais." },
  { id: "l4", integrationId: "integ-001", integrationName: "Tasy — HIS Principal", timestamp: "2026-03-22T07:12:00", status: "success", statusCode: 200, durationMs: 198, message: "Conexão OK — heartbeat" },
  { id: "l5", integrationId: "integ-002", integrationName: "LabNet — LIS Laboratório", timestamp: "2026-03-22T07:45:00", status: "success", statusCode: 200, durationMs: 112, message: "Conexão OK — nenhum resultado pendente" },
];

// ── Form initial state ─────────────────────────────────────────────────────────

function emptyInteg(): Omit<ApiIntegration, "id" | "createdAt" | "endpoints"> {
  return {
    name: "", description: "", category: "HIS", baseUrl: "", authType: "api_key",
    apiKey: "", username: "", password: "", bearerToken: "",
    oauthClientId: "", oauthClientSecret: "", oauthTokenUrl: "",
    headers: [], status: "inactive", webhookEnabled: false, webhookUrl: "", notes: "",
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: IntegStatus }) {
  const m = STATUS_META[status];
  return <span className={cn("w-2 h-2 rounded-full flex-shrink-0 inline-block", m.dot)} />;
}

function IntegCard({
  integ, selected, onSelect, onTest, onDelete,
}: {
  integ: ApiIntegration;
  selected: boolean;
  onSelect: () => void;
  onTest: () => void;
  onDelete: () => void;
}) {
  const m = STATUS_META[integ.status];
  const cat = CATEGORY_PRESETS[integ.category];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm",
        selected ? "border-sky-400 ring-1 ring-sky-400 bg-sky-50/40" : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <StatusDot status={integ.status} />
          <span className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{integ.name}</span>
        </div>
        <Badge className={cn("text-[10px] border flex-shrink-0", m.badge)}>{m.label}</Badge>
      </div>
      <Badge className={cn("text-[10px] mb-2 border-0", cat.color)}>{integ.category}</Badge>
      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{integ.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{integ.baseUrl}</span>
        <div className="flex gap-1">
          <button
            onClick={e => { e.stopPropagation(); onTest(); }}
            className="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
            title="Testar conexão"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Remover integração"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {integ.lastTest && (
        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Último teste: {new Date(integ.lastTest).toLocaleString("pt-BR")}
          {integ.lastTestMs ? ` (${integ.lastTestMs}ms)` : ""}
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminIntegracoes() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>(SAMPLE_INTEGRATIONS);
  const [logs, setLogs] = useState<TestLog[]>(SAMPLE_LOGS);
  const [selected, setSelected] = useState<ApiIntegration | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyInteg());
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [expandedEndpoints, setExpandedEndpoints] = useState(false);
  const [headerKey, setHeaderKey] = useState("");
  const [headerVal, setHeaderVal] = useState("");

  const toggleSecret = (key: string) => setShowSecret(p => ({ ...p, [key]: !p[key] }));

  const handleTest = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: "testing" } : i));
    if (selected?.id === id) setSelected(p => p ? { ...p, status: "testing" } : p);

    setTimeout(() => {
      const integ = integrations.find(i => i.id === id);
      if (!integ) return;
      // Simula sucesso para integ ativa, erro para a de PACS (exemplo)
      const ok = id !== "integ-003";
      const now = new Date().toISOString();
      const ms = ok ? Math.floor(Math.random() * 300 + 80) : 0;
      const newStatus: IntegStatus = ok ? "active" : "error";
      const msg = ok
        ? `Conexão OK — endpoint respondeu em ${ms}ms`
        : "Unauthorized — verifique as credenciais";

      setIntegrations(prev => prev.map(i =>
        i.id === id ? { ...i, status: newStatus, lastTest: now, lastTestMs: ms } : i
      ));
      if (selected?.id === id) setSelected(p => p ? { ...p, status: newStatus, lastTest: now, lastTestMs: ms } : p);

      const log: TestLog = {
        id: `l${Date.now()}`,
        integrationId: id,
        integrationName: integ.name,
        timestamp: now,
        status: ok ? "success" : "error",
        statusCode: ok ? 200 : 401,
        durationMs: ms,
        message: msg,
      };
      setLogs(prev => [log, ...prev]);
      if (ok) toast.success(`${integ.name}: conexão bem-sucedida (${ms}ms)`);
      else toast.error(`${integ.name}: falha na conexão — verifique as credenciais`);
    }, 1800);
  };

  const handleDelete = (id: string) => {
    setIntegrations(prev => prev.filter(i => i.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Integração removida");
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.baseUrl.trim()) {
      toast.error("Informe nome e URL base");
      return;
    }
    const newInteg: ApiIntegration = {
      ...form,
      id: `integ-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      endpoints: [],
    };
    setIntegrations(prev => [...prev, newInteg]);
    setForm(emptyInteg());
    setShowForm(false);
    toast.success("Integração criada com sucesso! Clique em 'Testar' para validar a conexão.");
  };

  const addHeader = () => {
    if (!headerKey.trim()) return;
    setForm(p => ({ ...p, headers: [...p.headers, { key: headerKey.trim(), value: headerVal.trim() }] }));
    setHeaderKey(""); setHeaderVal("");
  };
  const removeHeader = (idx: number) => setForm(p => ({ ...p, headers: p.headers.filter((_, i) => i !== idx) }));

  const activeCount = integrations.filter(i => i.status === "active").length;
  const errorCount = integrations.filter(i => i.status === "error").length;
  const totalEndpoints = integrations.reduce((a, i) => a + i.endpoints.filter(e => e.active).length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Cable className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Integrações de API</h1>
              <p className="text-sm text-slate-500">Conecte o QHealth One a qualquer sistema de saúde via API</p>
            </div>
          </div>
          <Button
            className="bg-sky-600 hover:bg-sky-700 text-white gap-2 text-sm"
            onClick={() => { setShowForm(v => !v); setSelected(null); }}
          >
            <Plus className="w-4 h-4" />
            Nova Integração
          </Button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Integrações", value: integrations.length, icon: <Cable className="w-5 h-5 text-sky-500" />, bg: "bg-sky-50", text: "text-sky-700" },
            { label: "Ativas", value: activeCount, icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50", text: "text-emerald-700" },
            { label: "Com Erro", value: errorCount, icon: <XCircle className="w-5 h-5 text-red-500" />, bg: "bg-red-50", text: "text-red-700" },
            { label: "Endpoints Ativos", value: totalEndpoints, icon: <Zap className="w-5 h-5 text-violet-500" />, bg: "bg-violet-50", text: "text-violet-700" },
          ].map(k => (
            <Card key={k.label} className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", k.bg)}>{k.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                  <p className={cn("text-2xl font-bold", k.text)}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Error alert ── */}
        {errorCount > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              <strong>{errorCount} integração(ões)</strong> com falha de conexão — verifique as credenciais e teste novamente.
            </p>
          </div>
        )}

        {/* ── New integration form ── */}
        {showForm && (
          <Card className="border border-sky-200 bg-sky-50/40 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-500" />
                Nova Integração
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {/* Row 1: Nome, Categoria, URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Nome da integração *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="Ex.: Tasy — HIS Principal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Categoria</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as SystemCategory }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {Object.keys(CATEGORY_PRESETS).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">URL Base *</label>
                  <input
                    value={form.baseUrl}
                    onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="https://sistema.hospital.com.br/api/v1"
                  />
                </div>
              </div>

              {/* Row 2: Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Descrição</label>
                <input
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="Para que serve esta integração?"
                />
              </div>

              {/* Row 3: Autenticação */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Tipo de Autenticação</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(AUTH_LABELS) as [AuthType, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setForm(p => ({ ...p, authType: k }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        form.authType === k
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auth fields */}
              {form.authType === "api_key" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">API Key</label>
                  <div className="relative">
                    <input
                      type={showSecret.apiKey ? "text" : "password"}
                      value={form.apiKey}
                      onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
                      className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                      placeholder="Sua API Key"
                    />
                    <button onClick={() => toggleSecret("apiKey")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                      {showSecret.apiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              {form.authType === "bearer" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Bearer Token</label>
                  <div className="relative">
                    <input
                      type={showSecret.bearer ? "text" : "password"}
                      value={form.bearerToken}
                      onChange={e => setForm(p => ({ ...p, bearerToken: e.target.value }))}
                      className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                      placeholder="Bearer ey..."
                    />
                    <button onClick={() => toggleSecret("bearer")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                      {showSecret.bearer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              {form.authType === "basic" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Usuário</label>
                    <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="username" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Senha</label>
                    <div className="relative">
                      <input type={showSecret.pass ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="senha" />
                      <button onClick={() => toggleSecret("pass")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                        {showSecret.pass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {form.authType === "oauth2" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Client ID</label>
                    <input value={form.oauthClientId} onChange={e => setForm(p => ({ ...p, oauthClientId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="client_id" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Client Secret</label>
                    <div className="relative">
                      <input type={showSecret.oauthSecret ? "text" : "password"} value={form.oauthClientSecret} onChange={e => setForm(p => ({ ...p, oauthClientSecret: e.target.value }))} className="w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="client_secret" />
                      <button onClick={() => toggleSecret("oauthSecret")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                        {showSecret.oauthSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Token URL</label>
                    <input value={form.oauthTokenUrl} onChange={e => setForm(p => ({ ...p, oauthTokenUrl: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300" placeholder="https://.../oauth/token" />
                  </div>
                </div>
              )}

              {/* Headers customizados */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Headers Customizados</label>
                {form.headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">{h.key}: {h.value}</span>
                    <button onClick={() => removeHeader(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={headerKey} onChange={e => setHeaderKey(e.target.value)} placeholder="Header-Name" className="w-40 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-300" />
                  <input value={headerVal} onChange={e => setHeaderVal(e.target.value)} placeholder="valor" className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-300" />
                  <button onClick={addHeader} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">+ Adicionar</button>
                </div>
              </div>

              {/* Webhook */}
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={form.webhookEnabled}
                  onChange={e => setForm(p => ({ ...p, webhookEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-sky-600"
                  id="webhook-toggle"
                />
                <label htmlFor="webhook-toggle" className="text-sm text-slate-700 flex-1 cursor-pointer">
                  Habilitar Webhook (receber notificações em tempo real)
                </label>
                {form.webhookEnabled && (
                  <input
                    value={form.webhookUrl}
                    onChange={e => setForm(p => ({ ...p, webhookUrl: e.target.value }))}
                    placeholder="https://qhealth.seudominio.com/webhooks/..."
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-300"
                  />
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                  placeholder="Notas internas sobre esta integração..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => { setShowForm(false); setForm(emptyInteg()); }}>Cancelar</Button>
                <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5" onClick={handleSave}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Salvar Integração
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Main content: list + detail ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* List */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              {integrations.length} integração(ões) configurada(s)
            </h2>
            {integrations.map(integ => (
              <IntegCard
                key={integ.id}
                integ={integ}
                selected={selected?.id === integ.id}
                onSelect={() => { setSelected(integ); setShowForm(false); }}
                onTest={() => handleTest(integ.id)}
                onDelete={() => handleDelete(integ.id)}
              />
            ))}
            {integrations.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Cable className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma integração configurada ainda.</p>
                <p className="text-xs mt-1">Clique em "Nova Integração" para começar.</p>
              </div>
            )}
          </div>

          {/* Detail / Logs panel */}
          <div>
            {selected ? (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusDot status={selected.status} />
                      <CardTitle className="text-sm font-bold text-slate-800">{selected.name}</CardTitle>
                      <Badge className={cn("text-[10px] border", STATUS_META[selected.status].badge)}>
                        {STATUS_META[selected.status].label}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleTest(selected.id)}>
                        <RefreshCw className="w-3 h-3" />
                        Testar
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { toast.info("Editor de endpoints em breve"); }}>
                        <Settings className="w-3 h-3" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 py-4">
                  <Tabs defaultValue="overview">
                    <TabsList className="bg-slate-100 rounded-lg p-0.5 gap-0.5 h-auto mb-4">
                      {[["overview", "Visão Geral"], ["endpoints", "Endpoints"], ["logs", "Logs"]].map(([v, l]) => (
                        <TabsTrigger key={v} value={v} className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm text-slate-500">
                          {l}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Overview */}
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Categoria", value: selected.category },
                          { label: "Autenticação", value: AUTH_LABELS[selected.authType] },
                          { label: "URL Base", value: selected.baseUrl },
                          { label: "Criado em", value: selected.createdAt },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg bg-slate-50 p-3">
                            <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                            <p className="text-xs font-medium text-slate-700 break-all">{value}</p>
                          </div>
                        ))}
                      </div>
                      {selected.description && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selected.description}</p>
                      )}
                      {selected.notes && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">{selected.notes}</p>
                        </div>
                      )}
                      {selected.lastTest && (
                        <div className={cn("flex items-center gap-2 rounded-lg p-3 text-sm", selected.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                          {selected.status === "active"
                            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            : <XCircle className="w-4 h-4 flex-shrink-0" />}
                          Último teste: {new Date(selected.lastTest).toLocaleString("pt-BR")}
                          {selected.lastTestMs ? ` — ${selected.lastTestMs}ms` : ""}
                        </div>
                      )}
                      {selected.webhookEnabled && selected.webhookUrl && (
                        <div className="flex items-center gap-2 text-xs bg-violet-50 border border-violet-200 rounded-lg p-3">
                          <Zap className="w-4 h-4 text-violet-500 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-violet-800">Webhook ativo</p>
                            <p className="text-violet-600 mt-0.5 break-all">{selected.webhookUrl}</p>
                          </div>
                          <button onClick={() => { navigator.clipboard.writeText(selected.webhookUrl!); toast.success("URL copiada!"); }} className="ml-auto text-violet-400 hover:text-violet-600">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {selected.headers.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2">Headers customizados</p>
                          <div className="space-y-1">
                            {selected.headers.map((h, i) => (
                              <div key={i} className="flex items-center gap-2 font-mono text-xs bg-slate-50 px-3 py-1.5 rounded">
                                <span className="text-sky-700">{h.key}:</span>
                                <span className="text-slate-600">{h.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Endpoints */}
                    <TabsContent value="endpoints" className="space-y-2">
                      {selected.endpoints.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">Nenhum endpoint configurado. Clique em "Editar" para adicionar.</p>
                      ) : (
                        selected.endpoints.map(ep => (
                          <div key={ep.id} className={cn("rounded-lg border p-3 flex items-start gap-3", ep.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60")}>
                            <Badge className={cn("text-[10px] font-mono mt-0.5 border-0", {
                              GET: "bg-emerald-100 text-emerald-700",
                              POST: "bg-blue-100 text-blue-700",
                              PUT: "bg-amber-100 text-amber-700",
                              DELETE: "bg-red-100 text-red-700",
                              PATCH: "bg-violet-100 text-violet-700",
                            }[ep.method])}>
                              {ep.method}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700">{ep.label}</p>
                              <p className="text-[10px] font-mono text-slate-500 truncate">{ep.path}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{ep.description}</p>
                            </div>
                            <Badge className={ep.active ? "bg-emerald-100 text-emerald-700 border-0 text-[10px]" : "bg-slate-100 text-slate-500 border-0 text-[10px]"}>
                              {ep.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        ))
                      )}
                      <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 mt-2" onClick={() => toast.info("Gerenciador de endpoints em breve")}>
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Endpoint
                      </Button>
                    </TabsContent>

                    {/* Logs */}
                    <TabsContent value="logs" className="space-y-2">
                      {logs.filter(l => l.integrationId === selected.id).length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">Nenhum log para esta integração ainda.</p>
                      ) : (
                        logs.filter(l => l.integrationId === selected.id).map(log => (
                          <div key={log.id} className={cn("flex items-start gap-3 rounded-lg p-3 text-xs", log.status === "success" ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100")}>
                            {log.status === "success"
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                              <p className={log.status === "success" ? "text-emerald-800" : "text-red-800"}>{log.message}</p>
                              <p className="text-slate-400 mt-0.5">
                                {new Date(log.timestamp).toLocaleString("pt-BR")}
                                {log.statusCode ? ` · HTTP ${log.statusCode}` : ""}
                                {log.durationMs > 0 ? ` · ${log.durationMs}ms` : ""}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                <Cable className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Selecione uma integração</p>
                <p className="text-xs mt-1">Clique em um item à esquerda para ver detalhes, endpoints e logs</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Global logs section ── */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              Log Global de Conexões
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-slate-50 last:border-0">
                {log.status === "success"
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                <span className="font-medium text-slate-700 w-52 truncate flex-shrink-0">{log.integrationName}</span>
                <span className="text-slate-500 flex-1 truncate">{log.message}</span>
                {log.statusCode && (
                  <Badge className={cn("text-[10px] border-0 flex-shrink-0", log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                    {log.statusCode}
                  </Badge>
                )}
                {log.durationMs > 0 && <span className="text-slate-400 flex-shrink-0">{log.durationMs}ms</span>}
                <span className="text-slate-400 flex-shrink-0">{new Date(log.timestamp).toLocaleString("pt-BR", { timeStyle: "short", dateStyle: "short" })}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Integration catalog ── */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="px-5 pt-4 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-500" />
              Sistemas de Saúde Suportados
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">O QHealth One conecta-se a qualquer sistema via REST, HL7 FHIR, SOAP ou webhooks</p>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(Object.entries(CATEGORY_PRESETS) as [SystemCategory, { desc: string; color: string }][]).map(([cat, meta]) => (
                <div
                  key={cat}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center cursor-pointer hover:shadow-sm hover:border-slate-200 transition-all"
                  onClick={() => { setForm(p => ({ ...p, category: cat })); setShowForm(true); toast.info(`Configurar integração ${cat}`); }}
                >
                  <Badge className={cn("text-[10px] border-0 mb-2", meta.color)}>{cat}</Badge>
                  <p className="text-[10px] text-slate-500 leading-snug">{meta.desc}</p>
                  <p className="text-[10px] text-sky-500 mt-1.5">+ Adicionar</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
