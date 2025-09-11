import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { RtlProvider } from "@/hooks/use-rtl";
import BrandNav from "@/components/BrandNav";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Events from "@/pages/Events";
import Impacts from "@/pages/Impacts";
import Tasks from "@/pages/Tasks";
import Watchlist from "@/pages/Watchlist";
import Assets from "@/pages/Assets";
import Reference from "@/pages/Reference";
import Settings from "@/pages/Settings";

function AuthenticatedRoutes() {
  // Skip authentication - go directly to main app
  return (
    <div className="min-h-screen bg-background">
      <BrandNav />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/events" component={Events} />
        <Route path="/impacts" component={Impacts} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/watchlist" component={Watchlist} />
        <Route path="/assets" component={Assets} />
        <Route path="/reference" component={Reference} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RtlProvider>
          <AuthProvider>
            <AuthenticatedRoutes />
            <Toaster />
          </AuthProvider>
        </RtlProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
