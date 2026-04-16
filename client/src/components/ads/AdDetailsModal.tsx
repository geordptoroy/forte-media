import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Eye, Calendar, Globe, Clock, Tag, Package, Repeat, ExternalLink, Download, Share2, Link as LinkIcon, Users, MapPin, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AdDetailsModalProps {
  ad: any;
  media: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AdDetailsModal({ ad, media, isOpen, onClose }: AdDetailsModalProps) {
  if (!ad) return null;

  const officialLibraryUrl = `https://www.facebook.com/ads/library/?id=${ad.id}`;
  const body = ad.ad_creative_bodies?.[0] || "Sem descrição disponível.";
  const platforms = ad.publisher_platforms || [];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(officialLibraryUrl);
    toast.success("Link da biblioteca copiado!");
  };

  const downloadMedia = async () => {
    if (!media || !media.url) return;
    const url = Array.isArray(media.url) ? media.url[0] : media.url;
    const extension = media.type === 'video' ? 'mp4' : 'jpg';
    window.open(url, '_blank');
    toast.info("Iniciando download em nova aba.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0A0A0A] border-white/10 text-white p-0 overflow-hidden gap-0">
        <div className="flex flex-col md:flex-row h-[90vh] md:h-[600px]">
          {/* Media Section */}
          <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/10">
            {media ? (
              media.type === 'video' ? (
                <video src={media.url} controls autoPlay muted loop className="max-h-full max-w-full object-contain" />
              ) : (
                <img src={Array.isArray(media.url) ? media.url[0] : media.url} className="max-h-full max-w-full object-contain" alt="Ad" />
              )
            ) : (
              <div className="text-white/20 text-[10px] font-black uppercase tracking-widest">Mídia não carregada</div>
            )}
            
            <div className="absolute top-4 left-4 flex gap-2">
              {platforms.map((p: string) => (
                <Badge key={p} className="bg-black/80 border-white/10 text-[8px] font-black uppercase">{p}</Badge>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="w-full md:w-1/2 flex flex-col">
            <DialogHeader className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase">Ativo</Badge>
                <span className="text-[10px] font-bold text-white/20 tabular-nums">ID: {ad.id}</span>
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">{ad.page_name}</DialogTitle>
              <DialogDescription className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Iniciado em {new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR')}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                {/* Copy Section */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Texto do Criativo</h4>
                  <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                    <p className="text-xs leading-relaxed text-white/80 italic">"{body}"</p>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                      <Eye className="w-3 h-3" /> Impressões
                    </div>
                    <p className="text-sm font-black text-white">{ad.impressions?.lower_bound || 0} - {ad.impressions?.upper_bound || '1k+'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                      <Repeat className="w-3 h-3" /> Frequência
                    </div>
                    <p className="text-sm font-black text-white">{ad.frequency || 1} Anúncios</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                      <Package className="w-3 h-3" /> Tipo
                    </div>
                    <p className="text-sm font-black text-white uppercase">{ad.detectedProductType || 'Infoproduto'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                      <Tag className="w-3 h-3" /> Nicho
                    </div>
                    <p className="text-sm font-black text-white uppercase">{ad.detectedNiche || 'Outros'}</p>
                  </div>
                </div>

                {/* Target Info */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Segmentação Estimada</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-white/60">
                      <Globe className="w-4 h-4 text-white/20" />
                      <span>Países: {ad.target_locations?.map((l: any) => l.name).join(', ') || 'Brasil'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-white/60">
                      <Users className="w-4 h-4 text-white/20" />
                      <span>Público: {ad.estimated_audience_size?.lower_bound || 'N/A'} - {ad.estimated_audience_size?.upper_bound || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
              <Button className="flex-1 bg-white text-black hover:bg-white/90 font-black uppercase text-[10px] tracking-widest h-11" asChild>
                <a href={officialLibraryUrl} target="_blank" rel="noreferrer">
                  Ver na Biblioteca <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 h-11 px-4" onClick={copyToClipboard}>
                <LinkIcon className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 h-11 px-4" onClick={downloadMedia}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
