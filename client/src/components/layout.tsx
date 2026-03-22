import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  LayoutDashboard, Search, Bell, Settings, LogOut, Menu, ChevronDown,
  Building2, BarChart3, FileText, AlertTriangle, Users, ClipboardList,
  Activity, ShieldCheck, BookOpen, Zap, MessageSquare, Link2, Bot,
  Home, Stethoscope, Target, ScrollText, GraduationCap, CheckSquare,
  Radio, Library, Siren, TrendingUp, Map, Pill, Award, Star,
  BarChart2, Triangle, ChevronRight, X, Wifi, WifiOff, Globe,
  Calendar, Filter, User, Layers, Store, CreditCard,
  Palette, KeyRound, Workflow, SlidersHorizontal, ListTodo,
  LayoutTemplate, Tag, ScrollText as ScrollTextIcon, ClipboardCheck, Grid2X2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationsCenter } from "@/components/notifications-center";
import { useBrandingConfig } from "@/hooks/use-branding";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ============================================================
// QHEALTH ONE 2026 — DESIGN SYSTEM
// Dark sidebar enterprise premium
// ============================================================

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "warning";
  highlight?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Core ONA",
    items: [
      { label: "Home Executiva", path: "/home", icon: <Home className="w-4 h-4" />, highlight: true },
      { label: "Diagnóstico", path: "/diagnostico", icon: <Search className="w-4 h-4" /> },
      { label: "Acreditação ONA 2026", path: "/acreditacao-ona", icon: <Award className="w-4 h-4" />, highlight: true },
      { label: "Matriz GUT", path: "/matriz-gut", icon: <Triangle className="w-4 h-4" /> },
    ],
  },
  {
    label: "Qualidade",
    items: [
      { label: "Unidades de Negócio", path: "/unidades-negocio", icon: <Building2 className="w-4 h-4" /> },
      { label: "Processos", path: "/processos", icon: <ClipboardList className="w-4 h-4" /> },
      { label: "Riscos", path: "/riscos", icon: <AlertTriangle className="w-4 h-4" /> },
      { label: "Indicadores", path: "/indicadores", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Gestão Operacional", path: "/gestao-operacional", icon: <CheckSquare className="w-4 h-4" /> },
    ],
  },
  {
    label: "Clínico",
    items: [
      { label: "Governança Clínica", path: "/governanca-clinica", icon: <Stethoscope className="w-4 h-4" /> },
      { label: "Comissões", path: "/comissoes", icon: <Users className="w-4 h-4" /> },
      { label: "Jornada do Paciente", path: "/jornada-paciente", icon: <Map className="w-4 h-4" /> },
      { label: "Protocolos Gerenciados", path: "/protocolos", icon: <Pill className="w-4 h-4" /> },
    ],
  },
  {
    label: "Estratégico",
    items: [
      { label: "Análise SWOT", path: "/swot", icon: <Grid2X2 className="w-4 h-4" /> },
      { label: "Planejamento BSC", path: "/planejamento-bsc", icon: <Target className="w-4 h-4" /> },
      { label: "Políticas & Regimentos", path: "/politicas", icon: <ScrollText className="w-4 h-4" /> },
      { label: "Documentos & Evidências", path: "/documentos", icon: <FileText className="w-4 h-4" /> },
      { label: "Treinamentos", path: "/treinamentos", icon: <GraduationCap className="w-4 h-4" /> },
    ],
  },
  {
    label: "Regulatório",
    items: [
      { label: "Comunicação Interna", path: "/comunicacao", icon: <Radio className="w-4 h-4" /> },
      { label: "Referências Normativas", path: "/referencias", icon: <Library className="w-4 h-4" /> },
      { label: "Notificação de Eventos", path: "/eventos", icon: <Siren className="w-4 h-4" /> },
      { label: "LGPD — Proteção de Dados", path: "/lgpd", icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
  {
    label: "IA & Sistema",
    items: [
      { label: "IA ONA Copilot", path: "/ia-copilot", icon: <Bot className="w-4 h-4" />, highlight: true },
      { label: "Integrações & API", path: "/integracoes", icon: <Link2 className="w-4 h-4" /> },
      { label: "Manual do Sistema", path: "/manual", icon: <BookOpen className="w-4 h-4" /> },
      { label: "Administração", path: "/administracao", icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

// Grupo exclusivo para admins — Plataforma WhiteLabel
const platformNavGroup: NavGroup = {
  label: "Plataforma",
  items: [
    { label: "Gestão de Empresas", path: "/plataforma", icon: <Store className="w-4 h-4" />, highlight: true },
    { label: "Módulos & Licenças", path: "/plataforma/modulos", icon: <Layers className="w-4 h-4" /> },
    { label: "Faturamento & Planos", path: "/plataforma/faturamento", icon: <CreditCard className="w-4 h-4" /> },
    { label: "Branding por Empresa", path: "/plataforma/branding", icon: <Palette className="w-4 h-4" /> },
  ],
};

// Grupo exclusivo para admins — Configurações Avançadas
const adminAdvancedNavGroup: NavGroup = {
  label: "Config. Avançada",
  items: [
    { label: "Usuários & Perfis", path: "/admin/users", icon: <Users className="w-4 h-4" /> },
    { label: "Unidades", path: "/admin/units", icon: <Building2 className="w-4 h-4" /> },
    { label: "Permissões", path: "/admin/permissions", icon: <KeyRound className="w-4 h-4" /> },
    { label: "Branding & White-label", path: "/admin/branding", icon: <Palette className="w-4 h-4" /> },
    { label: "Tipos de Processo", path: "/admin/process-types", icon: <ClipboardCheck className="w-4 h-4" /> },
    { label: "Prioridades", path: "/admin/priorities", icon: <Tag className="w-4 h-4" /> },
    { label: "Templates", path: "/admin/templates", icon: <LayoutTemplate className="w-4 h-4" /> },
    { label: "Campos Customizados", path: "/admin/custom-fields", icon: <SlidersHorizontal className="w-4 h-4" /> },
    { label: "Automações", path: "/admin/automations", icon: <Workflow className="w-4 h-4" /> },
    { label: "Configurações", path: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
    { label: "Logs de Auditoria", path: "/admin/logs", icon: <ListTodo className="w-4 h-4" /> },
  ],
};

// Score ONA badge colors
const onaBadgeColor = (level: number) => {
  if (level === 3) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (level === 2) return "bg-violet-500/20 text-violet-400 border-violet-500/30";
  return "bg-sky-500/20 text-sky-400 border-sky-500/30";
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { currentUser, logout } = useStore();
  const { isConnected } = useWebSocket();
  const { data: branding } = useBrandingConfig();
  const companyName = branding?.appName || "Hospital Geral";
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [globalSearch, setGlobalSearch] = useState("");

  if (!currentUser) return <>{children}</>;

  const handleLogout = () => {
    logout();
    window.location.href = "/auth";
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const navigate = (path: string) => {
    setLocation(path);
    setIsMobileOpen(false);
  };

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  const NavContent = () => (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight">QHealth One</span>
          <span className="text-[10px] font-medium text-sky-400/80 block -mt-0.5 tracking-wider uppercase">2026</span>
        </div>
        <div className="ml-auto">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-red-400"
          )} title={isConnected ? "Online" : "Offline"} />
        </div>
      </div>

      {/* ONA Score Summary */}
      <div className="mx-4 mt-4 mb-2 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Score ONA</span>
          <span className="text-[10px] text-slate-500">{companyName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map(level => (
              <div key={level} className={cn("px-2 py-0.5 rounded-md text-[11px] font-bold border", onaBadgeColor(level))}>
                N{level}: {level === 1 ? "84%" : level === 2 ? "71%" : "58%"}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full" style={{ width: "71%" }} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2 space-y-0.5 custom-scrollbar">
        {[...navGroups, ...(currentUser?.role === "admin" ? [platformNavGroup, adminAdvancedNavGroup] : [])].map((group) => {
          const isCollapsed = collapsedGroups.has(group.label);
          const isPlatform = group.label === "Plataforma" || group.label === "Config. Avançada";
          return (
            <div key={group.label} className="mb-1">
              {isPlatform && <div className="my-2 border-t border-slate-700/50" />}
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-md group"
              >
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest transition-colors",
                  isPlatform
                    ? "text-amber-500/80 group-hover:text-amber-400"
                    : "text-slate-500 group-hover:text-slate-400"
                )}>
                  {group.label}
                </span>
                <ChevronRight className={cn(
                  "w-3 h-3 text-slate-600 transition-transform duration-200",
                  !isCollapsed && "rotate-90"
                )} />
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                          active
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/20"
                            : item.highlight
                              ? "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                              : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-400 rounded-r-full" />
                        )}
                        <span className={cn(
                          "flex-shrink-0",
                          active ? "text-sky-400" : item.highlight ? "text-slate-300" : "text-slate-500 group-hover:text-slate-300"
                        )}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                        {item.highlight && !active && (
                          <Star className="w-2.5 h-2.5 text-amber-400/60 ml-auto flex-shrink-0" />
                        )}
                        {item.badge && (
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-800/60 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-slate-700">
            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs font-bold">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 capitalize truncate">{currentUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 xl:w-64 border-r border-slate-800/80 fixed h-full z-30">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 xl:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 px-4 md:px-6 flex items-center gap-4">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-slate-950 border-slate-800">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">QHealth One</span>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-lg hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Buscar módulo, requisito, documento..."
              className="bg-transparent text-sm text-slate-600 dark:text-slate-300 placeholder:text-slate-400 outline-none flex-1 min-w-0"
            />
            <kbd className="text-[10px] text-slate-400 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 hidden md:block">⌘K</kbd>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Unit selector */}
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-slate-600 dark:text-slate-400 hidden md:flex">
              <Building2 className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate">{companyName}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>

            {/* Period filter */}
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-slate-600 dark:text-slate-400 hidden md:flex">
              <Calendar className="w-3.5 h-3.5" />
              <span>Mar 2026</span>
            </Button>

            {/* AI Copilot quick access */}
            <Button
              onClick={() => navigate("/ia-copilot")}
              size="sm"
              className="h-8 gap-1.5 text-xs bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white border-0 shadow-sm hidden md:flex"
            >
              <Bot className="w-3.5 h-3.5" />
              IA Copilot
            </Button>

            <NotificationsCenter />

            {/* User avatar */}
            <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <AvatarFallback className="bg-slate-700 text-slate-300 text-xs font-bold">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950">
          {children}
        </div>
      </main>
    </div>
  );
}
