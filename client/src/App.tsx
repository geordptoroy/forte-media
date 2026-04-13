import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Minerador from "./pages/Minerador";
import Settings from "./pages/Settings";
import LandingPage from "./pages/LandingPage";
import { type ComponentType } from "react";

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          <span className="text-black font-black text-xs tracking-tighter">FM</span>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white/40" />
      </div>
    </div>
  );
}

function PrivateRoute({ component: Component, ...rest }: { path: string; component: ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <Route {...rest} >
      {isAuthenticated ? <Component /> : <Redirect to="/" />}
    </Route>
  );
}

function PublicRoute({ component: Component, ...rest }: { path: string; component: ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <Route {...rest} >
      {!isAuthenticated ? <Component /> : <Redirect to="/minerador" />}
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <PublicRoute path="/" component={LandingPage} />
      <PublicRoute path="/login" component={Login} />
      <PublicRoute path="/register" component={Register} />

      {/* A página Minerador agora é a página principal do Dashboard */}
      <PrivateRoute path="/minerador" component={Minerador} />
      
      {/* Redirecionar rotas antigas para /minerador */}
      <Route path="/escalados">
        <Redirect to="/minerador" />
      </Route>
      <Route path="/dashboard">
        <Redirect to="/minerador" />
      </Route>

      <PrivateRoute path="/settings" component={Settings} />

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
