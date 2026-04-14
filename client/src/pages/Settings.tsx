import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Lock,
  User,
  Mail,
  Save,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: "profile", label: "Meu Perfil", icon: User },
    { id: "security", label: "Segurança", icon: Lock },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      toast.success("Perfil atualizado com sucesso!");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tighter">Configurações</h1>
          <p className="text-sm text-gray-500 font-medium">Gerencie sua conta e preferências de segurança.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tabs Navigation */}
          <aside className="lg:w-64 space-y-2 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id
                    ? "bg-white text-black shadow-xl"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
                    <div className="flex items-start gap-4 mb-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Informações Pessoais</h2>
                        <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">
                          Atualize seus dados de contato e exibição.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nome Completo</label>
                          <Input
                            defaultValue={user?.name || ""}
                            className="input-premium h-12"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">E-mail</label>
                          <div className="relative">
                            <Input
                              defaultValue={user?.email || ""}
                              disabled
                              className="input-premium h-12 pr-12 opacity-50"
                            />
                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={isLoading} className="btn-premium h-12 w-full md:w-auto px-8 text-[10px] font-black uppercase tracking-[0.2em]">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
                      </Button>
                    </form>
                  </Card>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <Card className="card-premium bg-white/[0.02] border-white/5 p-8">
                    <div className="flex items-start gap-4 mb-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Segurança da Conta</h2>
                        <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">
                          Proteja seu acesso com senhas fortes.
                        </p>
                      </div>
                    </div>

                    <form className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Senha Atual</label>
                        <Input type="password" rounded-none className="input-premium h-12" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nova Senha</label>
                          <Input type="password" rounded-none className="input-premium h-12" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Confirmar Nova Senha</label>
                          <Input type="password" rounded-none className="input-premium h-12" />
                        </div>
                      </div>

                      <Button type="button" className="btn-premium h-12 w-full md:w-auto px-8 text-[10px] font-black uppercase tracking-[0.2em]">
                        Atualizar Senha
                      </Button>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
