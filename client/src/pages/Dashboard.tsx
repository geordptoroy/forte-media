import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();

  const stats = [
    { label: "Anúncios Analisados", value: "12,482", icon: BarChart3, trend: "+12%" },
    { label: "Anúncios Favoritos", value: "156", icon: Heart, trend: "+5%" },
    { label: "Em Monitoramento", value: "42", icon: Eye, trend: "Estável" },
    { label: "Meta API Status", value: credentialsStatus.data?.isValid ? "Ativo" : "Inativo", icon: ShieldCheck, status: credentialsStatus.data?.isValid },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Olá, {user?.name?.split(" ")[0] || "Usuário"}
            </h1>
            <p className="text-gray-500 font-medium">
              Aqui está o resumo da sua inteligência competitiva hoje.
            </p>
          </div>
          
          {!credentialsStatus.data?.hasCredentials && (
            <Button
              onClick={() => setLocation("/settings")}
              className="btn-premium flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Configurar Meta API
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="card-premium-hover bg-white/[0.02] border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                {stat.trend && (
                  <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    {stat.trend}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white">
                  {stat.value}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity / Quick Search */}
          <Card className="lg:col-span-2 card-premium bg-white/[0.02] border-white/5 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400" />
                Tendências Globais
              </h3>
              <Button variant="link" className="text-white hover:text-gray-300 text-xs font-bold uppercase tracking-wider">
                Ver Tudo
              </Button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden border border-white/10">
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-500">AD</div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-primary-foreground transition-colors">Campanha de Escala #{i+1042}</p>
                      <p className="text-xs text-gray-500">Meta Ad Library • Há 2 horas</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </Card>

          {/* Integration Status */}
          <Card className="card-premium bg-white/[0.02] border-white/5 p-8 flex flex-col">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Status da API
            </h3>
            
            <div className="flex-1 space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conexão</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${credentialsStatus.data?.isValid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {credentialsStatus.data?.isValid ? 'Estável' : 'Erro'}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {credentialsStatus.data?.isValid 
                    ? "Sua conta está sincronizada com a Meta Marketing API." 
                    : "Sua conexão com a Meta expirou ou não foi configurada."}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Próximos Passos</p>
                <ul className="text-xs space-y-2 text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    Explorar novos criativos escalados
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    Exportar relatório de performance semanal
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                    Monitorar 5 novos concorrentes
                  </li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => setLocation("/settings")}
              variant="outline"
              className="mt-8 border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
            >
              Gerenciar API
            </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
