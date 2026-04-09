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
  Activity,
  Clock,
  ImageOff,
  Image as ImageIcon,
  Video,
  Layers,
  Monitor,
  Globe,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardV3Props {
  ad: any;
  initialIsFavorited?: boolean;
  showIntelligence?: boolean; // Mostrar Score de Escala e Nicho
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

function getScaleColor(score: number): string {
  if (score >= 70) return 'from-emerald-600 to-emerald-400'; // Massiva - Verde
  if (score >= 40) return 'from-yellow-600 to-yellow-400'; // Alta - Amarelo
  if (score >= 20) return 'from-blue-600 to-blue-400'; // Média - Azul
  return 'from-zinc-600 to-zinc-400'; // Teste - Cinza
}

function getScaleLabel(score: number): string {
  if (score >= 70) return 'Massiva';
  if (score >= 40) return 'Alta';
  if (score >= 20) return 'Média';
  return 'Teste';
}

function getNicheColor(niche: string): string {
  const colors: Record<string, string> = {
    'Infoproduto': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Nutra': 'bg-green-500/20 text-green-300 border-green-500/30',
    'SaaS': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'E-commerce': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Imobiliário': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Geral': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  };
  return colors[niche] || colors['Geral'];
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

function AdPreviewFrameV3({ ad }: { ad: any }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Prioridade: CDN URLs > Direct Images > Snapshot URL
  const cdnVideoUrl = ad.cdn_video_url || ad.cdnVideoUrl;
  const cdnImageUrl = ad.cdn_image_url || ad.cdnImageUrl;
  const cdnThumbnailUrl = ad.cdn_thumbnail_url || ad.cdnThumbnailUrl;
  const snapshotUrl = ad.ad_snapshot_url;
  const directImageUrl =
    ad.ad_creative_images?.[0]?.url ||
    ad.ad_creative_videos?.[0]?.thumbnail_url ||
    null;

  // Mostrar vídeo CDN se disponível
  if (cdnVideoUrl) {
    return (
      <video
        src={cdnVideoUrl}
        poster={cdnThumbnailUrl}
        className="w-full h-full object-cover"
        controls
        loading="lazy"
      />
    );
  }

  // Mostrar imagem CDN se disponível
  if (cdnImageUrl) {
    return (
      <img
        src={cdnImageUrl}
        alt={ad.page_name || 'Criativo'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    );
  }

  // Fallback para imagem direta
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

  // Fallback para snapshot (com iframe)
  if (snapshotUrl && !iframeError) {
    return (
      <div className="relative w-full h-full bg-zinc-950">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950">
            <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
            <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">Conectando Meta...</p>
          </div>
        )}
        <iframe
          src={snapshotUrl}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-700",
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

  // Sem mídia disponível
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 gap-3 border border-dashed border-zinc-800 rounded-lg m-2">
      <ImageOff className="w-6 h-6 text-zinc-700" />
      <div className="text-center px-4">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Preview Indisponível</p>
        <p className="text-[9px] text-zinc-700 mt-1">Nenhuma mídia disponível.</p>
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
  showIntelligence = false 
}) => {
  const [open, setOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

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

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const adId = ad.id || ad.ad_archive_id || ad.adId;
    const pageId = ad.page_id || ad.pageId;
    if (!adId || !pageId) { 
      toast.error('Dados do anúncio incompletos'); 
      return; 
    }
    toggleFavoriteMutation.mutate({ adId, pageId, pageName: ad.page_name || ad.pageName });
  };

  const copy = ad.ad_creative_bodies?.[0] || ad.adCreativeBodies?.[0] || ad.body || '';
  const daysActive = ad.days_active || ad.daysActive || calculateDaysActive(ad.ad_delivery_start_time || ad.adDeliveryStartTime, ad.ad_delivery_stop_time || ad.adDeliveryStopTime);
  const isStillActive = !(ad.ad_delivery_stop_time || ad.adDeliveryStopTime);
  const platforms = ad.publisher_platforms || ad.publisherPlatforms || [];
  const mediaType = ad.media_type;
  const adId = ad.id || ad.ad_archive_id || ad.adId;
  const snapshotUrl = ad.ad_snapshot_url || ad.adSnapshotUrl;

  // Inteligência
  const scaleScore = ad.scale_score || ad.scaleScore || 0;
  const scaleLevelLabel = ad.scale_level_label || ad.scaleLevelLabel || getScaleLabel(scaleScore);
  const niche = ad.niche || 'Geral';
  const isScaledAd = ad.is_scaled_ad || ad.isScaledAd || scaleScore >= 70;

  const scaleGradient = getScaleColor(scaleScore);
  const nicheColorClass = getNicheColor(niche);

  return (
    <>
      <div
        className={cn(
          "group relative bg-[#0a0a0a] rounded-2xl overflow-hidden border transition-all duration-500 flex flex-col shadow-2xl cursor-pointer",
          isScaledAd && showIntelligence 
            ? "border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10" 
            : "border-white/[0.05] hover:border-white/[0.15]"
        )}
        onClick={() => setOpen(true)}
      >
        <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
          <AdPreviewFrameV3 ad={ad} />

          {/* Overlay com badges */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between z-10">
            {/* Nicho Badge (Esquerda) */}
            {showIntelligence && niche !== 'Geral' ? (
              <div className={cn("flex items-center gap-1.5 px-2 py-1 border rounded-full backdrop-blur-md", nicheColorClass)}>
                <Tag className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {niche}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                {getMediaTypeIcon(mediaType)}
                <span className="text-[9px] font-black text-white uppercase tracking-widest">
                  {mediaType || 'AD'}
                </span>
              </div>
            )}

            {/* Status Badge (Direita) */}
            {isStillActive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
              </div>
            )}
          </div>

          {/* Termômetro de Escala (Fundo) */}
          {showIntelligence && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-900/50 border-t border-white/10">
              <div
                className={cn(
                  "h-full bg-gradient-to-r transition-all duration-500 shadow-lg",
                  scaleGradient
                )}
                style={{ width: `${scaleScore}%` }}
              />
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/[0.06] flex items-center justify-center text-[10px] font-black text-white shrink-0">
              {ad.page_name?.charAt(0)?.toUpperCase() || ad.pageName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <p className="text-xs font-black text-white truncate">{ad.page_name || ad.pageName || 'Página Desconhecida'}</p>
          </div>

          {copy && (
            <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{copy}</p>
          )}

          {/* Inteligência: Score e Nível */}
          {showIntelligence && scaleScore > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/20 border border-white/[0.05]">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-zinc-500" />
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Escala:</span>
                <span className={cn(
                  "text-[10px] font-black uppercase",
                  scaleScore >= 70 ? "text-emerald-400" :
                  scaleScore >= 40 ? "text-yellow-400" :
                  scaleScore >= 20 ? "text-blue-400" : "text-zinc-400"
                )}>
                  {scaleLevelLabel} ({scaleScore})
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-auto">
            <MetricItem
              icon={<Clock className="w-2.5 h-2.5" />}
              label="Dias Ativo"
              value={daysActive > 0 ? `${daysActive}d` : '—'}
              valueClass="text-zinc-100"
            />
            <MetricItem
              icon={<Activity className="w-2.5 h-2.5" />}
              label="Status"
              value={isStillActive ? 'Ativo' : 'Inativo'}
              valueClass={isStillActive ? 'text-emerald-400' : 'text-zinc-600'}
            />
            <MetricItem
              icon={getMediaTypeIcon(mediaType)}
              label="Formato"
              value={mediaType || '—'}
              valueClass="text-zinc-100"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-1 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleFavorite}
            disabled={toggleFavoriteMutation.isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 border",
              isFavorited
                ? "bg-white text-black border-white"
                : "bg-zinc-900/50 border-white/[0.05] text-zinc-400 hover:text-white hover:border-white/[0.1] hover:bg-zinc-800"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isFavorited && "fill-current")} />
            {isFavorited ? 'Salvo' : 'Salvar'}
          </button>
          {snapshotUrl && (
            <a
              href={snapshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/[0.05] text-zinc-400 hover:text-white hover:border-white/[0.1] hover:bg-zinc-800 transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Modal de detalhes */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 border-white/[0.1] bg-black shadow-[0_0_50px_rgba(0,0,0,1)]">
          <div className="flex h-[85vh]">
            <div className="w-3/5 border-r border-white/[0.05] bg-zinc-950 flex flex-col relative">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                  Live Preview
                </span>
                {showIntelligence && niche !== 'Geral' && (
                  <span className={cn("px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md", nicheColorClass)}>
                    {niche}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <AdPreviewFrameV3 ad={ad} />
              </div>
              {/* Termômetro no modal */}
              {showIntelligence && (
                <div className="h-2 bg-zinc-900/50 border-t border-white/10">
                  <div
                    className={cn("h-full bg-gradient-to-r transition-all duration-500", scaleGradient)}
                    style={{ width: `${scaleScore}%` }}
                  />
                </div>
              )}
            </div>
            <div className="w-2/5 overflow-y-auto p-8 space-y-8 bg-[#050505]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-xl font-black text-white">
                  {(ad.page_name || ad.pageName)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">{ad.page_name || ad.pageName}</h2>
                  <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Meta ID: {adId}</p>
                </div>
              </div>

              {/* Inteligência no Modal */}
              {showIntelligence && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inteligência de Escala</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Score de Escala</p>
                      <p className={cn(
                        "text-sm font-black",
                        scaleScore >= 70 ? "text-emerald-400" :
                        scaleScore >= 40 ? "text-yellow-400" :
                        scaleScore >= 20 ? "text-blue-400" : "text-zinc-400"
                      )}>
                        {scaleScore}/100
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Nível</p>
                      <p className={cn(
                        "text-sm font-black uppercase",
                        scaleScore >= 70 ? "text-emerald-400" :
                        scaleScore >= 40 ? "text-yellow-400" :
                        scaleScore >= 20 ? "text-blue-400" : "text-zinc-400"
                      )}>
                        {scaleLevelLabel}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Nicho</p>
                      <p className="text-sm font-black text-white">{niche}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Dias Ativo</p>
                      <p className="text-sm font-black text-white">{daysActive}d</p>
                    </div>
                  </div>
                </div>
              )}

              {copy && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Creative Copy</p>
                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.03] text-zinc-300 text-xs leading-relaxed italic">
                    "{copy}"
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dados de Veiculação</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Tempo de Veiculação</p>
                    <p className="text-sm font-black text-white">{daysActive} Dias</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Status Atual</p>
                    <p className={cn("text-sm font-black", isStillActive ? "text-emerald-400" : "text-zinc-500")}>
                      {isStillActive ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Formato</p>
                    <p className="text-sm font-black text-white">{mediaType || '—'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.03]">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Plataformas</p>
                    <p className="text-sm font-black text-white">{platforms.join(', ') || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timeline</p>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{formatDateShort(ad.ad_delivery_start_time || ad.adDeliveryStartTime)}</span>
                  </div>
                  <div className="h-px flex-1 bg-zinc-800" />
                  <div className="flex items-center gap-2">
                    {isStillActive ? (
                      <span className="text-emerald-500 font-black uppercase text-[9px]">Live Now</span>
                    ) : (
                      <span>{formatDateShort(ad.ad_delivery_stop_time || ad.adDeliveryStopTime)}</span>
                    )}
                  </div>
                </div>
              </div>

              {ad.ad_reached_countries && ad.ad_reached_countries.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Países Alcançados</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Globe className="w-3.5 h-3.5 text-zinc-600" />
                    {ad.ad_reached_countries.map((c: string) => (
                      <span key={c} className="px-2 py-0.5 bg-zinc-900 border border-white/[0.04] rounded text-[9px] font-black text-zinc-400 uppercase">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={snapshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-transform shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              >
                <ExternalLink className="w-4 h-4" />
                Ver na Biblioteca Meta
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
