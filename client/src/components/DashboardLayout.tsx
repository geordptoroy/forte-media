import { ReactNode } from "react";
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
  Zap
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Search, label: "Busca Avançada", href: "/search" },
    { icon: TrendingUp, label: "Inteligência", href: "/competitive-intelligence" },
    { icon: BarChart3, label: "Performance", href: "/performance" },
    { icon: Zap, label: "Anúncios Scaled", href: "/ads" },
    { icon: FileText, label: "Relatórios", href: "/reports" },
    { icon: Heart, label: "Favoritos", href: "/favorites" },
    { icon: Eye, label: "Monitoramento", href: "/monitoring" },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black flex flex-col z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-black font-bold text-xs">FM</span>
          </div>
          <span className="font-bold text-lg tracking-tight">FORTE MEDIA</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-white text-black" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-black" : "text-gray-400")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10 space-y-2">
          <Link href="/settings">
            <a className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              location === "/settings" 
                ? "bg-white text-black" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}>
              <Settings className="w-5 h-5" />
              Configurações
            </a>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>

          <div className="mt-6 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Usuário</p>
            <p className="text-xs font-medium truncate text-gray-200">{user?.name || user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-black">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md z-40">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
            {menuItems.find(i => i.href === location)?.label || "Plataforma"}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Live</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
