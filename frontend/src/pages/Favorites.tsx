import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { favoritesApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { getScoreBadgeColor, formatSpendRange } from '../lib/utils';

export const Favorites: React.FC = () => {
  const { toast } = useToast();
  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.list,
  });

  const handleRemove = async (adId: string) => {
    try {
      await favoritesApi.remove(adId);
      toast('Removido dos favoritos');
      refetch();
    } catch (err) {
      toast('Erro ao remover', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        [1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)
      ) : favorites?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[#AAAAAA]">Nenhum anúncio favoritado</p>
          </CardContent>
        </Card>
      ) : (
        favorites?.map((fav: any) => (
          <Card key={fav.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {fav.ad?.creative_url && (
                  <img src={fav.ad.creative_url} alt={fav.ad.page_name} className="w-20 h-20 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1">{fav.ad?.page_name}</h3>
                  <p className="text-[#AAAAAA] text-sm mb-2">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${getScoreBadgeColor(fav.ad?.score || 0)}`}>
                      Score {fav.ad?.score}
                    </span>
                  </p>
                  <p className="text-[#AAAAAA] text-sm mb-2">Pasta: {fav.folder_name}</p>
                  {fav.notes && <p className="text-[#888888] text-sm italic mb-2">"{fav.notes}"</p>}
                  <Button size="sm" variant="danger" onClick={() => handleRemove(fav.ad_id)}>Remover</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
