import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ExternalLink, Calendar, Users, Eye, DollarSign, Globe } from "lucide-react";

interface AdCardProps {
  ad: any;
}

export function AdCardV3({ ad }: AdCardProps) {
  const platforms = ad.publisher_platforms || [];
  const body = ad.ad_creative_bodies?.[0] || "Sem descrição disponível.";
  
  return (
    <Card className="overflow-hidden flex flex-col bg-black border-white/[0.06] hover:border-white/20 transition-all group">
      {/* Media Preview Placeholder */}
      <div className="aspect-[4/5] bg-white/[0.02] relative flex items-center justify-center border-b border-white/[0.06]">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <Eye className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Mídia disponível na biblioteca
          </p>
        </div>
        
        {/* Platform Badges */}
        <div className="absolute top-3 left-3 flex gap-1">
          {platforms.map((p: string) => (
            <Badge key={p} variant="secondary" className="bg-black/60 backdrop-blur-md text-[8px] px-1.5 py-0 border-white/10 uppercase font-black">
              {p}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-tight text-white truncate flex-1">
              {ad.page_name}
            </h3>
            <span className="text-[9px] font-bold text-white/30 ml-2">#{ad.id}</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/40 uppercase tracking-tighter">
            <Calendar className="w-3 h-3" />
            Início: {ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString('pt-BR') : 'N/A'}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-white/60 line-clamp-4 font-medium italic">
          "{body}"
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-white/[0.03] border border-white/[0.06] p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[8px] font-black text-white/40 uppercase tracking-widest">
              <DollarSign className="w-2.5 h-2.5" /> Gasto
            </div>
            <p className="text-[10px] font-black text-white">
              {ad.currency} {ad.spend?.lower_bound || 0} - {ad.spend?.upper_bound || '100+'}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[8px] font-black text-white/40 uppercase tracking-widest">
              <Eye className="w-2.5 h-2.5" /> Impressões
            </div>
            <p className="text-[10px] font-black text-white">
              {ad.impressions?.lower_bound || 0} - {ad.impressions?.upper_bound || '1k+'}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[8px] font-black text-white/40 uppercase tracking-widest">
              <Users className="w-2.5 h-2.5" /> Público
            </div>
            <p className="text-[10px] font-black text-white">
              {ad.estimated_audience_size?.lower_bound || 'N/A'}
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[8px] font-black text-white/40 uppercase tracking-widest">
              <Globe className="w-2.5 h-2.5" /> Região
            </div>
            <p className="text-[10px] font-black text-white truncate">
              {ad.delivery_by_region?.[0]?.region || 'Brasil'}
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-8 bg-white text-black hover:bg-white/90 border-none font-black text-[10px] uppercase tracking-widest mt-auto"
          asChild
        >
          <a href={ad.ad_snapshot_url} target="_blank" rel="noreferrer">
            Analisar Criativo <ExternalLink className="w-3 h-3 ml-2" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
