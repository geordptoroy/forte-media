import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AlertCircle, BarChart3, Zap, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const loginMutation = trpc.auth.login.useMutation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await loginMutation.mutateAsync({ email, password });
      setLocation('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">FM</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">FORTE MEDIA</h1>
          <p className="text-muted-foreground text-sm">
            Inteligência Competitiva para Anúncios Meta
          </p>
        </div>

        {/* Main Card */}
        <Card className="card-premium mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Entrar na sua conta</CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">E-mail</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="input-premium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="input-premium"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="btn-premium w-full"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Não tem conta?{' '}
              <a href="/register" className="text-white hover:underline font-medium">
                Criar conta
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BarChart3 className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="font-medium text-foreground">Análise de Anúncios Competitivos</p>
              <p className="text-xs text-muted-foreground">Monitore estratégias de concorrentes</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="font-medium text-foreground">Dashboard de Performance</p>
              <p className="text-xs text-muted-foreground">Métricas detalhadas de campanhas</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="font-medium text-foreground">Segurança de Nível Empresarial</p>
              <p className="text-xs text-muted-foreground">Credenciais criptografadas AES-256</p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center space-y-2 text-xs text-muted-foreground">
          <p>Confiado por profissionais de marketing digital</p>
          <div className="flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" strokeWidth={2.5} />
            <span>Dados 100% seguros e criptografados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
