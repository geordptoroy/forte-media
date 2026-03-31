import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#000000]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar sidebarCollapsed={collapsed} />
      <main
        className="transition-all duration-300 pt-16"
        style={{ marginLeft: collapsed ? '64px' : '280px' }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
