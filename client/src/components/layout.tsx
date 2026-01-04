import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { currentUser, logout } = useStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold tracking-tight">MediFlow</span>
        </div>
        
        <nav className="space-y-2">
          {currentUser.role === 'admin' && (
            <Button 
              variant={location === '/dashboard' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-3 font-medium"
              onClick={() => setLocation('/dashboard')}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          )}
          
          <Button 
            variant={location === '/kanban' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-3 font-medium"
            onClick={() => setLocation('/kanban')}
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
                onClick={() => setLocation('/admin/users')}
              >
                <Users className="w-4 h-4" />
                Usuários
              </Button>
              <Button 
                variant={location === '/admin/settings' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3 font-medium"
                onClick={() => setLocation('/admin/settings')}
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={currentUser.avatar} />
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
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
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
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="md:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </Button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
