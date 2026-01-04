import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useBrandingConfig } from "@/hooks/use-branding";
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Menu,
  FileClock,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatButton } from "@/components/chat";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { currentUser, logout } = useStore();
  const { data: branding } = useBrandingConfig();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const appName = branding?.appName || 'MediFlow';
  const appInitial = appName.charAt(0).toUpperCase();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
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
        
        <nav className="space-y-2">
          {currentUser.role === 'admin' && (
            <Button 
              variant={location === '/dashboard' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-3 font-medium"
              onClick={() => { setLocation('/dashboard'); setIsMobileOpen(false); }}
              data-testid="nav-dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          )}
          
          <Button 
            variant={location === '/kanban' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-medium"
            onClick={() => { setLocation('/kanban'); setIsMobileOpen(false); }}
            data-testid="nav-kanban"
          >
            <Kanban className="w-4 h-4" />
            Processos
          </Button>

          {currentUser.role === 'admin' && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </div>
              <Button 
                variant={location === '/admin/users' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3 font-medium"
                onClick={() => { setLocation('/admin/users'); setIsMobileOpen(false); }}
                data-testid="nav-users"
              >
                <Users className="w-4 h-4" />
                Usuários
              </Button>
              <Button 
                variant={location === '/admin/branding' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3 font-medium"
                onClick={() => { setLocation('/admin/branding'); setIsMobileOpen(false); }}
                data-testid="nav-branding"
              >
                <Palette className="w-4 h-4" />
                Marca / White Label
              </Button>
              <Button 
                variant={location === '/admin/settings' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3 font-medium"
                onClick={() => { setLocation('/admin/settings'); setIsMobileOpen(false); }}
                data-testid="nav-settings"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
              <Button 
                variant={location === '/admin/logs' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3 font-medium"
                onClick={() => { setLocation('/admin/logs'); setIsMobileOpen(false); }}
                data-testid="nav-logs"
              >
                <FileClock className="w-4 h-4" />
                Logs de Auditoria
              </Button>
            </>
          )}
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
            <ChatButton />
            <Button variant="ghost" size="icon" className="relative text-muted-foreground" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
