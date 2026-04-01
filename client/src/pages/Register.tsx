import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AlertCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const registerMutation = trpc.auth.register.useMutation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await registerMutation.mutateAsync({ name, email, password });
      setLocation('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
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
        <Card className="card-premium">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold text-lg">FM</span>
            </div>
            <CardTitle className="text-xl">FORTE MEDIA</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Criar nova conta</p>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome completo</label>
                <Input
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="input-premium"
                />
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirmar Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="input-premium"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="btn-premium w-full"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Já tem conta?{' '}
              <a href="/login" className="text-white hover:underline font-medium">
                Entrar
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
