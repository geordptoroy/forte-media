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
    { label: "Anúncios Analisados", value: "---", icon: BarChart3, trend: "" }, // Placeholder, will be real data
    { label: "Anúncios Favoritos", value: "---", icon: Heart, trend: "" }, // Placeholder, will be real data
    { label: "Em Monitoramento", value: "---", icon: Eye, trend: "" }, // Placeholder, will be real data
    { label: "Meta API Status", value: credentialsStatus.data?.hasCredentials ? "Ativo" : "Inativo", icon: ShieldCheck, status: credentialsStatus.data?.hasCredentials },
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

          {/* Adicionar um alerta se as credenciais não estiverem configuradas */}
          {!credentialsStatus.data?.hasCredentials && (
            <Card className="card-premium bg-yellow-500/5 border-yellow-500/20 p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-yellow-500">Credenciais Meta Ausentes</p>
                <p className="text-xs text-gray-400 mt-1">Por favor, configure suas credenciais Meta em <span className="text-primary-foreground cursor-pointer" onClick={() => setLocation("/settings")}>Configurações</span> para acessar todos os recursos.</p>
              </div>
            </Card>
          )}

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
            
            {/* Placeholder for real trend data */}
            <div className="space-y-4">
              <Card className="card-premium bg-white/[0.01] border-white/5 p-6 text-center">
                <p className="text-sm text-gray-500">Nenhuma tendência disponível. Conecte sua conta Meta para ver dados reais.</p>
              </Card>
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
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${credentialsStatus.data?.hasCredentials ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {credentialsStatus.data?.hasCredentials ? 'Estável' : 'Erro'}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {credentialsStatus.data?.hasCredentials 
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
