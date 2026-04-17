import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ExternalLink, Calendar, Eye, Play, Loader2, Image as ImageIcon, Layers, AlertCircle, Link as LinkIcon, Package, Repeat, Download, MousePointer2, Tag } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";

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
  const destinationUrl = ad.destination_url || officialLibraryUrl;

  // Lógica de CTA Inteligente
  const getCtaText = () => {
    const funnels = ad.detectedFunnels || [];
    // Se for X1 ou TypeBot, forçamos "Saiba Mais" conforme solicitado
    if (funnels.includes("X1") || funnels.includes("Type Bot")) return "Saiba Mais";
    return ad.ad_creative_link_titles?.[0] || "Saiba Mais";
  };

  const extractMutation = trpc.ads.extractMedia.useMutation({
    onSuccess: (data) => {
      if (data.result) setMedia(data.result as ExtractionResult);
      setIsExtracting(false);
    },
    onError: () => setIsExtracting(false)
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
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !media && !isExtracting) {
      setIsExtracting(true);
      extractMutation.mutate({ snapshotUrl: ad.ad_snapshot_url });
    }
  }, [isVisible]);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(officialLibraryUrl);
    toast.success("Link da biblioteca copiado!");
  };

  const downloadMedia = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!media || !media.url) return;
    const url = Array.isArray(media.url) ? media.url[0] : media.url;
    window.open(url, '_blank');
    toast.info("Abrindo mídia para download.");
  };

  const calculateActiveTime = (startTime: string) => {
    if (!startTime) return "N/A";
    const start = new Date(startTime);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? "Ativo hoje" : `Ativo há ${diffDays} dias`;
  };
  
  return (
    <Card 
      ref={cardRef}
      onClick={() => onExpand?.(ad, media)}
      className="overflow-hidden flex flex-col bg-[#0A0A0A] border-white/[0.06] hover:border-white/20 transition-all duration-500 group rounded-xl shadow-2xl cursor-pointer"
    >
      {/* Media Preview */}
      <div className="aspect-[4/5] bg-white/[0.02] relative flex items-center justify-center border-b border-white/[0.06] overflow-hidden">
        {isVisible && media ? (
          media.type === 'video' ? (
            <video src={media.url as string} className="w-full h-full object-cover" controls muted loop poster={media.thumbnail} />
          ) : (
            <img src={Array.isArray(media.url) ? media.url[0] : media.url} className="w-full h-full object-cover" alt="Ad" loading="lazy" />
          )
        ) : isExtracting ? (
          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
        ) : (
          <AlertCircle className="w-5 h-5 text-white/10" />
        )}
        
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {(ad.publisher_platforms || []).map((p: string) => (
            <Badge key={p} variant="secondary" className="bg-black/80 backdrop-blur-md text-[7px] px-2 py-0.5 border-white/10 uppercase font-black rounded-md">
              {p}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[11px] uppercase tracking-tight text-white truncate flex-1">{ad.page_name}</h3>
            <span className="text-[8px] font-bold text-white/20 ml-3">ID: {ad.id}</span>
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

        <p className="text-[10px] leading-relaxed text-white/60 line-clamp-3 font-medium italic">
          "{ad.ad_creative_bodies?.[0] || "Sem descrição."}"
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Eye className="w-2.5 h-2.5" /> Impressões
            </div>
            <p className="text-[10px] font-black text-white">
              {ad.impressions?.lower_bound || 0} - {ad.impressions?.upper_bound || '1k+'}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Repeat className="w-2.5 h-2.5" /> Frequência
            </div>
            <p className="text-[10px] font-black text-white">{ad.frequency || 1} Anúncios</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Package className="w-2.5 h-2.5" /> Tipo
            </div>
            <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
              {ad.detectedTypes?.[0] || 'Outros'}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-[7px] font-black text-white/30 uppercase tracking-widest">
              <Layers className="w-2.5 h-2.5" /> Funil
            </div>
            <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
              {ad.detectedFunnels?.[0] || 'Indefinido'}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <Button 
            className="w-full h-10 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-between px-4 group/cta transition-all"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={destinationUrl} target="_blank" rel="noreferrer">
              <span>{getCtaText()}</span>
              <MousePointer2 className="w-3.5 h-3.5 text-white/40 group-hover/cta:text-white transition-colors" />
            </a>
          </Button>
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-9 bg-transparent text-white hover:bg-white/10 border border-white/20 rounded-lg font-black text-[9px] uppercase tracking-[0.1em]"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={officialLibraryUrl} target="_blank" rel="noreferrer">
              Biblioteca <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
          
          <Button variant="outline" size="icon" className="w-9 h-9 bg-transparent border-white/20 rounded-lg" onClick={copyToClipboard}>
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>

          {media && (
            <Button variant="outline" size="icon" className="w-9 h-9 bg-transparent border-white/20 rounded-lg" onClick={downloadMedia}>
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
