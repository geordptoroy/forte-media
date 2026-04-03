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
import { Heart, Eye, TrendingUp, DollarSign, Activity, Calendar, ExternalLink, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardProps {
  ad: any;
}

export const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  const [open, setOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isMonitored, setIsMonitored] = useState(false);

  const addFavoriteMutation = trpc.ads.addFavorite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsFavorited(true);
        toast.success('Adicionado aos favoritos');
      } else {
        toast.error(data.error || 'Erro ao adicionar favorito');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao adicionar favorito');
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
    if (isFavorited) {
      toast.info('Anúncio já está nos favoritos');
      return;
    }
    
    // Normalize fields from Meta API
    const adId = ad.id || ad.ad_archive_id;
    const pageId = ad.page_id;
    
    if (!adId || !pageId) {
      toast.error('Dados do anúncio incompletos');
      return;
    }

    addFavoriteMutation.mutate({
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

  const displayImage = ad.ad_snapshot_url || "/placeholder-ad.png";
  const displayBody = ad.ad_creative_bodies?.[0] || "Nenhum texto detectado para este criativo.";

  return (
    <>
      <Card 
        onClick={() => setOpen(true)}
        className="card-premium bg-white/[0.02] border-white/5 overflow-hidden group hover:border-white/20 transition-all cursor-pointer flex flex-col h-full"
      >
        {/* Media Preview */}
        <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
          <img
            src={displayImage}
            alt={ad.page_name || "Ad Creative"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-ad.png"; 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="text-[8px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-widest">
              {ad.publisher_platforms?.[0] || 'Meta'}
            </span>
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleFavorite}
              className={cn(
                "w-8 h-8 rounded-full backdrop-blur-xl border border-white/10",
                isFavorited ? "bg-red-500 text-white border-red-500" : "bg-black/40 text-white hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", isFavorited && "fill-current")} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleMonitor}
              className={cn(
                "w-8 h-8 rounded-full backdrop-blur-xl border border-white/10",
                isMonitored ? "bg-blue-500 text-white border-blue-500" : "bg-black/40 text-white hover:bg-white/20"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-sm text-white truncate pr-2 group-hover:text-primary-foreground transition-colors">
              {ad.page_name || 'Meta Advertiser'}
            </h3>
            <span className="flex items-center gap-1 text-[8px] font-bold text-green-500 uppercase tracking-widest shrink-0">
              <Activity className="w-2.5 h-2.5" /> Ativo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1">
                <DollarSign className="w-2.5 h-2.5" /> Gasto
              </p>
              <p className="text-xs font-bold text-gray-300">
                {ad.spend?.range || ad.spend || 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" /> Alcance
              </p>
              <p className="text-xs font-bold text-gray-300">
                {ad.impressions?.range || ad.impressions || 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> {ad.ad_delivery_start_time ? 'Iniciado' : 'N/A'}
            </p>
            <Button 
              variant="ghost" 
              className="h-6 px-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white group-hover:bg-white/5"
            >
              Detalhes <ExternalLink className="w-2.5 h-2.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border-white/10 max-w-2xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">
            {/* Left: Preview */}
            <div className="w-full md:w-1/2 bg-white/[0.02] flex items-center justify-center p-6 border-r border-white/5">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={displayImage}
                  alt={ad.page_name || "Ad Creative"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-ad.png";
                  }}
                />
              </div>
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-8 flex flex-col">
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-primary-foreground" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Inteligência Criativa</span>
                </div>
                <DialogTitle className="text-2xl font-bold text-white tracking-tight leading-tight">
                  {ad.page_name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Gasto Estimado</p>
                    <p className="text-lg font-bold text-white">{ad.spend?.range || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Impressões</p>
                    <p className="text-lg font-bold text-primary-foreground">{ad.impressions?.range || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Copy do Criativo</p>
                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 italic text-sm text-gray-400 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                    "{displayBody}"
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex gap-3">
                <Button
                  onClick={handleFavorite}
                  className={cn(
                    "flex-1 h-12 font-bold uppercase tracking-widest text-[10px]",
                    isFavorited ? "bg-red-500 hover:bg-red-600 text-white" : "btn-premium"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5 mr-2", isFavorited && "fill-current")} />
                  {isFavorited ? 'Salvo' : 'Salvar'}
                </Button>
                <Button
                  onClick={handleMonitor}
                  variant="outline"
                  className={cn(
                    "flex-1 h-12 font-bold uppercase tracking-widest text-[10px] border-white/10 hover:bg-white/5",
                    isMonitored && "text-blue-400 border-blue-500/20 bg-blue-500/5"
                  )}
                >
                  <Eye className="w-3.5 h-3.5 mr-2" />
                  {isMonitored ? 'Monitorando' : 'Monitorar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
