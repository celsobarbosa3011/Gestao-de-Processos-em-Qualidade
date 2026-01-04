import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import AuthPage from "@/pages/auth";
import KanbanPage from "@/pages/kanban";
import DashboardPage from "@/pages/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminUnitsPage from "@/pages/admin/units";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminLogsPage from "@/pages/admin/logs";
import AdminBrandingPage from "@/pages/admin/branding";
import AdminCustomFieldsPage from "@/pages/admin/custom-fields";
import AdminAutomationsPage from "@/pages/admin/automations";
import AdminTemplatesPage from "@/pages/admin/templates";
import CalendarPage from "@/pages/calendar";
import TimelinePage from "@/pages/timeline";
import ProfileCompletionPage from "@/pages/profile-completion";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

// Temporary placeholders for missing pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground">
    {title} - Em desenvolvimento
  </div>
);

function Router() {
  const { currentUser, _hasHydrated } = useStore();

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/:rest*">
          <Redirect to="/auth" />
        </Route>
      </Switch>
    );
  }

  if (currentUser.mustChangePassword && !currentUser.profileCompleted) {
    return (
      <Switch>
        <Route path="/profile-completion" component={ProfileCompletionPage} />
        <Route path="/:rest*">
          <Redirect to="/profile-completion" />
        </Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/auth">
          <Redirect to="/kanban" />
        </Route>
        <Route path="/profile-completion">
          <Redirect to="/kanban" />
        </Route>
        <Route path="/kanban" component={KanbanPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/timeline" component={TimelinePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/units" component={AdminUnitsPage} />
        <Route path="/admin/branding" component={AdminBrandingPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/admin/logs" component={AdminLogsPage} />
        <Route path="/admin/custom-fields" component={AdminCustomFieldsPage} />
        <Route path="/admin/automations" component={AdminAutomationsPage} />
        <Route path="/admin/templates" component={AdminTemplatesPage} />
        <Route path="/">
          <Redirect to={currentUser.role === 'admin' ? "/dashboard" : "/kanban"} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ChangePasswordModal />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
