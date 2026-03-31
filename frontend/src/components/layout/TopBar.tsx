import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ads': 'Anúncios Escalados',
  '/search': 'Pesquisa Avançada',
  '/monitoring': 'Monitoramento',
  '/favorites': 'Favoritos',
  '/reports': 'Relatórios',
  '/settings': 'Configurações',
};

interface TopBarProps {
  sidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ sidebarCollapsed }) => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'FORTE MEDIA';

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center px-6 z-30 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '64px' : '280px' }}
    >
      <h1 className="text-white font-semibold text-lg">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-[#AAAAAA] bg-[#111111] border border-[#222222] px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Modo Mock Ativo
        </div>
      </div>
    </header>
  );
};
