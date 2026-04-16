import { useState, useCallback } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, AlertCircle, Globe, LayoutGrid, Tag, Package, Clock, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import DashboardLayout from "../components/DashboardLayout";
import { AdCardV3 } from "../components/ads/AdCardV3";
import { cn } from "../lib/utils";

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

const NICHES = [
  "Relacionamento", "Espiritualidade", "Renda Extra", "Emagrecimento", 
  "Marketing Digital", "Desenvolvimento Pessoal", "Finanças/Investimentos", 
  "Saúde & Fitness", "Beleza & Estética", "Culinária/Receitas", 
  "Maternidade/Paternidade", "Idiomas", "Concursos Públicos", 
  "Música/Instrumentos", "Artesanato/DIY", "Pet/Animais", 
  "Tecnologia/Programação", "Negócios/Empreendedorismo", "Outros"
];

const PRODUCT_TYPES = ["Infoproduto", "Nutra", "Encapsulado", "Todos"];

// Componente de Label Estilizado
const FilterLabel = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
  <div className="flex items-center gap-1.5 mb-2 ml-1">
    {Icon && <Icon className="w-3 h-3 text-white/30" />}
    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 font-mono">
      {children}
    </label>
  </div>
);

export default function Minerador() {
  // Estado Unificado para Filtros (Lógica Refatorada)
  const [filters, setFilters] = useState({
    searchTerms: "",
    country: "BR",
    adType: "ALL" as "ALL" | "POLITICAL_AND_ISSUE_ADS" | "NON_POLITICAL",
    niche: "Todos",
    productType: "Todos",
    activeSince: "anytime"
  });

  const [hasSearched, setHasSearched] = useState(false);

  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const { data: ads, isLoading, error, refetch } = trpc.ads.search.useQuery(
    { 
      searchTerms: filters.searchTerms, 
      country: filters.country, 
      adType: filters.adType === "NON_POLITICAL" ? "ALL" : filters.adType,
      niche: filters.niche,
      productType: filters.productType,
      activeSince: filters.activeSince
    },
    { 
      enabled: false,
      retry: false,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filters.searchTerms.trim()) {
      setHasSearched(true);
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-10 max-w-[1600px] mx-auto px-4 md:px-8">
        {/* Header Section - Minimalista */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.04] pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Minerador</h1>
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] ml-11">
              Meta Intelligence Engine v2.5
            </p>
          </div>
          
          {ads && (
            <div className="flex items-center gap-6 px-6 py-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl backdrop-blur-xl">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Database</span>
                <span className="text-sm font-black text-white tabular-nums">{ads.length} Criativos</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Region</span>
                <span className="text-sm font-black text-white">{filters.country}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filters - Refatoração Gráfica Profunda */}
        <div className="relative group">
          {/* Efeito de Brilho de Fundo */}
          <div className="absolute -inset-1 bg-gradient-to-r from-white/5 to-transparent rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000" />
          
          <Card className="relative p-10 bg-[#050505]/80 border-white/[0.08] rounded-[1.5rem] shadow-3xl backdrop-blur-3xl overflow-hidden">
            <form onSubmit={handleSearch} className="space-y-10">
              
              {/* Grid Principal: Busca e País */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-9 space-y-1">
                  <FilterLabel icon={Search}>Palavra-chave ou Nicho</FilterLabel>
                  <div className="relative group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-500" />
                    <Input
                      placeholder="O que você deseja minerar hoje?"
                      value={filters.searchTerms}
                      onChange={(e) => updateFilter("searchTerms", e.target.value)}
                      className="relative pl-6 bg-white/[0.02] border-white/[0.1] rounded-xl h-14 text-base font-medium focus:border-white/30 focus:ring-0 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-1">
                  <FilterLabel icon={Globe}>País</FilterLabel>
                  <Select value={filters.country} onValueChange={(v) => updateFilter("country", v)}>
                    <SelectTrigger className="bg-white/[0.02] border-white/[0.1] rounded-xl h-14 text-xs font-black uppercase tracking-widest focus:ring-0 hover:bg-white/[0.04] transition-colors">
                      <SelectValue placeholder="País" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-xl max-h-[300px] shadow-2xl">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="text-[10px] font-black uppercase py-3 focus:bg-white/5 cursor-pointer">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid Secundário: Filtros Específicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <FilterLabel icon={Tag}>Nicho</FilterLabel>
                  <Select value={filters.niche} onValueChange={(v) => updateFilter("niche", v)}>
                    <SelectTrigger className="bg-white/[0.02] border-white/[0.1] rounded-xl h-12 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.04]">
                      <SelectValue placeholder="Nicho" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-xl max-h-[300px]">
                      <SelectItem value="Todos" className="text-[10px] font-black uppercase py-3">Todos os Nichos</SelectItem>
                      {NICHES.map((n) => (
                        <SelectItem key={n} value={n} className="text-[10px] font-black uppercase py-3">{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <FilterLabel icon={Package}>Tipo</FilterLabel>
                  <Select value={filters.productType} onValueChange={(v) => updateFilter("productType", v)}>
                    <SelectTrigger className="bg-white/[0.02] border-white/[0.1] rounded-xl h-12 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.04]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-xl">
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-[10px] font-black uppercase py-3">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <FilterLabel icon={Clock}>Tempo</FilterLabel>
                  <Select value={filters.activeSince} onValueChange={(v) => updateFilter("activeSince", v)}>
                    <SelectTrigger className="bg-white/[0.02] border-white/[0.1] rounded-xl h-12 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.04]">
                      <SelectValue placeholder="Tempo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-xl">
                      <SelectItem value="anytime" className="text-[10px] font-black uppercase py-3">Qualquer tempo</SelectItem>
                      <SelectItem value="7d" className="text-[10px] font-black uppercase py-3">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d" className="text-[10px] font-black uppercase py-3">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d" className="text-[10px] font-black uppercase py-3">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <FilterLabel icon={Filter}>Categoria</FilterLabel>
                  <Select value={filters.adType} onValueChange={(v: any) => updateFilter("adType", v)}>
                    <SelectTrigger className="bg-white/[0.02] border-white/[0.1] rounded-xl h-12 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.04]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-xl">
                      <SelectItem value="ALL" className="text-[10px] font-black uppercase py-3">Todos</SelectItem>
                      <SelectItem value="NON_POLITICAL" className="text-[10px] font-black uppercase py-3">Não Políticos</SelectItem>
                      <SelectItem value="POLITICAL_AND_ISSUE_ADS" className="text-[10px] font-black uppercase py-3">Políticos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botão de Ação - Centralizado e Poderoso */}
              <div className="flex flex-col items-center pt-6">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={cn(
                    "w-full md:w-[400px] h-16 bg-white text-black hover:bg-white/90 rounded-2xl font-black uppercase tracking-[0.3em] text-sm transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Sincronizando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      <span>Iniciar Mineração</span>
                    </div>
                  )}
                </Button>
                <p className="mt-4 text-[8px] font-bold text-white/10 uppercase tracking-[0.5em]">
                  Powered by Forte Media Intelligence
                </p>
              </div>
            </form>
          </Card>
        </div>

        {/* Loading State - Refatorado */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-40 space-y-10">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-white/5 rounded-full" />
              <div className="absolute inset-0 w-24 h-24 border-t-2 border-white rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.5em] text-white animate-pulse">Extraindo Dados</p>
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                Conectando aos servidores da Meta Ads Archive para sincronização de criativos...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-10 border-red-500/20 bg-red-500/5 rounded-[1.5rem] relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/40" />
            <div className="flex items-start space-x-8">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-red-500">Erro de Sincronização</p>
                <p className="text-[11px] font-bold text-red-500/60 leading-relaxed max-w-3xl">
                  {error.message.includes("access token") 
                    ? "Seu token de acesso da Meta expirou ou é inválido. Por favor, atualize o META_ACCESS_TOKEN no arquivo .env do servidor."
                    : error.message}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="mt-6 border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase px-8 h-10"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && ads && ads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/10 rounded-[2rem] space-y-6 bg-white/[0.01]">
            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-white/10" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Nenhum criativo encontrado</p>
              <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Tente ajustar seus filtros ou usar termos mais genéricos.</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {ads && ads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 pb-32">
            {ads.map((ad: any) => (
              <AdCardV3 key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
