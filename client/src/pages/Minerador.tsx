import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, AlertCircle, Globe, LayoutGrid } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import DashboardLayout from "../components/DashboardLayout";
import { AdCardV3 } from "../components/ads/AdCardV3";

const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "GB", name: "Reino Unido" },
  { code: "FR", name: "França" },
  { code: "DE", name: "Alemanha" },
  { code: "IT", name: "Itália" },
  { code: "CA", name: "Canadá" },
  { code: "AU", name: "Austrália" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colômbia" },
  { code: "CL", name: "Chile" },
];

export default function Minerador() {
  const [searchTerms, setSearchTerms] = useState("");
  const [country, setCountry] = useState("BR");
  const [adType, setAdType] = useState<"ALL" | "POLITICAL_AND_ISSUE_ADS">("ALL");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: ads, isLoading, error, refetch } = trpc.ads.search.useQuery(
    { searchTerms, country, adType },
    { 
      enabled: false,
      retry: false,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerms.trim()) {
      setHasSearched(true);
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <h1 className="text-2xl font-black tracking-tighter uppercase">Minerador de Anúncios</h1>
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
              Inteligência em tempo real da biblioteca Meta Ads
            </p>
          </div>
          
          {ads && (
            <div className="flex items-center gap-4 px-4 py-2 bg-white/[0.03] border border-white/[0.06]">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Resultados</span>
                <span className="text-xs font-black text-white">{ads.length} Criativos</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">País</span>
                <span className="text-xs font-black text-white">{country}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filters Card */}
        <Card className="p-8 bg-black border-white/[0.06] rounded-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-white/10 group-hover:bg-white/40 transition-colors" />
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Keyword Search */}
              <div className="lg:col-span-6 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Palavra-chave ou Nicho
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <Input
                    placeholder="Ex: Emagrecimento, Renda Extra, Marketing Digital..."
                    value={searchTerms}
                    onChange={(e) => setSearchTerms(e.target.value)}
                    className="pl-12 bg-white/[0.03] border-white/[0.08] rounded-none h-12 text-sm font-medium focus:border-white/20 focus:ring-0 transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              {/* Country Select */}
              <div className="lg:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  País de Destino
                </label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] rounded-none h-12 text-xs font-bold uppercase tracking-tighter focus:ring-0">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-white/20" />
                      <SelectValue placeholder="Selecionar País" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/[0.1] rounded-none max-h-[300px]">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-[10px] font-bold uppercase py-3 focus:bg-white/5">
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ad Category Select */}
              <div className="lg:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Categoria do Anúncio
                </label>
                <Select value={adType} onValueChange={(v: any) => setAdType(v)}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] rounded-none h-12 text-xs font-bold uppercase tracking-tighter focus:ring-0">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-white/20" />
                      <SelectValue placeholder="Categoria" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/[0.1] rounded-none">
                    <SelectItem value="ALL" className="text-[10px] font-bold uppercase py-3">Todos os Anúncios</SelectItem>
                    <SelectItem value="POLITICAL_AND_ISSUE_ADS" className="text-[10px] font-bold uppercase py-3">Temas Sociais / Políticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest hidden md:block">
                Dica: Use termos específicos para encontrar criativos de alta conversão.
              </p>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full md:w-auto h-12 px-12 bg-white text-black hover:bg-white/90 rounded-none font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Minerando...</span>
                  </div>
                ) : (
                  "Iniciar Mineração"
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-8">
            <div className="relative">
              <div className="w-20 h-20 border-2 border-white/5 rounded-full" />
              <div className="absolute inset-0 w-20 h-20 border-t-2 border-white rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-white/20" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-white">Sincronizando com Meta</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                Extraindo dados demográficos, gastos e métricas de alcance...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 border-red-500/20 bg-red-500/5 rounded-none relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-red-500">Falha na Conexão com a API</p>
                <p className="text-[11px] font-bold text-red-500/60 leading-relaxed max-w-2xl">
                  {error.message.includes("access token") 
                    ? "Seu token de acesso da Meta expirou ou é inválido. Por favor, atualize o META_ACCESS_TOKEN no arquivo .env do servidor."
                    : error.message}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="mt-4 border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-none text-[9px] font-black uppercase"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && ads && ads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 space-y-4">
            <Search className="w-8 h-8 text-white/10" />
            <div className="text-center space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Nenhum criativo encontrado.</p>
              <p className="text-[9px] font-bold text-white/20 uppercase">Tente usar palavras-chave mais genéricas ou mude o país.</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {ads && ads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
            {ads.map((ad: any) => (
              <AdCardV3 key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
