import { Link } from "wouter";
import { Search, Pickaxe, Settings, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <span className="text-black font-black text-lg tracking-tighter">FM</span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">Forte Media</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="text-sm font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors px-4 py-2">
                Entrar
              </button>
            </Link>
            <Link href="/register">
              <button className="text-sm font-black uppercase tracking-widest bg-white text-black px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
                Criar Conta
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
                <Zap className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conectado à Meta API v21.0</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic">
                A Mineração de Anúncios <span className="text-zinc-500">Definitiva.</span>
              </h1>
              
              <p className="text-xl text-zinc-400 font-medium leading-relaxed mb-12 max-w-2xl">
                Acesse a biblioteca da Meta com filtros profissionais. Encontre criativos, monitore tendências e organize seus favoritos em uma interface premium feita para alta performance.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link href="/register">
                  <button className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] group">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="pl-6 text-sm font-black text-zinc-500 uppercase tracking-widest">
                    +1.000 usuários ativos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-6 group">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                  <Pickaxe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Minerador Avançado</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  Filtre por país, formato de mídia, plataforma, data e muito mais. Busca direta na API oficial sem algoritmos que escondem resultados.
                </p>
              </div>

              <div className="space-y-6 group">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Escalados & Favoritos</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  Salve os melhores anúncios em sua biblioteca pessoal. Organize referências de criativos e copies vencedoras com um clique.
                </p>
              </div>

              <div className="space-y-6 group">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Configuração Total</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  Conecte sua própria chave de API da Meta para ter total autonomia e velocidade nas requisições sem limites compartilhados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-sm">FM</span>
              </div>
              <span className="font-black uppercase italic tracking-tighter">Forte Media</span>
            </div>
            <p className="text-zinc-600 text-sm font-medium">
              © 2026 Forte Media. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
