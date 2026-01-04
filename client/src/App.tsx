import { Switch, Route, Redirect, useLocation } from "wouter";
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
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function Router() {
  const { currentUser } = useStore();
  const [isReady, setIsReady] = useState(false);
  const [, setLocation] = useLocation();

  // Wait for store to be ready on client side
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Show loading while waiting for hydration
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - show auth page
  if (!currentUser) {
    return <AuthPage />;
  }

  // Needs to complete profile
  if (currentUser.mustChangePassword && !currentUser.profileCompleted) {
    return <ProfileCompletionPage />;
  }

  // Logged in - show main app
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
