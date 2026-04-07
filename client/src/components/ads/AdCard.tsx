import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  Heart, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Calendar, 
  ExternalLink, 
  Shield,
  Play,
  Maximize2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardProps {
  ad: any;
  initialIsFavorited?: boolean;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, initialIsFavorited = false }) => {
  const [open, setOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isMonitored, setIsMonitored] = useState(false);

  const toggleFavoriteMutation = trpc.ads.toggleFavorite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsFavorited(data.action === 'added');
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Erro ao processar favorito');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao processar favorito');
    },
  });

  const addMonitoredMutation = trpc.monitoring.addMonitored.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsMonitored(true);
        toast.success('Monitoramento ativado');
      } else {
        toast.error(data.error || 'Erro ao ativar monitoramento');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao ativar monitoramento');
    },
  });

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const adId = ad.id || ad.ad_archive_id;
    const pageId = ad.page_id;
    
    if (!adId || !pageId) {
      toast.error('Dados do anúncio incompletos');
      return;
    }

    toggleFavoriteMutation.mutate({
      adId,
      pageId,
      pageName: ad.page_name,
      adSnapshotUrl: ad.ad_snapshot_url,
      adDeliveryStartTime: ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time) : undefined,
      adDeliveryStopTime: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : undefined,
      publisherPlatforms: ad.publisher_platforms,
      adCreativeBodies: ad.ad_creative_bodies,
      adCreativeLinkTitles: ad.ad_creative_link_titles,
      adCreativeLinkDescriptions: ad.ad_creative_link_descriptions,
      currency: ad.currency,
      spend: ad.spend,
      impressions: ad.impressions,
    });
  };

  const handleMonitor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMonitored) {
      toast.info('Anúncio já está em monitoramento');
      return;
    }
    
    const adId = ad.id || ad.ad_archive_id;
    const pageId = ad.page_id;
    
    if (!adId || !pageId) {
      toast.error('Dados do anúncio incompletos');
      return;
    }

    addMonitoredMutation.mutate({
      adId,
      pageId,
      pageName: ad.page_name,
    });
  };

  // Helper to safely render spend/impressions and avoid React Error #31
  const renderMetricValue = (value: any) => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'object') {
      if (value.range) return value.range;
      if (value.lower_bound !== undefined && value.upper_bound !== undefined) {
        return `${value.lower_bound.toLocaleString()} - ${value.upper_bound.toLocaleString()}`;
      }
      if (value.min !== undefined) return `${value.min.toLocaleString()}+`;
      return JSON.stringify(value); // Last resort, but should be avoided
    }
    return 'N/A';
  };

  const displayImage = ad.ad_snapshot_url || "/placeholder-ad.png";
  const displayBody = ad.ad_creative_bodies?.[0] || ad.body || "Nenhum texto detectado para este criativo.";
  const isVideo = ad.media_type === 'VIDEO' || (ad.publisher_platforms?.includes('instagram') && !ad.ad_snapshot_url?.includes('.jpg'));

  return (
    <>
      <Card 
        onClick={() => setOpen(true)}
        className="card-premium bg-white/[0.02] border-white/5 overflow-hidden group hover:border-white/20 transition-all cursor-pointer flex flex-col h-full relative"
      >
        {/* Scale Score Indicator (Visual Force Bar) */}
        {ad.scalingScore !== undefined && (
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-10">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                ad.scalingScore > 70 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
                ad.scalingScore > 40 ? "bg-yellow-500" : "bg-blue-500"
              )}
              style={{ width: `${ad.scalingScore}%` }}
            />
          </div>
        )}

        {/* Media Preview */}
        <div className="relative aspect-[4/5] bg-black overflow-hidden">
          <img
            src={displayImage}
            alt={ad.page_name || "Ad Creative"}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-ad.png"; 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80"></div>
          
          {/* Play Icon for Videos */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 text-white fill-current ml-1" />
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <span className="text-[8px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-green-500" /> Ativo
              </span>
              {ad.scalingScore !== undefined && (
                <span className="text-[8px] font-bold px-2 py-1 rounded bg-yellow-500 text-black uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5" /> {ad.scalingScore}% Escala
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleFavorite}
              className={cn(
                "w-9 h-9 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl",
                isFavorited ? "bg-red-500 text-white border-red-500" : "bg-black/60 text-white hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleMonitor}
              className={cn(
                "w-9 h-9 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl",
                isMonitored ? "bg-blue-500 text-white border-blue-500" : "bg-black/60 text-white hover:bg-white/20"
              )}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              asChild
              className="w-9 h-9 rounded-xl backdrop-blur-xl border border-white/10 bg-black/60 text-white hover:bg-white/20 shadow-2xl"
            >
              <a href={ad.ad_snapshot_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-4">
            <p className="text-[10px] font-bold text-white/90 line-clamp-2 leading-relaxed mb-2">
              {displayBody}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center overflow-hidden">
                  <span className="text-[8px] font-bold text-white">
                    {ad.page_name?.charAt(0) || 'M'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
                  {ad.page_name || 'Meta Advertiser'}
                </span>
              </div>
              <div className="flex gap-1">
                {ad.publisher_platforms?.map((p: string) => (
                  <div key={p} className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-[6px] uppercase text-gray-400">{p.charAt(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Footer */}
        <div className="p-4 bg-white/[0.01] border-t border-white/5 grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5" /> Gasto
            </p>
            <p className="text-[11px] font-bold text-gray-300">
              {renderMetricValue(ad.spend)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> Alcance
            </p>
            <p className="text-[11px] font-bold text-gray-300">
              {renderMetricValue(ad.impressions)}
            </p>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border-white/10 max-w-4xl p-0 overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row h-[80vh] md:h-[600px]">
            {/* Left: Preview */}
            <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4 border-r border-white/5 relative">
              <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl flex items-center justify-center bg-white/[0.02]">
                <img
                  src={displayImage}
                  alt={ad.page_name || "Ad Creative"}
                  className="max-w-full max-h-full object-contain"
                />
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Button variant="outline" className="rounded-full w-16 h-16 border-white/20 bg-white/5 backdrop-blur-md">
                      <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </Button>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                  className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/10"
                >
                  <a href={ad.ad_snapshot_url} target="_blank" rel="noopener noreferrer">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    <span className="text-sm font-bold text-white">{ad.page_name?.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{ad.page_name}</h3>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">ID: {ad.id || ad.ad_archive_id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleFavorite}
                    className={cn(
                      "w-9 h-9 rounded-xl border-white/10",
                      isFavorited ? "bg-red-500 text-white border-red-500" : "hover:bg-white/5"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5" /> Gasto Estimado
                  </p>
                  <p className="text-lg font-bold text-white">{renderMetricValue(ad.spend)}</p>
                </div>
                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" /> Alcance
                  </p>
                  <p className="text-lg font-bold text-green-500">{renderMetricValue(ad.impressions)}</p>
                </div>
              </div>

              {ad.scalingReasons && ad.scalingReasons.length > 0 && (
                <div className="mb-8 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                  <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Análise de Escala
                  </p>
                  <ul className="space-y-2">
                    {ad.scalingReasons.map((reason: string, i: number) => (
                      <li key={i} className="text-[11px] text-gray-400 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-yellow-500/50" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Copy do Criativo</p>
                  <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 text-sm text-gray-300 leading-relaxed">
                    {displayBody}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Início da Veiculação</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Plataformas</p>
                    <div className="flex gap-2">
                      {ad.publisher_platforms?.map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[8px] uppercase border-white/10 text-gray-500">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                <Button
                  onClick={handleMonitor}
                  className={cn(
                    "flex-1 h-12 font-bold uppercase tracking-widest text-[10px] rounded-xl",
                    isMonitored ? "bg-blue-500 text-white" : "bg-white text-black hover:bg-gray-200"
                  )}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isMonitored ? 'Monitorando' : 'Monitorar Agora'}
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="flex-1 h-12 font-bold uppercase tracking-widest text-[10px] border-white/10 hover:bg-white/5 rounded-xl"
                >
                  <a href={ad.ad_snapshot_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Biblioteca de Anúncios
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

function Badge({ children, className, variant = "default" }: any) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full font-bold tracking-tighter",
      variant === "outline" ? "border border-current" : "bg-white text-black",
      className
    )}>
      {children}
    </span>
  );
}
