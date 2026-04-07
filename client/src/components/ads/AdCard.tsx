import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Heart,
  Eye,
  TrendingUp,
  DollarSign,
  Calendar,
  ExternalLink,
  Play,
  Maximize2,
  Info,
  Activity,
  Globe,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ImageOff,
  ChevronRight,
  BarChart2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardProps {
  ad: any;
  initialIsFavorited?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderMetricValue(value: any): string {
  if (!value) return 'N/D';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toLocaleString('pt-BR');
  if (typeof value === 'object') {
    if (value.range) return value.range;
    if (value.lower_bound !== undefined && value.upper_bound !== undefined) {
      return `${Number(value.lower_bound).toLocaleString('pt-BR')} – ${Number(value.upper_bound).toLocaleString('pt-BR')}`;
    }
    if (value.min !== undefined && value.max !== undefined) {
      return `${Number(value.min).toLocaleString('pt-BR')} – ${Number(value.max).toLocaleString('pt-BR')}`;
    }
    if (value.min !== undefined) return `${Number(value.min).toLocaleString('pt-BR')}+`;
  }
  return 'N/D';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/D';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'N/D';
  }
}

function getScaleStatus(score?: number): { label: string; color: string; bg: string; border: string; icon: React.ReactNode } {
  if (score === undefined) return { label: 'Sem dados', color: 'text-gray-600', bg: 'bg-transparent', border: 'border-white/[0.06]', icon: <AlertCircle className="w-3 h-3" /> };
  if (score >= 70) return { label: 'Escalado', color: 'text-green-400', bg: 'bg-green-500/[0.06]', border: 'border-green-500/20', icon: <CheckCircle2 className="w-3 h-3" /> };
  if (score >= 40) return { label: 'Em escala', color: 'text-yellow-400', bg: 'bg-yellow-500/[0.06]', border: 'border-yellow-500/20', icon: <TrendingUp className="w-3 h-3" /> };
  return { label: 'Baixo', color: 'text-gray-500', bg: 'bg-transparent', border: 'border-white/[0.06]', icon: <XCircle className="w-3 h-3" /> };
}

/**
 * Thumbnail Resolver
 * ─────────────────────────────────────────────────────────────────────────────
 * A Meta Ad Library API pública não retorna URLs de imagem direta nos campos
 * padrão. O ad_snapshot_url aponta para a página HTML da biblioteca.
 *
 * Estratégia:
 * 1. Tenta campos alternativos (image_url, thumbnail_url, ad_creative_images)
 * 2. Tenta extrair imagem do ad_snapshot_url via parsing de HTML (fetch + DOM)
 * 3. Se tudo falhar, exibe placeholder com informações do anúncio
 */

function AdThumbnail({ ad, className }: { ad: any; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(null);

  // Tentar extrair URL de imagem direta de campos alternativos
  const directImageUrl =
    ad.image_url ||
    ad.thumbnail_url ||
    ad.ad_creative_images?.[0]?.url ||
    ad.creative?.thumbnail_url ||
    extractedImageUrl ||
    null;

  // Função para extrair imagem do snapshot HTML
  const extractImageFromSnapshot = async () => {
    if (!ad.ad_snapshot_url || imgError || extractedImageUrl) return;
    setIsLoading(true);
    try {
      const response = await fetch(ad.ad_snapshot_url, { mode: 'no-cors' });
      const html = await response.text();
      
      // Procura por img tags ou og:image meta tag
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      
      const imageUrl = imgMatch?.[1] || ogMatch?.[1];
      if (imageUrl) {
        setExtractedImageUrl(imageUrl);
      }
    } catch (error) {
      // Silenciosamente falha - usa fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Chamar extração quando o componente monta
  if (!directImageUrl && !imgError && !isLoading && !extractedImageUrl) {
    extractImageFromSnapshot();
  }

  if (directImageUrl && !imgError) {
    return (
      <img
        src={directImageUrl}
        alt={ad.page_name || 'Criativo'}
        className={cn("w-full h-full object-cover", className)}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // Fallback: exibir placeholder com informações do anúncio
  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-3", className)}>
      {isLoading ? (
        <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
      ) : (
        <>
          <div className="w-10 h-10 border border-white/[0.08] flex items-center justify-center">
            <span className="text-lg font-black text-white/20">
              {ad.page_name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="text-center px-4">
            <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">Criativo</p>
            <p className="text-[10px] font-bold text-gray-500 mt-0.5 line-clamp-2 leading-tight">
              {ad.page_name || 'Anunciante'}
            </p>
          </div>
          {ad.media_type && (
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border border-white/[0.08] text-gray-600">
              {ad.media_type}
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ─── Creative Viewer (Modal) ─────────────────────────────────────────────────
function CreativeViewer({ ad }: { ad: any }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const isVideo = ad.media_type === 'VIDEO';
  const snapshotUrl = ad.ad_snapshot_url;

  if (!snapshotUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#080808]">
        <ImageOff className="w-8 h-8 text-gray-700" />
        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Sem preview disponível</p>
        <p className="text-[10px] text-gray-700 text-center max-w-[200px]">
          A Meta não fornece imagem direta via API pública
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#080808]">
      {!iframeLoaded && !iframeError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border border-white/10" />
            <div className="absolute inset-0 border border-white border-t-transparent animate-spin" />
          </div>
        </div>
      )}
      {!iframeError ? (
        <iframe
          src={snapshotUrl}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-300",
            iframeLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          sandbox="allow-scripts allow-same-origin allow-popups"
          title={`Criativo: ${ad.page_name}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <ImageOff className="w-8 h-8 text-gray-700" />
          <div className="text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Preview bloqueado</p>
            <p className="text-[10px] text-gray-700 max-w-[200px] text-center">
              Abra na Biblioteca de Anúncios para visualizar
            </p>
          </div>
          <a
            href={snapshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir Criativo
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
    if (!adId || !pageId) { toast.error('Dados do anúncio incompletos'); return; }
    toggleFavoriteMutation.mutate({
      adId, pageId,
      pageName: ad.page_name,
    });
  };

  const handleMonitor = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMonitored) { toast.info('Anúncio já está em monitoramento'); return; }
    const adId = ad.id || ad.ad_archive_id;
    const pageId = ad.page_id;
    if (!adId || !pageId) { toast.error('Dados do anúncio incompletos'); return; }
    addMonitoredMutation.mutate({
      adId, pageId,
      pageName: ad.page_name,
    });
  };

  const scaleStatus = getScaleStatus(ad.scalingScore);
  const copy = ad.ad_creative_bodies?.[0] || ad.body || '';
  const title = ad.ad_creative_link_titles?.[0] || '';
  const description = ad.ad_creative_link_descriptions?.[0] || '';

  return (
    <>
      <div className="border border-white/[0.06] bg-black overflow-hidden hover:border-white/[0.12] transition-all group">
        {/* Scale indicator bar */}
        {ad.scalingScore !== undefined && (
          <div className="h-1 bg-white/[0.02]">
            <div
              className={cn(
                "h-full transition-all",
                ad.scalingScore >= 70 ? "bg-green-500" : ad.scalingScore >= 40 ? "bg-yellow-500" : "bg-gray-700"
              )}
              style={{ width: `${Math.min(100, ad.scalingScore)}%` }}
            />
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-[#0a0a0a] overflow-hidden">
          <AdThumbnail ad={ad} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
            >
              <Maximize2 className="w-3 h-3" />
              Ver Criativo
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header: Page name + Scale badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white truncate">{ad.page_name || 'Anunciante'}</p>
              <p className="text-[9px] text-gray-600 font-mono truncate">ID: {ad.id || ad.ad_archive_id || 'N/D'}</p>
            </div>
            <span className={cn("shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-widest border", scaleStatus.bg, scaleStatus.border, scaleStatus.color)}>
              {scaleStatus.icon}
              {scaleStatus.label}
            </span>
          </div>

          {/* Copy preview */}
          {copy && (
            <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
              {copy}
            </p>
          )}

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
            <div className="bg-black px-2 py-2">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <DollarSign className="w-2.5 h-2.5" /> Gasto
              </p>
              <p className="text-xs font-black text-white">{renderMetricValue(ad.spend)}</p>
            </div>
            <div className="bg-black px-2 py-2">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <Eye className="w-2.5 h-2.5" /> Alcance
              </p>
              <p className="text-xs font-black text-white">{renderMetricValue(ad.impressions)}</p>
            </div>
          </div>

          {/* Platforms + Media type */}
          <div className="flex flex-wrap gap-1">
            {ad.publisher_platforms?.map((platform: string) => (
              <span key={platform} className="text-[8px] font-bold text-gray-500 border border-white/[0.08] px-2 py-0.5">
                {platform}
              </span>
            ))}
            {ad.media_type && (
              <span className="text-[8px] font-bold text-gray-500 border border-white/[0.08] px-2 py-0.5 ml-auto">
                {ad.media_type}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center justify-between text-[9px] text-gray-600 font-mono">
            <span>Início: {formatDate(ad.ad_delivery_start_time)}</span>
            {ad.ad_delivery_stop_time && <span>Fim: {formatDate(ad.ad_delivery_stop_time)}</span>}
          </div>

          {/* Actions */}
          <div className="flex gap-1 pt-2 border-t border-white/[0.06]">
            <button
              onClick={handleFavorite}
              disabled={toggleFavoriteMutation.isPending}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-black uppercase tracking-widest transition-all border",
                isFavorited
                  ? "bg-white/[0.08] border-white/[0.12] text-white hover:bg-white/[0.12]"
                  : "border-white/[0.06] text-gray-600 hover:text-white hover:border-white/[0.12]"
              )}
            >
              <Heart className={cn("w-3 h-3", isFavorited && "fill-current")} />
              Favorito
            </button>
            <button
              onClick={handleMonitor}
              disabled={addMonitoredMutation.isPending || isMonitored}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-black uppercase tracking-widest transition-all border",
                isMonitored
                  ? "bg-white/[0.08] border-white/[0.12] text-white"
                  : "border-white/[0.06] text-gray-600 hover:text-white hover:border-white/[0.12]"
              )}
            >
              <Activity className="w-3 h-3" />
              {isMonitored ? "Monitorado" : "Monitorar"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 border-white/[0.06]">
          <div className="flex h-[70vh]">
            {/* Left: Creative preview (45%) */}
            <div className="w-[45%] border-r border-white/[0.06] bg-[#080808]">
              <CreativeViewer ad={ad} />
            </div>

            {/* Right: Details (55%) */}
            <div className="w-[55%] overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-base font-black text-white mb-1">{ad.page_name}</h2>
                <p className="text-[10px] text-gray-600 font-mono">{ad.id || ad.ad_archive_id}</p>
              </div>

              {/* Scale status */}
              <div className={cn("p-3 border", scaleStatus.bg, scaleStatus.border)}>
                <div className="flex items-center gap-2 mb-1">
                  {scaleStatus.icon}
                  <span className={cn("text-xs font-black uppercase tracking-widest", scaleStatus.color)}>
                    {scaleStatus.label}
                  </span>
                </div>
                {ad.scalingScore !== undefined && (
                  <p className="text-[10px] text-gray-400">Score: {ad.scalingScore}/100</p>
                )}
              </div>

              {/* Copy */}
              {copy && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Copy</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{copy}</p>
                </div>
              )}

              {/* Title + Description */}
              {(title || description) && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Criativo</p>
                  {title && <p className="text-xs font-bold text-white mb-1">{title}</p>}
                  {description && <p className="text-xs text-gray-400">{description}</p>}
                </div>
              )}

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Gasto</p>
                  <p className="text-sm font-black text-white">{renderMetricValue(ad.spend)}</p>
                </div>
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Alcance</p>
                  <p className="text-sm font-black text-white">{renderMetricValue(ad.impressions)}</p>
                </div>
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Moeda</p>
                  <p className="text-sm font-black text-white">{ad.currency || 'N/D'}</p>
                </div>
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Tipo</p>
                  <p className="text-sm font-black text-white">{ad.media_type || 'N/D'}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Timeline</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>Início: {formatDate(ad.ad_delivery_start_time)}</span>
                </div>
                {ad.ad_delivery_stop_time && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>Fim: {formatDate(ad.ad_delivery_stop_time)}</span>
                  </div>
                )}
              </div>

              {/* Platforms */}
              {ad.publisher_platforms?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Plataformas</p>
                  <div className="flex flex-wrap gap-1">
                    {ad.publisher_platforms.map((p: string) => (
                      <span key={p} className="text-[9px] font-bold text-gray-400 border border-white/[0.08] px-2 py-1">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External link */}
              <div className="pt-4 border-t border-white/[0.06]">
                <a
                  href={ad.ad_snapshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir na Biblioteca
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
