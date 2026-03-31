import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'px-4 py-3 rounded-lg text-sm font-medium shadow-lg border animate-in slide-in-from-right',
              t.type === 'success' && 'bg-green-500/20 text-green-400 border-green-500/30',
              t.type === 'error' && 'bg-red-500/20 text-red-400 border-red-500/30',
              t.type === 'info' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
