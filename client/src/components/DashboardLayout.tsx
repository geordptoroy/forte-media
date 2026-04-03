import { ReactNode, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Search, label: "Busca Avancada", href: "/search" },
  { icon: TrendingUp, label: "Inteligencia", href: "/competitive-intelligence" },
  { icon: BarChart3, label: "Performance", href: "/performance" },
  { icon: Zap, label: "Anuncios Scaled", href: "/ads" },
  { icon: FileText, label: "Relatorios", href: "/reports" },
  { icon: Heart, label: "Favoritos", href: "/favorites" },
  { icon: Eye, label: "Monitoramento", href: "/monitoring" },
];

interface SidebarContentProps {
  location: string;
  user: { name?: string | null; email?: string | null } | null;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ location, user, onLogout, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
          <span className="text-black font-bold text-xs">FM</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-white">FORTE MEDIA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
        {menuItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn("w-5 h-5", isActive ? "text-black" : "text-gray-400")}
                />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-6 border-t border-white/10 space-y-2 shrink-0">
        <Link href="/settings">
          <a
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              location === "/settings"
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-5 h-5" />
            Configuracoes
          </a>
        </Link>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>

        <div className="mt-4 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
            Usuario
          </p>
          <p className="text-xs font-medium truncate text-gray-200">
            {user?.name || user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const currentPageLabel =
    menuItems.find((i) => i.href === location)?.label ||
    (location === "/settings" ? "Configuracoes" : "Plataforma");

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 bg-black flex-col z-50 shrink-0">
        <SidebarContent
          location={location}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-black border-r border-white/10 [&>button]:hidden"
        >
          <SidebarContent
            location={location}
            user={user}
            onLogout={handleLogout}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-black min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 lg:px-8 bg-black/50 backdrop-blur-md z-40 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-400 hover:text-white hover:bg-white/5"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
              {currentPageLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification badge */}
            {unreadCount > 0 && (
              <div className="relative">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <Bell className="w-4 h-4 text-gray-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </div>
            )}

            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                Live
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
