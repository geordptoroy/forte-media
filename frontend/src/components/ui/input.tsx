import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm text-[#AAAAAA]">{label}</label>}
    <input
      className={cn(
        'bg-[#111111] border border-[#333333] text-white placeholder-[#666666] rounded-lg px-3 py-2 w-full focus:outline-none focus:border-[#2C3E66] transition-colors text-sm',
        error && 'border-red-500',
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);
