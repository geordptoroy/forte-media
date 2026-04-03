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
import { useEffect, type ComponentType } from "react";

/**
 * Tela de carregamento exibida enquanto o estado de autenticacao e verificado.
 * Inclui o logo da marca para manter consistencia visual.
 */
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
          <span className="text-black font-bold text-xs">FM</span>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white/40" />
      </div>
    </div>
  );
}

/**
 * Protege rotas privadas: redireciona para /login se nao autenticado.
 * Usa wouter de forma consistente (sem window.location.href).
 */
function PrivateRoute({
  path,
  component: Component,
}: {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
}) {
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

/**
 * Rotas publicas (Login/Register): redireciona para /dashboard se ja autenticado.
 */
function PublicRoute({
  path,
  component: Component,
}: {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
}) {
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

function Router() {
  return (
    <Switch>
      {/* Rota publica principal */}
      <Route path="/" component={Home} />

      {/* Rotas de autenticacao */}
      <PublicRoute path="/login" component={Login} />
      <PublicRoute path="/register" component={Register} />

      {/* Rotas protegidas */}
      <PrivateRoute path="/dashboard" component={Dashboard} />
      <PrivateRoute path="/settings" component={Settings} />
      <PrivateRoute path="/competitive-intelligence" component={CompetitiveIntelligence} />
      <PrivateRoute path="/search" component={AdvancedSearch} />
      <PrivateRoute path="/performance" component={Performance} />
      <PrivateRoute path="/reports" component={Reports} />
      <PrivateRoute path="/ads" component={ScaledAds} />
      <PrivateRoute path="/favorites" component={Favorites} />
      <PrivateRoute path="/monitoring" component={Monitoring} />

      {/* Fallback 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" theme="dark" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
