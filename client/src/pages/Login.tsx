import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn, Zap, Shield, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663498105862/CQ89RPbzuKzdf7EqzqtoG8/forte-media-logo-A56WY8ozwSWWWprfdhedVS.webp" 
              alt="FORTE MEDIA Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">FORTE MEDIA</h1>
          <p className="text-muted-foreground text-sm">
            Inteligência Competitiva para Anúncios Meta
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95 mb-8 p-8 animate-slide-in-up">
          <div className="space-y-6">
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart3 className="w-3 h-3 text-primary" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Análise de Anúncios Competitivos
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monitore estratégias de concorrentes em tempo real
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-primary" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Dashboard de Performance
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Métricas detalhadas de suas campanhas Meta
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 text-primary" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Segurança de Nível Empresarial
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Credenciais criptografadas com AES-256-GCM
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">
                  Comece agora
                </span>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-300 font-medium text-white"
            >
              <LogIn className="w-4 h-4 mr-2" strokeWidth={2.5} />
              Conectar com Manus
            </Button>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center">
              Ao conectar, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">
                Termos de Serviço
              </a>
            </p>
          </div>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center space-y-2 text-xs text-muted-foreground">
          <p>Confiado por profissionais de marketing digital</p>
          <div className="flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" strokeWidth={2.5} />
            <span>Dados 100% seguros e criptografados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
