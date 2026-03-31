import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import CompetitiveIntelligence from "./pages/CompetitiveIntelligence";
import AdvancedSearch from "./pages/AdvancedSearch";
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";
import ScaledAds from "./pages/ScaledAds";
import Favorites from "./pages/Favorites";
import Monitoring from "./pages/Monitoring";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/competitive-intelligence" component={CompetitiveIntelligence} />
      <Route path="/search" component={AdvancedSearch} />
      <Route path="/performance" component={Performance} />
      <Route path="/reports" component={Reports} />
      <Route path="/ads" component={ScaledAds} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/monitoring" component={Monitoring} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
