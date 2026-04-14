import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import DashboardLayout from "../components/DashboardLayout";
import { AdCardV3 } from "../components/ads/AdCardV3";

export default function Minerador() {
  const [searchTerms, setSearchTerms] = useState("");
  const [country, setCountry] = useState("BR");
  const [adType, setAdType] = useState<"ALL" | "POLITICAL_AND_ISSUE_ADS">("ALL");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: ads, isLoading, error, refetch } = trpc.ads.search.useQuery(
    { searchTerms, country, adType },
    { enabled: false }
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
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tighter uppercase">Minerador de Anúncios</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            Inteligência em tempo real da biblioteca Meta
          </p>
        </div>

        <Card className="p-6 bg-black border-white/[0.06] rounded-none">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Ex: Emagrecimento, Renda Extra, Marketing Digital..."
                value={searchTerms}
                onChange={(e) => setSearchTerms(e.target.value)}
                className="pl-10 bg-white/[0.02] border-white/[0.06] rounded-none h-11 text-sm focus:ring-white/20"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-[120px] bg-white/[0.02] border-white/[0.06] rounded-none h-11 text-xs font-bold uppercase">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/[0.1] rounded-none">
                  <SelectItem value="BR">Brasil</SelectItem>
                  <SelectItem value="US">EUA</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                  <SelectItem value="ES">Espanha</SelectItem>
                </SelectContent>
              </Select>

              <Select value={adType} onValueChange={(v: any) => setAdType(v)}>
                <SelectTrigger className="w-[180px] bg-white/[0.02] border-white/[0.06] rounded-none h-11 text-xs font-bold uppercase">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/[0.1] rounded-none">
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="POLITICAL_AND_ISSUE_ADS">Políticos</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-11 px-8 bg-white text-black hover:bg-white/90 rounded-none font-black uppercase tracking-widest text-xs"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Minerar"}
              </Button>
            </div>
          </form>
        </Card>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-white/10 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-t-2 border-white rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.3em]">Sincronizando com Meta</p>
              <p className="text-[10px] text-gray-600 font-bold uppercase">Extraindo dados demográficos e métricas...</p>
            </div>
          </div>
        )}

        {error && (
          <Card className="p-6 border-red-500/20 bg-red-500/5 rounded-none">
            <div className="flex items-center space-x-4 text-red-500">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Erro na Mineração</p>
                <p className="text-[10px] font-bold opacity-70">{error.message}</p>
              </div>
            </div>
          </Card>
        )}

        {hasSearched && !isLoading && ads && ads.length === 0 && (
          <div className="text-center py-32 border border-dashed border-white/10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-600">Nenhum criativo encontrado para estes termos.</p>
          </div>
        )}

        {ads && ads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.map((ad: any) => (
              <AdCardV3 key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
