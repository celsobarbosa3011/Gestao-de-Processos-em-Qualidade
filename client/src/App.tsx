import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import AuthPage from "@/pages/auth";
import ProfileCompletionPage from "@/pages/profile-completion";
import CompleteProfilePage from "@/pages/complete-profile";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

// ============================================================
// QHEALTH ONE 2026 — MÓDULOS MVP
// ============================================================

// Módulo 1 — Home Executiva
const HomeExecutiva = lazy(() => import("@/pages/home-executiva"));

// Módulo 2 — Diagnóstico
const Diagnostico = lazy(() => import("@/pages/diagnostico"));

// Módulo 3 — Matriz GUT
const MatrizGUT = lazy(() => import("@/pages/matriz-gut"));

// Módulo 4 — Acreditação ONA 2026
const AcreditacaoONA = lazy(() => import("@/pages/acreditacao-ona"));

// Módulo 5 — Unidades de Negócio
const UnidadesNegocio = lazy(() => import("@/pages/unidades-negocio"));

// Módulo 6 — Processos
const Processos = lazy(() => import("@/pages/processos"));

// Módulo 7 — Riscos
const Riscos = lazy(() => import("@/pages/riscos"));

// Módulo 8 — Governança Clínica
const GovernancaClinical = lazy(() => import("@/pages/governanca-clinica"));

// Módulo 9 — Comissões
const Comissoes = lazy(() => import("@/pages/comissoes"));

// Módulo 10 — Indicadores
const Indicadores = lazy(() => import("@/pages/indicadores"));

// Módulo 11 — Jornada do Paciente
const JornadaPaciente = lazy(() => import("@/pages/jornada-paciente"));

// Módulo 12 — Protocolos Gerenciados
const Protocolos = lazy(() => import("@/pages/protocolos"));

// Módulo 13 — Planejamento BSC
const PlanejamentoBSC = lazy(() => import("@/pages/planejamento-bsc"));

// Módulo 14 — Políticas & Regimentos
const Politicas = lazy(() => import("@/pages/politicas"));

// Módulo 15 — Documentos & Evidências
const Documentos = lazy(() => import("@/pages/documentos"));

// Módulo 16 — Treinamentos
const Treinamentos = lazy(() => import("@/pages/treinamentos"));

// Módulo 17 — Gestão Operacional
const GestaoOperacional = lazy(() => import("@/pages/gestao-operacional"));

// Módulo 18 — Comunicação Interna
const Comunicacao = lazy(() => import("@/pages/comunicacao"));

// Módulo 19 — Referências Normativas
const Referencias = lazy(() => import("@/pages/referencias"));

// Módulo 20 — Notificação de Eventos
const Eventos = lazy(() => import("@/pages/eventos"));

// Módulo 21 — IA ONA Copilot
const IACopilot = lazy(() => import("@/pages/ia-copilot"));

// Módulo 22 — Administração
const Administracao = lazy(() => import("@/pages/administracao"));

// Módulo Integrações & API (standalone)
const Integracoes = lazy(() => import("@/pages/integracoes"));

// Plataforma WhiteLabel — Super Admin
const Plataforma = lazy(() => import("@/pages/plataforma"));

// Admin pages — gerenciamento avançado
const AdminUsersPage = lazy(() => import("@/pages/admin/users"));
const AdminUnitsPage = lazy(() => import("@/pages/admin/units"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/settings"));
const AdminLogsPage = lazy(() => import("@/pages/admin/logs"));
const AdminBrandingPage = lazy(() => import("@/pages/admin/branding"));
const AdminPermissionsPage = lazy(() => import("@/pages/admin/permissions"));
const AdminAutomationsPage = lazy(() => import("@/pages/admin/automations"));
const AdminCustomFieldsPage = lazy(() => import("@/pages/admin/custom-fields"));
const AdminPrioritiesPage = lazy(() => import("@/pages/admin/priorities"));
const AdminProcessTypesPage = lazy(() => import("@/pages/admin/process-types"));
const AdminTemplatesPage = lazy(() => import("@/pages/admin/templates"));

// Page loading skeleton
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center animate-pulse">
        <Loader2 className="w-5 h-5 text-white animate-spin" />
      </div>
      <p className="text-sm text-slate-500">Carregando módulo...</p>
    </div>
  </div>
);

function Router() {
  const { currentUser, _hasHydrated } = useStore();

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-xl shadow-sky-500/20">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-slate-400 text-sm font-medium">QHealth One 2026</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (window.location.pathname !== "/auth") {
      window.location.href = "/auth";
      return null;
    }
    return <AuthPage />;
  }

  if (currentUser.mustChangePassword) {
    if (window.location.pathname !== "/profile-completion") {
      window.location.href = "/profile-completion";
      return null;
    }
    return <ProfileCompletionPage />;
  }

  if (currentUser.profileCompleted === false) {
    if (window.location.pathname !== "/completar-perfil") {
      window.location.href = "/completar-perfil";
      return null;
    }
    return <CompleteProfilePage />;
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Auth redirects */}
          <Route path="/auth"><Redirect to="/home" /></Route>
          <Route path="/profile-completion"><Redirect to="/home" /></Route>
          <Route path="/completar-perfil"><Redirect to="/home" /></Route>

          {/* ============================================================ */}
          {/* QHEALTH ONE 2026 — MVP MODULES */}
          {/* ============================================================ */}

          {/* Módulo 1 — Home Executiva */}
          <Route path="/home" component={HomeExecutiva} />

          {/* Módulo 2 — Diagnóstico */}
          <Route path="/diagnostico" component={Diagnostico} />
          <Route path="/diagnostico/:id" component={Diagnostico} />

          {/* Módulo 3 — Matriz GUT */}
          <Route path="/matriz-gut" component={MatrizGUT} />

          {/* Módulo 4 — Acreditação ONA 2026 */}
          <Route path="/acreditacao-ona" component={AcreditacaoONA} />
          <Route path="/acreditacao-ona/:tab" component={AcreditacaoONA} />

          {/* Módulo 5 — Unidades de Negócio */}
          <Route path="/unidades-negocio" component={UnidadesNegocio} />
          <Route path="/unidades-negocio/:id" component={UnidadesNegocio} />

          {/* Módulo 6 — Processos */}
          <Route path="/processos" component={Processos} />
          <Route path="/kanban" component={Processos} /> {/* backwards compat */}

          {/* Módulo 7 — Riscos */}
          <Route path="/riscos" component={Riscos} />

          {/* Módulo 8 — Governança Clínica */}
          <Route path="/governanca-clinica" component={GovernancaClinical} />

          {/* Módulo 9 — Comissões */}
          <Route path="/comissoes" component={Comissoes} />
          <Route path="/comissoes/:id" component={Comissoes} />

          {/* Módulo 10 — Indicadores */}
          <Route path="/indicadores" component={Indicadores} />

          {/* Módulo 11 — Jornada do Paciente */}
          <Route path="/jornada-paciente" component={JornadaPaciente} />

          {/* Módulo 12 — Protocolos Gerenciados */}
          <Route path="/protocolos" component={Protocolos} />
          <Route path="/protocolos/:id" component={Protocolos} />

          {/* Módulo 13 — Planejamento BSC */}
          <Route path="/planejamento-bsc" component={PlanejamentoBSC} />

          {/* Módulo 14 — Políticas & Regimentos */}
          <Route path="/politicas" component={Politicas} />

          {/* Módulo 15 — Documentos & Evidências */}
          <Route path="/documentos" component={Documentos} />
          <Route path="/documentos/:id" component={Documentos} />

          {/* Módulo 16 — Treinamentos */}
          <Route path="/treinamentos" component={Treinamentos} />

          {/* Módulo 17 — Gestão Operacional */}
          <Route path="/gestao-operacional" component={GestaoOperacional} />

          {/* Módulo 18 — Comunicação Interna */}
          <Route path="/comunicacao" component={Comunicacao} />

          {/* Módulo 19 — Referências Normativas */}
          <Route path="/referencias" component={Referencias} />

          {/* Módulo 20 — Notificação de Eventos */}
          <Route path="/eventos" component={Eventos} />
          <Route path="/eventos/:id" component={Eventos} />

          {/* Módulo 21 — IA ONA Copilot */}
          <Route path="/ia-copilot" component={IACopilot} />

          {/* Módulo 22 — Administração */}
          <Route path="/administracao" component={Administracao} />

          {/* Integrações & API — módulo standalone */}
          <Route path="/integracoes" component={Integracoes} />

          {/* Plataforma WhiteLabel — gestão multi-tenant */}
          <Route path="/plataforma" component={Plataforma} />
          <Route path="/plataforma/modulos" component={Plataforma} />
          <Route path="/plataforma/faturamento" component={Plataforma} />
          <Route path="/plataforma/branding" component={Plataforma} />

          {/* Admin routes — gerenciamento avançado */}
          <Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/admin/units" component={AdminUnitsPage} />
          <Route path="/admin/settings" component={AdminSettingsPage} />
          <Route path="/admin/logs" component={AdminLogsPage} />
          <Route path="/admin/branding" component={AdminBrandingPage} />
          <Route path="/admin/permissions" component={AdminPermissionsPage} />
          <Route path="/admin/automations" component={AdminAutomationsPage} />
          <Route path="/admin/custom-fields" component={AdminCustomFieldsPage} />
          <Route path="/admin/priorities" component={AdminPrioritiesPage} />
          <Route path="/admin/process-types" component={AdminProcessTypesPage} />
          <Route path="/admin/templates" component={AdminTemplatesPage} />

          {/* Root redirect */}
          <Route path="/">
            <Redirect to="/home" />
          </Route>

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster richColors position="top-right" />
        <ChangePasswordModal />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
