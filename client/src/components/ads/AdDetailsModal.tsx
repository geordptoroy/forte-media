import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Eye, Calendar, Globe, Clock, Tag, Package, Repeat, ExternalLink, 
  Download, Share2, Link as LinkIcon, Users, MapPin, BarChart3, 
  Copy, MessageSquare, Sparkles, Info, Instagram, Facebook, Search
} from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

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
  const title = ad.ad_creative_link_titles?.[0] || "";
  const platforms = ad.publisher_platforms || [];
  const page = ad.pageDetails;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const downloadMedia = async () => {
    if (!media || !media.url) return;
    const url = Array.isArray(media.url) ? media.url[0] : media.url;
    window.open(url, '_blank');
    toast.info("Iniciando download em nova aba.");
  };

  const shareAd = (platform: 'whatsapp' | 'telegram' | 'email') => {
    const text = `Confira este anúncio vencedor!\n\nAnunciante: ${ad.page_name}\nAtivo há: ${ad.frequency} anúncios similares\nLink: ${officialLibraryUrl}`;
    const encodedText = encodeURIComponent(text);
    
    const urls = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${officialLibraryUrl}&text=${encodedText}`,
      email: `mailto:?subject=Anúncio Vencedor Encontrado&body=${encodedText}`
    };
    
    window.open(urls[platform], '_blank');
  };

  const generateAI = (type: 'keywords' | 'audience' | 'copy') => {
    const prompts = {
      keywords: `Gere 10 palavras-chave de alta conversão para este anúncio: "${body}"`,
      audience: `Sugira uma segmentação de público detalhada no Facebook Ads para este produto: "${body}"`,
      copy: `Crie 3 variações de copy para teste A/B baseadas neste anúncio: "${body}"`
    };
    
    const encodedPrompt = encodeURIComponent(prompts[type]);
    window.open(`https://chatgpt.com/?q=${encodedPrompt}`, '_blank');
    toast.success("Prompt enviado para o ChatGPT!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-[#0A0A0A] border-white/10 text-white p-0 overflow-hidden gap-0">
        <div className="flex flex-col md:flex-row h-[90vh] md:h-[700px]">
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
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase">Ativo</Badge>
                  {page?.verification_status === 'verified' && (
                    <Badge className="bg-blue-500 text-white text-[8px] font-black uppercase">Verificado</Badge>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/20 tabular-nums">ID: {ad.id}</span>
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                {ad.page_name}
                {page?.instagram_accounts?.[0] && (
                  <a href={`https://instagram.com/${page.instagram_accounts[0].username}`} target="_blank" rel="noreferrer">
                    <Instagram className="w-4 h-4 text-pink-500 hover:scale-110 transition-transform" />
                  </a>
                )}
              </DialogTitle>
              <DialogDescription className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Iniciado em {new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR')}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                {/* Anunciante Info */}
                {page && (
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                      <Info className="w-3 h-3" /> Sobre o Anunciante
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-white/40 uppercase font-black">Categoria</p>
                        <p className="text-xs font-bold">{page.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/40 uppercase font-black">Seguidores</p>
                        <p className="text-xs font-bold">{page.fan_count?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                    {page.about && <p className="text-[10px] text-white/60 leading-relaxed">{page.about}</p>}
                  </div>
                )}

                {/* Texto do Criativo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Texto do Criativo</h4>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase text-white/40 hover:text-white" onClick={() => copyToClipboard(body, "Texto")}>
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-4 rounded-xl">
                    <p className="text-xs leading-relaxed text-white/80 italic">"{body}"</p>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                      <Eye className="w-3 h-3" /> Impressões
                    </div>
                    <p className="text-sm font-black text-white">{ad.impressions?.lower_bound || 0} - {ad.impressions?.upper_bound || '1k+'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                      <Repeat className="w-3 h-3" /> Escala (Criativos)
                    </div>
                    <p className="text-sm font-black text-emerald-500">{ad.frequency || 1} anúncios iguais</p>
                  </div>
                </div>

                {/* IA Actions */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-purple-500" /> Gerar com IA
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-[9px] font-black uppercase border-purple-500/20 hover:bg-purple-500/10" onClick={() => generateAI('keywords')}>Palavras-Chave</Button>
                    <Button variant="outline" size="sm" className="text-[9px] font-black uppercase border-purple-500/20 hover:bg-purple-500/10" onClick={() => generateAI('audience')}>Público Alvo</Button>
                    <Button variant="outline" size="sm" className="text-[9px] font-black uppercase border-purple-500/20 hover:bg-purple-500/10" onClick={() => generateAI('copy')}>Variações de Copy</Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
              <Button className="flex-1 bg-white text-black hover:bg-white/90 font-black uppercase text-[10px] tracking-widest h-11" asChild>
                <a href={officialLibraryUrl} target="_blank" rel="noreferrer">
                  Biblioteca <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 h-11 px-4">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0A0A0A] border-white/10 text-white">
                  <DropdownMenuItem onClick={() => shareAd('whatsapp')} className="text-[10px] font-black uppercase">WhatsApp</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareAd('telegram')} className="text-[10px] font-black uppercase">Telegram</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => shareAd('email')} className="text-[10px] font-black uppercase">E-mail</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
