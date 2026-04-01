import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
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
import { useEffect } from "react";

// Componente para proteger rotas privadas
function PrivateRoute({ path, component: Component }: { path: string; component: React.ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return <Route path={path} component={Component} />;
}

// Componente para rotas públicas (Login/Register) que redirecionam se já logado
function PublicRoute({ path, component: Component }: { path: string; component: React.ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) return <LoadingScreen />;
  return <Route path={path} component={Component} />;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <PublicRoute path="/login" component={Login} />
      <PublicRoute path="/register" component={Register} />
      
      {/* Rotas Protegidas */}
      <PrivateRoute path="/dashboard" component={Dashboard} />
      <PrivateRoute path="/settings" component={Settings} />
      <PrivateRoute path="/competitive-intelligence" component={CompetitiveIntelligence} />
      <PrivateRoute path="/search" component={AdvancedSearch} />
      <PrivateRoute path="/performance" component={Performance} />
      <PrivateRoute path="/reports" component={Reports} />
      <PrivateRoute path="/ads" component={ScaledAds} />
      <PrivateRoute path="/favorites" component={Favorites} />
      <PrivateRoute path="/monitoring" component={Monitoring} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
