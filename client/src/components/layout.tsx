import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useBrandingConfig } from "@/hooks/use-branding";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  FileClock,
  Palette,
  Calendar,
  GanttChart,
  Layers,
  Zap,
  FileText,
  Building2,
  ListOrdered,
  Gauge,
  ChevronDown,
  Layout as LayoutIcon,
  ShieldCheck,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatButton } from "@/components/chat";
import { NotificationsCenter } from "@/components/notifications-center";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { currentUser, logout } = useStore();
  const { data: branding } = useBrandingConfig();
  const { status: wsStatus, isConnected } = useWebSocket();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const appName = branding?.appName || 'MediFlow';
  const appInitial = appName.charAt(0).toUpperCase();

  const NavContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 pt-6">
        <div className="mb-6 flex items-center gap-2">
          {branding?.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={appName} 
              className="w-8 h-8 rounded-lg object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">{appInitial}</span>
            </div>
          )}
          <span className="text-xl font-bold tracking-tight">{appName}</span>
        </div>
        
        <nav className="space-y-1">
          <Accordion type="multiple" defaultValue={["operational", "management", "admin"]} className="w-full space-y-2">
            <AccordionItem value="operational" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Operacional
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-1 pb-2">
                <Button 
                  variant={location === '/kanban' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3 font-medium h-9"
                  onClick={() => { setLocation('/kanban'); setIsMobileOpen(false); }}
                  data-testid="nav-kanban"
                >
                  <Kanban className="w-4 h-4" />
                  Processos
                </Button>

                <Button 
                  variant={location === '/calendar' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3 font-medium h-9"
                  onClick={() => { setLocation('/calendar'); setIsMobileOpen(false); }}
                  data-testid="nav-calendar"
                >
                  <Calendar className="w-4 h-4" />
                  Calendário
                </Button>

                <Button 
                  variant={location === '/timeline' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3 font-medium h-9"
                  onClick={() => { setLocation('/timeline'); setIsMobileOpen(false); }}
                  data-testid="nav-timeline"
                >
                  <GanttChart className="w-4 h-4" />
                  Timeline
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="management" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Gestão
              </AccordionTrigger>
              <AccordionContent className="space-y-1 pt-1 pb-2">
                <Button 
                  variant={location === '/dashboard' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3 font-medium h-9"
                  onClick={() => { setLocation('/dashboard'); setIsMobileOpen(false); }}
                  data-testid="nav-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                {currentUser.role === 'admin' && (
                  <Button 
                    variant={location === '/admin/logs' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/logs'); setIsMobileOpen(false); }}
                    data-testid="nav-logs"
                  >
                    <FileClock className="w-4 h-4" />
                    Logs de Auditoria
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>

            {currentUser.role === 'admin' && (
              <AccordionItem value="admin" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Configurações
                </AccordionTrigger>
                <AccordionContent className="space-y-1 pt-1 pb-2">
                  <Button 
                    variant={location === '/admin/users' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/users'); setIsMobileOpen(false); }}
                    data-testid="nav-users"
                  >
                    <Users className="w-4 h-4" />
                    Usuários
                  </Button>
                  <Button 
                    variant={location === '/admin/units' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/units'); setIsMobileOpen(false); }}
                    data-testid="nav-units"
                  >
                    <Building2 className="w-4 h-4" />
                    Unidades
                  </Button>
                  <Button 
                    variant={location === '/admin/branding' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/branding'); setIsMobileOpen(false); }}
                    data-testid="nav-branding"
                  >
                    <Palette className="w-4 h-4" />
                    Marca / White Label
                  </Button>
                  <Button 
                    variant={location === '/admin/process-types' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/process-types'); setIsMobileOpen(false); }}
                    data-testid="nav-process-types"
                  >
                    <ListOrdered className="w-4 h-4" />
                    Tipos de Processo
                  </Button>
                  <Button 
                    variant={location === '/admin/priorities' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/priorities'); setIsMobileOpen(false); }}
                    data-testid="nav-priorities"
                  >
                    <Gauge className="w-4 h-4" />
                    Prioridades
                  </Button>
                  <Button 
                    variant={location === '/admin/custom-fields' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/custom-fields'); setIsMobileOpen(false); }}
                    data-testid="nav-custom-fields"
                  >
                    <Layers className="w-4 h-4" />
                    Campos Personalizados
                  </Button>
                  <Button 
                    variant={location === '/admin/automations' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/automations'); setIsMobileOpen(false); }}
                    data-testid="nav-automations"
                  >
                    <Zap className="w-4 h-4" />
                    Automações
                  </Button>
                  <Button 
                    variant={location === '/admin/templates' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/templates'); setIsMobileOpen(false); }}
                    data-testid="nav-templates"
                  >
                    <FileText className="w-4 h-4" />
                    Templates
                  </Button>
                  <Button 
                    variant={location === '/admin/permissions' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/permissions'); setIsMobileOpen(false); }}
                    data-testid="nav-permissions"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Permissões
                  </Button>
                  <Button 
                    variant={location === '/admin/settings' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-3 font-medium h-9"
                    onClick={() => { setLocation('/admin/settings'); setIsMobileOpen(false); }}
                    data-testid="nav-settings"
                  >
                    <Settings className="w-4 h-4" />
                    Sistema
                  </Button>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={currentUser.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground truncate capitalize">{currentUser.role}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
        
        {branding?.footerText && (
          <p className="text-[10px] text-muted-foreground/60 text-center mt-4">
            {branding.footerText}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border fixed h-full bg-sidebar z-30">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
          <div className="md:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>

          {/* Mobile App Name */}
          <div className="md:hidden flex items-center gap-2">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={appName} className="w-6 h-6 rounded object-contain" />
            ) : (
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">{appInitial}</span>
              </div>
            )}
            <span className="font-semibold text-sm">{appName}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    data-testid="websocket-status-indicator"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isConnected ? 'Conectado em tempo real' : 'Desconectado'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ChatButton />
            <NotificationsCenter />
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
