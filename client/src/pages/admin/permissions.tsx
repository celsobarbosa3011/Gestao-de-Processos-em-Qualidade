import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Search, User, Eye, Edit, Trash2 } from "lucide-react";
import { useProfiles } from "@/hooks/use-profiles";
import { useStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface UserPermission {
  userId: string;
  canEdit: boolean;
  canDelete: boolean;
  canViewDashboard: boolean;
  canViewReports: boolean;
}

export default function AdminPermissionsPage() {
  const { currentUser } = useStore();
  const { data: profiles = [], isLoading } = useProfiles();
  const [search, setSearch] = useState("");
  const [permissions, setPermissions] = useState<Record<string, UserPermission>>({});

  const nonAdminProfiles = profiles.filter(p => p.role !== 'admin');
  
  const filteredProfiles = nonAdminProfiles.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const getUserPermission = (userId: string): UserPermission => {
    return permissions[userId] || {
      userId,
      canEdit: false,
      canDelete: false,
      canViewDashboard: true,
      canViewReports: false,
    };
  };

  const updatePermission = (userId: string, key: keyof UserPermission, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [userId]: {
        ...getUserPermission(userId),
        [key]: value,
      }
    }));
    toast.success("Permissão atualizada");
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Permissões de Usuários</h1>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Permissões de Usuários</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Configure quais ações cada usuário pode realizar no sistema.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShieldCheck className="w-5 h-5" />
                Gerenciar Permissões
              </CardTitle>
              <CardDescription className="mt-1">
                Defina permissões individuais para cada usuário do sistema.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-user"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProfiles.map((profile) => {
                const perm = getUserPermission(profile.id);
                return (
                  <Card key={profile.id} className="border shadow-sm" data-testid={`user-permission-${profile.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={profile.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {profile.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">{profile.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {profile.role}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`view-dashboard-${profile.id}`}
                              checked={perm.canViewDashboard}
                              onCheckedChange={(checked) => updatePermission(profile.id, 'canViewDashboard', checked)}
                              data-testid={`switch-view-dashboard-${profile.id}`}
                            />
                            <Label htmlFor={`view-dashboard-${profile.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                              <Eye className="w-3 h-3" />
                              Dashboard
                            </Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`view-reports-${profile.id}`}
                              checked={perm.canViewReports}
                              onCheckedChange={(checked) => updatePermission(profile.id, 'canViewReports', checked)}
                              data-testid={`switch-view-reports-${profile.id}`}
                            />
                            <Label htmlFor={`view-reports-${profile.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                              <Eye className="w-3 h-3" />
                              Relatórios
                            </Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`edit-${profile.id}`}
                              checked={perm.canEdit}
                              onCheckedChange={(checked) => updatePermission(profile.id, 'canEdit', checked)}
                              data-testid={`switch-edit-${profile.id}`}
                            />
                            <Label htmlFor={`edit-${profile.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                              <Edit className="w-3 h-3" />
                              Editar
                            </Label>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`delete-${profile.id}`}
                              checked={perm.canDelete}
                              onCheckedChange={(checked) => updatePermission(profile.id, 'canDelete', checked)}
                              data-testid={`switch-delete-${profile.id}`}
                            />
                            <Label htmlFor={`delete-${profile.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                              <Trash2 className="w-3 h-3" />
                              Excluir
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Legenda de Permissões</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Eye className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Ver Dashboard</h4>
                <p className="text-xs text-muted-foreground">Permite visualizar o painel de métricas e estatísticas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Eye className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Ver Relatórios</h4>
                <p className="text-xs text-muted-foreground">Permite acessar relatórios e logs de auditoria.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Edit className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Editar Processos</h4>
                <p className="text-xs text-muted-foreground">Permite modificar informações dos processos cadastrados.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Excluir Processos</h4>
                <p className="text-xs text-muted-foreground">Permite remover processos do sistema.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
