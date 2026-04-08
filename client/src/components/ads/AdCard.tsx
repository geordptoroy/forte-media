import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Heart,
  TrendingUp,
  Calendar,
  ExternalLink,
  Maximize2,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ImageOff,
  Loader2,
  Play,
  Image as ImageIcon,
  Video,
  Layers,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardProps {
  ad: any;
  initialIsFavorited?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function getScaleStatus(score?: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  barColor: string;
} {
  if (score === undefined || score === null) {
    return {
      label: 'Analisando',
      color: 'text-gray-600',
      bg: 'bg-transparent',
      border: 'border-white/[0.06]',
      icon: <AlertCircle className="w-3 h-3" />,
      barColor: 'bg-gray-700',
    };
  }
  if (score >= 61) {
    return {
      label: 'Escalado',
      color: 'text-green-400',
      bg: 'bg-green-500/[0.06]',
      border: 'border-green-500/20',
      icon: <CheckCircle2 className="w-3 h-3" />,
      barColor: 'bg-green-500',
    };
  }
  if (score >= 31) {
    return {
      label: 'Validação',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/[0.06]',
      border: 'border-yellow-500/20',
      icon: <TrendingUp className="w-3 h-3" />,
      barColor: 'bg-yellow-500',
    };
  }
  return {
    label: 'Teste',
    color: 'text-gray-500',
    bg: 'bg-transparent',
    border: 'border-white/[0.06]',
    icon: <XCircle className="w-3 h-3" />,
    barColor: 'bg-gray-700',
  };
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

function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    'facebook': 'FB',
    'FACEBOOK': 'FB',
    'instagram': 'IG',
    'INSTAGRAM': 'IG',
    'audience_network': 'AN',
    'AUDIENCE_NETWORK': 'AN',
    'messenger': 'MSG',
    'MESSENGER': 'MSG',
    'threads': 'THR',
    'THREADS': 'THR',
    'whatsapp': 'WA',
    'WHATSAPP': 'WA',
  };
  return labels[platform] || platform.substring(0, 3).toUpperCase();
}

// ─── Thumbnail Component ─────────────────────────────────────────────────────
// A Meta Ad Library API NÃO fornece imagens para anúncios comuns.
// Apenas anúncios políticos/UE têm ad_creative_images/videos.
// Para anúncios comuns, usamos o ad_snapshot_url via iframe.

function AdThumbnail({ ad, onOpenModal }: { ad: any; onOpenModal: () => void }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const snapshotUrl = ad.ad_snapshot_url;
  const mediaType = ad.media_type?.toUpperCase();

  // Verificar se há imagem direta (apenas para anúncios políticos/UE)
  const directImageUrl =
    ad.ad_creative_images?.[0]?.url ||
    ad.ad_creative_videos?.[0]?.thumbnail_url ||
    null;

  if (directImageUrl) {
    return (
      <div className="relative w-full h-full">
        <img
          src={directImageUrl}
          alt={ad.page_name || 'Criativo'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => {}}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
          >
            <Maximize2 className="w-3 h-3" />
            Ver Criativo
          </button>
        </div>
      </div>
    );
  }

  // Para anúncios comuns: usar iframe do snapshot
  if (snapshotUrl && !iframeError) {
    return (
      <div className="relative w-full h-full bg-[#0a0a0a]">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-[#0a0a0a]">
            <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">Carregando preview</p>
          </div>
        )}
        <iframe
          src={snapshotUrl}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-500 pointer-events-none",
            iframeLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={`Preview: ${ad.page_name}`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
          >
            <Maximize2 className="w-3 h-3" />
            Ver Criativo
          </button>
        </div>
      </div>
    );
  }

  // Fallback: placeholder visual
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#050505] gap-3 group">
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
      {mediaType && (
        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border border-white/[0.08] text-gray-600 bg-white/[0.02] flex items-center gap-1">
          {getMediaTypeIcon(mediaType)}
          {mediaType}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
        <button
          onClick={onOpenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
        >
          <Maximize2 className="w-3 h-3" />
          Ver Criativo
        </button>
      </div>
    </div>
  );
}

// ─── Creative Viewer (Modal) ─────────────────────────────────────────────────

function CreativeViewer({ ad }: { ad: any }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const snapshotUrl = ad.ad_snapshot_url;

  // Imagem direta (apenas anúncios políticos/UE)
  const directImageUrl =
    ad.ad_creative_images?.[0]?.url ||
    ad.ad_creative_videos?.[0]?.thumbnail_url ||
    null;

  if (directImageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#080808] p-4">
        <img
          src={directImageUrl}
          alt={ad.page_name || 'Criativo'}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  if (!snapshotUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#080808]">
        <ImageOff className="w-8 h-8 text-gray-700" />
        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Sem preview disponível</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#080808] flex flex-col">
      {!iframeLoaded && !iframeError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border border-white/10" />
            <div className="absolute inset-0 border border-white border-t-transparent animate-spin" />
          </div>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Carregando criativo</p>
        </div>
      )}

      {!iframeError ? (
        <iframe
          src={snapshotUrl}
          className={cn(
            "flex-1 w-full border-0 transition-opacity duration-300",
            iframeLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={`Criativo: ${ad.page_name}`}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <ImageOff className="w-8 h-8 text-gray-700" />
          <div className="text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Preview bloqueado</p>
            <p className="text-[10px] text-gray-700 max-w-[200px] text-center leading-relaxed">
              O Facebook bloqueou o carregamento do preview. Abra diretamente na biblioteca.
            </p>
          </div>
        </div>
      )}

      {/* Botão sempre visível para abrir na biblioteca */}
      <div className="p-3 border-t border-white/[0.06] bg-black">
        <a
          href={snapshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Abrir na Biblioteca Meta
        </a>
      </div>
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
    toggleFavoriteMutation.mutate({ adId, pageId, pageName: ad.page_name });
  };

  const handleMonitor = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMonitored) { toast.info('Anúncio já está em monitoramento'); return; }
    const adId = ad.id || ad.ad_archive_id;
    const pageId = ad.page_id;
    if (!adId || !pageId) { toast.error('Dados do anúncio incompletos'); return; }
    addMonitoredMutation.mutate({ adId, pageId, pageName: ad.page_name });
  };

  const scaleStatus = getScaleStatus(ad.scalingScore);
  const copy = ad.ad_creative_bodies?.[0] || ad.body || '';
  const title = ad.ad_creative_link_titles?.[0] || '';
  const description = ad.ad_creative_link_descriptions?.[0] || '';
  const daysActive = ad.daysActive ?? calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
  const isStillActive = !ad.ad_delivery_stop_time;
  const platforms = ad.publisher_platforms || [];
  const mediaType = ad.media_type;

  return (
    <>
      <div className="border border-white/[0.06] bg-black overflow-hidden hover:border-white/[0.12] transition-all group cursor-pointer" onClick={() => setOpen(true)}>
        {/* Barra de score */}
        <div className="h-0.5 bg-white/[0.02]">
          {ad.scalingScore !== undefined && (
            <div
              className={cn("h-full transition-all", scaleStatus.barColor)}
              style={{ width: `${Math.min(100, ad.scalingScore || 0)}%` }}
            />
          )}
        </div>

        {/* Thumbnail / Preview */}
        <div className="relative w-full aspect-video bg-[#0a0a0a] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <AdThumbnail ad={ad} onOpenModal={() => setOpen(true)} />
        </div>

        {/* Conteúdo */}
        <div className="p-3 space-y-2.5">
          {/* Header: Nome + Badge de escala */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white truncate">{ad.page_name || 'Anunciante'}</p>
              <p className="text-[9px] text-gray-700 font-mono truncate">ID: {ad.id || ad.ad_archive_id || '—'}</p>
            </div>
            <span className={cn(
              "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border",
              scaleStatus.bg, scaleStatus.border, scaleStatus.color
            )}>
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

          {/* Métricas rastreáveis: Dias ativos + Status + Plataformas */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
            {/* Dias ativos */}
            <div className="bg-black px-2 py-1.5">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <Clock className="w-2.5 h-2.5" /> Dias Ativo
              </p>
              <p className="text-xs font-black text-white">{daysActive > 0 ? `${daysActive}d` : '—'}</p>
            </div>
            {/* Status */}
            <div className="bg-black px-2 py-1.5">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <Activity className="w-2.5 h-2.5" /> Status
              </p>
              <p className={cn("text-xs font-black", isStillActive ? "text-green-400" : "text-gray-500")}>
                {isStillActive ? 'Ativo' : 'Inativo'}
              </p>
            </div>
          </div>

          {/* Plataformas + Tipo de mídia */}
          <div className="flex flex-wrap gap-1 items-center">
            {platforms.slice(0, 4).map((platform: string) => (
              <span key={platform} className="text-[8px] font-bold text-gray-500 border border-white/[0.08] px-1.5 py-0.5 bg-white/[0.02]">
                {getPlatformLabel(platform)}
              </span>
            ))}
            {mediaType && (
              <span className="text-[8px] font-bold text-gray-500 border border-white/[0.08] px-1.5 py-0.5 bg-white/[0.02] ml-auto flex items-center gap-0.5">
                {getMediaTypeIcon(mediaType)}
                {mediaType}
              </span>
            )}
          </div>

          {/* Data de início */}
          <div className="flex items-center justify-between text-[9px] text-gray-700 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {formatDateShort(ad.ad_delivery_start_time)}
            </span>
            {ad.ad_delivery_stop_time && (
              <span className="text-gray-800">→ {formatDateShort(ad.ad_delivery_stop_time)}</span>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-1 pt-1 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleFavorite}
              disabled={toggleFavoriteMutation.isPending}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border",
                isFavorited
                  ? "bg-white/[0.08] border-white/[0.12] text-white hover:bg-white/[0.12]"
                  : "border-white/[0.06] text-gray-600 hover:text-white hover:border-white/[0.12]"
              )}
            >
              <Heart className={cn("w-3 h-3", isFavorited && "fill-current")} />
              {isFavorited ? 'Salvo' : 'Salvar'}
            </button>
            <button
              onClick={handleMonitor}
              disabled={addMonitoredMutation.isPending || isMonitored}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border",
                isMonitored
                  ? "bg-white/[0.08] border-white/[0.12] text-white"
                  : "border-white/[0.06] text-gray-600 hover:text-white hover:border-white/[0.12]"
              )}
            >
              <Activity className="w-3 h-3" />
              {isMonitored ? 'Monitorado' : 'Monitorar'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal com detalhes completos */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 border-white/[0.06] bg-black">
          <div className="flex h-[80vh]">
            {/* Esquerda: Criativo (50%) */}
            <div className="w-1/2 border-r border-white/[0.06] flex flex-col">
              <CreativeViewer ad={ad} />
            </div>

            {/* Direita: Detalhes (50%) */}
            <div className="w-1/2 overflow-y-auto p-5 space-y-5">
              {/* Header */}
              <div>
                <h2 className="text-sm font-black text-white mb-0.5">{ad.page_name || 'Anunciante'}</h2>
                <p className="text-[9px] text-gray-600 font-mono">{ad.id || ad.ad_archive_id}</p>
              </div>

              {/* Status de escala */}
              <div className={cn("p-3 border", scaleStatus.bg, scaleStatus.border)}>
                <div className="flex items-center gap-2 mb-1">
                  {scaleStatus.icon}
                  <span className={cn("text-xs font-black uppercase tracking-widest", scaleStatus.color)}>
                    {scaleStatus.label}
                  </span>
                  {ad.scalingScore !== undefined && (
                    <span className="text-[10px] text-gray-500 ml-auto">Score: {ad.scalingScore}/100</span>
                  )}
                </div>
                {/* Barra de progresso do score */}
                {ad.scalingScore !== undefined && (
                  <div className="h-1 bg-white/[0.04] mt-2">
                    <div
                      className={cn("h-full", scaleStatus.barColor)}
                      style={{ width: `${Math.min(100, ad.scalingScore)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Sinais de escala */}
              {ad.scalingReasons && ad.scalingReasons.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Sinais de Escala</p>
                  <div className="space-y-1">
                    {ad.scalingReasons.slice(0, 4).map((reason: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-gray-400">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy */}
              {copy && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Copy do Anúncio</p>
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

              {/* Métricas rastreáveis */}
              <div>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Dados Rastreáveis</p>
                <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
                  <div className="bg-black px-3 py-2">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Dias Ativo</p>
                    <p className="text-sm font-black text-white">{daysActive > 0 ? `${daysActive} dias` : '—'}</p>
                  </div>
                  <div className="bg-black px-3 py-2">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Status</p>
                    <p className={cn("text-sm font-black", isStillActive ? "text-green-400" : "text-gray-500")}>
                      {isStillActive ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                  <div className="bg-black px-3 py-2">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Formato</p>
                    <p className="text-sm font-black text-white flex items-center gap-1">
                      {getMediaTypeIcon(mediaType)}
                      {mediaType || '—'}
                    </p>
                  </div>
                  <div className="bg-black px-3 py-2">
                    <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Plataformas</p>
                    <p className="text-sm font-black text-white">{platforms.length > 0 ? platforms.length : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Timeline</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span>Início: {formatDate(ad.ad_delivery_start_time)}</span>
                  </div>
                  {ad.ad_delivery_stop_time ? (
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <Calendar className="w-3 h-3 text-gray-600" />
                      <span>Fim: {formatDate(ad.ad_delivery_stop_time)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-green-500">
                      <Activity className="w-3 h-3" />
                      <span>Ainda em veiculação ativa</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Plataformas */}
              {platforms.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Plataformas</p>
                  <div className="flex flex-wrap gap-1">
                    {platforms.map((p: string) => (
                      <span key={p} className="text-[9px] font-bold text-gray-400 border border-white/[0.08] px-2 py-1 bg-white/[0.02]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
