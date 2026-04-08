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
  Image as ImageIcon,
  Video,
  Layers,
  Monitor,
  MoreHorizontal,
  Globe,
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
      color: 'text-gray-500',
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
    'facebook': 'Facebook',
    'FACEBOOK': 'Facebook',
    'instagram': 'Instagram',
    'INSTAGRAM': 'Instagram',
    'audience_network': 'Audience Network',
    'AUDIENCE_NETWORK': 'Audience Network',
    'messenger': 'Messenger',
    'MESSENGER': 'Messenger',
    'threads': 'Threads',
    'THREADS': 'Threads',
    'whatsapp': 'WhatsApp',
    'WHATSAPP': 'WhatsApp',
  };
  return labels[platform] || platform;
}

// ─── Avatar Placeholder ──────────────────────────────────────────────────────

function PageAvatar({ name }: { name?: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || 'A';
  const colors = [
    'bg-blue-600', 'bg-purple-600', 'bg-green-600',
    'bg-orange-600', 'bg-pink-600', 'bg-teal-600',
  ];
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div className={cn(
      "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-black",
      colors[colorIndex]
    )}>
      {initial}
    </div>
  );
}

// ─── Ad Preview (iframe estilo biblioteca Meta) ──────────────────────────────

function AdPreviewFrame({ ad }: { ad: any }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const snapshotUrl = ad.ad_snapshot_url;

  // Imagem direta (anúncios políticos/UE)
  const directImageUrl =
    ad.ad_creative_images?.[0]?.url ||
    ad.ad_creative_videos?.[0]?.thumbnail_url ||
    null;

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

  if (snapshotUrl && !iframeError) {
    return (
      <div className="relative w-full h-full bg-white">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-gray-50">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            <p className="text-[10px] text-gray-400 font-medium">Carregando anúncio...</p>
          </div>
        )}
        <iframe
          src={snapshotUrl}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-500",
            iframeLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={`Anúncio: ${ad.page_name}`}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-3">
      <ImageOff className="w-8 h-8 text-gray-400" />
      <p className="text-xs text-gray-500 font-medium">Preview não disponível</p>
    </div>
  );
}

// ─── Creative Viewer (Modal) ─────────────────────────────────────────────────

function CreativeViewer({ ad }: { ad: any }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const snapshotUrl = ad.ad_snapshot_url;

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

// ─── Metric Item ─────────────────────────────────────────────────────────────

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
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
        {icon}
        {label}
      </span>
      <span className={cn("text-[11px] font-bold text-white leading-tight", valueClass)}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AdCard: React.FC<AdCardProps> = ({ ad, initialIsFavorited = false }) => {
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
    const adId = ad.id || ad.ad_archive_id;
    const pageId = ad.page_id;
    if (!adId || !pageId) { toast.error('Dados do anúncio incompletos'); return; }
    toggleFavoriteMutation.mutate({ adId, pageId, pageName: ad.page_name });
  };

  const scaleStatus = getScaleStatus(ad.scalingScore);
  const copy = ad.ad_creative_bodies?.[0] || ad.body || '';
  const title = ad.ad_creative_link_titles?.[0] || '';
  const description = ad.ad_creative_link_descriptions?.[0] || '';
  const linkCaption = ad.ad_creative_link_captions?.[0] || '';
  const daysActive = ad.daysActive ?? calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
  const isStillActive = !ad.ad_delivery_stop_time;
  const platforms = ad.publisher_platforms || [];
  const mediaType = ad.media_type;
  const adId = ad.id || ad.ad_archive_id;
  const snapshotUrl = ad.ad_snapshot_url;

  return (
    <>
      {/* ── Card principal estilo Biblioteca Meta ── */}
      <div
        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
        onClick={() => setOpen(true)}
      >
        {/* Barra de score no topo (sutil) */}
        {ad.scalingScore !== undefined && (
          <div className="h-0.5 bg-gray-100">
            <div
              className={cn("h-full transition-all", scaleStatus.barColor)}
              style={{ width: `${Math.min(100, ad.scalingScore || 0)}%` }}
            />
          </div>
        )}

        {/* ── Cabeçalho estilo post do Facebook ── */}
        <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PageAvatar name={ad.page_name} />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                {ad.page_name || 'Anunciante'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Patrocinado</span>
                <span className="text-gray-400">·</span>
                <Globe className="w-3 h-3 text-gray-400" />
              </div>
              {adId && (
                <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate">
                  Identificação da biblioteca: {adId}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Badge de escala */}
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border",
              scaleStatus.bg, scaleStatus.border, scaleStatus.color
            )}>
              {scaleStatus.icon}
              {scaleStatus.label}
            </span>
            <button
              className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Copy do anúncio ── */}
        {copy && (
          <div className="px-3 pb-2">
            <p className="text-[12px] text-gray-800 leading-relaxed line-clamp-3">
              {copy}
            </p>
          </div>
        )}

        {/* ── Iframe do criativo (estilo biblioteca Meta) ── */}
        <div
          className="relative w-full bg-gray-100 overflow-hidden"
          style={{ minHeight: '280px', maxHeight: '420px', height: '360px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <AdPreviewFrame ad={ad} />

          {/* Overlay hover para expandir */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-900 text-[10px] font-bold rounded-md shadow-md hover:bg-white transition-all"
            >
              <Maximize2 className="w-3 h-3" />
              Expandir
            </button>
          </div>
        </div>

        {/* ── Rodapé do criativo (link/CTA estilo Facebook) ── */}
        {(linkCaption || title || description) && (
          <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {linkCaption && (
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">{linkCaption}</p>
              )}
              {title && (
                <p className="text-[12px] font-bold text-gray-900 truncate leading-tight">{title}</p>
              )}
              {description && (
                <p className="text-[11px] text-gray-500 truncate">{description}</p>
              )}
            </div>
            {snapshotUrl && (
              <a
                href={snapshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-bold rounded-md transition-colors whitespace-nowrap"
              >
                Saiba mais
              </a>
            )}
          </div>
        )}

        {/* ── Métricas rastreadas (separador visual) ── */}
        <div className="border-t border-gray-100 bg-gray-50/80 px-3 pt-2.5 pb-1">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Métricas rastreadas
          </p>

          {/* Grid de métricas */}
          <div className="grid grid-cols-3 gap-x-3 gap-y-2 mb-2">
            {/* Dias ativo */}
            <MetricItem
              icon={<Clock className="w-2.5 h-2.5" />}
              label="Dias ativo"
              value={daysActive > 0 ? `${daysActive}d` : '—'}
            />

            {/* Status */}
            <MetricItem
              icon={<Activity className="w-2.5 h-2.5" />}
              label="Status"
              value={isStillActive ? 'Ativo' : 'Inativo'}
              valueClass={isStillActive ? 'text-green-600' : 'text-gray-400'}
            />

            {/* Formato */}
            <MetricItem
              icon={getMediaTypeIcon(mediaType)}
              label="Formato"
              value={
                <span className="flex items-center gap-0.5">
                  {mediaType || '—'}
                </span>
              }
            />

            {/* Início */}
            <MetricItem
              icon={<Calendar className="w-2.5 h-2.5" />}
              label="Início"
              value={formatDateShort(ad.ad_delivery_start_time)}
            />

            {/* Fim / Em veiculação */}
            <MetricItem
              icon={<Calendar className="w-2.5 h-2.5" />}
              label="Fim"
              value={ad.ad_delivery_stop_time ? formatDateShort(ad.ad_delivery_stop_time) : 'Em veiculação'}
              valueClass={!ad.ad_delivery_stop_time ? 'text-green-600' : undefined}
            />

            {/* Plataformas */}
            <MetricItem
              icon={<Globe className="w-2.5 h-2.5" />}
              label="Plataformas"
              value={platforms.length > 0 ? `${platforms.length} plat.` : '—'}
            />
          </div>

          {/* Tags de plataformas */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {platforms.slice(0, 4).map((platform: string) => (
                <span
                  key={platform}
                  className="text-[8px] font-bold text-gray-500 border border-gray-200 px-1.5 py-0.5 bg-white rounded-sm"
                >
                  {getPlatformLabel(platform)}
                </span>
              ))}
              {platforms.length > 4 && (
                <span className="text-[8px] font-bold text-gray-400 px-1 py-0.5">
                  +{platforms.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Ações ── */}
        <div
          className="px-3 pb-3 pt-1 flex gap-2 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleFavorite}
            disabled={toggleFavoriteMutation.isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition-all border",
              isFavorited
                ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                : "border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 bg-white"
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
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-md border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 bg-white transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Biblioteca
            </a>
          )}
        </div>
      </div>

      {/* ── Modal com detalhes completos ── */}
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
              <div className="flex items-center gap-3">
                <PageAvatar name={ad.page_name} />
                <div>
                  <h2 className="text-sm font-black text-white mb-0.5">{ad.page_name || 'Anunciante'}</h2>
                  <p className="text-[9px] text-gray-600 font-mono">{adId}</p>
                </div>
              </div>

              {/* Status de escala */}
              <div className={cn("p-3 border rounded-lg", scaleStatus.bg, scaleStatus.border)}>
                <div className="flex items-center gap-2 mb-1">
                  {scaleStatus.icon}
                  <span className={cn("text-xs font-black uppercase tracking-widest", scaleStatus.color)}>
                    {scaleStatus.label}
                  </span>
                  {ad.scalingScore !== undefined && (
                    <span className="text-[10px] text-gray-500 ml-auto">Score: {ad.scalingScore}/100</span>
                  )}
                </div>
                {ad.scalingScore !== undefined && (
                  <div className="h-1 bg-white/[0.04] mt-2 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", scaleStatus.barColor)}
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
                <div className="grid grid-cols-2 gap-px bg-white/[0.04] rounded-lg overflow-hidden">
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
                      <span key={p} className="text-[9px] font-bold text-gray-400 border border-white/[0.08] px-2 py-1 bg-white/[0.02] rounded-sm">
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
