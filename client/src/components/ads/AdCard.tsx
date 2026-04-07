import React, { useState } from 'react';
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

// ─── Thumbnail resolver ──────────────────────────────────────────────────────
// A Meta retorna ad_snapshot_url como URL da biblioteca de anúncios (HTML),
// não como imagem direta. Para exibir o criativo, usamos um iframe ou
// fallback para placeholder. Para imagens diretas, a API retorna campos
// como images[].url ou video_hd_url (apenas com permissões especiais).
// A solução robusta é usar o iframe do snapshot_url dentro do modal.

function AdThumbnail({ ad, className }: { ad: any; className?: string }) {
  const [imgError, setImgError] = useState(false);
  
  // Tentar extrair URL de imagem direta de campos alternativos
  const directImageUrl =
    ad.image_url ||
    ad.thumbnail_url ||
    ad.ad_creative_images?.[0]?.url ||
    ad.creative?.thumbnail_url ||
    null;

  if (directImageUrl && !imgError) {
    return (
      <img
        src={directImageUrl}
        alt={ad.page_name || 'Criativo'}
        className={cn("w-full h-full object-cover", className)}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: exibir placeholder com informações do anúncio
  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-3", className)}>
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

  const handleMonitor = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMonitored) { toast.info('Anúncio já está em monitoramento'); return; }
    const adId = ad.id || ad.ad_archive_id;
    const pageId = ad.page_id;
    if (!adId || !pageId) { toast.error('Dados do anúncio incompletos'); return; }
    addMonitoredMutation.mutate({ adId, pageId, pageName: ad.page_name });
  };

  const scaleStatus = getScaleStatus(ad.scalingScore);
  const displayBody = ad.ad_creative_bodies?.[0] || ad.body || '';
  const displayTitle = ad.ad_creative_link_titles?.[0] || '';
  const isVideo = ad.media_type === 'VIDEO';
  const platforms = ad.publisher_platforms || [];
  const daysActive = ad.daysActive || 0;

  return (
    <>
      {/* ── Card ── */}
      <div
        onClick={() => setOpen(true)}
        className="group cursor-pointer bg-black border-b border-r border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-150 flex flex-col h-full"
      >
        {/* Scale bar top */}
        {ad.scalingScore !== undefined && (
          <div className="h-0.5 w-full bg-white/[0.04]">
            <div
              className={cn(
                "h-full transition-all duration-700",
                ad.scalingScore >= 70 ? "bg-green-500" :
                ad.scalingScore >= 40 ? "bg-yellow-500" : "bg-white/20"
              )}
              style={{ width: `${ad.scalingScore}%` }}
            />
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative aspect-square bg-[#080808] overflow-hidden">
          <AdThumbnail ad={ad} />

          {/* Media type badge */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 bg-black/60 border border-white/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={cn("scale-indicator", scaleStatus.bg, scaleStatus.border, scaleStatus.color)}>
              {scaleStatus.icon}
              {scaleStatus.label}
            </span>
            {ad.scalingScore !== undefined && (
              <span className="text-[8px] font-black px-1.5 py-0.5 bg-black/70 text-white/60 border border-white/[0.08] uppercase tracking-widest">
                Score {ad.scalingScore}
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleFavorite}
              className={cn(
                "w-7 h-7 flex items-center justify-center border transition-all",
                isFavorited
                  ? "bg-red-500 border-red-500 text-white"
                  : "bg-black/70 border-white/20 text-white hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-3 h-3", isFavorited && "fill-current")} />
            </button>
            <button
              onClick={(e) => handleMonitor(e)}
              className={cn(
                "w-7 h-7 flex items-center justify-center border transition-all",
                isMonitored
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-black/70 border-white/20 text-white hover:bg-white/20"
              )}
            >
              <Eye className="w-3 h-3" />
            </button>
            <a
              href={ad.ad_snapshot_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 flex items-center justify-center border bg-black/70 border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Info section */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          {/* Advertiser */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
              <span className="text-[8px] font-black text-white/60">
                {ad.page_name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-white truncate flex-1">{ad.page_name || 'Anunciante'}</span>
            {isVideo && (
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest border border-white/[0.06] px-1.5 py-0.5 shrink-0">
                VIDEO
              </span>
            )}
          </div>

          {/* Copy preview */}
          {displayBody && (
            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
              {displayBody}
            </p>
          )}
          {displayTitle && !displayBody && (
            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed font-bold">
              {displayTitle}
            </p>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04] mt-auto">
            <div className="bg-black px-2 py-1.5">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <DollarSign className="w-2 h-2" /> Gasto
              </p>
              <p className="text-[11px] font-black text-white">{renderMetricValue(ad.spend)}</p>
            </div>
            <div className="bg-black px-2 py-1.5">
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <BarChart2 className="w-2 h-2" /> Alcance
              </p>
              <p className="text-[11px] font-black text-white">{renderMetricValue(ad.impressions)}</p>
            </div>
          </div>

          {/* Footer: platforms + date */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1">
              {platforms.slice(0, 3).map((p: string) => (
                <span key={p} className="text-[8px] font-black uppercase text-gray-700 border border-white/[0.06] px-1.5 py-0.5">
                  {p.slice(0, 2)}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-700">
              <Clock className="w-2.5 h-2.5" />
              <span>{daysActive > 0 ? `${daysActive}d` : formatDate(ad.ad_delivery_start_time)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-black border border-white/[0.08] max-w-5xl p-0 overflow-hidden rounded-none shadow-2xl">
          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[680px]">

            {/* Left: Creative Preview */}
            <div className="w-full lg:w-[45%] bg-[#060606] border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-col">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Visualização do Criativo</span>
                <a
                  href={ad.ad_snapshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-black text-gray-600 hover:text-white transition-colors uppercase tracking-widest"
                >
                  <Maximize2 className="w-3 h-3" />
                  Abrir
                </a>
              </div>
              <div className="flex-1 overflow-hidden">
                <CreativeViewer ad={ad} />
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full lg:w-[55%] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-white/60">{ad.page_name?.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white leading-tight truncate">{ad.page_name}</h3>
                    <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest truncate">
                      ID: {ad.id || ad.ad_archive_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Scale badge */}
                  <span className={cn("scale-indicator", scaleStatus.bg, scaleStatus.border, scaleStatus.color)}>
                    {scaleStatus.icon}
                    {scaleStatus.label}
                    {ad.scalingScore !== undefined && ` · ${ad.scalingScore}`}
                  </span>
                  <button
                    onClick={handleFavorite}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center border transition-all",
                      isFavorited ? "bg-red-500 border-red-500 text-white" : "border-white/[0.08] text-gray-500 hover:text-white hover:border-white/20"
                    )}
                  >
                    <Heart className={cn("w-3.5 h-3.5", isFavorited && "fill-current")} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-5">

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
                    <div className="bg-black p-3">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <DollarSign className="w-2.5 h-2.5" /> Gasto Estimado
                      </p>
                      <p className="text-base font-black text-white">{renderMetricValue(ad.spend)}</p>
                    </div>
                    <div className="bg-black p-3">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <BarChart2 className="w-2.5 h-2.5" /> Alcance / Impressões
                      </p>
                      <p className="text-base font-black text-green-400">{renderMetricValue(ad.impressions)}</p>
                    </div>
                    <div className="bg-black p-3">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Clock className="w-2.5 h-2.5" /> Dias Ativo
                      </p>
                      <p className="text-base font-black text-white">{daysActive > 0 ? `${daysActive} dias` : 'N/D'}</p>
                    </div>
                    <div className="bg-black p-3">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Globe className="w-2.5 h-2.5" /> Plataformas
                      </p>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {platforms.length > 0 ? platforms.map((p: string) => (
                          <span key={p} className="text-[8px] font-black uppercase text-gray-400 border border-white/[0.08] px-1.5 py-0.5">
                            {p}
                          </span>
                        )) : <span className="text-sm font-black text-gray-600">N/D</span>}
                      </div>
                    </div>
                  </div>

                  {/* Scaling Analysis */}
                  {ad.scalingReasons && ad.scalingReasons.length > 0 && (
                    <div className="border border-white/[0.06] bg-white/[0.01]">
                      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-yellow-500" />
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Análise de Escala</span>
                      </div>
                      <div className="p-4 space-y-2">
                        {ad.scalingReasons.map((reason: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-yellow-500/50 mt-1.5 shrink-0" />
                            <p className="text-[11px] text-gray-400 leading-relaxed">{reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Creative Copy */}
                  {(displayBody || displayTitle) && (
                    <div className="border border-white/[0.06]">
                      <div className="px-4 py-2.5 border-b border-white/[0.06]">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Copy do Criativo</span>
                      </div>
                      <div className="p-4">
                        {displayTitle && (
                          <p className="text-sm font-black text-white mb-2 leading-snug">{displayTitle}</p>
                        )}
                        {displayBody && (
                          <p className="text-xs text-gray-400 leading-relaxed">{displayBody}</p>
                        )}
                        {ad.ad_creative_link_descriptions?.[0] && (
                          <p className="text-[10px] text-gray-600 mt-2 leading-relaxed border-t border-white/[0.04] pt-2">
                            {ad.ad_creative_link_descriptions[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
                    <div className="bg-black p-3">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Início</p>
                      <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ad.ad_delivery_start_time)}
                      </p>
                    </div>
                    <div className="bg-black p-3">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Fim / Status</p>
                      <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                        <Activity className="w-3 h-3" />
                        {ad.ad_delivery_stop_time ? formatDate(ad.ad_delivery_stop_time) : (
                          <span className="text-green-400">Ativo</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Media type + currency */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {ad.media_type && (
                      <span className="text-[8px] font-black uppercase tracking-widest border border-white/[0.08] px-2 py-1 text-gray-500">
                        {ad.media_type}
                      </span>
                    )}
                    {ad.currency && (
                      <span className="text-[8px] font-black uppercase tracking-widest border border-white/[0.08] px-2 py-1 text-gray-500">
                        {ad.currency}
                      </span>
                    )}
                    {ad.ad_archive_id && (
                      <span className="text-[8px] font-mono text-gray-700 border border-white/[0.04] px-2 py-1">
                        Archive: {ad.ad_archive_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="px-6 py-4 border-t border-white/[0.06] flex gap-2">
                <button
                  onClick={() => handleMonitor()}
                  className={cn(
                    "flex-1 h-10 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all",
                    isMonitored
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-white text-black hover:bg-white/90"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isMonitored ? 'Monitorando' : 'Monitorar'}
                </button>
                <a
                  href={ad.ad_snapshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-10 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Biblioteca Meta
                </a>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
