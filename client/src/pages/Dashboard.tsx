import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const navigationItems = [
    {
      label: "Dashboard",
      icon: BarChart3,
      href: "/dashboard",
      active: true,
    },
    {
      label: "Inteligência Competitiva",
      icon: TrendingUp,
      href: "/competitive-intelligence",
    },
    {
      label: "Performance",
      icon: Eye,
      href: "/performance",
    },
    {
      label: "Favoritos",
      icon: Heart,
      href: "/favorites",
    },
    {
      label: "Configurações",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border/50 transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img 
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663498105862/CQ89RPbzuKzdf7EqzqtoG8/forte-media-logo-A56WY8ozwSWWWprfdhedVS.webp" 
                alt="FORTE MEDIA"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-foreground">FORTE</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" strokeWidth={2} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
            {sidebarOpen && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Welcome Card */}
          <Card className="border-border/50 p-8 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Bem-vindo, {user?.name?.split(" ")[0]}!
                </h2>
                <p className="text-muted-foreground">
                  {credentialsStatus.data?.hasCredentials
                    ? "Suas credenciais Meta estão configuradas. Comece a analisar anúncios competitivos."
                    : "Configure suas credenciais Meta para começar a usar FORTE MEDIA."}
                </p>
              </div>
              {!credentialsStatus.data?.hasCredentials && (
                <Button
                  onClick={() => setLocation("/settings")}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Configurar Meta API
                </Button>
              )}
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Anúncios Analisados
                  </p>
                  <p className="text-3xl font-bold text-foreground">0</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
              </div>
            </Card>

            <Card className="border-border/50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Favoritos
                  </p>
                  <p className="text-3xl font-bold text-foreground">0</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
              </div>
            </Card>

            <Card className="border-border/50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Em Monitoramento
                  </p>
                  <p className="text-3xl font-bold text-foreground">0</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
              </div>
            </Card>

            <Card className="border-border/50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Status API
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {credentialsStatus.data?.isValid ? "✓" : "✗"}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-border/50 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Ações Rápidas
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => setLocation("/competitive-intelligence")}
                variant="outline"
                className="border-border hover:bg-muted"
              >
                <TrendingUp className="w-4 h-4 mr-2" strokeWidth={2} />
                Buscar Anúncios
              </Button>
              <Button
                onClick={() => setLocation("/performance")}
                variant="outline"
                className="border-border hover:bg-muted"
              >
                <BarChart3 className="w-4 h-4 mr-2" strokeWidth={2} />
                Ver Performance
              </Button>
              <Button
                onClick={() => setLocation("/settings")}
                variant="outline"
                className="border-border hover:bg-muted"
              >
                <Settings className="w-4 h-4 mr-2" strokeWidth={2} />
                Configurações
              </Button>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="border-border/50 p-6 bg-muted/30">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Dica: Configure suas credenciais Meta
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para acessar dados de anúncios competitivos e métricas de performance,
              você precisa conectar sua conta Meta. Vá para Configurações para
              adicionar seu Access Token.
            </p>
            <Button
              onClick={() => setLocation("/settings")}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Ir para Configurações
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
