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
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdCardProps {
  ad: any;
  initialIsFavorited?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
      color: 'text-zinc-500',
      bg: 'bg-zinc-900/50',
      border: 'border-zinc-800',
      icon: <AlertCircle className="w-3 h-3" />,
      barColor: 'bg-zinc-800',
    };
  }
  if (score >= 61) {
    return {
      label: 'Escalado',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: <Zap className="w-3 h-3" />,
      barColor: 'bg-emerald-500',
    };
  }
  if (score >= 31) {
    return {
      label: 'Validação',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: <TrendingUp className="w-3 h-3" />,
      barColor: 'bg-amber-500',
    };
  }
  return {
    label: 'Teste',
    color: 'text-zinc-400',
    bg: 'bg-zinc-900/50',
    border: 'border-zinc-800',
    icon: <Activity className="w-3 h-3" />,
    barColor: 'bg-zinc-700',
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

// ─── Ad Preview (Iframe com tratamento de erro) ──────────────────────────────

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
          title={`Anúncio: ${ad.page_name}`}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 gap-3 border border-dashed border-zinc-800 rounded-lg m-2">
      <ImageOff className="w-6 h-6 text-zinc-700" />
      <div className="text-center px-4">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Preview Indisponível</p>
        <p className="text-[9px] text-zinc-700 mt-1">A Meta bloqueou o acesso direto ao iframe.</p>
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
  const daysActive = ad.daysActive ?? calculateDaysActive(ad.ad_delivery_start_time, ad.ad_delivery_stop_time);
  const isStillActive = !ad.ad_delivery_stop_time;
  const platforms = ad.publisher_platforms || [];
  const mediaType = ad.media_type;
  const adId = ad.id || ad.ad_archive_id;
  const snapshotUrl = ad.ad_snapshot_url;

  return (
    <>
      {/* ── Card Black Minimalista Premium ── */}
      <div
        className="group relative bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/[0.05] hover:border-white/[0.15] transition-all duration-500 flex flex-col shadow-2xl"
        onClick={() => setOpen(true)}
      >
        {/* Glow Effect on Hover */}
        <div className="absolute -inset-px bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* ── Header ── */}
        <div className="relative px-4 pt-4 pb-3 flex items-start justify-between gap-3 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/[0.05] flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-zinc-400 text-sm font-black">{ad.page_name?.charAt(0).toUpperCase() || 'A'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-zinc-100 leading-tight truncate tracking-tight">
                {ad.page_name || 'Anunciante'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Patrocinado</span>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <Globe className="w-2.5 h-2.5 text-zinc-600" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border backdrop-blur-md",
              scaleStatus.bg, scaleStatus.border, scaleStatus.color
            )}>
              {scaleStatus.icon}
              {scaleStatus.label}
            </span>
            {adId && (
              <p className="text-[8px] text-zinc-700 font-mono tracking-tighter">ID: {adId}</p>
            )}
          </div>
        </div>

        {/* ── Iframe do Anúncio (O Coração do Card) ── */}
        <div
          className="relative w-full aspect-[4/5] bg-zinc-950 overflow-hidden border-y border-white/[0.03] group/iframe"
          onClick={(e) => e.stopPropagation()}
        >
          <AdPreviewFrame ad={ad} />

          {/* Premium Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/iframe:opacity-40 transition-opacity duration-500 pointer-events-none" />
          
          {/* Action Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Analisar Criativo
            </button>
          </div>
        </div>

        {/* ── Métricas Rastreadas (Design Premium) ── */}
        <div className="relative px-4 py-4 bg-gradient-to-b from-zinc-900/20 to-black z-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
              Data Intelligence
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-800/50 to-transparent ml-4" />
          </div>

          {/* Grid de métricas */}
          <div className="grid grid-cols-3 gap-2">
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

          {/* Barra de Score Inferior */}
          {ad.scalingScore !== undefined && (
            <div className="mt-4 pt-3 border-t border-white/[0.03]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Scaling Score</span>
                <span className={cn("text-[10px] font-black", scaleStatus.color)}>{ad.scalingScore}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", scaleStatus.barColor)}
                  style={{ width: `${Math.min(100, ad.scalingScore || 0)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div
          className="px-4 pb-4 pt-1 flex gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
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

      {/* ── Modal de Detalhes (Mantido Black Premium) ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 border-white/[0.1] bg-black shadow-[0_0_50px_rgba(0,0,0,1)]">
          <div className="flex h-[85vh]">
            {/* Esquerda: Criativo */}
            <div className="w-3/5 border-r border-white/[0.05] bg-zinc-950 flex flex-col relative">
               <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    Live Preview
                  </span>
               </div>
               <div className="flex-1 overflow-hidden">
                  <AdPreviewFrame ad={ad} />
               </div>
            </div>

            {/* Direita: Inteligência de Dados */}
            <div className="w-2/5 overflow-y-auto p-8 space-y-8 bg-[#050505]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-xl font-black text-white">
                  {ad.page_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">{ad.page_name}</h2>
                  <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Meta ID: {adId}</p>
                </div>
              </div>

              {/* Scaling Analysis */}
              <div className={cn("p-5 rounded-2xl border backdrop-blur-sm", scaleStatus.bg, scaleStatus.border)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {scaleStatus.icon}
                    <span className={cn("text-xs font-black uppercase tracking-[0.2em]", scaleStatus.color)}>
                      {scaleStatus.label}
                    </span>
                  </div>
                  <span className="text-xl font-black text-white">{ad.scalingScore || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000", scaleStatus.barColor)}
                    style={{ width: `${ad.scalingScore || 0}%` }}
                  />
                </div>
              </div>

              {/* Copy Analysis */}
              {copy && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Creative Copy</p>
                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.03] text-zinc-300 text-xs leading-relaxed italic">
                    "{copy}"
                  </div>
                </div>
              )}

              {/* Data Grid */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rastreamento de Performance</p>
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
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timeline</p>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{formatDateShort(ad.ad_delivery_start_time)}</span>
                  </div>
                  <div className="h-px flex-1 bg-zinc-800" />
                  <div className="flex items-center gap-2">
                    {isStillActive ? (
                      <span className="text-emerald-500 font-black uppercase text-[9px]">Live Now</span>
                    ) : (
                      <span>{formatDateShort(ad.ad_delivery_stop_time)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* External Link */}
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
