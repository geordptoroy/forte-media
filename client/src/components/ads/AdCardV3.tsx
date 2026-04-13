import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Heart,
  Calendar,
  ExternalLink,
  Clock,
  ImageOff,
  Image as ImageIcon,
  Video,
  Layers,
  Monitor,
  Globe,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardV3Props {
  ad: any;
  initialIsFavorited?: boolean;
  showIntelligence?: boolean;
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return '—';
  }
}

function calculateDaysActive(startTime?: string, stopTime?: string): number {
  if (!startTime) return 0;
  try {
    const start = new Date(startTime).getTime();
    const end = stopTime ? new Date(stopTime).getTime() : Date.now();
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function getMediaTypeIcon(mediaType?: string) {
  switch (mediaType?.toUpperCase()) {
    case 'VIDEO':
      return <Video className="w-3 h-3" />;
    case 'IMAGE':
      return <ImageIcon className="w-3 h-3" />;
    case 'CAROUSEL':
      return <Layers className="w-3 h-3" />;
    default:
      return <Monitor className="w-3 h-3" />;
  }
}

/**
 * AdPreviewFrameV3 - Exibe o criativo do anúncio.
 * Prioriza o iframe da snapshot_url para garantir que o criativo (imagem ou vídeo) apareça.
 */
function AdPreviewFrameV3({ ad, isModal = false }: { ad: any; isModal?: boolean }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const snapshotUrl = ad.ad_snapshot_url || ad.adSnapshotUrl;
  
  // Se tivermos a snapshot_url, usamos o iframe para renderizar o criativo oficial da Meta
  if (snapshotUrl && !iframeError) {
    return (
      <div className={cn(
        "relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden",
        !isModal && "pointer-events-none" // Evita interação no card, apenas no modal
      )}>
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950">
            <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Carregando Criativo...</p>
          </div>
        )}
        <iframe
          src={snapshotUrl}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-700 scale-[1.02]",
            iframeLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={`Anuncio: ${ad.page_name}`}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback para imagem direta se houver
  const directImageUrl = ad.ad_creative_images?.[0]?.url || ad.ad_creative_videos?.[0]?.thumbnail_url;
  if (directImageUrl) {
    return (
      <img
        src={directImageUrl}
        alt={ad.page_name || 'Criativo'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 gap-3 border border-dashed border-zinc-800 rounded-lg m-2">
      <ImageOff className="w-6 h-6 text-zinc-700" />
      <div className="text-center px-4">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Preview Indisponível</p>
      </div>
    </div>
  );
}

function MetricItem({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-lg bg-zinc-900/30 border border-white/[0.02]">
      <span className="flex items-center gap-1.5 text-[8px] font-black text-zinc-600 uppercase tracking-widest">
        {icon}
        {label}
      </span>
      <span className={cn("text-[11px] font-black text-zinc-200 leading-tight", valueClass)}>
        {value}
      </span>
    </div>
  );
}

export const AdCardV3: React.FC<AdCardV3Props> = ({ 
  ad, 
  initialIsFavorited = false,
}) => {
  const [open, setOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

  const toggleFavoriteMutation = trpc.ads.toggleFavorite.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsFavorited(data.action === 'added');
        toast.success(data.action === 'added' ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
      }
    },
  });

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const adId = ad.id || ad.ad_archive_id || ad.adId;
    const pageId = ad.page_id || ad.pageId;
    if (!adId || !pageId) return;
    toggleFavoriteMutation.mutate({ 
      adId, 
      pageId, 
      pageName: ad.page_name || ad.pageName,
      adSnapshotUrl: ad.ad_snapshot_url || ad.adSnapshotUrl,
      adData: ad
    });
  };

  const copy = ad.ad_creative_bodies?.[0] || ad.adCreativeBodies?.[0] || ad.body || '';
  const daysActive = calculateDaysActive(ad.ad_delivery_start_time || ad.adDeliveryStartTime, ad.ad_delivery_stop_time || ad.adDeliveryStopTime);
  const isStillActive = !(ad.ad_delivery_stop_time || ad.adDeliveryStopTime);
  const platforms = ad.publisher_platforms || ad.publisherPlatforms || [];
  const mediaType = ad.media_type;

  return (
    <>
      <div
        className="group relative bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/[0.05] hover:border-white/[0.15] transition-all duration-500 flex flex-col shadow-2xl cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {/* Ad Preview Area */}
        <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
          <AdPreviewFrameV3 ad={ad} />

          {/* Overlay Controls */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
              {getMediaTypeIcon(mediaType)}
              <span className="text-[9px] font-black text-white uppercase tracking-widest">
                {mediaType || 'AD'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isStillActive && (
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
                </div>
              )}
              <button
                onClick={handleFavorite}
                className={cn(
                  "p-2 rounded-full border backdrop-blur-md transition-all duration-300",
                  isFavorited 
                    ? "bg-red-500/20 border-red-500/40 text-red-500" 
                    : "bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", isFavorited && "fill-current")} />
              </button>
            </div>
          </div>

          {/* Hover Action */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="px-4 py-2 bg-white text-black rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Ver Detalhes</span>
            </div>
          </div>
        </div>

        {/* Ad Info Area */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-white truncate group-hover:text-white/90 transition-colors uppercase tracking-tight">
                {ad.page_name || ad.pageName || 'Página da Meta'}
              </h3>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                ID: {ad.id || ad.adId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricItem 
              icon={<Clock className="w-2.5 h-2.5" />} 
              label="Duração" 
              value={`${daysActive} dias`} 
            />
            <MetricItem 
              icon={<Globe className="w-2.5 h-2.5" />} 
              label="Plataformas" 
              value={platforms.length > 0 ? platforms.join(', ') : 'Meta'}
              valueClass="truncate"
            />
          </div>

          {copy && (
            <div className="relative">
              <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 italic font-medium">
                "{copy}"
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl bg-black border-white/[0.06] p-0 overflow-hidden gap-0 rounded-none lg:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
            {/* Left: Preview */}
            <div className="lg:w-[45%] bg-zinc-950 flex items-center justify-center min-h-[400px] border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <AdPreviewFrameV3 ad={ad} isModal={true} />
            </div>

            {/* Right: Details */}
            <div className="lg:w-[55%] flex flex-col bg-black overflow-y-auto custom-scrollbar">
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-xl">
                    {getMediaTypeIcon(mediaType)}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-tight">{ad.page_name || ad.pageName}</h2>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Anúncio Oficial Meta</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFavorite}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all",
                      isFavorited 
                        ? "bg-red-500/10 border-red-500/20 text-red-500" 
                        : "bg-white/[0.02] border-white/[0.05] text-zinc-600 hover:text-white"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Status & Timing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5" />
                      Data de Início
                    </div>
                    <p className="text-sm font-black text-white">{formatDateShort(ad.ad_delivery_start_time || ad.adDeliveryStartTime)}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      Tempo Ativo
                    </div>
                    <p className="text-sm font-black text-white">{daysActive} dias</p>
                  </div>
                </div>

                {/* Ad Copy */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] border-l-2 border-white pl-3">Copy do Anúncio</h4>
                  </div>
                  <div className="p-5 bg-zinc-900/50 border border-white/[0.04] rounded-2xl">
                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-medium">
                      {copy || 'Sem texto descritivo.'}
                    </p>
                  </div>
                </div>

                {/* Platforms */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] border-l-2 border-white pl-3">Plataformas de Veiculação</h4>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p: string) => (
                      <span key={p} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-3">
                  <a
                    href={ad.ad_snapshot_url || ad.adSnapshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all rounded-2xl"
                  >
                    Ver na Biblioteca da Meta
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[8px] text-center text-zinc-700 font-bold uppercase tracking-widest">
                    O criativo acima é carregado diretamente dos servidores da Meta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
