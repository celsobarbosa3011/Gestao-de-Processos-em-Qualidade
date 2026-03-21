import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Users,
  Shield,
  Plug,
  Activity,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  Plus,
  Trash2,
  Edit,
  Download,
  Server,
  HardDrive,
  Wifi,
  WifiOff,
  Cpu,
  Database,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "gestor" | "operador" | "visualizador";
  unit: string;
  status: "ativo" | "inativo" | "pendente";
  lastAccess: string;
  mfaEnabled: boolean;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: "conectado" | "desconectado" | "erro" | "configurando";
  lastSync: string;
  description: string;
  icon: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  ip: string;
  severity: "info" | "warning" | "critical";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const systemUsers: SystemUser[] = [
  { id: "1", name: "Dr. Carlos Menezes", email: "c.menezes@hospital.com", role: "admin", unit: "Administração", status: "ativo", lastAccess: "Há 2 horas", mfaEnabled: true },
  { id: "2", name: "Dra. Ana Lucia", email: "a.lucia@hospital.com", role: "gestor", unit: "Qualidade", status: "ativo", lastAccess: "Há 15 min", mfaEnabled: true },
  { id: "3", name: "Enf. Roberto Silva", email: "r.silva@hospital.com", role: "operador", unit: "UTI Adulto", status: "ativo", lastAccess: "Há 1 dia", mfaEnabled: false },
  { id: "4", name: "Dr. Fernando Costa", email: "f.costa@hospital.com", role: "gestor", unit: "Centro Cirúrgico", status: "ativo", lastAccess: "Há 3 horas", mfaEnabled: true },
  { id: "5", name: "Maria Santos", email: "m.santos@hospital.com", role: "operador", unit: "Farmácia", status: "inativo", lastAccess: "Há 5 dias", mfaEnabled: false },
  { id: "6", name: "João Oliveira", email: "j.oliveira@hospital.com", role: "visualizador", unit: "Controle de Infecção", status: "pendente", lastAccess: "Nunca acessou", mfaEnabled: false },
];

const integrations: Integration[] = [
  { id: "1", name: "MV SOUL", type: "HIS", status: "conectado", lastSync: "Há 5 min", description: "Sistema de gestão hospitalar principal (prontuário, internações, cirurgias)", icon: "🏥" },
  { id: "2", name: "Tasy (Philips)", type: "HIS", status: "configurando", lastSync: "Em configuração", description: "Integração em implantação para unidades satélite", icon: "🔧" },
  { id: "3", name: "NOTIVISA (ANVISA)", type: "Regulatório", status: "conectado", lastSync: "Há 2 horas", description: "Notificação automática de eventos adversos sentinela para a ANVISA", icon: "⚠️" },
  { id: "4", name: "Rede Sentinela", type: "Regulatório", status: "conectado", lastSync: "Há 1 hora", description: "Vigilância epidemiológica e reações adversas a medicamentos e produtos", icon: "🛡️" },
  { id: "5", name: "Totvs RH", type: "RH", status: "conectado", lastSync: "Há 30 min", description: "Dados de colaboradores, cargos, treinamentos e certificações", icon: "👥" },
  { id: "6", name: "Power BI", type: "Analytics", status: "conectado", lastSync: "Há 10 min", description: "Dashboard executivo para board e diretoria com indicadores consolidados", icon: "📊" },
  { id: "7", name: "WhatsApp Business", type: "Comunicação", status: "desconectado", lastSync: "Há 3 dias", description: "Alertas automáticos de desvios críticos e eventos sentinela", icon: "📱" },
  { id: "8", name: "E-mail SMTP", type: "Comunicação", status: "conectado", lastSync: "Há 5 min", description: "Notificações automáticas, relatórios e alertas por e-mail", icon: "✉️" },
  { id: "9", name: "ONA WebService", type: "Acreditação", status: "erro", lastSync: "Erro há 2h", description: "Envio de dados para plataforma de acompanhamento ONA", icon: "🏆" },
];

const auditLogs: AuditLog[] = [
  { id: "1", user: "Dra. Ana Lucia", action: "Atualização de evidência ONA", module: "Acreditação ONA", timestamp: "2026-03-21 14:32", ip: "10.0.1.45", severity: "info" },
  { id: "2", user: "Dr. Carlos Menezes", action: "Criação de usuário: João Oliveira", module: "Administração", timestamp: "2026-03-21 13:15", ip: "10.0.1.10", severity: "info" },
  { id: "3", user: "SISTEMA", action: "Falha na integração ONA WebService", module: "Integrações", timestamp: "2026-03-21 12:00", ip: "—", severity: "critical" },
  { id: "4", user: "Enf. Roberto Silva", action: "Notificação de Evento Sentinela registrada", module: "Notificação de Eventos", timestamp: "2026-03-21 11:45", ip: "10.0.2.88", severity: "warning" },
  { id: "5", user: "Dr. Fernando Costa", action: "Alteração de status de processo crítico", module: "Gestão Operacional", timestamp: "2026-03-21 10:30", ip: "10.0.1.22", severity: "warning" },
  { id: "6", user: "Maria Santos", action: "Login bem-sucedido após 5 dias", module: "Autenticação", timestamp: "2026-03-20 09:10", ip: "10.0.1.77", severity: "info" },
  { id: "7", user: "SISTEMA", action: "Backup automático concluído com sucesso", module: "Sistema", timestamp: "2026-03-21 03:00", ip: "—", severity: "info" },
  { id: "8", user: "Dr. Carlos Menezes", action: "Exportação de relatório de conformidade ONA", module: "Acreditação ONA", timestamp: "2026-03-20 17:22", ip: "10.0.1.10", severity: "info" },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const roleConfig = {
  admin: { label: "Administrador", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  gestor: { label: "Gestor", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  operador: { label: "Operador", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  visualizador: { label: "Visualizador", color: "bg-slate-600/40 text-slate-400 border-slate-600/50" },
};

const statusUserConfig = {
  ativo: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  inativo: { label: "Inativo", color: "bg-slate-600/40 text-slate-400 border-slate-600", dot: "bg-slate-500" },
  pendente: { label: "Pendente", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400 animate-pulse" },
};

const integrationStatusConfig = {
  conectado: { label: "Conectado", color: "text-emerald-400", icon: <Wifi className="w-3.5 h-3.5" /> },
  desconectado: { label: "Desconectado", color: "text-slate-500", icon: <WifiOff className="w-3.5 h-3.5" /> },
  erro: { label: "Erro", color: "text-red-400", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  configurando: { label: "Configurando", color: "text-amber-400", icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
};

const severityConfig = {
  info: { color: "text-slate-400", dot: "bg-slate-500" },
  warning: { color: "text-amber-400", dot: "bg-amber-400" },
  critical: { color: "text-red-400", dot: "bg-red-400 animate-pulse" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Administracao() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = systemUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.unit.toLowerCase().includes(userSearch.toLowerCase())
  );

  const activeUsers = systemUsers.filter((u) => u.status === "ativo").length;
  const connectedIntegrations = integrations.filter((i) => i.status === "conectado").length;
  const criticalLogs = auditLogs.filter((l) => l.severity === "critical").length;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg border border-slate-500/30">
              <Settings className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Administração & Integrações</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestão de usuários, perfis, integrações e configurações do sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Download className="w-4 h-4 mr-2" />
              Exportar Auditoria
            </Button>
            <Button size="sm" className="bg-sky-600 hover:bg-sky-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-5 gap-4 mt-5">
          {[
            { label: "Usuários Ativos", value: activeUsers, sub: `de ${systemUsers.length} cadastrados`, icon: <Users className="w-4 h-4" />, color: "text-sky-400" },
            { label: "Integrações", value: `${connectedIntegrations}/${integrations.length}`, sub: "conectadas", icon: <Plug className="w-4 h-4" />, color: "text-emerald-400" },
            { label: "Alertas Críticos", value: criticalLogs, sub: "últimas 24h", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400" },
            { label: "Uptime Sistema", value: "99.97%", sub: "últimos 30 dias", icon: <Activity className="w-4 h-4" />, color: "text-emerald-400" },
            { label: "Último Backup", value: "03:00", sub: "hoje, 21/03", icon: <Database className="w-4 h-4" />, color: "text-slate-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-slate-700/60", kpi.color)}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-100">{kpi.value}</p>
                  <p className="text-xs text-slate-400">{kpi.label}</p>
                  <p className="text-xs text-slate-500">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="px-6 pt-4 border-b border-slate-800">
            <TabsList className="bg-slate-800/50 border border-slate-700/50">
              {[
                { value: "usuarios", label: "Usuários & Perfis", icon: <Users className="w-3.5 h-3.5" /> },
                { value: "permissoes", label: "Permissões", icon: <Shield className="w-3.5 h-3.5" /> },
                { value: "integracoes", label: "Integrações", icon: <Plug className="w-3.5 h-3.5" /> },
                { value: "auditoria", label: "Log de Auditoria", icon: <Eye className="w-3.5 h-3.5" /> },
                { value: "sistema", label: "Sistema", icon: <Server className="w-3.5 h-3.5" /> },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-400"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Usuários */}
          <TabsContent value="usuarios" className="flex-1 overflow-auto m-0 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar usuário, e-mail ou unidade..."
                  className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <Badge className="bg-slate-700/60 text-slate-300 border-slate-600">
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Usuário</th>
                      <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Perfil</th>
                      <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Unidade</th>
                      <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Status</th>
                      <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">MFA</th>
                      <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Último Acesso</th>
                      <th className="text-xs text-slate-500 font-medium px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const role = roleConfig[user.role];
                      const status = statusUserConfig[user.status];
                      return (
                        <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/30 to-emerald-500/30 border border-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-300">
                                {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-200">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn("text-xs border", role.color)} variant="outline">
                              {role.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-300">{user.unit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                              <Badge className={cn("text-xs border", status.color)} variant="outline">
                                {status.label}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {user.mfaEnabled
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              : <Lock className="w-4 h-4 text-slate-600" />
                            }
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400">{user.lastAccess}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-sky-400">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Permissões */}
          <TabsContent value="permissoes" className="flex-1 overflow-auto m-0 p-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { role: "Administrador", desc: "Acesso total ao sistema", modules: ["Todos os módulos", "Configurações", "Integrações", "Logs de auditoria"], color: "border-red-500/30 bg-red-500/5" },
                { role: "Gestor", desc: "Gestão operacional e de qualidade", modules: ["Home Executiva", "Diagnóstico", "ONA", "GUT", "Riscos", "Indicadores", "Comissões", "Documentos", "Eventos"], color: "border-sky-500/30 bg-sky-500/5" },
                { role: "Operador", desc: "Registro e atualização de dados", modules: ["Processos", "Eventos", "Indicadores (entrada)", "Documentos (leitura)", "Treinamentos"], color: "border-emerald-500/30 bg-emerald-500/5" },
                { role: "Visualizador", desc: "Consulta e relatórios apenas", modules: ["Home (read-only)", "Indicadores (view)", "Relatórios exportáveis"], color: "border-slate-600/50 bg-slate-800/30" },
              ].map((profile) => (
                <Card key={profile.role} className={cn("border", profile.color)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-slate-200">{profile.role}</CardTitle>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-sky-400 text-xs">
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">{profile.desc}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {profile.modules.map((mod) => (
                        <div key={mod} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{mod}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Integrações */}
          <TabsContent value="integracoes" className="flex-1 overflow-auto m-0 p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {integrations.map((integ) => {
                const statusCfg = integrationStatusConfig[integ.status];
                return (
                  <Card key={integ.id} className="bg-slate-800/40 border-slate-700/50 hover:border-slate-600/70 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600/50 flex items-center justify-center text-xl">
                          {integ.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 text-sm">{integ.name}</span>
                            <Badge className="text-xs bg-slate-700/60 text-slate-400 border-slate-600">
                              {integ.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{integ.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={cn("flex items-center gap-1.5 text-xs", statusCfg.color)}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </div>
                          <div className="text-xs text-slate-500 w-28 text-right">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {integ.lastSync}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-sky-400 text-xs">
                              <Settings className="w-3.5 h-3.5 mr-1" />
                              Config
                            </Button>
                            {integ.status !== "conectado" && (
                              <Button size="sm" className="text-xs bg-sky-600 hover:bg-sky-500 text-white">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Reconectar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button variant="outline" className="w-full border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar nova integração
            </Button>
          </TabsContent>

          {/* Auditoria */}
          <TabsContent value="auditoria" className="flex-1 overflow-auto m-0 p-6">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    Log de Auditoria — Últimas 24 horas
                  </CardTitle>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 text-xs hover:bg-slate-800">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-700/40">
                  {auditLogs.map((log) => {
                    const sevCfg = severityConfig[log.severity];
                    return (
                      <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-slate-800/40 transition-colors">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", sevCfg.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-sm font-medium text-slate-200">{log.user}</span>
                              <span className="text-slate-600 mx-2">·</span>
                              <span className={cn("text-xs", sevCfg.color)}>{log.module}</span>
                            </div>
                            <span className="text-xs text-slate-500 flex-shrink-0">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{log.action}</p>
                          <p className="text-xs text-slate-600 mt-0.5">IP: {log.ip}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sistema */}
          <TabsContent value="sistema" className="flex-1 overflow-auto m-0 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              {/* System status */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    Status do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "API Server", uptime: "99.97%" },
                    { name: "Banco de Dados (PGlite)", uptime: "100%" },
                    { name: "WebSocket Server", uptime: "99.9%" },
                    { name: "File Storage", uptime: "100%" },
                    { name: "Backup Service", uptime: "99.8%" },
                  ].map((svc) => (
                    <div key={svc.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-sm text-slate-300">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Uptime {svc.uptime}</span>
                        <Badge className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/30" variant="outline">
                          online
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Configurações gerais */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-sky-400" />
                    Configurações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Autenticação de 2 fatores obrigatória", value: true },
                    { label: "Alertas por e-mail habilitados", value: true },
                    { label: "Backup automático diário", value: true },
                    { label: "Modo manutenção", value: false },
                    { label: "Log detalhado de auditoria", value: true },
                  ].map((cfg) => (
                    <div key={cfg.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{cfg.label}</span>
                      <Switch
                        checked={cfg.value}
                        className="data-[state=checked]:bg-sky-600"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Storage */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-400" />
                    Armazenamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Documentos & Evidências", used: 48, total: 100, unit: "GB" },
                    { name: "Banco de Dados", used: 2.3, total: 10, unit: "GB" },
                    { name: "Backups", used: 18, total: 50, unit: "GB" },
                  ].map((storage) => {
                    const pct = Math.round((storage.used / storage.total) * 100);
                    return (
                      <div key={storage.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">{storage.name}</span>
                          <span className="text-slate-300">{storage.used} / {storage.total} {storage.unit}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct >= 80 ? "bg-red-400" : pct >= 60 ? "bg-amber-400" : "bg-sky-400"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Versão e licença */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    Versão & Licença
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Versão do Sistema", value: "QHealth One 2026 v1.0.0" },
                    { label: "Licença", value: "Enterprise — SaaS Hospitalar" },
                    { label: "Unidades Ativas", value: "10 unidades" },
                    { label: "Usuários Licenciados", value: "50 usuários" },
                    { label: "Validade da Licença", value: "31/12/2026" },
                    { label: "Suporte", value: "Antygravity Tech — 24/7" },
                  ].map((info) => (
                    <div key={info.label} className="flex items-center justify-between py-1 border-b border-slate-700/30 last:border-0">
                      <span className="text-xs text-slate-500">{info.label}</span>
                      <span className="text-xs font-medium text-slate-300">{info.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
