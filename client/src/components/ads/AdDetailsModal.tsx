import React, { memo, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Eye, Calendar, Globe, Clock, Tag, Package, Repeat, ExternalLink, 
  Download, Share2, Link as LinkIcon, Users, MapPin, BarChart3, 
  Copy, MessageSquare, Sparkles, Info, Instagram, Facebook, Search,
  AlertCircle, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type ExtractionResult } from "../../types/adTypes";

// --- TIPAGEM ---
interface AdDetailsModalProps {
  ad: any;
  media: ExtractionResult | null;
  isOpen: boolean;
  onClose: () => void;
}

// --- SUB-COMPONENTES MEMOIZADOS ---

const InfoSection = memo(({ icon: Icon, label, value, colorClass = "text-white" }: { 
  icon: any, 
  label: string, 
  value: string | number,
  colorClass?: string
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
      <Icon className="w-3 h-3" /> {label}
    </div>
    <p className={cn("text-sm font-black tracking-tight", colorClass)}>{value}</p>
  </div>
));

const AIActionButton = memo(({ onClick, label }: { onClick: () => void, label: string }) => (
  <Button 
    variant="outline" 
    size="sm" 
    className="text-[9px] font-black uppercase border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all"
    onClick={onClick}
  >
    {label}
  </Button>
));

// --- COMPONENTE PRINCIPAL ---

export const AdDetailsModal = memo(({ ad, media, isOpen, onClose }: AdDetailsModalProps) => {
  if (!ad) return null;

  // Memoização de URLs e Dados
  const data = useMemo(() => {
    const officialLibraryUrl = `https://www.facebook.com/ads/library/?id=${ad.id}`;
    const body = ad.ad_creative_bodies?.[0] || "Sem descrição disponível.";
    const platforms = ad.publisher_platforms || [];
    const page = ad.pageDetails;
    const startDate = ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR') : 'N/A';
    
    return { officialLibraryUrl, body, platforms, page, startDate };
  }, [ad]);

  // Handlers
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const downloadMedia = () => {
    if (!media || !media.url) return;
    const url = Array.isArray(media.url) ? media.url[0] : media.url;
    window.open(url, '_blank');
    toast.info("Abrindo mídia em nova aba.");
  };

  const shareAd = (platform: 'whatsapp' | 'telegram' | 'email') => {
    const text = `Confira este anúncio vencedor!\n\nAnunciante: ${ad.page_name}\nAtivo há: ${ad.frequency} anúncios similares\nLink: ${data.officialLibraryUrl}`;
    const encodedText = encodeURIComponent(text);
    
    const urls = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${data.officialLibraryUrl}&text=${encodedText}`,
      email: `mailto:?subject=Anúncio Vencedor Encontrado&body=${encodedText}`
    };
    
    window.open(urls[platform], '_blank');
  };

  const generateAI = (type: 'keywords' | 'audience' | 'copy') => {
    const prompts = {
      keywords: `Gere 10 palavras-chave de alta conversão para este anúncio: "${data.body}"`,
      audience: `Sugira uma segmentação de público detalhada no Facebook Ads para este produto: "${data.body}"`,
      copy: `Crie 3 variações de copy para teste A/B baseadas neste anúncio: "${data.body}"`
    };
    
    const encodedPrompt = encodeURIComponent(prompts[type]);
    window.open(`https://chatgpt.com/?q=${encodedPrompt}`, '_blank');
    toast.success("Prompt enviado para o ChatGPT!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-[#0A0A0A] border-white/10 text-white p-0 overflow-hidden gap-0 shadow-2xl">
        <div className="flex flex-col md:flex-row h-[90vh] md:h-[750px]">
          
          {/* Media Section (Left) */}
          <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
            {media ? (
              media.type === 'video' ? (
                <video 
                  src={Array.isArray(media.url) ? media.url[0] : media.url} 
                  controls 
                  autoPlay 
                  muted 
                  loop 
                  className="max-h-full max-w-full object-contain" 
                />
              ) : (
                <img 
                  src={Array.isArray(media.url) ? media.url[0] : media.url} 
                  className="max-h-full max-w-full object-contain" 
                  alt="Ad Preview" 
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-3 opacity-20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Carregando Mídia...</span>
              </div>
            )}
            
            <div className="absolute top-6 left-6 flex gap-2 z-10">
              {data.platforms.map((p: string) => (
                <Badge key={p} className="bg-black/80 backdrop-blur-md border-white/10 text-[8px] font-black uppercase px-2.5 py-1">
                  {p}
                </Badge>
              ))}
            </div>
          </div>

          {/* Info Section (Right) */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#0A0A0A]">
            <DialogHeader className="p-8 border-b border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5">
                    Ativo
                  </Badge>
                  {data.page?.verification_status === 'verified' && (
                    <Badge className="bg-blue-500 text-white text-[8px] font-black uppercase px-2 py-0.5">
                      Verificado
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/20 tabular-nums tracking-widest">ID: {ad.id}</span>
              </div>
              
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  {ad.page_name}
                  {data.page?.instagram_accounts?.[0] && (
                    <a href={`https://instagram.com/${data.page.instagram_accounts[0].username}`} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-opacity">
                      <Instagram className="w-5 h-5 text-pink-500" />
                    </a>
                  )}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Iniciado em {data.startDate}
                </DialogDescription>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-10">
                
                {/* Anunciante Info */}
                {data.page && (
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Sobre o Anunciante
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <InfoSection icon={Tag} label="Categoria" value={data.page.category || 'N/A'} />
                      <InfoSection icon={Users} label="Seguidores" value={data.page.fan_count?.toLocaleString() || 'N/A'} />
                    </div>
                    {data.page.about && (
                      <p className="text-[11px] text-white/60 leading-relaxed font-medium border-t border-white/5 pt-4">
                        {data.page.about}
                      </p>
                    )}
                  </div>
                )}

                {/* Texto do Criativo */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Texto do Criativo</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5" 
                      onClick={() => copyToClipboard(data.body, "Texto")}
                    >
                      <Copy className="w-3.5 h-3.5 mr-2" /> Copiar
                    </Button>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl relative group">
                    <p className="text-xs leading-relaxed text-white/80 italic font-medium">
                      "{data.body}"
                    </p>
                  </div>
                </div>

                {/* Métricas de Performance */}
                <div className="grid grid-cols-2 gap-6">
                  <InfoSection 
                    icon={Eye} 
                    label="Impressões" 
                    value={`${ad.impressions?.lower_bound || 0} - ${ad.impressions?.upper_bound || '1k+'}`} 
                  />
                  <InfoSection 
                    icon={Repeat} 
                    label="Escala (Criativos)" 
                    value={`${ad.collationCount || 1} anúncios iguais`} 
                    colorClass="text-emerald-500"
                  />
                </div>

                {/* IA Actions */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Inteligência Artificial
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    <AIActionButton label="Palavras-Chave" onClick={() => generateAI('keywords')} />
                    <AIActionButton label="Público Alvo" onClick={() => generateAI('audience')} />
                    <AIActionButton label="Variações de Copy" onClick={() => generateAI('copy')} />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-8 border-t border-white/5 bg-white/[0.01] flex gap-4">
              <Button className="flex-1 bg-white text-black hover:bg-white/90 font-black uppercase text-[11px] tracking-[0.15em] h-12 shadow-lg shadow-white/5" asChild>
                <a href={data.officialLibraryUrl} target="_blank" rel="noreferrer">
                  Biblioteca <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 h-12 w-12 p-0 rounded-xl">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#0A0A0A] border-white/10 text-white p-2 min-w-[160px]">
                    <DropdownMenuItem onClick={() => shareAd('whatsapp')} className="text-[10px] font-black uppercase py-2.5 cursor-pointer">WhatsApp</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareAd('telegram')} className="text-[10px] font-black uppercase py-2.5 cursor-pointer">Telegram</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => shareAd('email')} className="text-[10px] font-black uppercase py-2.5 cursor-pointer">E-mail</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="outline" 
                  className="border-white/10 hover:bg-white/5 h-12 w-12 p-0 rounded-xl" 
                  onClick={downloadMedia}
                  title="Ver mídia original"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AdDetailsModal.displayName = "AdDetailsModal";
