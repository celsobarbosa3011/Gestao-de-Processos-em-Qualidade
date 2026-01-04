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
import AdminSettingsPage from "@/pages/admin/settings";
import AdminLogsPage from "@/pages/admin/logs";
import AdminBrandingPage from "@/pages/admin/branding";
import CalendarPage from "@/pages/calendar";
import TimelinePage from "@/pages/timeline";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { useStore } from "@/lib/store";

// Temporary placeholders for missing pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground">
    {title} - Em desenvolvimento
  </div>
);

function Router() {
  const { currentUser } = useStore();

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

  return (
    <Layout>
      <Switch>
        <Route path="/auth">
          <Redirect to="/kanban" />
        </Route>
        <Route path="/kanban" component={KanbanPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/timeline" component={TimelinePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/branding" component={AdminBrandingPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/admin/logs" component={AdminLogsPage} />
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
