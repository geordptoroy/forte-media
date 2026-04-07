import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import DashboardLayout from "@/components/DashboardLayout";
import { AdCard } from "@/components/ads/AdCard";
import {
  Search,
  Loader2,
  Filter,
  TrendingUp,
  Zap,
  Globe,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function CompetitiveIntelligence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ads, setAds] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchScaledAdsQuery = trpc.meta.searchScaledAds.useQuery(
    {
      countries: ["BR"],
      searchTerms: searchQuery,
    },
    { enabled: false }
  );

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await searchScaledAdsQuery.refetch();
      if (result.data?.success && result.data?.data) {
        setAds(result.data.data);
        toast.success(`${result.data.data.length} anúncios encontrados`);
      } else {
        toast.error(result.data?.error || "Erro ao buscar anúncios");
      }
    } catch (error) {
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Inteligência Competitiva"
          subtitle="Analise os criativos mais fortes do mercado em tempo real."
        />

        <Card className="bg-white/[0.02] border-white/5 p-6 rounded-[2rem]">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="Pesquisar por nicho ou concorrente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="input-premium h-14 pl-12 text-lg"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="btn-premium h-14 px-10">
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analisar"}
            </Button>
          </div>
        </Card>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-white/10" />
                <p className="text-sm text-gray-600 font-black uppercase tracking-widest">Minerando Criativos...</p>
              </motion.div>
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ads.map((ad, i) => (
                  <motion.div key={ad.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <AdCard ad={ad} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Inicie sua análise"
                description="Digite um termo acima para descobrir o que está performando agora."
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
