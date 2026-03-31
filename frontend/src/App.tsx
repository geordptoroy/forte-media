import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthContext, useAuthState } from './hooks/useAuth';
import { ToastProvider } from './components/ui/toast';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ScaledAds } from './pages/ScaledAds';
import { AdvancedSearch } from './pages/AdvancedSearch';
import { Monitoring } from './pages/Monitoring';
import { Favorites } from './pages/Favorites';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthState();
  if (isLoading) return <div className="min-h-screen bg-[#000000] flex items-center justify-center"><div className="text-white">Carregando...</div></div>;
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const auth = useAuthState();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="ads" element={<ScaledAds />} />
                <Route path="search" element={<AdvancedSearch />} />
                <Route path="monitoring" element={<Monitoring />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route index element={<Navigate to="dashboard" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
