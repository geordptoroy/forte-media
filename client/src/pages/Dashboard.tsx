import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { CredentialsWarning } from "@/components/CredentialsWarning";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMetaCredentials } from "@/hooks/useMetaCredentials";
import { useFavoriteAds, useMonitoredAds } from "@/hooks/useAds";
import { Globe, Zap, Heart, Eye, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const credentials = useMetaCredentials();
  const favorites = useFavoriteAds();
  const monitored = useMonitoredAds();

  const favoritesCount = favorites.data?.favorites?.length ?? 0;
  const monitoredCount = monitored.data?.monitored?.length ?? 0;
  const activeMonitored = monitored.data?.monitored?.filter(
    (m) => m.monitoringStatus === "active"
  ).length ?? 0;

  const stats = [
    {
      icon: Heart,
      label: "Favoritos",
      value: favorites.isLoading ? "..." : String(favoritesCount),
      trend: favoritesCount > 0 ? `${favoritesCount} salvos` : undefined,
    },
    {
      icon: Eye,
      label: "Monitorados",
      value: monitored.isLoading ? "..." : String(monitoredCount),
      trend: activeMonitored > 0 ? `${activeMonitored} ativos` : undefined,
    },
    {
      icon: Globe,
      label: "Status API",
      value: credentials.isLoading ? "..." : credentials.hasCredentials ? "Ativo" : "Inativo",
      trend: credentials.hasCredentials ? "Conectado" : undefined,
    },
    {
      icon: Zap,
      label: "Conta Meta",
      value: credentials.accountName ? credentials.accountName.split(" ")[0] : "N/A",
      trend: credentials.isValid ? "Valido" : undefined,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title={`Ola, ${user?.name?.split(" ")[0] || "usuario"}`}
          subtitle="Visao geral da sua plataforma de inteligencia competitiva."
        />

        {/* Aviso de credenciais */}
        {!credentials.isLoading && !credentials.hasCredentials && (
          <CredentialsWarning message="Configure suas credenciais Meta para desbloquear busca de anuncios, monitoramento e analise de performance." />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card
              key={i}
              className="card-premium-hover bg-white/[0.02] border-white/5 p-6"
            >
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
                <p className="text-2xl font-bold text-white truncate">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Acesso Rapido */}
          <Card className="lg:col-span-2 card-premium bg-white/[0.02] border-white/5 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400" />
                Acesso Rapido
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Buscar Anuncios",
                  desc: "Pesquise na biblioteca de anuncios da Meta",
                  href: "/search",
                },
                {
                  label: "Inteligencia Competitiva",
                  desc: "Analise anuncios dos seus concorrentes",
                  href: "/competitive-intelligence",
                },
                {
                  label: "Anuncios Escalados",
                  desc: "Descubra o que esta escalando agora",
                  href: "/ads",
                },
                {
                  label: "Relatorios",
                  desc: "Exporte dados em CSV ou JSON",
                  href: "/reports",
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setLocation(item.href)}
                  className="text-left p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200"
                >
                  <p className="text-sm font-bold text-white mb-1">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Status da API */}
          <Card className="card-premium bg-white/[0.02] border-white/5 p-8 flex flex-col">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Status da API
            </h3>

            <div className="flex-1 space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Conexao
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      credentials.hasCredentials
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {credentials.hasCredentials ? "Estavel" : "Inativo"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {credentials.hasCredentials
                    ? "Sua conta esta sincronizada com a Meta Marketing API."
                    : "Configure suas credenciais Meta para comecar."}
                </p>
              </div>

              {credentials.hasCredentials && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Conta Ativa
                  </p>
                  <p className="text-sm font-bold text-white truncate">
                    {credentials.accountName || "Conta Padrao"}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={() => setLocation("/settings")}
              variant="outline"
              className="mt-6 border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
            >
              <Settings className="w-3.5 h-3.5 mr-2" />
              Gerenciar API
            </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
