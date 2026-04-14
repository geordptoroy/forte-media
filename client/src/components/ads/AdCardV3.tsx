import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ExternalLink, Calendar, Users, Eye, DollarSign, Globe, Play, Loader2, Image as ImageIcon, Layers, AlertCircle } from "lucide-react";
import { trpc } from "../../lib/trpc";

interface AdCardProps {
  ad: any;
}

interface ExtractionResult {
  type: 'video' | 'image' | 'carousel' | 'unknown';
  url: string | string[];
  thumbnail?: string;
}

export function AdCardV3({ ad }: AdCardProps) {
  const [media, setMedia] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const extractMutation = trpc.ads.extractMedia.useMutation({
    onSuccess: (data) => {
      if (data.result) {
        setMedia(data.result as ExtractionResult);
      }
      setIsExtracting(false);
    },
    onError: () => {
      setIsExtracting(false);
    }
  });

  // Intersection Observer para Lazy Loading da extração
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Extração Automática apenas quando visível
  useEffect(() => {
    if (isVisible && !media && !isExtracting) {
      setIsExtracting(true);
      extractMutation.mutate({ snapshotUrl: ad.ad_snapshot_url });
    }
  }, [isVisible]);

  const platforms = ad.publisher_platforms || [];
  const body = ad.ad_creative_bodies?.[0] || "Sem descrição disponível.";
  
  const renderMedia = () => {
    if (!isVisible) return null;

    if (isExtracting) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white/[0.01]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white/5" />
            <div className="absolute inset-0 w-12 h-12 border-t-2 border-white/40 rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 animate-pulse">
              Sincronizando
            </p>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Extraindo Mídia...</p>
          </div>
        </div>
      );
    }

    if (!media) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-white/[0.01]">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white/10" />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
              Mídia Indisponível
            </p>
            <button 
              onClick={() => {
                setIsExtracting(true);
                extractMutation.mutate({ snapshotUrl: ad.ad_snapshot_url });
              }}
              className="text-[8px] font-bold text-white/40 hover:text-white underline uppercase tracking-tighter transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    if (media.type === 'video') {
      return (
        <video 
          src={media.url as string} 
          className="w-full h-full object-cover" 
          controls 
          autoPlay 
          muted 
          loop
          poster={media.thumbnail}
        />
      );
    }

    if (media.type === 'image') {
      return (
        <img 
          src={media.url as string} 
          className="w-full h-full object-cover" 
          alt="Ad Creative"
          loading="lazy"
        />
      );
    }

    if (media.type === 'carousel') {
      const urls = media.url as string[];
      return (
        <div className="relative w-full h-full">
          <img 
            src={urls[0]} 
            className="w-full h-full object-cover" 
            alt="Carousel Start"
            loading="lazy"
          />
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-black/80 backdrop-blur-md text-[9px] font-black border-white/10 px-2 py-0.5 rounded-none">
              <Layers className="w-3 h-3 mr-1.5" /> 1/{urls.length}
            </Badge>
          </div>
        </div>
      );
    }

    return null;
  };
  
  return (
    <Card 
      ref={cardRef}
      className="overflow-hidden flex flex-col bg-black border-white/[0.06] hover:border-white/20 transition-all duration-500 group rounded-none"
    >
      {/* Media Preview Container */}
      <div className="aspect-[4/5] bg-white/[0.02] relative flex items-center justify-center border-b border-white/[0.06] overflow-hidden">
        {renderMedia()}
        
        {/* Platform Badges */}
        <div className="absolute top-4 left-4 flex gap-1.5 z-10">
          {platforms.map((p: string) => (
            <Badge key={p} variant="secondary" className="bg-black/60 backdrop-blur-md text-[8px] px-2 py-0.5 border-white/10 uppercase font-black rounded-none">
              {p}
            </Badge>
          ))}
        </div>

        {/* Media Type Badge */}
        {media && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-white text-black text-[8px] px-2 py-0.5 uppercase font-black border-none rounded-none shadow-lg">
              {media.type === 'video' && <Play className="w-2.5 h-2.5 mr-1.5 fill-black" />}
              {media.type === 'image' && <ImageIcon className="w-2.5 h-2.5 mr-1.5" />}
              {media.type === 'carousel' && <Layers className="w-2.5 h-2.5 mr-1.5" />}
              {media.type}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-tight text-white truncate flex-1 group-hover:text-white/90 transition-colors">
              {ad.page_name}
            </h3>
            <span className="text-[9px] font-bold text-white/20 ml-3 tabular-nums">#{ad.id}</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/40 uppercase tracking-widest">
            <Calendar className="w-3 h-3 opacity-50" />
            Início: {ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR') : 'N/A'}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-white/60 line-clamp-4 font-medium italic group-hover:text-white/80 transition-colors">
          "{body}"
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5 group-hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 text-[8px] font-black text-white/30 uppercase tracking-widest">
              <DollarSign className="w-3 h-3" /> Gasto
            </div>
            <p className="text-[11px] font-black text-white tabular-nums">
              {ad.currency} {ad.spend?.lower_bound || 0} - {ad.spend?.upper_bound || '100+'}
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5 group-hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 text-[8px] font-black text-white/30 uppercase tracking-widest">
              <Eye className="w-3 h-3" /> Impressões
            </div>
            <p className="text-[11px] font-black text-white tabular-nums">
              {ad.impressions?.lower_bound || 0} - {ad.impressions?.upper_bound || '1k+'}
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5 group-hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 text-[8px] font-black text-white/30 uppercase tracking-widest">
              <Users className="w-3 h-3" /> Público
            </div>
            <p className="text-[11px] font-black text-white tabular-nums">
              {ad.estimated_audience_size?.lower_bound || 'N/A'}
            </p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5 group-hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2 text-[8px] font-black text-white/30 uppercase tracking-widest">
              <Globe className="w-3 h-3" /> Região
            </div>
            <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter">
              {ad.delivery_by_region?.[0]?.region || 'Brasil'}
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-10 bg-white text-black hover:bg-white/90 border-none rounded-none font-black text-[10px] uppercase tracking-[0.2em] mt-auto transition-all active:scale-95"
          asChild
        >
          <a href={ad.ad_snapshot_url} target="_blank" rel="noreferrer">
            Analisar Criativo <ExternalLink className="w-3.5 h-3.5 ml-2.5" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
