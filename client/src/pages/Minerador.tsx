import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCardV3 } from "@/components/ads/AdCardV3";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Pickaxe, Filter, Globe, Tag } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "ALL", name: "Todos" },
];

const AD_TYPES = [
  { id: "ALL", name: "Todas as Categorias" },
  { id: "POLITICAL_AND_ISSUE_ADS", name: "Temas, Eleições ou Política" },
  { id: "HOUSING_ADS", name: "Moradia" },
  { id: "EMPLOYMENT_ADS", name: "Emprego" },
  { id: "CREDIT_ADS", name: "Crédito" },
];

export default function Minerador() {
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeywords, setSearchKeywords] = useState("");
  const [country, setCountry] = useState("BR");
  const [adType, setAdType] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const searchByKeywordsQuery = trpc.ads.searchByKeywords.useQuery(
    {
      keywords: searchKeywords,
      countries: country === "ALL" ? [] : [country],
      adType: adType as any,
      limit: 50,
    },
    { enabled: false }
  );

  const performSearch = useCallback(async () => {
    if (!searchKeywords.trim()) {
      toast.error("Digite uma palavra-chave para buscar");
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchByKeywordsQuery.refetch();
      if (result.data?.success && result.data?.data) {
        setAds(result.data.data);
        toast.success(`${result.data.data.length} anúncios encontrados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anúncios");
      }
    } catch (error) {
      toast.error("Erro na busca de anúncios");
    } finally {
      setIsLoading(false);
    }
  }, [searchKeywords, searchByKeywordsQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const resetFilters = () => {
    setSearchKeywords("");
    setCountry("BR");
    setAdType("ALL");
    setAds([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pickaxe className="w-5 h-5 text-orange-400" />
              <h1 className="text-lg font-black text-white tracking-tight">Minerador</h1>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Busca oficial na Meta Ad Library por palavra-chave, localização e categoria.
            </p>
          </div>
          {ads.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Encontrados</p>
                <p className="text-sm font-black text-white">{ads.length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="border border-white/[0.06] bg-black">
          <div className="flex flex-col md:flex-row gap-0">
            <div className="flex-1 relative flex items-center border-b md:border-b-0 md:border-r border-white/[0.06]">
              <Search className="absolute left-4 w-4 h-4 text-gray-600" />
              <Input
                placeholder="Buscar por palavra-chave (ex: emagrecimento, curso, saas...)"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-12 bg-transparent border-none pl-12 text-sm font-medium focus-visible:ring-0 placeholder:text-gray-700 rounded-none"
              />
            </div>
            <div className="flex">
              <button
                onClick={performSearch}
                disabled={isLoading || !searchKeywords.trim()}
                className="flex-1 md:flex-none px-6 h-12 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Minerar"}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "w-12 h-12 border-l border-white/[0.06] transition-all flex items-center justify-center",
                  showFilters
                    ? "bg-white/[0.1] text-white"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filtros Oficiais */}
          {showFilters && (
            <div className="border-t border-white/[0.06] p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Localização */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-gray-600" />
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Localização</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCountry(c.code)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border transition-all",
                        country === c.code
                          ? "bg-white text-black border-white"
                          : "bg-transparent border-white/[0.1] text-gray-600 hover:text-white hover:border-white/[0.2]"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria de Anúncio */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-gray-600" />
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Categoria de Anúncio</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AD_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setAdType(type.id)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded border transition-all",
                        adType === type.id
                          ? "bg-white text-black border-white"
                          : "bg-transparent border-white/[0.1] text-gray-600 hover:text-white hover:border-white/[0.2]"
                      )}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="md:col-span-2">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded border border-white/[0.1] text-gray-600 hover:text-white hover:border-white/[0.2] transition-all"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {ads.length > 0 ? (
              ads.map((ad, idx) => (
                <motion.div
                  key={ad.id || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdCardV3 ad={ad} showIntelligence={false} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12">
                <EmptyState
                  icon={Pickaxe}
                  title={isLoading ? "Minerando..." : "Comece a minerar"}
                  description={
                    isLoading
                      ? "Buscando anúncios oficiais na Meta..."
                      : "Digite uma palavra-chave e ajuste a localização e categoria para encontrar anúncios oficiais."
                  }
                  actionLabel="Minerar Agora"
                  onAction={performSearch}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
