import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '◈' },
  { path: '/ads', label: 'Anúncios Escalados', icon: '⚡' },
  { path: '/search', label: 'Pesquisa Avançada', icon: '⊕' },
  { path: '/monitoring', label: 'Monitoramento', icon: '◎' },
  { path: '/favorites', label: 'Favoritos', icon: '★' },
  { path: '/reports', label: 'Relatórios', icon: '▤' },
  { path: '/settings', label: 'Configurações', icon: '⚙' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1a1a1a]">
        <div className="w-8 h-8 bg-[#2C3E66] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">FM</span>
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-base leading-tight">FORTE MEDIA</div>
            <div className="text-[#AAAAAA] text-xs">Inteligência Competitiva</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn('ml-auto text-[#AAAAAA] hover:text-white transition-colors', collapsed && 'mx-auto')}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-[#2C3E66]/20 text-white border border-[#2C3E66]/30'
                  : 'text-[#AAAAAA] hover:text-white hover:bg-[#1a1a1a]'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-[#1a1a1a]">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2C3E66] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-[#AAAAAA] text-xs truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-[#AAAAAA] hover:text-red-400 transition-colors text-sm" title="Sair">
              ⏻
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center text-[#AAAAAA] hover:text-red-400 transition-colors" title="Sair">
            ⏻
          </button>
        )}
      </div>
    </aside>
  );
};
