import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AdCardProps {
  ad: any;
}

export const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  const [open, setOpen] = useState(false);

  const handleFavorite = async () => {
    console.log('Adicionado aos favoritos:', ad.id);
  };

  const handleMonitor = async () => {
    console.log('Monitoramento ativado:', ad.id);
  };

  return (
    <>
      <Card className="hover:border-primary/50 transition-all duration-200 group">
        <div className="relative">
          <img
            src={ad.creative_url || `https://picsum.photos/seed/${ad.id}/400/300`}
            alt={ad.page_name}
            className="w-full h-40 object-cover rounded-t-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${ad.id}/400/300`;
            }}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            <span className="text-xs px-2 py-0.5 rounded-full border font-bold bg-primary/20 text-primary">
              Score {ad.score || 0}
            </span>
          </div>
          {ad.media_type && (
            <div className="absolute top-2 left-2">
              <span className="text-xs px-2 py-0.5 rounded bg-black/60 text-muted-foreground capitalize">
                {ad.media_type}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm truncate mb-2">{ad.page_name}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
            <div>
              <span className="block text-xs opacity-60">Gasto</span>
              <span>${ad.spend || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs opacity-60">Impressões</span>
              <span>{ad.impressions || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs opacity-60">Dias no ar</span>
              <span>{ad.days_active || 'N/A'}d</span>
            </div>
            <div>
              <span className="block text-xs opacity-60">Status</span>
              <span className="text-green-500">Ativo</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => setOpen(true)}
              className="flex-1"
            >
              Ver detalhes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFavorite}
              title="Favoritar"
            >
              ★
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMonitor}
              title="Monitorar"
            >
              ◎
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes — {ad.page_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <img
              src={ad.creative_url || `https://picsum.photos/seed/${ad.id}/400/300`}
              alt={ad.page_name}
              className="w-full rounded-lg object-cover max-h-64"
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted p-3 rounded-lg">
                <span className="text-muted-foreground block text-xs mb-1">
                  Score
                </span>
                <span className="font-bold text-lg text-primary">
                  {ad.score || 0}
                </span>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <span className="text-muted-foreground block text-xs mb-1">
                  Gasto
                </span>
                <span className="font-bold text-lg">${ad.spend || 'N/A'}</span>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <span className="text-muted-foreground block text-xs mb-1">
                  Impressões
                </span>
                <span className="font-bold text-lg">
                  {ad.impressions || 'N/A'}
                </span>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <span className="text-muted-foreground block text-xs mb-1">
                  Dias no ar
                </span>
                <span className="font-bold text-lg">
                  {ad.days_active || 'N/A'}d
                </span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Anúncio:</strong> {ad.page_name}
              </p>
              <p>
                <strong>Tipo:</strong> {ad.media_type || 'N/A'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleFavorite}
                variant="secondary"
                className="flex-1"
              >
                ★ Favoritar
              </Button>
              <Button
                onClick={handleMonitor}
                variant="default"
                className="flex-1"
              >
                ◎ Monitorar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
