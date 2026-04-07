import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  FileText,
  TrendingUp,
  Heart,
  Eye,
  Settings,
  LogOut,
  Zap,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Target,
  ShieldCheck,
  Smartphone,
  ExternalLink
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
    section: "PRODUTO PRINCIPAL",
    items: [
      { icon: Zap, label: "Escala & Mercado", href: "/dashboard", description: "Anúncios escalados agora" },
      { icon: Search, label: "Busca Avançada", href: "/search", description: "Filtros granulares Meta" },
    ]
  },
  {
    section: "RASTREAMENTO",
    items: [
      { icon: Target, label: "Meus Anúncios", href: "/monitoring", description: "Rastreio estilo Utmify" },
      { icon: BarChart3, label: "Performance", href: "/performance", description: "Métricas da sua conta" },
    ]
  },
  {
    section: "BIBLIOTECA",
    items: [
      { icon: Heart, label: "Favoritos", href: "/favorites", description: "Sua coleção de criativos" },
      { icon: FileText, label: "Relatórios", href: "/reports", description: "Exportação de dados" },
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
  return (
    <div className="flex flex-col h-full bg-black border-r border-white/5 relative group/sidebar">
      {/* Collapse Toggle Button (Desktop) */}
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-black z-50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity hidden lg:flex shadow-xl"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo */}
      <div className={cn("p-8 flex items-center gap-3 shrink-0", isCollapsed && "px-6 justify-center")}>
        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <span className="text-black font-black text-xs">FM</span>
        </div>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="font-black text-lg tracking-tighter text-white"
          >
            FORTE<span className="text-gray-500">MEDIA</span>
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto mt-4 custom-scrollbar">
        {menuItems.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {!isCollapsed && (
              <p className="px-4 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">
                {section.section}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative group",
                        isActive
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                          : "text-gray-500 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon
                        className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-black" : "text-gray-500")}
                      />
                      {!isCollapsed && (
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          <span className={cn("text-[9px] font-medium opacity-50", isActive ? "text-black" : "text-gray-500")}>
                            {item.description}
                          </span>
                        </div>
                      )}
                      {isCollapsed && isActive && (
                        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
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
      <div className={cn("p-6 border-t border-white/5 space-y-3 shrink-0 bg-black/50 backdrop-blur-md", isCollapsed && "px-4")}>
        <Link href="/settings">
          <a
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
              location === "/settings"
                ? "bg-white text-black"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && "Configurações"}
          </a>
        </Link>

        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500/80 hover:bg-red-500/10 transition-all duration-200",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && "Sair da Conta"}
        </button>

        {!isCollapsed && (
          <div className="mt-4 px-4 py-4 bg-white/[0.02] rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/10 flex items-center justify-center">
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

  // Load collapse state from local storage
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
          "hidden lg:flex border-r border-white/5 bg-black flex-col z-50 shrink-0 transition-all duration-500 ease-in-out",
          isCollapsed ? "w-24" : "w-72"
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
          className="w-72 p-0 bg-black border-r border-white/5 [&>button]:hidden"
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
      <main className="flex-1 flex flex-col overflow-hidden bg-black min-w-0 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/[0.01] blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 bg-black/40 backdrop-blur-xl z-40 shrink-0">
          <div className="flex items-center gap-6">
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                {currentPageLabel}
                <div className="w-1 h-1 rounded-full bg-gray-700" />
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Painel</span>
              </h2>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                {currentItem?.description || "Inteligência & Performance"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification badge */}
            <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all">
              <Bell className="w-4 h-4 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full text-[9px] font-black flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Quick Link to Meta Library */}
            <Button 
              variant="outline" 
              asChild 
              className="hidden sm:flex h-10 border-white/5 bg-white/[0.02] hover:bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-xl"
            >
              <a href="https://www.facebook.com/ads/library" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-2" />
                Meta Library
              </a>
            </Button>

            {/* Live indicator */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-40" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-200">
                Sistema Ativo
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 lg:p-10"
          >
            <div className="max-w-[1600px] mx-auto">{children}</div>
          </motion.div>
        </div>
      </main>
      <MetaEventTracker />
    </div>
  );
}
