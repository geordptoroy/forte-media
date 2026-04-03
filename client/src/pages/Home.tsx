import { Button } from "@/components/ui/button";
import {
  Search,
  Eye,
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

const features = [
  {
    icon: Search,
    title: "Busca Avancada",
    description:
      "Encontre anuncios competitivos com filtros poderosos por pais, tipo, periodo e gasto estimado.",
  },
  {
    icon: Eye,
    title: "Monitoramento em Tempo Real",
    description:
      "Acompanhe anuncios competitivos e receba alertas quando mudancas importantes ocorrem.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de Performance",
    description:
      "Visualize metricas detalhadas de suas campanhas Meta em um unico lugar.",
  },
  {
    icon: TrendingUp,
    title: "Analise de Tendencias",
    description:
      "Identifique padroes e tendencias nos anuncios mais escalados do mercado.",
  },
  {
    icon: Shield,
    title: "Seguranca de Nivel Empresarial",
    description:
      "Credenciais criptografadas com AES-256-GCM e conformidade LGPD.",
  },
  {
    icon: Zap,
    title: "API Integrada",
    description:
      "Integracao direta com Meta Ad Library e Marketing APIs para dados em tempo real.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-black/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-xs">FM</span>
            </div>
            <span className="font-bold text-lg tracking-tight">FORTE MEDIA</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/login")}
              className="text-gray-400 hover:text-white text-sm font-medium"
            >
              Entrar
            </Button>
            <Button
              onClick={() => setLocation("/register")}
              className="bg-white text-black hover:bg-gray-100 text-sm font-bold"
            >
              Comecar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-32 px-4 text-center">
        <div className="container max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Plataforma de Inteligencia Competitiva
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
            FORTE MEDIA
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Analise anuncios competitivos, monitore concorrentes e otimize suas
            campanhas com inteligencia competitiva em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/register")}
              className="bg-white text-black hover:bg-gray-100 text-sm font-bold px-8 h-12"
            >
              Comecar Gratuitamente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-sm font-medium h-12 px-8"
            >
              Ja tenho conta
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-4">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tudo que voce precisa
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Uma suite completa de ferramentas para analise e inteligencia competitiva
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                  <feature.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para comecar?
          </h2>
          <p className="text-gray-500 mb-10">
            Acesse FORTE MEDIA agora e comece a analisar anuncios competitivos.
          </p>
          <Button
            onClick={() => setLocation("/register")}
            className="bg-white text-black hover:bg-gray-100 text-sm font-bold px-8 h-12"
          >
            Criar Conta Agora
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="container text-center text-xs text-gray-600 space-y-4">
          <div className="flex justify-center gap-6">
            <button 
              onClick={() => setLocation("/privacy-policy")}
              className="hover:text-white transition-colors"
            >
              Política de Privacidade
            </button>
            <button className="hover:text-white transition-colors">Termos de Uso</button>
            <button className="hover:text-white transition-colors">Suporte</button>
          </div>
          <p>
            2026 FORTE MEDIA. Todos os direitos reservados. Desenvolvido para
            profissionais de marketing digital.
          </p>
        </div>
      </footer>
    </div>
  );
}
