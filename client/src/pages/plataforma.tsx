import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Store, Building2, Users, CreditCard, Package, CheckCircle2,
  XCircle, Clock, AlertTriangle, Plus, Settings, Eye, Edit3,
  Layers, TrendingUp, DollarSign, Calendar, Globe, Shield,
  Award, BarChart3, Stethoscope, ClipboardList, FileText,
  Bot, Link2, GraduationCap, Target, Radio, Siren, Activity,
  ChevronRight, Copy, RefreshCw, Crown, Zap, Star, Palette
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type TenantStatus = "ativo" | "trial" | "suspenso" | "cancelado";
type TenantPlan = "starter" | "professional" | "enterprise";

interface ModuleDefinition {
  id: string;
  nome: string;
  descricao: string;
  icone: React.ReactNode;
  categoria: string;
  precoMensal: number;
}

interface TenantModule {
  moduleId: string;
  ativo: boolean;
  ativadoEm: string | null;
}

interface Tenant {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cidade: string;
  uf: string;
  plano: TenantPlan;
  status: TenantStatus;
  usuarios: number;
  usuariosMax: number;
  modulosAtivos: number;
  mrr: number;
  criadoEm: string;
  vencimentoLicenca: string;
  responsavel: string;
  email: string;
  modulos: TenantModule[];
  onaScore: number | null;
}

interface License {
  tenantId: string;
  tipo: TenantPlan;
  inicio: string;
  fim: string;
  valor: number;
  status: "vigente" | "vencida" | "cancelada";
  renovacaoAuto: boolean;
}

// ── Module Catalog ─────────────────────────────────────────────────────────────

const moduleCatalog: ModuleDefinition[] = [
  { id: "M01", nome: "Home Executiva", descricao: "Dashboard 360° com KPIs e semáforo ONA", icone: <BarChart3 className="w-4 h-4" />, categoria: "Core ONA", precoMensal: 0 },
  { id: "M02", nome: "Diagnóstico", descricao: "Ciclos de diagnóstico e formulário de avaliação", icone: <Activity className="w-4 h-4" />, categoria: "Core ONA", precoMensal: 0 },
  { id: "M03", nome: "Matriz GUT", descricao: "Priorização de problemas por Gravidade, Urgência e Tendência", icone: <AlertTriangle className="w-4 h-4" />, categoria: "Core ONA", precoMensal: 0 },
  { id: "M04", nome: "Acreditação ONA 2026", descricao: "Questionário ONA 2026 com 22 grupos e scoring automático", icone: <Award className="w-4 h-4" />, categoria: "Core ONA", precoMensal: 0 },
  { id: "M05", nome: "Unidades de Negócio", descricao: "Gestão por unidades assistenciais com score ONA por nível", icone: <Building2 className="w-4 h-4" />, categoria: "Qualidade", precoMensal: 49 },
  { id: "M06", nome: "Processos", descricao: "Gestão de processos em kanban com workflow e notificações", icone: <ClipboardList className="w-4 h-4" />, categoria: "Qualidade", precoMensal: 49 },
  { id: "M07", nome: "Riscos", descricao: "Gestão de riscos institucionais com matriz e planos de ação", icone: <Shield className="w-4 h-4" />, categoria: "Qualidade", precoMensal: 49 },
  { id: "M08", nome: "Governança Clínica", descricao: "Indicadores clínicos, tendências e score por unidade", icone: <Stethoscope className="w-4 h-4" />, categoria: "Clínico", precoMensal: 79 },
  { id: "M09", nome: "Comissões", descricao: "Gestão de comissões hospitalares (NSP, CCIH, CME...)", icone: <Users className="w-4 h-4" />, categoria: "Clínico", precoMensal: 49 },
  { id: "M10", nome: "Indicadores", descricao: "KPIs assistenciais e operacionais com metas e trending", icone: <BarChart3 className="w-4 h-4" />, categoria: "Qualidade", precoMensal: 49 },
  { id: "M11", nome: "Jornada do Paciente", descricao: "Swimlane do fluxo assistencial, rupturas e handoffs", icone: <Activity className="w-4 h-4" />, categoria: "Clínico", precoMensal: 79 },
  { id: "M12", nome: "Protocolos Gerenciados", descricao: "Gestão de protocolos com aderência por unidade", icone: <ClipboardList className="w-4 h-4" />, categoria: "Clínico", precoMensal: 49 },
  { id: "M13", nome: "Planejamento BSC", descricao: "Balanced Scorecard com 4 perspectivas e mapa estratégico", icone: <Target className="w-4 h-4" />, categoria: "Estratégico", precoMensal: 79 },
  { id: "M14", nome: "Políticas & Regimentos", descricao: "Gestão de documentos normativos com controle de validade", icone: <FileText className="w-4 h-4" />, categoria: "Estratégico", precoMensal: 49 },
  { id: "M15", nome: "Documentos & Evidências", descricao: "GED completo com versionamento e workflow de aprovação", icone: <FileText className="w-4 h-4" />, categoria: "Estratégico", precoMensal: 79 },
  { id: "M16", nome: "Treinamentos", descricao: "Gestão de capacitações com controle de carga horária", icone: <GraduationCap className="w-4 h-4" />, categoria: "Estratégico", precoMensal: 49 },
  { id: "M17", nome: "Gestão Operacional", descricao: "Planos de ação, metas e follow-up operacional", icone: <CheckCircle2 className="w-4 h-4" />, categoria: "Qualidade", precoMensal: 49 },
  { id: "M18", nome: "Comunicação Interna", descricao: "Mural de comunicados e agenda de reuniões", icone: <Radio className="w-4 h-4" />, categoria: "Regulatório", precoMensal: 29 },
  { id: "M19", nome: "Referências Normativas", descricao: "Biblioteca de normas ANVISA, CFM, COFEN, RDC", icone: <FileText className="w-4 h-4" />, categoria: "Regulatório", precoMensal: 29 },
  { id: "M20", nome: "Notificação de Eventos", descricao: "Notificação NSP com formulário FOR SN-003", icone: <Siren className="w-4 h-4" />, categoria: "Regulatório", precoMensal: 49 },
  { id: "M21", nome: "IA ONA Copilot", descricao: "Assistente IA para análise de gaps e recomendações ONA", icone: <Bot className="w-4 h-4" />, categoria: "IA & Sistema", precoMensal: 149 },
  { id: "M22", nome: "Integrações & API", descricao: "Conectores HIS/LIS/PACS e API RESTful documentada", icone: <Link2 className="w-4 h-4" />, categoria: "IA & Sistema", precoMensal: 99 },
];

const planConfig: Record<TenantPlan, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; modulos: string[] }> = {
  starter: {
    label: "Starter",
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-300",
    icon: <Package className="w-4 h-4" />,
    modulos: ["M01", "M02", "M03", "M04", "M06", "M07", "M10", "M17"],
  },
  professional: {
    label: "Professional",
    color: "text-blue-700",
    bg: "bg-blue-100",
    border: "border-blue-300",
    icon: <Star className="w-4 h-4" />,
    modulos: ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18", "M19", "M20"],
  },
  enterprise: {
    label: "Enterprise",
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-300",
    icon: <Crown className="w-4 h-4" />,
    modulos: moduleCatalog.map(m => m.id),
  },
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const tenants: Tenant[] = [
  {
    id: "T001", razaoSocial: "Hospital Geral São Lucas S/A", nomeFantasia: "HSL — São Lucas",
    cnpj: "12.345.678/0001-90", cidade: "São Paulo", uf: "SP", plano: "enterprise",
    status: "ativo", usuarios: 48, usuariosMax: 100, modulosAtivos: 22, mrr: 2890,
    criadoEm: "2025-08-15", vencimentoLicenca: "2026-12-31",
    responsavel: "Dr. Carlos Mendes", email: "carlos.mendes@hsl.com.br", onaScore: 71,
    modulos: moduleCatalog.map(m => ({ moduleId: m.id, ativo: true, ativadoEm: "2025-08-15" })),
  },
  {
    id: "T002", razaoSocial: "Clínica Santa Maria Ltda", nomeFantasia: "Clínica Santa Maria",
    cnpj: "23.456.789/0001-01", cidade: "Rio de Janeiro", uf: "RJ", plano: "professional",
    status: "ativo", usuarios: 18, usuariosMax: 30, modulosAtivos: 18, mrr: 1290,
    criadoEm: "2025-10-01", vencimentoLicenca: "2026-10-31",
    responsavel: "Dra. Ana Lima", email: "ana.lima@santamaria.com.br", onaScore: 63,
    modulos: planConfig.professional.modulos.map(id => ({ moduleId: id, ativo: true, ativadoEm: "2025-10-01" })),
  },
  {
    id: "T003", razaoSocial: "UPA Norte Gestão de Saúde S/A", nomeFantasia: "UPA Norte",
    cnpj: "34.567.890/0001-12", cidade: "Belo Horizonte", uf: "MG", plano: "starter",
    status: "trial", usuarios: 5, usuariosMax: 10, modulosAtivos: 8, mrr: 0,
    criadoEm: "2026-03-01", vencimentoLicenca: "2026-03-31",
    responsavel: "Paulo Sousa", email: "paulo.sousa@upanorte.mg.gov.br", onaScore: null,
    modulos: planConfig.starter.modulos.map(id => ({ moduleId: id, ativo: true, ativadoEm: "2026-03-01" })),
  },
  {
    id: "T004", razaoSocial: "Instituto Oncológico do Sul Ltda", nomeFantasia: "IOS Oncologia",
    cnpj: "45.678.901/0001-23", cidade: "Porto Alegre", uf: "RS", plano: "professional",
    status: "ativo", usuarios: 24, usuariosMax: 50, modulosAtivos: 20, mrr: 1490,
    criadoEm: "2025-09-15", vencimentoLicenca: "2026-09-30",
    responsavel: "Dra. Fernanda Ramos", email: "fernanda@ios.com.br", onaScore: 78,
    modulos: planConfig.professional.modulos.map(id => ({ moduleId: id, ativo: true, ativadoEm: "2025-09-15" })),
  },
  {
    id: "T005", razaoSocial: "Centro de Diagnóstico Curitiba S/A", nomeFantasia: "CDC Curitiba",
    cnpj: "56.789.012/0001-34", cidade: "Curitiba", uf: "PR", plano: "starter",
    status: "suspenso", usuarios: 8, usuariosMax: 10, modulosAtivos: 8, mrr: 0,
    criadoEm: "2025-07-01", vencimentoLicenca: "2026-01-31",
    responsavel: "Roberto Vieira", email: "roberto@cdcuritiba.com.br", onaScore: 55,
    modulos: planConfig.starter.modulos.map(id => ({ moduleId: id, ativo: false, ativadoEm: null })),
  },
];

const mrrTrend = [
  { mes: "Out/25", mrr: 3200, clientes: 2 },
  { mes: "Nov/25", mrr: 4500, clientes: 3 },
  { mes: "Dez/25", mrr: 4500, clientes: 3 },
  { mes: "Jan/26", mrr: 5680, clientes: 4 },
  { mes: "Fev/26", mrr: 5680, clientes: 4 },
  { mes: "Mar/26", mrr: 5670, clientes: 5 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function tenantStatusMeta(s: TenantStatus) {
  const map: Record<TenantStatus, { label: string; color: string; bg: string; dot: string }> = {
    ativo: { label: "Ativo", color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
    trial: { label: "Trial", color: "text-blue-700", bg: "bg-blue-100", dot: "bg-blue-500" },
    suspenso: { label: "Suspenso", color: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500" },
    cancelado: { label: "Cancelado", color: "text-red-700", bg: "bg-red-100", dot: "bg-red-500" },
  };
  return map[s];
}

function onaScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 65) return "text-amber-600";
  return "text-red-600";
}

// ── TenantCard Component ───────────────────────────────────────────────────────

function TenantCard({ tenant, onSelect, isSelected }: { tenant: Tenant; onSelect: () => void; isSelected: boolean }) {
  const sm = tenantStatusMeta(tenant.status);
  const pm = planConfig[tenant.plano];
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left bg-white border rounded-xl p-5 transition-all",
        isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{tenant.nomeFantasia}</p>
            <p className="text-xs text-gray-400">{tenant.cidade}/{tenant.uf} · {tenant.cnpj}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", sm.dot)} />
            <Badge className={cn("text-xs", sm.color, sm.bg)}>{sm.label}</Badge>
          </div>
          <Badge className={cn("text-xs", pm.color, pm.bg, "border", pm.border)}>
            {pm.icon} <span className="ml-1">{pm.label}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-gray-900">{tenant.usuarios}</p>
          <p className="text-xs text-gray-400">Usuários</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-lg font-bold text-gray-900">{tenant.modulosAtivos}</p>
          <p className="text-xs text-gray-400">Módulos</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className={cn("text-lg font-bold", tenant.onaScore ? onaScoreColor(tenant.onaScore) : "text-gray-400")}>
            {tenant.onaScore ? `${tenant.onaScore}%` : "—"}
          </p>
          <p className="text-xs text-gray-400">Score ONA</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className={cn("text-lg font-bold", tenant.mrr > 0 ? "text-emerald-600" : "text-gray-400")}>
            {tenant.mrr > 0 ? `R$${tenant.mrr.toLocaleString("pt-BR")}` : "Trial"}
          </p>
          <p className="text-xs text-gray-400">MRR</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Usuários: {tenant.usuarios}/{tenant.usuariosMax}</span>
            <span>{Math.round((tenant.usuarios / tenant.usuariosMax) * 100)}%</span>
          </div>
          <Progress value={(tenant.usuarios / tenant.usuariosMax) * 100} className="h-1.5" />
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
    </button>
  );
}

// ── ModuleToggle Component ─────────────────────────────────────────────────────

function ModuleTogglePanel({ tenant }: { tenant: Tenant }) {
  const [moduleState, setModuleState] = useState<Record<string, boolean>>(
    Object.fromEntries(tenant.modulos.map(m => [m.moduleId, m.ativo]))
  );

  const categories = [...new Set(moduleCatalog.map(m => m.categoria))];

  const toggleModule = (moduleId: string) => {
    setModuleState(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const activeCount = Object.values(moduleState).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{activeCount} de {moduleCatalog.length} módulos ativos para <strong>{tenant.nomeFantasia}</strong></p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setModuleState(Object.fromEntries(moduleCatalog.map(m => [m.id, false])))}>
            Desmarcar todos
          </Button>
          <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-0" onClick={() => setModuleState(Object.fromEntries(moduleCatalog.map(m => [m.id, true])))}>
            Ativar todos
          </Button>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {moduleCatalog.filter(m => m.categoria === cat).map(mod => {
              const isActive = moduleState[mod.id] ?? false;
              return (
                <div
                  key={mod.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    isActive ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className={cn("p-1.5 rounded-md", isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400")}>
                    {mod.icone}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{mod.nome}</p>
                    <p className="text-xs text-gray-400 truncate">{mod.descricao}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {mod.precoMensal > 0 && (
                      <span className="text-xs text-gray-400">+R${mod.precoMensal}/mês</span>
                    )}
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors focus:outline-none",
                        isActive ? "bg-emerald-500" : "bg-gray-300"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                        isActive ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
          Salvar Configuração de Módulos
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

function getInitialTab(pathname: string): string {
  if (pathname.includes("/modulos")) return "modulos";
  if (pathname.includes("/faturamento")) return "licencas";
  if (pathname.includes("/branding")) return "branding";
  return "empresas";
}

export default function Plataforma() {
  const [location, navigate] = useLocation();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState(getInitialTab(location));
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);

  const totalMRR = tenants.filter(t => t.status === "ativo").reduce((a, t) => a + t.mrr, 0);
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === "ativo").length;
  const trialTenants = tenants.filter(t => t.status === "trial").length;
  const totalUsers = tenants.reduce((a, t) => a + t.usuarios, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Plataforma QHealth One</h1>
            <Badge className="bg-amber-100 text-amber-700 text-xs">Super Admin</Badge>
          </div>
          <p className="text-sm text-gray-500 ml-11">Gestão multi-tenant · Empresas, módulos, licenças e faturamento</p>
        </div>
        <Button
          onClick={() => setShowNewTenantForm(true)}
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white border-0"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">MRR Total</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">R${totalMRR.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-gray-400 mt-0.5">receita mensal recorrente</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Empresas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalTenants}</p>
                <p className="text-xs text-gray-400 mt-0.5">{activeTenants} ativas · {trialTenants} em trial</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Usuários Totais</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                <p className="text-xs text-gray-400 mt-0.5">em todas as empresas</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Planos Enterprise</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{tenants.filter(t => t.plano === "enterprise").length}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tenants.filter(t => t.plano === "professional").length} professional</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">ARR Projetado</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">R${(totalMRR * 12).toLocaleString("pt-BR")}</p>
                <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +26% vs ano anterior
                </p>
              </div>
              <div className="p-2 bg-sky-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="empresas">Empresas & Tenants</TabsTrigger>
          <TabsTrigger value="modulos">Catálogo de Módulos</TabsTrigger>
          <TabsTrigger value="licencas">Licenças & Planos</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Empresas ───────────────────────────────────────────── */}
        <TabsContent value="empresas" className="space-y-4 mt-4">
          <div className="flex gap-4">
            {/* Tenant list */}
            <div className="flex-1 space-y-3">
              {tenants.map(tenant => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  isSelected={selectedTenant?.id === tenant.id}
                  onSelect={() => setSelectedTenant(selectedTenant?.id === tenant.id ? null : tenant)}
                />
              ))}
            </div>

            {/* Detail / Module config panel */}
            {selectedTenant && (
              <div className="w-[420px] flex-shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <CardTitle className="text-base">{selectedTenant.nomeFantasia}</CardTitle>
                      <Badge className={cn("text-xs ml-auto", tenantStatusMeta(selectedTenant.status).color, tenantStatusMeta(selectedTenant.status).bg)}>
                        {tenantStatusMeta(selectedTenant.status).label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">Responsável</p>
                        <p className="font-medium text-gray-900 text-xs">{selectedTenant.responsavel}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-medium text-gray-900 text-xs truncate">{selectedTenant.email}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">Plano</p>
                        <p className={cn("font-bold text-xs", planConfig[selectedTenant.plano].color)}>
                          {planConfig[selectedTenant.plano].label}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">Validade</p>
                        <p className="font-medium text-gray-900 text-xs">{selectedTenant.vencimentoLicenca}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">MRR</p>
                        <p className={cn("font-bold text-xs", selectedTenant.mrr > 0 ? "text-emerald-600" : "text-gray-400")}>
                          {selectedTenant.mrr > 0 ? `R$ ${selectedTenant.mrr.toLocaleString("pt-BR")}` : "Trial gratuito"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-400">Score ONA</p>
                        <p className={cn("font-bold text-xs", selectedTenant.onaScore ? onaScoreColor(selectedTenant.onaScore) : "text-gray-400")}>
                          {selectedTenant.onaScore ? `${selectedTenant.onaScore}%` : "Não avaliado"}
                        </p>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                        <Eye className="w-3 h-3" /> Acessar tenant
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                        <Edit3 className="w-3 h-3" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                        <RefreshCw className="w-3 h-3" /> Renovar licença
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-red-600 border-red-200 hover:bg-red-50">
                        <XCircle className="w-3 h-3" /> Suspender
                      </Button>
                    </div>

                    {/* Module config */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Configurar Módulos Disponíveis</p>
                      <div className="max-h-64 overflow-y-auto space-y-1.5">
                        {moduleCatalog.map(mod => {
                          const tenantMod = selectedTenant.modulos.find(m => m.moduleId === mod.id);
                          const isActive = tenantMod?.ativo ?? false;
                          return (
                            <div key={mod.id} className={cn("flex items-center gap-2 p-2 rounded-lg border text-xs", isActive ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200")}>
                              <span className={isActive ? "text-emerald-600" : "text-gray-400"}>{mod.icone}</span>
                              <span className={cn("flex-1 font-medium", isActive ? "text-gray-900" : "text-gray-500")}>{mod.nome}</span>
                              <span className={cn("w-2 h-2 rounded-full", isActive ? "bg-emerald-500" : "bg-gray-300")} />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs"
                      onClick={() => {
                        setActiveTab("modulos");
                      }}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Gerenciar módulos desta empresa
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 2: Catálogo de Módulos ────────────────────────────────── */}
        <TabsContent value="modulos" className="space-y-4 mt-4">
          {selectedTenant ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-blue-100 text-blue-700">Configurando: {selectedTenant.nomeFantasia}</Badge>
                <button onClick={() => setSelectedTenant(null)} className="text-xs text-gray-400 hover:text-gray-600">
                  ✕ Desvincular seleção
                </button>
              </div>
              <ModuleTogglePanel tenant={selectedTenant} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Layers className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Selecione uma empresa na aba "Empresas" para configurar módulos</p>
                  <p className="text-xs text-blue-600 mt-1">Ou explore abaixo o catálogo completo de módulos disponíveis na plataforma</p>
                </div>
              </div>

              {[...new Set(moduleCatalog.map(m => m.categoria))].map(cat => (
                <div key={cat}>
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {cat}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {moduleCatalog.filter(m => m.categoria === cat).map(mod => (
                      <div key={mod.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">{mod.icone}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{mod.nome}</p>
                              <span className="text-[10px] font-mono text-gray-400">{mod.id}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{mod.descricao}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Preço adicional</span>
                          <span className={cn("text-sm font-bold", mod.precoMensal === 0 ? "text-emerald-600" : "text-gray-700")}>
                            {mod.precoMensal === 0 ? "Incluído" : `+R$${mod.precoMensal}/mês`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 3: Licenças & Planos ──────────────────────────────────── */}
        <TabsContent value="licencas" className="space-y-6 mt-4">
          {/* Plan cards */}
          <div className="grid grid-cols-3 gap-4">
            {(["starter", "professional", "enterprise"] as TenantPlan[]).map(plan => {
              const pm = planConfig[plan];
              const planTenants = tenants.filter(t => t.plano === plan);
              const planPrices: Record<TenantPlan, number> = { starter: 490, professional: 1290, enterprise: 2890 };
              return (
                <Card key={plan} className={cn("border-2", pm.border)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className={pm.color}>{pm.icon}</span>
                      <CardTitle className={cn("text-base", pm.color)}>{pm.label}</CardTitle>
                      <Badge className={cn("ml-auto text-xs", pm.color, pm.bg)}>{planTenants.length} empresa{planTenants.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      R${planPrices[plan].toLocaleString("pt-BR")}
                      <span className="text-sm font-normal text-gray-400">/mês</span>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Módulos inclusos ({pm.modulos.length})</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {pm.modulos.map(moduleId => {
                        const mod = moduleCatalog.find(m => m.id === moduleId);
                        if (!mod) return null;
                        return (
                          <div key={moduleId} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            {mod.nome}
                          </div>
                        );
                      })}
                      {plan !== "enterprise" && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <XCircle className="w-3 h-3 flex-shrink-0" />
                          {moduleCatalog.length - pm.modulos.length} módulos não inclusos
                        </div>
                      )}
                    </div>
                    <Button className={cn("w-full mt-3 text-xs border-0", plan === "enterprise" ? "bg-amber-600 hover:bg-amber-700 text-white" : plan === "professional" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white")}>
                      Criar empresa neste plano
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* License table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Licenças Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 text-xs text-gray-500 font-medium">Empresa</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium">Plano</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium">Início</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium">Vencimento</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium text-right">MRR</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium text-center">Status</th>
                      <th className="pb-2 text-xs text-gray-500 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tenants.map(t => {
                      const pm = planConfig[t.plano];
                      const sm = tenantStatusMeta(t.status);
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <p className="font-medium text-gray-900">{t.nomeFantasia}</p>
                            <p className="text-xs text-gray-400">{t.cnpj}</p>
                          </td>
                          <td className="py-3">
                            <Badge className={cn("text-xs", pm.color, pm.bg)}>{pm.label}</Badge>
                          </td>
                          <td className="py-3 text-gray-600 text-xs">{t.criadoEm}</td>
                          <td className="py-3 text-gray-600 text-xs">{t.vencimentoLicenca}</td>
                          <td className="py-3 text-right font-semibold">
                            {t.mrr > 0 ? (
                              <span className="text-emerald-600">R${t.mrr.toLocaleString("pt-BR")}</span>
                            ) : (
                              <span className="text-gray-400">Trial</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <Badge className={cn("text-xs", sm.color, sm.bg)}>{sm.label}</Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2">Renovar</Button>
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2">Editar</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Métricas ───────────────────────────────────────────── */}
        <TabsContent value="metricas" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução do MRR (R$)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={mrrTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                    <Tooltip formatter={(v: number) => `R$${v.toLocaleString("pt-BR")}`} />
                    <Line type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Empresas por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={[
                      { plano: "Starter", count: tenants.filter(t => t.plano === "starter").length, mrr: tenants.filter(t => t.plano === "starter").reduce((a, t) => a + t.mrr, 0) },
                      { plano: "Professional", count: tenants.filter(t => t.plano === "professional").length, mrr: tenants.filter(t => t.plano === "professional").reduce((a, t) => a + t.mrr, 0) },
                      { plano: "Enterprise", count: tenants.filter(t => t.plano === "enterprise").length, mrr: tenants.filter(t => t.plano === "enterprise").reduce((a, t) => a + t.mrr, 0) },
                    ]}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="plano" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Empresas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="mrr" name="MRR (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ONA scores across tenants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score ONA por Empresa Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenants.filter(t => t.onaScore !== null).sort((a, b) => (b.onaScore ?? 0) - (a.onaScore ?? 0)).map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="w-36 text-sm text-gray-700 truncate">{t.nomeFantasia}</div>
                    <div className="flex-1">
                      <Progress value={t.onaScore ?? 0} className="h-3" />
                    </div>
                    <span className={cn("text-sm font-bold w-10 text-right", onaScoreColor(t.onaScore ?? 0))}>
                      {t.onaScore}%
                    </span>
                    <Badge className={cn("text-xs w-20 justify-center", planConfig[t.plano].color, planConfig[t.plano].bg)}>
                      {planConfig[t.plano].label}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{Math.round(tenants.filter(t => t.onaScore !== null).reduce((a, t) => a + (t.onaScore ?? 0), 0) / tenants.filter(t => t.onaScore !== null).length)}%</p>
                <p className="text-sm text-gray-500 mt-1">Score ONA médio</p>
                <p className="text-xs text-gray-400">na base de clientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{Math.round(totalUsers / activeTenants)}</p>
                <p className="text-sm text-gray-500 mt-1">Usuários por empresa</p>
                <p className="text-xs text-gray-400">média</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">R${Math.round(totalMRR / activeTenants).toLocaleString("pt-BR")}</p>
                <p className="text-sm text-gray-500 mt-1">ARPU</p>
                <p className="text-xs text-gray-400">receita média por empresa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{Math.round(tenants.reduce((a, t) => a + t.modulosAtivos, 0) / tenants.length)}</p>
                <p className="text-sm text-gray-500 mt-1">Módulos por empresa</p>
                <p className="text-xs text-gray-400">média de uso</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 5: Branding ───────────────────────────────────────────── */}
        <TabsContent value="branding" className="space-y-6 mt-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <Palette className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Branding WhiteLabel por Empresa</p>
              <p className="text-xs text-amber-700 mt-1">
                Personalize logo, cores, nome do sistema e domínio para cada empresa cliente.
                O painel de branding completo está disponível em{" "}
                <button onClick={() => navigate("/admin/branding")} className="underline font-medium hover:text-amber-900">
                  /admin/branding
                </button>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tenants.map(t => {
              const sm = tenantStatusMeta(t.status);
              const pm = planConfig[t.plano];
              const brandColors: Record<string, { primary: string; accent: string }> = {
                T001: { primary: "#0ea5e9", accent: "#10b981" },
                T002: { primary: "#8b5cf6", accent: "#ec4899" },
                T003: { primary: "#f59e0b", accent: "#ef4444" },
                T004: { primary: "#14b8a6", accent: "#6366f1" },
                T005: { primary: "#64748b", accent: "#94a3b8" },
              };
              const colors = brandColors[t.id] || { primary: "#3b82f6", accent: "#10b981" };
              return (
                <Card key={t.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
                      >
                        {t.nomeFantasia.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{t.nomeFantasia}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge className={cn("text-xs", sm.color, sm.bg)}>{sm.label}</Badge>
                          <Badge className={cn("text-xs", pm.color, pm.bg)}>{pm.label}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                          style={{ backgroundColor: colors.primary }}
                          title="Cor primária"
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                          style={{ backgroundColor: colors.accent }}
                          title="Cor de destaque"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono">{colors.primary}</span>
                        <span className="mx-1">·</span>
                        <span className="font-mono">{colors.accent}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Domínio: </span>
                      <span className="font-medium text-gray-700">
                        {t.nomeFantasia.toLowerCase().replace(/[^a-z0-9]/g, "")}.qhealthone.com.br
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-1"
                      onClick={() => navigate("/admin/branding")}
                    >
                      <Palette className="w-3 h-3" />
                      Configurar Branding
                    </Button>
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
