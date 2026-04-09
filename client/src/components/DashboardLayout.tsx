import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Pickaxe,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { MetaEventTracker } from "./ads/MetaEventTracker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
}

// Unified Menu Structure
const menuItems = [
  { 
    section: "FORTE ADS",
    items: [
      { icon: Pickaxe, label: "Minerador", href: "/minerador", description: "Busca global de anúncios" },
      { icon: Trophy, label: "Escalados", href: "/escalados", description: "Seus anúncios salvos" },
    ]
  }
];

interface SidebarContentProps {
  location: string;
  user: { name?: string | null; email?: string | null } | null;
  onLogout: () => void;
  onNavigate?: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

function SidebarContent({ location, user, onLogout, onNavigate, isCollapsed, toggleCollapse }: SidebarContentProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleSidebarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCollapsed) return;
    const target = e.target as HTMLElement;
    const navLink = target.closest("a[data-nav-link]");
    const logoutBtn = target.closest("button[data-logout]");
    const collapseBtn = target.closest("button[data-collapse-btn]");
    if (navLink || logoutBtn || collapseBtn) return;
    toggleCollapse();
  };

  return (
    <div
      className="flex flex-col h-full bg-black border-r border-white/[0.06] relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSidebarClick}
    >
      {/* Logo area */}
      <div
        className={cn(
          "px-6 py-6 flex items-center gap-3 shrink-0 border-b border-white/[0.06] relative",
          isCollapsed && "px-4 justify-center"
        )}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.button
              key="collapse-btn"
              data-collapse-btn
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              className={cn(
                "absolute inset-0 w-full h-full bg-black/80 backdrop-blur-sm",
                "hidden lg:flex items-center justify-center z-10",
                "cursor-pointer group/collapse-btn border-b border-white/[0.06]"
              )}
              title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white flex items-center justify-center shadow-xl">
                  {isCollapsed
                    ? <ChevronRight className="w-3.5 h-3.5 text-black" />
                    : <ChevronLeft className="w-3.5 h-3.5 text-black" />
                  }
                </div>
                {!isCollapsed && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                    Colapsar
                  </span>
                )}
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="w-7 h-7 bg-white flex items-center justify-center shrink-0">
          <span className="text-black font-black text-[10px] tracking-tighter">FM</span>
        </div>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-black text-base tracking-tighter text-white"
          >
            FORTE<span className="text-gray-500">MEDIA</span>
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto mt-4 custom-scrollbar">
        {menuItems.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[9px] font-black uppercase tracking-[0.25em] mb-2 text-white/50">
                {section.section}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      data-nav-link
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all duration-150 relative group",
                        isActive
                          ? "bg-white text-black"
                          : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-black" : "text-gray-500"
                        )}
                      />
                      {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs leading-tight">{item.label}</span>
                          <span className={cn(
                            "text-[9px] font-medium truncate",
                            isActive ? "text-black/60" : "text-gray-600"
                          )}>
                            {item.description}
                          </span>
                        </div>
                      )}
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 w-0.5 h-5 bg-white" />
                      )}
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className={cn("p-4 border-t border-white/[0.06] space-y-1 shrink-0", isCollapsed && "px-3")}>
        <Link href="/settings">
          <a
            data-nav-link
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all duration-150",
              location === "/settings"
                ? "bg-white text-black"
                : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-xs">Configurações</span>}
          </a>
        </Link>

        <button
          data-logout
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500/70 hover:bg-red-500/[0.06] hover:text-red-400 transition-all duration-150",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-xs">Sair da Conta</span>}
        </button>

        {!isCollapsed && (
          <div className="mt-3 px-3 py-3 bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-white">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{user?.name || "Usuário"}</p>
                <p className="text-[9px] text-gray-600 font-bold truncate uppercase tracking-tighter">Plano Pro</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const currentItem = menuItems.flatMap(s => s.items).find(i => i.href === location);
  const currentPageLabel = currentItem?.label || (location === "/settings" ? "Configurações" : "Forte Media");

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-white selection:text-black">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex border-r border-white/[0.06] bg-black flex-col z-50 shrink-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          location={location}
          user={user}
          onLogout={handleLogout}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-black border-r border-white/[0.06] [&>button]:hidden"
        >
          <SidebarContent
            location={location}
            user={user}
            onLogout={handleLogout}
            onNavigate={() => setMobileOpen(false)}
            isCollapsed={false}
            toggleCollapse={() => {}}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#020202] min-w-0 relative">
        {/* Header */}
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-black z-40 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-400 hover:text-white hover:bg-white/[0.04] rounded-none w-8 h-8"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            <div className="flex flex-col">
              <h2 className="text-xs font-black text-white tracking-tight flex items-center gap-2">
                {currentPageLabel}
                <span className="text-gray-700">·</span>
                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Painel</span>
              </h2>
              <p className="text-[9px] text-gray-700 font-bold uppercase tracking-tighter">
                {currentItem?.description || "Inteligência & Performance"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative w-8 h-8 rounded-none bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
              <Bell className="w-3.5 h-3.5 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-black text-[8px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06]">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-500" />
                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 animate-ping opacity-40" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Ativo
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 lg:p-8"
          >
            <div className="max-w-[1600px] mx-auto">{children}</div>
          </motion.div>
        </div>
      </main>
      <MetaEventTracker />
    </div>
  );
}
