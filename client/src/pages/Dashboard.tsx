import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import { RegionSelector } from "@/components/ads/RegionSelector";
import { Pickaxe, Loader2, Search, RefreshCcw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const AD_TYPE_OPTIONS = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "POLITICAL_AND_ISSUE_ADS", label: "Politicos e de interesse publico" },
  { value: "CREDIT_ADS", label: "Credito" },
  { value: "EMPLOYMENT_ADS", label: "Emprego" },
  { value: "HOUSING_ADS", label: "Habitacao" },
] as const;

const AD_ACTIVE_STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "INACTIVE", label: "Inativos" },
] as const;

const MEDIA_TYPE_OPTIONS = [
  { value: "ALL", label: "Todos os formatos" },
  { value: "IMAGE", label: "Imagem" },
  { value: "VIDEO", label: "Video" },
  { value: "MEME", label: "Meme" },
  { value: "NONE", label: "Sem midia" },
] as const;

const PUBLISHER_PLATFORM_OPTIONS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "AUDIENCE_NETWORK", label: "Audience Network" },
  { value: "MESSENGER", label: "Messenger" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

const LIMIT_OPTIONS = [25, 50, 100, 200, 500] as const;

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full h-9 bg-transparent border border-white/[0.08] text-[11px] font-medium text-gray-300 px-3 pr-8 appearance-none focus:outline-none focus:border-white/20 hover:border-white/15 transition-colors"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-zinc-900 text-white">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [ads, setAds] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerms, setSearchTerms] = useState("");
  const [searchPageIds, setSearchPageIds] = useState("");
  const [countries, setCountries] = useState(["BR"]);
  const [adType, setAdType] = useState<typeof AD_TYPE_OPTIONS[number]["value"]>("ALL");
  const [adActiveStatus, setAdActiveStatus] = useState<typeof AD_ACTIVE_STATUS_OPTIONS[number]["value"]>("ALL");
  const [mediaType, setMediaType] = useState<typeof MEDIA_TYPE_OPTIONS[number]["value"]>("ALL");
  const [publisherPlatforms, setPublisherPlatforms] = useState<string[]>([]);
  const [adDeliveryDateMin, setAdDeliveryDateMin] = useState("");
  const [adDeliveryDateMax, setAdDeliveryDateMax] = useState("");
  const [limit, setLimit] = useState<number>(50);

  const searchQuery = trpc.meta.searchAds.useQuery(
    {
      searchTerms: searchTerms.trim() || undefined,
      searchPageIds: searchPageIds.trim()
        ? searchPageIds.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      countries,
      adType,
      adActiveStatus,
      mediaType: mediaType === "ALL" ? undefined : mediaType,
      publisherPlatforms: publisherPlatforms.length > 0
        ? (publisherPlatforms as any)
        : undefined,
      adDeliveryDateMin: adDeliveryDateMin || undefined,
      adDeliveryDateMax: adDeliveryDateMax || undefined,
      limit,
    },
    { enabled: false }
  );

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      const result = await searchQuery.refetch();
      if (result.data?.success && result.data?.data) {
        setAds(result.data.data);
        toast.success(`${result.data.data.length} anuncios encontrados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anuncios");
      }
    } catch {
      toast.error("Erro na conexao com a Meta API");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const togglePlatform = (platform: string) => {
    setPublisherPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pickaxe className="w-5 h-5 text-white" />
              <h1 className="text-lg font-black text-white tracking-tight">Minerador</h1>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Busca direta na Meta Ad Library API
            </p>
          </div>
          {ads.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3 py-2 border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Total</p>
                <p className="text-sm font-black text-white">{ads.length}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border border-white/[0.06] bg-black">
          <div className="flex flex-col md:flex-row gap-0">
            <div className="flex-1 relative flex items-center border-b md:border-b-0 md:border-r border-white/[0.06]">
              <Search className="absolute left-4 w-4 h-4 text-gray-600" />
              <Input
                placeholder="Palavras-chave (ex: cosmeticos, dropshipping, suplementos...)"
                value={searchTerms}
                onChange={(e) => setSearchTerms(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 bg-transparent border-none pl-12 text-sm font-medium focus-visible:ring-0 placeholder:text-gray-700 rounded-none"
              />
            </div>
            <div className="flex">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex-1 md:flex-none px-6 h-12 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Minerar"}
              </button>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-12 h-12 border-l border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-center"
              >
                <RefreshCcw className={cn("w-3.5 h-3.5", isSearching && "animate-spin")} />
              </button>
            </div>
          </div>

          <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-3">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap">
              Page IDs
            </span>
            <Input
              placeholder="IDs de paginas separados por virgula (ex: 123456789, 987654321)"
              value={searchPageIds}
              onChange={(e) => setSearchPageIds(e.target.value)}
              className="h-9 bg-transparent border border-white/[0.08] text-sm font-medium focus-visible:ring-0 placeholder:text-gray-700 rounded-none flex-1"
            />
          </div>

          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1 whitespace-nowrap">
                Pais / Regiao
              </span>
              <div className="flex-1">
                <RegionSelector selected={countries} onChange={setCountries} />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] px-4 py-4">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">
              Filtros Avancados
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FilterSelect
                label="Status do Anuncio"
                value={adActiveStatus}
                options={AD_ACTIVE_STATUS_OPTIONS}
                onChange={setAdActiveStatus}
              />
              <FilterSelect
                label="Tipo de Anuncio"
                value={adType}
                options={AD_TYPE_OPTIONS}
                onChange={setAdType}
              />
              <FilterSelect
                label="Formato de Midia"
                value={mediaType}
                options={MEDIA_TYPE_OPTIONS}
                onChange={setMediaType}
              />
              <FilterSelect
                label="Quantidade"
                value={String(limit) as any}
                options={LIMIT_OPTIONS.map((l) => ({ value: String(l) as any, label: l + " anuncios" }))}
                onChange={(v) => setLimit(Number(v))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  Data de Inicio (min.)
                </span>
                <Input
                  type="date"
                  value={adDeliveryDateMin}
                  onChange={(e) => setAdDeliveryDateMin(e.target.value)}
                  className="h-9 bg-transparent border border-white/[0.08] text-[11px] font-medium text-gray-300 focus-visible:ring-0 rounded-none [color-scheme:dark]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  Data de Fim (max.)
                </span>
                <Input
                  type="date"
                  value={adDeliveryDateMax}
                  onChange={(e) => setAdDeliveryDateMax(e.target.value)}
                  className="h-9 bg-transparent border border-white/[0.08] text-[11px] font-medium text-gray-300 focus-visible:ring-0 rounded-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">
                Plataformas
              </span>
              <div className="flex flex-wrap gap-2">
                {PUBLISHER_PLATFORM_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-all",
                      publisherPlatforms.includes(p.value)
                        ? "bg-white border-white text-black"
                        : "bg-transparent border-white/[0.08] text-gray-500 hover:border-white/20 hover:text-white"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
                {publisherPlatforms.length > 0 && (
                  <button
                    onClick={() => setPublisherPlatforms([])}
                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/[0.08] text-gray-600 hover:text-white hover:border-white/20 transition-all"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

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
                  <AdCard ad={ad} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12">
                <EmptyState
                  icon={Search}
                  title="Nenhum anuncio minerado"
                  description={
                    isSearching
                      ? "Minerando anuncios na Meta Ad Library..."
                      : "Configure os filtros acima e clique em Minerar para comecar."
                  }
                  actionLabel="Minerar Agora"
                  onAction={handleSearch}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
