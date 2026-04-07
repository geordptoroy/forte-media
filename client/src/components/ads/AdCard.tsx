import { useState, useEffect } from 'react';
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
  Loader2,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardProps {
  ad: any;
  initialIsFavorited?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Renderiza valores de métricas de forma segura
 * Trata ranges, objetos, strings e números
 */
function renderMetricValue(value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || '—';
  }
  
  if (typeof value === 'number') {
    if (value === 0) return '0';
    if (value < 1000) return value.toString();
    return value.toLocaleString('pt-BR');
  }
  
  if (typeof value === 'object') {
    // Trata ranges com min/max
    if (value.min !== undefined && value.max !== undefined) {
      const min = Number(value.min);
      const max = Number(value.max);
      if (min === max) return min.toLocaleString('pt-BR');
      return `${min.toLocaleString('pt-BR')} – ${max.toLocaleString('pt-BR')}`;
    }
    
    // Trata ranges com lower_bound/upper_bound
    if (value.lower_bound !== undefined && value.upper_bound !== undefined) {
      const min = Number(value.lower_bound);
      const max = Number(value.upper_bound);
      if (min === max) return min.toLocaleString('pt-BR');
      return `${min.toLocaleString('pt-BR')} – ${max.toLocaleString('pt-BR')}`;
    }
    
    // Trata string de range
    if (value.range && typeof value.range === 'string') {
      return value.range;
    }
    
    // Trata array
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '—';
    }
  }
  
  return '—';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getCountryLabel(countries?: string[]): string {
  if (!countries || countries.length === 0) return '—';
  if (countries.length === 1) return countries[0];
  return `${countries.length} países`;
}

function getScaleStatus(score?: number): { label: string; color: string; bg: string; border: string; icon: React.ReactNode } {
  if (score === undefined || score === null) return { label: 'Sem dados', color: 'text-gray-600', bg: 'bg-transparent', border: 'border-white/[0.06]', icon: <AlertCircle className="w-3 h-3" /> };
  if (score >= 70) return { label: 'Escalado', color: 'text-green-400', bg: 'bg-green-500/[0.06]', border: 'border-green-500/20', icon: <CheckCircle2 className="w-3 h-3" /> };
  if (score >= 40) return { label: 'Em escala', color: 'text-yellow-400', bg: 'bg-yellow-500/[0.06]', border: 'border-yellow-500/20', icon: <TrendingUp className="w-3 h-3" /> };
  return { label: 'Baixo', color: 'text-gray-500', bg: 'bg-transparent', border: 'border-white/[0.06]', icon: <XCircle className="w-3 h-3" /> };
}

/**
 * Componente de Thumbnail com extração via Proxy
 */
function AdThumbnail({ ad, className }: { ad: any; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Tentar campos diretos primeiro
  const directImageUrl =
    ad.ad_creative_images?.[0]?.url ||
    ad.image_url ||
    ad.thumbnail_url ||
    extractedImageUrl;

  const extractThumbnailQuery = trpc.ads.extractThumbnail.useQuery(
    { snapshotUrl: ad.ad_snapshot_url },
    { enabled: false }
  );

  useEffect(() => {
    if (!directImageUrl && !imgError && !isExtracting && ad.ad_snapshot_url) {
      setIsExtracting(true);
      extractThumbnailQuery.refetch().then(result => {
        if (result.data?.success && result.data?.imageUrl) {
          setExtractedImageUrl(result.data.imageUrl);
        }
        setIsExtracting(false);
      }).catch(() => {
        setIsExtracting(false);
      });
    }
  }, [ad.ad_snapshot_url, directImageUrl, imgError, isExtracting]);

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

  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#050505] gap-3", className)}>
      {isExtracting ? (
        <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
      ) : (
        <>
          <div className="w-12 h-12 border border-white/[0.08] flex items-center justify-center bg-white/[0.02]">
            <span className="text-xl font-black text-white/30">
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
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border border-white/[0.08] text-gray-600 bg-white/[0.02]">
              {ad.media_type}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Visualizador de Criativo via iframe
 */
function CreativeViewer({ ad }: { ad: any }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const snapshotUrl = ad.ad_snapshot_url;

  if (!snapshotUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#080808]">
        <ImageOff className="w-8 h-8 text-gray-700" />
        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Sem preview disponível</p>
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
              Clique em "Abrir Criativo" para visualizar na Biblioteca
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
  const spend = renderMetricValue(ad.spend);
  const impressions = renderMetricValue(ad.impressions);
  const currency = ad.currency || '—';
  const countries = getCountryLabel(ad.ad_reached_countries);

  return (
    <>
      <div className="border border-white/[0.06] bg-black overflow-hidden hover:border-white/[0.12] transition-all group">
        {/* Barra de escala */}
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

        {/* Conteúdo */}
        <div className="p-4 space-y-3">
          {/* Header: Nome + Badge de escala */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white truncate">{ad.page_name || 'Anunciante'}</p>
              <p className="text-[9px] text-gray-600 font-mono truncate">ID: {ad.id || ad.ad_archive_id || '—'}</p>
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

          {/* Grid de métricas principais */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
            <div className="bg-black px-2 py-2">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <DollarSign className="w-2.5 h-2.5" /> Gasto
              </p>
              <p className="text-xs font-black text-white">{spend}</p>
            </div>
            <div className="bg-black px-2 py-2">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <Eye className="w-2.5 h-2.5" /> Alcance
              </p>
              <p className="text-xs font-black text-white">{impressions}</p>
            </div>
            <div className="bg-black px-2 py-2">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <Tag className="w-2.5 h-2.5" /> Moeda
              </p>
              <p className="text-xs font-black text-white">{currency}</p>
            </div>
            <div className="bg-black px-2 py-2">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <Globe className="w-2.5 h-2.5" /> País
              </p>
              <p className="text-xs font-black text-white">{countries}</p>
            </div>
          </div>

          {/* Plataformas + Tipo de mídia */}
          <div className="flex flex-wrap gap-1">
            {ad.publisher_platforms?.map((platform: string) => (
              <span key={platform} className="text-[8px] font-bold text-gray-500 border border-white/[0.08] px-2 py-0.5 bg-white/[0.02]">
                {platform}
              </span>
            ))}
            {ad.media_type && (
              <span className="text-[8px] font-bold text-gray-500 border border-white/[0.08] px-2 py-0.5 bg-white/[0.02] ml-auto">
                {ad.media_type}
              </span>
            )}
          </div>

          {/* Datas */}
          <div className="flex items-center justify-between text-[9px] text-gray-600 font-mono gap-2">
            <span className="truncate">Início: {formatDate(ad.ad_delivery_start_time)}</span>
            {ad.ad_delivery_stop_time && <span className="truncate">Fim: {formatDate(ad.ad_delivery_stop_time)}</span>}
          </div>

          {/* Ações */}
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

      {/* Modal com detalhes completos */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 border-white/[0.06]">
          <div className="flex h-[70vh]">
            {/* Esquerda: Criativo (45%) */}
            <div className="w-[45%] border-r border-white/[0.06] bg-[#080808]">
              <CreativeViewer ad={ad} />
            </div>

            {/* Direita: Detalhes (55%) */}
            <div className="w-[55%] overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-base font-black text-white mb-1">{ad.page_name}</h2>
                <p className="text-[10px] text-gray-600 font-mono">{ad.id || ad.ad_archive_id}</p>
              </div>

              {/* Status de escala */}
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

              {/* Título + Descrição */}
              {(title || description) && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Criativo</p>
                  {title && <p className="text-xs font-bold text-white mb-1">{title}</p>}
                  {description && <p className="text-xs text-gray-400">{description}</p>}
                </div>
              )}

              {/* Grid de métricas expandido */}
              <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Gasto</p>
                  <p className="text-sm font-black text-white">{spend}</p>
                </div>
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Alcance</p>
                  <p className="text-sm font-black text-white">{impressions}</p>
                </div>
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Moeda</p>
                  <p className="text-sm font-black text-white">{currency}</p>
                </div>
                <div className="bg-black px-3 py-2">
                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Tipo</p>
                  <p className="text-sm font-black text-white">{ad.media_type || '—'}</p>
                </div>
              </div>

              {/* Datas */}
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

              {/* Plataformas */}
              {ad.publisher_platforms?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Plataformas</p>
                  <div className="flex flex-wrap gap-1">
                    {ad.publisher_platforms.map((p: string) => (
                      <span key={p} className="text-[9px] font-bold text-gray-400 border border-white/[0.08] px-2 py-1 bg-white/[0.02]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Países */}
              {ad.ad_reached_countries?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Países</p>
                  <div className="flex flex-wrap gap-1">
                    {ad.ad_reached_countries.map((c: string) => (
                      <span key={c} className="text-[9px] font-bold text-gray-400 border border-white/[0.08] px-2 py-1 bg-white/[0.02]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Link externo */}
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
