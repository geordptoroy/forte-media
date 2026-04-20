import { useMemo, memo, useState, useRef, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  ExternalLink, Calendar, Eye, Loader2, Layers, 
  AlertCircle, Link as LinkIcon, Package, Repeat, 
  Download, MousePointer2, TrendingUp, Flame
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { type ExtractionResult } from "../../types/adTypes";

interface AdCardProps {
  ad: any;
  onExpand?: (ad: any, media: ExtractionResult | null) => void;
}

// --- SUB-COMPONENTES MEMOIZADOS PARA PERFORMANCE ---

const AdMediaPreview = memo(({ isVisible, media, isExtracting, platforms, collationCount }: { 
  isVisible: boolean, 
  media: ExtractionResult | null, 
  isExtracting: boolean,
  platforms: string[],
  collationCount?: number
}) => {
  const { t } = useTranslation();
  const scaleInfo = useMemo(() => {
    const count = collationCount || 1;
    if (count >= 40) return { color: "bg-red-600 text-white shadow-red-500/50", icon: <Flame className="w-3 h-3 animate-bounce" />, label: t('viral_scale') };
    if (count >= 20) return { color: "bg-orange-500 text-white shadow-orange-500/50", icon: <TrendingUp className="w-3 h-3" />, label: t('high_scale') };
    if (count >= 10) return { color: "bg-emerald-500 text-white shadow-emerald-500/50", icon: <Repeat className="w-3 h-3" />, label: t('medium_scale') };
    return { color: "bg-blue-500 text-white shadow-blue-500/50", icon: null, label: t('low_scale') };
  }, [collationCount, t]);

  return (
  <div className="aspect-[4/5] bg-white/[0.02] relative flex items-center justify-center border-b border-white/[0.06] overflow-hidden">
    {isVisible && media ? (
      media.type === 'video' ? (
        <video 
          src={Array.isArray(media.url) ? media.url[0] : media.url} 
          className="w-full h-full object-cover" 
          controls 
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
    
    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
      <div className="flex gap-1.5">
        {platforms.map((p) => (
          <Badge key={p} variant="secondary" className="bg-black/80 backdrop-blur-md text-[7px] px-2 py-0.5 border-white/10 uppercase font-black rounded-md">
            {p}
          </Badge>
        ))}
      </div>
      {(collationCount || 1) > 1 && (
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg shadow-xl border border-white/20 backdrop-blur-md transition-all duration-500 animate-in fade-in slide-in-from-left-2",
          scaleInfo.color
        )}>
          {scaleInfo.icon}
          <span className="text-[9px] font-black uppercase tracking-tighter">
            {collationCount} {t('ads_in_scale')}
          </span>
        </div>
      )}
    </div>
  </div>
  );
});

const AdMetricItem = memo(({ icon: Icon, label, value, highlight }: { icon: any, label: string, value: string | number, highlight?: boolean }) => (
  <div className={cn(
    "bg-white/[0.03] border p-2.5 rounded-lg space-y-1 transition-colors",
    highlight ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/[0.05]"
  )}>
    <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
      <Icon className={cn("w-2.5 h-2.5", highlight && "text-emerald-500")} /> {label}
    </div>
    <p className={cn(
      "text-[10px] font-black truncate uppercase tracking-tighter",
      highlight ? "text-emerald-400" : "text-white"
    )}>
      {value}
    </p>
  </div>
));

// --- COMPONENTE PRINCIPAL ---

export const AdCardV3 = memo(({ ad, onExpand }: AdCardProps) => {
  const { t } = useTranslation();
  const [media, setMedia] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const urls = useMemo(() => {
    const official = `https://www.facebook.com/ads/library/?id=${ad.id}`;
    const destination = media?.ctaLink || (ad.destination_url && ad.destination_url !== official ? ad.destination_url : official);
    return { official, destination };
  }, [ad.id, ad.destination_url, media?.ctaLink]);

  const ctaText = useMemo(() => {
    const funnels = ad.detectedFunnels || [];
    if (funnels.includes("X1") || funnels.includes("Type Bot")) return "Saiba Mais";
    return media?.title || ad.ad_creative_link_titles?.[0] || "Saiba Mais";
  }, [ad.detectedFunnels, ad.ad_creative_link_titles, media?.title]);

  const activeTimeLabel = useMemo(() => {
    if (!ad.ad_delivery_start_time) return "N/A";
    const start = new Date(ad.ad_delivery_start_time);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? t('active_today') : `${diffDays} ${t('active_days')}`;
  }, [ad.ad_delivery_start_time, t]);

  const extractMutation = trpc.ads.extractMedia.useMutation({
    onSuccess: (data) => {
      if (data.result) setMedia(data.result as ExtractionResult);
      setIsExtracting(false);
    },
    onError: () => {
      setIsExtracting(false);
      console.error(`Falha ao extrair mídia para o anúncio ${ad.id}`);
    }
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !media && !isExtracting) {
      setIsExtracting(true);
      extractMutation.mutate({ snapshotUrl: ad.ad_snapshot_url });
    }
  }, [isVisible, media, isExtracting, ad.ad_snapshot_url]);

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
        "transition-all duration-500 group rounded-xl shadow-2xl cursor-pointer h-full",
        (ad.collationCount || 1) > 10 && "shadow-[0_0_20px_rgba(16,185,129,0.05)] border-emerald-500/20",
        (ad.collationCount || 1) > 40 && "shadow-[0_0_30px_rgba(239,68,68,0.1)] border-red-500/20"
      )}
    >
      <AdMediaPreview 
        isVisible={isVisible} 
        media={media} 
        isExtracting={isExtracting} 
        platforms={ad.publisher_platforms || []} 
        collationCount={ad.collationCount}
      />

      <div className="p-5 flex-1 flex flex-col space-y-4">
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
              {ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-white/60 line-clamp-3 font-medium italic min-h-[45px]">
          "{ad.ad_creative_bodies?.[0] || "Sem descrição disponível."}"
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <AdMetricItem 
            icon={Eye} 
            label="Impressões" 
            value={`${ad.impressions?.lower_bound || 0} - ${ad.impressions?.upper_bound || '1k+'}`} 
          />
          <AdMetricItem 
            icon={Repeat} 
            label={t('copies')} 
            value={`${ad.collationCount || 1}`} 
            highlight={(ad.collationCount || 1) > 1}
          />
          <AdMetricItem 
            icon={Package} 
            label={t('product_type').split(' ')[2]} 
            value={ad.detectedTypes?.[0] || t('others')} 
          />
          <AdMetricItem 
            icon={Layers} 
            label={t('funnel')} 
            value={ad.detectedFunnels?.[0] || 'Indefinido'} 
          />
        </div>

        <div className="pt-2">
          <Button 
            className={cn(
              "w-full h-10 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10",
              "text-white font-black text-[10px] uppercase tracking-widest",
              "flex items-center justify-between px-4 group/cta transition-all"
            )}
            onClick={(e) => {
              e.stopPropagation();
              window.open(urls.destination, '_blank');
            }}
          >
            <span className="group-hover/cta:translate-x-1 transition-transform duration-300">
              {ctaText}
            </span>
            <MousePointer2 className="w-3 h-3 text-white/40 group-hover/cta:text-white transition-colors" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
