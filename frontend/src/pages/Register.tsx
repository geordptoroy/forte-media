import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast('Preencha todos os campos', 'error');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
      toast('Conta criada com sucesso!');
    } catch (err) {
      toast('Erro ao criar conta', 'error');
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
          <p className="text-[#AAAAAA]">Criar nova conta</p>
        </div>

        <form onSubmit={handleRegister} className="bg-[#111111] border border-[#222222] rounded-xl p-6 space-y-4">
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
          />
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
            Criar conta
          </Button>
        </form>

        <p className="text-center text-[#AAAAAA] text-sm mt-4">
          Já tem conta? <Link to="/login" className="text-[#2C3E66] hover:text-white transition-colors">Entrar</Link>
        </p>
      </div>
    </div>
  );
};
