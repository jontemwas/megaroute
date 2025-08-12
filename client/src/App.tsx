import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CaptivePortal from "@/pages/captive-portal";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminPlans from "@/pages/admin-plans";
import AdminUsers from "@/pages/admin-users";
import AdminPayments from "@/pages/admin-payments";
import AdminRouters from "@/pages/admin-routers";
import AdminReports from "@/pages/admin-reports";
import AdminSettings from "@/pages/admin-settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CaptivePortal} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/payments" component={AdminPayments} />
      <Route path="/admin/routers" component={AdminRouters} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
