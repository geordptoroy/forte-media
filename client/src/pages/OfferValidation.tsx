import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Search,
  Loader2,
  BarChart2,
  Users,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Activity,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ScaleLevel = "SCALED" | "MODERATE" | "LOW" | "UNKNOWN";

function ScaleBadge({ level, score }: { level: ScaleLevel; score?: number }) {
  const config = {
    SCALED: { label: "Escalado", color: "text-green-400", bg: "bg-green-500/[0.06]", border: "border-green-500/20", icon: <CheckCircle2 className="w-3 h-3" /> },
    MODERATE: { label: "Em Escala", color: "text-yellow-400", bg: "bg-yellow-500/[0.06]", border: "border-yellow-500/20", icon: <TrendingUp className="w-3 h-3" /> },
    LOW: { label: "Baixo", color: "text-gray-500", bg: "bg-transparent", border: "border-white/[0.08]", icon: <XCircle className="w-3 h-3" /> },
    UNKNOWN: { label: "Sem dados", color: "text-gray-600", bg: "bg-transparent", border: "border-white/[0.06]", icon: <AlertCircle className="w-3 h-3" /> },
  };
  const c = config[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border", c.bg, c.border, c.color)}>
      {c.icon}
      {c.label}
      {score !== undefined && ` · ${score}`}
    </span>
  );
}

function SignalRow({ signal }: { signal: any }) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-b-0", signal.passed ? "bg-green-500/[0.02]" : "bg-transparent")}>
      <div className="mt-0.5 shrink-0">
        {signal.passed
          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          : <XCircle className="w-3.5 h-3.5 text-gray-700" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{signal.signal.replace(/_/g, " ")}</p>
        <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{signal.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Peso {signal.weight}</span>
      </div>
    </div>
  );
}

function AdValidationCard({ validation }: { validation: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-white/[0.06] bg-black">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
            <span className="text-[9px] font-black text-white/50">{validation.pageName?.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate">{validation.pageName}</p>
            <p className="text-[9px] text-gray-600 font-mono truncate">ID: {validation.adId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ScaleBadge level={validation.scaleLevel} score={validation.scalingScore} />
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest border border-white/[0.06] px-2 py-1">
            {validation.confidence}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-400 leading-relaxed">{validation.summary}</p>
              <div className="border border-white/[0.06]">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Sinais de Validação</span>
                </div>
                {validation.signals?.map((s: any, i: number) => (
                  <SignalRow key={i} signal={s} />
                ))}
              </div>
              <div className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Recomendação</p>
                <p className="text-xs text-gray-300 leading-relaxed">{validation.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OfferValidation() {
  const [offerName, setOfferName] = useState("");
  const [searchTerms, setSearchTerms] = useState("");
  const [country, setCountry] = useState("BR");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateOfferQuery = trpc.scalingValidation.validateOffer.useQuery(
    { offerName, searchTerms, countries: [country], limit: 50 },
    { enabled: false }
  );

  const handleValidate = async () => {
    if (!offerName.trim() || !searchTerms.trim()) {
      toast.error("Preencha o nome da oferta e os termos de busca");
      return;
    }
    setIsLoading(true);
    try {
      const res = await validateOfferQuery.refetch();
      if (res.data?.success && res.data?.data) {
        setResult(res.data.data);
        toast.success(`Oferta validada: ${res.data.data.totalAdsAnalyzed} anúncios analisados`);
      } else {
        toast.error(res.data?.error || "Erro ao validar oferta");
      }
    } catch (error) {
      toast.error("Erro na conexão com a Meta API");
    } finally {
      setIsLoading(false);
    }
  };

  const COUNTRIES = ["BR", "US", "PT", "MX", "AR"];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white tracking-tight">Validação de Oferta</h1>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            Analise se uma oferta ou produto está escalado no mercado com base nos dados reais da Meta Ad Library API
          </p>
        </div>

        {/* Input form */}
        <div className="border border-white/[0.06] bg-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04]">
            <div className="bg-black p-4">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">
                Nome da Oferta / Produto
              </label>
              <Input
                placeholder="ex: Curso de Marketing Digital, Suplemento Pré-treino..."
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                className="h-10 bg-white/[0.02] border-white/[0.08] rounded-none text-sm focus-visible:ring-0 focus-visible:border-white/20"
              />
            </div>
            <div className="bg-black p-4">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-2">
                Termos de Busca na Meta
              </label>
              <Input
                placeholder="ex: marketing digital, whey protein, dropshipping..."
                value={searchTerms}
                onChange={(e) => setSearchTerms(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                className="h-10 bg-white/[0.02] border-white/[0.08] rounded-none text-sm focus-visible:ring-0 focus-visible:border-white/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">País:</span>
              <div className="flex gap-0.5">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCountry(c)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-black transition-all border",
                      country === c
                        ? "bg-white text-black border-white"
                        : "text-gray-600 border-white/[0.06] hover:text-white hover:border-white/20"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleValidate}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Validar Oferta
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border border-white/10" />
                <div className="absolute inset-0 border border-white border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Analisando Mercado</p>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Meta Ad Library API v21.0</p>
              </div>
            </motion.div>
          )}

          {!isLoading && result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Offer Summary */}
              <div className="border border-white/[0.06] bg-black">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-base font-black text-white">{result.offerName}</h2>
                      <ScaleBadge level={result.offerScaleLevel} />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{result.offerRecommendation}</p>
                  </div>
                  <div className={cn(
                    "shrink-0 px-4 py-3 border text-center",
                    result.isOfferValidated
                      ? "border-green-500/20 bg-green-500/[0.06]"
                      : "border-white/[0.06] bg-transparent"
                  )}>
                    {result.isOfferValidated
                      ? <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-1" />
                      : <XCircle className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                    }
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      {result.isOfferValidated ? "Validada" : "Não validada"}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04]">
                  <div className="bg-black px-4 py-3">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <BarChart2 className="w-2.5 h-2.5" /> Anúncios Analisados
                    </p>
                    <p className="text-xl font-black text-white">{result.totalAdsAnalyzed}</p>
                  </div>
                  <div className="bg-black px-4 py-3">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <TrendingUp className="w-2.5 h-2.5" /> Em Escala
                    </p>
                    <p className="text-xl font-black text-green-400">{result.scaledAdsCount}</p>
                  </div>
                  <div className="bg-black px-4 py-3">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Activity className="w-2.5 h-2.5" /> Score Médio
                    </p>
                    <p className="text-xl font-black text-white">{result.averageScore}</p>
                  </div>
                  <div className="bg-black px-4 py-3">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Users className="w-2.5 h-2.5" /> Concorrentes
                    </p>
                    <p className="text-xl font-black text-white">{result.competitorCount}</p>
                  </div>
                </div>

                {/* Market signals */}
                {result.marketSignals?.length > 0 && (
                  <div className="px-6 py-4 border-t border-white/[0.06]">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Sinais de Mercado</p>
                    <div className="space-y-2">
                      {result.marketSignals.map((signal: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-white/20 mt-1.5 shrink-0" />
                          <p className="text-xs text-gray-400 leading-relaxed">{signal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top competitors */}
                {result.topCompetitors?.length > 0 && (
                  <div className="px-6 py-4 border-t border-white/[0.06]">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Top Concorrentes</p>
                    <div className="flex flex-wrap gap-2">
                      {result.topCompetitors.map((name: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold text-gray-400 border border-white/[0.08] px-3 py-1.5">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Individual ad validations */}
              {result.adValidations?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">
                    Validação Individual — {result.adValidations.length} anúncios
                  </p>
                  <div className="space-y-px bg-white/[0.02]">
                    {result.adValidations.map((validation: any, i: number) => (
                      <AdValidationCard key={i} validation={validation} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
