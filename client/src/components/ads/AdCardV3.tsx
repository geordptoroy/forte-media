import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  ExternalLink, Calendar, Eye, Loader2, Layers, 
  AlertCircle, Link as LinkIcon, Package, Repeat, 
  Download, MousePointer2 
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- TIPAGEM ---
interface ExtractionResult {
  type: 'video' | 'image' | 'carousel' | 'unknown';
  url: string | string[];
  thumbnail?: string;
}

interface AdCardProps {
  ad: any;
  onExpand?: (ad: any, media: ExtractionResult | null) => void;
}

// --- SUB-COMPONENTES MEMOIZADOS PARA PERFORMANCE ---

const AdMediaPreview = memo(({ isVisible, media, isExtracting, platforms }: { 
  isVisible: boolean, 
  media: ExtractionResult | null, 
  isExtracting: boolean,
  platforms: string[]
}) => (
  <div className="aspect-[4/5] bg-white/[0.02] relative flex items-center justify-center border-b border-white/[0.06] overflow-hidden">
    {isVisible && media ? (
      media.type === 'video' ? (
        <video 
          src={Array.isArray(media.url) ? media.url[0] : media.url} 
          className="w-full h-full object-cover" 
          controls 
          muted 
          loop 
          poster={media.thumbnail} 
        />
      ) : (
        <img 
          src={Array.isArray(media.url) ? media.url[0] : media.url} 
          className="w-full h-full object-cover" 
          alt="Ad Creative" 
          loading="lazy" 
        />
      )
    ) : isExtracting ? (
      <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
    ) : (
      <AlertCircle className="w-5 h-5 text-white/10" />
    )}
    
    <div className="absolute top-3 left-3 flex gap-1.5 z-10">
      {platforms.map((p) => (
        <Badge key={p} variant="secondary" className="bg-black/80 backdrop-blur-md text-[7px] px-2 py-0.5 border-white/10 uppercase font-black rounded-md">
          {p}
        </Badge>
      ))}
    </div>
  </div>
));

const AdMetricItem = memo(({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
  <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1">
    <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
      <Icon className="w-2.5 h-2.5" /> {label}
    </div>
    <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
      {value}
    </p>
  </div>
));

// --- COMPONENTE PRINCIPAL ---

export const AdCardV3 = memo(({ ad, onExpand }: AdCardProps) => {
  const [media, setMedia] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Memoização de URLs e Textos para evitar re-cálculos
  const urls = useMemo(() => {
    const official = `https://www.facebook.com/ads/library/?id=${ad.id}`;
    // Prioridade: link extraído via Puppeteer > destination_url (vem do backend) > official
    const destination = media?.ctaLink || (ad.destination_url && ad.destination_url !== official ? ad.destination_url : official);
    return {
      official,
      destination
    };
  }, [ad.id, ad.destination_url, media?.ctaLink]);

  const ctaText = useMemo(() => {
    const funnels = ad.detectedFunnels || [];
    if (funnels.includes("X1") || funnels.includes("Type Bot")) return "Saiba Mais";
    // Prioridade: Título extraído via Puppeteer > Título da API > "Saiba Mais"
    return media?.title || ad.ad_creative_link_titles?.[0] || "Saiba Mais";
  }, [ad.detectedFunnels, ad.ad_creative_link_titles, media?.title]);

  const activeTimeLabel = useMemo(() => {
    if (!ad.ad_delivery_start_time) return "N/A";
    const start = new Date(ad.ad_delivery_start_time);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? "Ativo hoje" : `Ativo há ${diffDays} dias`;
  }, [ad.ad_delivery_start_time]);

  // Mutação para extração de mídia
  const extractMutation = trpc.ads.extractMedia.useMutation({
    onSuccess: (data) => {
      if (data.result) setMedia(data.result as ExtractionResult);
      setIsExtracting(false);
    },
    onError: () => {
      setIsExtracting(false);
      // Silencioso para não poluir a UI, mas logado para debug
      console.error(`Falha ao extrair mídia para o anúncio ${ad.id}`);
    }
  });

  // Intersection Observer para Lazy Loading de Mídia
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '200px' } // Começa a carregar um pouco antes de aparecer
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Disparar extração apenas quando visível
  useEffect(() => {
    if (isVisible && !media && !isExtracting) {
      setIsExtracting(true);
      extractMutation.mutate({ snapshotUrl: ad.ad_snapshot_url });
    }
  }, [isVisible, media, isExtracting, ad.ad_snapshot_url]);

  // Handlers de Ação
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(urls.official);
    toast.success("Link da biblioteca copiado!");
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!media || !media.url) return;
    const url = Array.isArray(media.url) ? media.url[0] : media.url;
    window.open(url, '_blank');
    toast.info("Abrindo mídia para visualização/download.");
  };

  return (
    <Card 
      ref={cardRef}
      onClick={() => onExpand?.(ad, media)}
      className={cn(
        "overflow-hidden flex flex-col bg-[#0A0A0A] border-white/20 hover:border-white/40",
        "transition-all duration-500 group rounded-xl shadow-2xl cursor-pointer h-full"
      )}
    >
      <AdMediaPreview 
        isVisible={isVisible} 
        media={media} 
        isExtracting={isExtracting} 
        platforms={ad.publisher_platforms || []} 
      />

      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Header Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[11px] uppercase tracking-tight text-white truncate flex-1">
              {ad.page_name}
            </h3>
            <span className="text-[8px] font-bold text-white/20 ml-3 shrink-0">ID: {ad.id}</span>
          </div>
          
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeTimeLabel}
            </div>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-1.5 text-white/40">
              <Calendar className="w-2.5 h-2.5 opacity-50" />
              {ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR') : 'N/A'}
            </div>
          </div>
        </div>

        {/* Ad Body */}
        <p className="text-[10px] leading-relaxed text-white/60 line-clamp-3 font-medium italic min-h-[45px]">
          "{ad.ad_creative_bodies?.[0] || "Sem descrição disponível."}"
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <AdMetricItem 
            icon={Eye} 
            label="Impressões" 
            value={`${ad.impressions?.lower_bound || 0} - ${ad.impressions?.upper_bound || '1k+'}`} 
          />
          <AdMetricItem 
            icon={Repeat} 
            label="Frequência" 
            value={`${ad.frequency || 1} Anúncios`} 
          />
          <AdMetricItem 
            icon={Package} 
            label="Tipo" 
            value={ad.detectedTypes?.[0] || 'Outros'} 
          />
          <AdMetricItem 
            icon={Layers} 
            label="Funil" 
            value={ad.detectedFunnels?.[0] || 'Indefinido'} 
          />
        </div>

        {/* Main CTA */}
        <div className="pt-2">
          <Button 
            className={cn(
              "w-full h-10 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10",
              "text-white font-black text-[10px] uppercase tracking-widest",
              "flex items-center justify-between px-4 group/cta transition-all"
            )}
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={urls.destination} target="_blank" rel="noreferrer">
              <span>{ctaText}</span>
              <MousePointer2 className="w-3.5 h-3.5 text-white/40 group-hover/cta:text-white transition-colors" />
            </a>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-9 bg-transparent text-white hover:bg-white/10 border border-white/20 rounded-lg font-black text-[9px] uppercase tracking-[0.1em]"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={urls.official} target="_blank" rel="noreferrer">
              Biblioteca <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="w-9 h-9 bg-transparent border-white/20 rounded-lg shrink-0 hover:bg-white/5" 
            onClick={handleCopyLink}
            title="Copiar link da biblioteca"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>

          {media && (
            <Button 
              variant="outline" 
              size="icon" 
              className="w-9 h-9 bg-transparent border-white/20 rounded-lg shrink-0 hover:bg-white/5" 
              onClick={handleDownload}
              title="Ver mídia original"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

AdCardV3.displayName = "AdCardV3";
