import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, AlertCircle, Globe, LayoutGrid, Tag, Package, Clock, Sparkles, ChevronDown, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import DashboardLayout from "../components/DashboardLayout";
import { AdCardV3 } from "../components/ads/AdCardV3";
import { cn } from "../lib/utils";

const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "EUA" },
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

const MiniLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1.5 ml-1 block font-mono">
    {children}
  </label>
);

export default function Minerador() {
  const [filters, setFilters] = useState({
    searchTerms: "",
    country: "BR",
    adType: "ALL" as "ALL" | "POLITICAL_AND_ISSUE_ADS" | "NON_POLITICAL",
    niche: "Todos",
    productType: "Todos",
    activeSince: "anytime"
  });

  const [allAds, setAllAds] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const searchMutation = trpc.ads.search.useQuery(
    { 
      searchTerms: filters.searchTerms, 
      country: filters.country, 
      adType: filters.adType === "NON_POLITICAL" ? "ALL" : filters.adType,
      niche: filters.niche,
      productType: filters.productType,
      activeSince: filters.activeSince,
      after: nextCursor
    },
    { 
      enabled: false,
      retry: false,
    }
  );

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setAllAds([]);
    setNextCursor(undefined);
    
    const result = await searchMutation.refetch();
    if (result.data) {
      setAllAds(result.data.data);
      setNextCursor(result.data.paging?.next_cursor);
    }
  };

  const fetchMore = async () => {
    if (isFetchingMore || !nextCursor) return;
    setIsFetchingMore(true);
    
    try {
      const result = await searchMutation.refetch();
      if (result.data) {
        setAllAds(prev => [...prev, ...result.data.data]);
        setNextCursor(result.data.paging?.next_cursor);
      }
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Intersection Observer para Scroll Infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !isFetchingMore) {
          fetchMore();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [nextCursor, isFetchingMore]);

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6 max-w-[1600px] mx-auto px-4 md:px-6">
        
        {/* Header Compacto */}
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">Minerador Pro</h1>
            {allAds.length > 0 && (
              <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black px-2 py-0">
                {allAds.length} RESULTADOS
              </Badge>
            )}
          </div>
        </div>

        {/* Barra de Filtros */}
        <Card className="p-4 bg-[#0A0A0A] border-white/[0.08] rounded-xl shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-end gap-3">
            <div className="flex-1 w-full space-y-0">
              <MiniLabel>Palavra-chave</MiniLabel>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                <Input
                  placeholder="Ex: Emagrecimento..."
                  value={filters.searchTerms}
                  onChange={(e) => updateFilter("searchTerms", e.target.value)}
                  className="pl-9 bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-xs font-medium focus:border-white/20 focus:ring-0 transition-all placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:flex items-end gap-2 w-full lg:w-auto">
              <div className="space-y-0">
                <MiniLabel>País</MiniLabel>
                <Select value={filters.country} onValueChange={(v) => updateFilter("country", v)}>
                  <SelectTrigger className="w-full lg:w-[90px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="País" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-[10px] font-black uppercase py-2">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <MiniLabel>Nicho</MiniLabel>
                <Select value={filters.niche} onValueChange={(v) => updateFilter("niche", v)}>
                  <SelectTrigger className="w-full lg:w-[120px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Tag className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="Nicho" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg max-h-[300px]">
                    <SelectItem value="Todos" className="text-[10px] font-black uppercase py-2">Todos Nichos</SelectItem>
                    {NICHES.map((n) => (
                      <SelectItem key={n} value={n} className="text-[10px] font-black uppercase py-2">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <MiniLabel>Tipo</MiniLabel>
                <Select value={filters.productType} onValueChange={(v) => updateFilter("productType", v)}>
                  <SelectTrigger className="w-full lg:w-[110px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Package className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="Tipo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-[10px] font-black uppercase py-2">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <MiniLabel>Tempo</MiniLabel>
                <Select value={filters.activeSince} onValueChange={(v) => updateFilter("activeSince", v)}>
                  <SelectTrigger className="w-full lg:w-[100px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Clock className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="Tempo" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    <SelectItem value="anytime" className="text-[10px] font-black uppercase py-2">Qualquer</SelectItem>
                    <SelectItem value="7" className="text-[10px] font-black uppercase py-2">7 Dias</SelectItem>
                    <SelectItem value="30" className="text-[10px] font-black uppercase py-2">30 Dias</SelectItem>
                    <SelectItem value="90" className="text-[10px] font-black uppercase py-2">90 Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0">
                <MiniLabel>Categoria</MiniLabel>
                <Select value={filters.adType} onValueChange={(v: any) => updateFilter("adType", v)}>
                  <SelectTrigger className="w-full lg:w-[110px] bg-white/[0.03] border-white/[0.08] rounded-lg h-10 text-[10px] font-black uppercase tracking-tighter focus:ring-0 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="w-3 h-3 text-white/20 shrink-0" />
                      <SelectValue placeholder="Cat." />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/[0.1] rounded-lg">
                    <SelectItem value="ALL" className="text-[10px] font-black uppercase py-2">Todos</SelectItem>
                    <SelectItem value="NON_POLITICAL" className="text-[10px] font-black uppercase py-2">Comercial</SelectItem>
                    <SelectItem value="POLITICAL_AND_ISSUE_ADS" className="text-[10px] font-black uppercase py-2">Político</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <Button 
                type="submit" 
                disabled={searchMutation.isLoading}
                className="w-full lg:w-auto h-10 px-6 bg-white text-black hover:bg-white/90 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shrink-0"
              >
                {searchMutation.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Minerar</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Loading State */}
        {searchMutation.isLoading && allAds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 animate-pulse">Sincronizando com Meta Ads Archive...</p>
          </div>
        )}

        {/* Error State */}
        {searchMutation.error && (
          <Card className="p-6 border-red-500/20 bg-red-500/5 rounded-xl">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Erro de Conexão</p>
                <p className="text-[10px] font-bold text-red-500/60">{searchMutation.error.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleSearch()} className="border-red-500/20 text-red-500 hover:bg-red-500/10 text-[9px] font-black uppercase">Tentar Novamente</Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {hasSearched && !searchMutation.isLoading && allAds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-xl space-y-3">
            <Search className="w-6 h-6 text-white/10" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Nenhum criativo encontrado para estes filtros.</p>
          </div>
        )}

        {/* Results Grid */}
        {allAds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {allAds.map((ad: any) => (
              <AdCardV3 key={ad.id} ad={ad} />
            ))}
          </div>
        )}

        {/* Infinite Scroll Loader */}
        <div ref={loaderRef} className="py-10 flex justify-center">
          {isFetchingMore && (
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Carregando mais criativos...</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "outline" ? "text-foreground border border-white/10" : "bg-primary text-primary-foreground hover:bg-primary/80",
      className
    )}>
      {children}
    </span>
  );
}
