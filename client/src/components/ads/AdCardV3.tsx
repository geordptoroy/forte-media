import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ExternalLink, Calendar, Users, Eye, Globe, Play, Loader2, Image as ImageIcon, Layers, AlertCircle, Share2, Link as LinkIcon, Tag, Package, Repeat, Download, Clock, Maximize2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface AdCardProps {
  ad: any;
  onExpand?: (ad: any, media: ExtractionResult | null) => void;
}

interface ExtractionResult {
  type: 'video' | 'image' | 'carousel' | 'unknown';
  url: string | string[];
  thumbnail?: string;
}

export function AdCardV3({ ad, onExpand }: AdCardProps) {
  const [media, setMedia] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const officialLibraryUrl = `https://www.facebook.com/ads/library/?id=${ad.id}`;

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

  useEffect(() => {
    if (isVisible && !media && !isExtracting) {
      setIsExtracting(true);
      extractMutation.mutate({ snapshotUrl: ad.ad_snapshot_url });
    }
  }, [isVisible]);

  const platforms = ad.publisher_platforms || [];
  const body = ad.ad_creative_bodies?.[0] || "Sem descrição disponível.";

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(officialLibraryUrl);
    toast.success("Link da biblioteca copiado!");
  };

  const downloadMedia = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!media || !media.url) return;
    
    const url = Array.isArray(media.url) ? media.url[0] : media.url;
    const extension = media.type === 'video' ? 'mp4' : 'jpg';
    const fileName = `ad-${ad.id}.${extension}`;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("Download iniciado!");
    } catch (error) {
      window.open(url, '_blank');
      toast.info("Abrindo mídia em nova aba para download.");
    }
  };

  const calculateActiveTime = (startTime: string) => {
    if (!startTime) return "N/A";
    const start = new Date(startTime);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) return "Ativo agora";
      return `Ativo há ${diffHours}h`;
    }
    return `Ativo há ${diffDays} dias`;
  };
  
  const renderMedia = () => {
    if (!isVisible) return null;

    if (media) {
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
    }

    if (isExtracting) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="relative flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 animate-pulse">
                Sincronizando
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-white/[0.02]">
        <AlertCircle className="w-5 h-5 text-white/10" />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExtracting(true);
            extractMutation.mutate({ snapshotUrl: ad.ad_snapshot_url });
          }}
          className="text-[8px] font-bold text-white/40 hover:text-white underline uppercase tracking-tighter transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  };
  
  return (
    <Card 
      ref={cardRef}
      onClick={() => onExpand?.(ad, media)}
      className="overflow-hidden flex flex-col bg-[#0A0A0A] border-white/[0.06] hover:border-white/20 transition-all duration-500 group rounded-xl shadow-2xl cursor-pointer"
    >
      {/* Media Preview Container */}
      <div className="aspect-[4/5] bg-white/[0.02] relative flex items-center justify-center border-b border-white/[0.06] overflow-hidden">
        {renderMedia()}
        
        {/* Top Overlay Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {platforms.map((p: string) => (
            <Badge key={p} variant="secondary" className="bg-black/80 backdrop-blur-md text-[7px] px-2 py-0.5 border-white/10 uppercase font-black rounded-md">
              {p}
            </Badge>
          ))}
        </div>

        {media && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-white text-black text-[7px] px-2 py-0.5 uppercase font-black border-none rounded-md shadow-lg">
              {media.type === 'video' && <Play className="w-2 h-2 mr-1 fill-black" />}
              {media.type === 'image' && <ImageIcon className="w-2 h-2 mr-1" />}
              {media.type === 'carousel' && <Layers className="w-2 h-2 mr-1" />}
              {media.type}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[11px] uppercase tracking-tight text-white truncate flex-1 group-hover:text-white/90 transition-colors">
              {ad.page_name}
            </h3>
            <span className="text-[8px] font-bold text-white/20 ml-3 tabular-nums">ID: {ad.id}</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {calculateActiveTime(ad.ad_delivery_start_time)}
            </div>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-1.5 text-white/40">
              <Calendar className="w-2.5 h-2.5 opacity-50" />
              {ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR') : 'N/A'}
            </div>
          </div>
        </div>

        <div className="relative">
          <p className="text-[10px] leading-relaxed text-white/60 line-clamp-3 font-medium italic group-hover:text-white/80 transition-colors">
            "{body}"
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1 group-hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Eye className="w-2.5 h-2.5" /> Impressões
            </div>
            <p className="text-[10px] font-black text-white tabular-nums">
              {ad.impressions?.lower_bound || 0} - {ad.impressions?.upper_bound || '1k+'}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1 group-hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Repeat className="w-2.5 h-2.5" /> Frequência
            </div>
            <p className="text-[10px] font-black text-white tabular-nums">
              {ad.frequency || 1} Anúncios
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1 group-hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Package className="w-2.5 h-2.5" /> Tipo
            </div>
            <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
              {ad.detectedProductType || 'Infoproduto'}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1 group-hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Tag className="w-2.5 h-2.5" /> Nicho
            </div>
            <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
              {ad.detectedNiche || 'Outros'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-9 bg-transparent text-white hover:bg-white/10 border border-white/20 hover:border-white/60 rounded-lg font-black text-[9px] uppercase tracking-[0.1em] transition-all active:scale-95"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={officialLibraryUrl} target="_blank" rel="noreferrer">
              Analisar Criativo <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="w-9 h-9 bg-transparent hover:bg-white/10 border border-white/20 hover:border-white/60 rounded-lg text-white transition-all active:scale-95"
            onClick={copyToClipboard}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>

          {media && (
            <Button 
              variant="outline" 
              size="icon" 
              className="w-9 h-9 bg-transparent hover:bg-white/10 border border-white/20 hover:border-white/60 rounded-lg text-white transition-all active:scale-95"
              onClick={downloadMedia}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
