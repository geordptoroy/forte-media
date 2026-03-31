import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Key,
  Shield,
  AlertCircle,
  CheckCircle,
  Copy,
  Trash2,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const credentialsStatus = trpc.meta.getCredentialsStatus.useQuery();
  const setCredentialsMutation = trpc.meta.setCredentials.useMutation();
  const deleteCredentialsMutation = trpc.meta.deleteCredentials.useMutation();

  const handleSetCredentials = async () => {
    if (!accessToken.trim()) {
      toast.error("Por favor, insira um Access Token válido");
      return;
    }

    setIsLoading(true);
    try {
      const result = await setCredentialsMutation.mutateAsync({
        accessToken: accessToken.trim(),
      });

      if (result.success) {
        toast.success("Credenciais Meta configuradas com sucesso!");
        setAccessToken("");
        credentialsStatus.refetch();
      } else {
        toast.error(result.error || "Erro ao configurar credenciais");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao configurar credenciais"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (
      !confirm(
        "Tem certeza que deseja remover suas credenciais Meta? Você não poderá mais acessar dados de anúncios."
      )
    ) {
      return;
    }

    try {
      await deleteCredentialsMutation.mutateAsync();
      toast.success("Credenciais removidas com sucesso");
      credentialsStatus.refetch();
    } catch (error) {
      toast.error("Erro ao remover credenciais");
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <h1 className="text-xl font-semibold text-foreground">
              Configurações
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Meta API Credentials Section */}
        <Card className="border-border/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Credenciais Meta API
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure seu Access Token para conectar com Meta Ad Library e
                Marketing APIs
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6 p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              {credentialsStatus.data?.isValid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Credenciais Ativas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suas credenciais Meta estão configuradas e válidas
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Credenciais Não Configuradas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Configure suas credenciais Meta para começar
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Token Input */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                App ID
              </label>
              <Input
                type="text"
                placeholder="Seu App ID do Meta for Developers"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Encontre em Meta for Developers &gt; Seu App &gt; Configurações &gt; Básico
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                App Secret
              </label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Seu App Secret do Meta for Developers"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Encontre em Meta for Developers &gt; Seu App &gt; Configurações &gt; Básico
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Access Token
              </label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Seu Access Token (longa duração - 60 dias)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Seu token será criptografado com AES-256-GCM antes de ser
                armazenado. Nunca será compartilhado ou exposto.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSetCredentials}
                disabled={isLoading || !appId.trim() || !appSecret.trim() || !accessToken.trim()}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isLoading ? "Configurando..." : "Salvar Credenciais"}
              </Button>
              {credentialsStatus.data?.isValid && (
                <Button
                  onClick={handleDeleteCredentials}
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" strokeWidth={2} />
                  Remover
                </Button>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Como obter seu Access Token?
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Acesse Meta for Developers (developers.facebook.com)</li>
              <li>Selecione seu app e vá para Graph API Explorer</li>
              <li>Selecione "Get User Access Token"</li>
              <li>
                Marque as permissões: ads_read, ads_management,
                business_management
              </li>
              <li>Gere o token e copie aqui</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              Para produção, recomendamos usar System User Tokens. Veja a
              documentação completa em README_SETUP.md
            </p>
          </div>
        </Card>

        {/* Security Section */}
        <Card className="border-border/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Segurança</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Informações sobre proteção de dados e privacidade
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Criptografia de Tokens
              </h3>
              <p className="text-sm text-muted-foreground">
                Seus Access Tokens são criptografados com AES-256-GCM antes de
                serem armazenados no banco de dados. Cada token tem um IV
                (Initialization Vector) único para máxima segurança.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Conformidade LGPD
              </h3>
              <p className="text-sm text-muted-foreground">
                FORTE MEDIA está em conformidade com a Lei Geral de Proteção de
                Dados (LGPD). Você pode remover suas credenciais a qualquer
                momento.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Permissões Necessárias
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>ads_read:</strong> Acessar dados de anúncios competitivos
                </p>
                <p>
                  <strong>ads_management:</strong> Acessar métricas de suas campanhas
                </p>
                <p>
                  <strong>business_management:</strong> Gerenciar contas de negócio
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Section */}
        <Card className="border-border/50 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Conta</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Gerenciar sua conta e sessão
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" strokeWidth={2} />
              Fazer Logout
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
