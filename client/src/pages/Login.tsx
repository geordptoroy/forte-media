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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">FM</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">FORTE MEDIA</h1>
          <p className="text-muted-foreground text-sm">
            Inteligência Competitiva para Anúncios Meta
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95 mb-8 animate-slide-in-up">
          <CardHeader className="text-center">
            <CardTitle>Entrar na sua conta</CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Não tem conta?{' '}
              <a href="/register" className="text-primary hover:underline">
                Criar conta
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BarChart3 className="w-3 h-3 text-primary" strokeWidth={3} />
            </div>
            <div>
              <p className="font-medium text-foreground">Análise de Anúncios Competitivos</p>
              <p className="text-xs text-muted-foreground">Monitore estratégias de concorrentes</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-3 h-3 text-primary" strokeWidth={3} />
            </div>
            <div>
              <p className="font-medium text-foreground">Dashboard de Performance</p>
              <p className="text-xs text-muted-foreground">Métricas detalhadas de campanhas</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-3 h-3 text-primary" strokeWidth={3} />
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
