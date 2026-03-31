import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/toast';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currency, setCurrency] = useState('BRL');
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    toast('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nome completo"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Button onClick={handleSave} variant="primary">Salvar Perfil</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Moeda"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            options={[
              { value: 'BRL', label: 'Real (R$)' },
              { value: 'USD', label: 'Dólar (US$)' },
              { value: 'EUR', label: 'Euro (€)' },
            ]}
          />
          <div className="flex items-center justify-between p-3 bg-[#0d0d0d] rounded-lg border border-[#1a1a1a]">
            <label className="text-white text-sm">Notificações por e-mail</label>
            <input
              type="checkbox"
              checked={notifications}
              onChange={e => setNotifications(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          <Button onClick={handleSave} variant="primary">Salvar Preferências</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Meta API</p>
                <p className="text-[#AAAAAA] text-xs">Conexão com Biblioteca de Anúncios</p>
              </div>
              <span className="text-[#AAAAAA] text-sm">Não configurado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
