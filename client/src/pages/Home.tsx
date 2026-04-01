import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Zap,
  BarChart3,
  Search,
  Eye,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">FM</span>
            </div>
            <span className="font-semibold text-lg text-foreground">FORTE MEDIA</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation("/login")}
              variant="ghost"
              className="text-foreground hover:bg-white/10"
            >
              Entrar
            </Button>
            <Button
              onClick={() => setLocation("/register")}
              className="btn-premium"
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span className="text-sm font-medium text-white">
              Inteligência Competitiva Profissional
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Domine o Mercado de{" "}
            <span className="gradient-text">Anúncios Meta</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Analise anúncios competitivos em tempo real, monitore performance de
            campanhas e tome decisões baseadas em dados com FORTE MEDIA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button
              onClick={() => setLocation("/register")}
              className="btn-premium"
              size="lg"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4 ml-2" strokeWidth={2.5} />
            </Button>
            <Button
              size="lg"
              className="btn-premium-outline"
            >
              Ver Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-16">
            <div className="card-premium">
              <div className="text-3xl font-bold text-white mb-2">
                10M+
              </div>
              <p className="text-sm text-muted-foreground">Anúncios Analisados</p>
            </div>
            <div className="card-premium">
              <div className="text-3xl font-bold text-white mb-2">
                500+
              </div>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            </div>
            <div className="card-premium">
              <div className="text-3xl font-bold text-white mb-2">
                99.9%
              </div>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 border-t border-border">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para dominar a inteligência competitiva
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card-premium-hover">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Busca Avançada
              </h3>
              <p className="text-sm text-muted-foreground">
                Encontre anúncios competitivos com filtros poderosos por país,
                tipo, período e gasto estimado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-premium-hover">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Monitoramento em Tempo Real
              </h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe anúncios competitivos e receba alertas quando mudanças
                importantes ocorrem.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-premium-hover">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Dashboard de Performance
              </h3>
              <p className="text-sm text-muted-foreground">
                Visualize métricas detalhadas de suas campanhas Meta em um único
                lugar.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-premium-hover">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Análise de Tendências
              </h3>
              <p className="text-sm text-muted-foreground">
                Identifique padrões e tendências nos anúncios mais escalados do
                mercado.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card-premium-hover">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Segurança de Nível Empresarial
              </h3>
              <p className="text-sm text-muted-foreground">
                Credenciais criptografadas com AES-256-GCM e conformidade LGPD.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card-premium-hover">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                API Integrada
              </h3>
              <p className="text-sm text-muted-foreground">
                Integração direta com Meta Ad Library e Marketing APIs para dados
                em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 border-t border-border">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Acesse FORTE MEDIA agora e comece a analisar anúncios competitivos.
          </p>
          <Button
            onClick={() => setLocation("/register")}
            className="btn-premium"
            size="lg"
          >
            Criar Conta Agora
            <ArrowRight className="w-4 h-4 ml-2" strokeWidth={2.5} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            © 2026 FORTE MEDIA. Todos os direitos reservados. | Desenvolvido com
            ❤️ para profissionais de marketing digital.
          </p>
        </div>
      </footer>
    </div>
  );
}
