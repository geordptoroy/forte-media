import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Preencha todos os campos', 'error');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
      toast('Login realizado com sucesso!');
    } catch (err) {
      toast('Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await login('demo@fortemedia.com', 'demo123');
      navigate('/dashboard');
      toast('Entrado como demo!');
    } catch (err) {
      toast('Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#2C3E66] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">FM</span>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">FORTE MEDIA</h1>
          <p className="text-[#AAAAAA]">Inteligência Competitiva de Anúncios</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#111111] border border-[#222222] rounded-xl p-6 space-y-4 mb-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>

        <Button onClick={handleDemoLogin} variant="secondary" className="w-full mb-4" loading={loading}>
          🎭 Entrar como Demo
        </Button>

        <p className="text-center text-[#AAAAAA] text-sm">
          Não tem conta? <Link to="/register" className="text-[#2C3E66] hover:text-white transition-colors">Criar conta</Link>
        </p>
      </div>
    </div>
  );
};
