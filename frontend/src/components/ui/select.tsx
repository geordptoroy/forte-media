import React from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm text-[#AAAAAA]">{label}</label>}
    <select
      className={cn(
        'bg-[#111111] border border-[#333333] text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-[#2C3E66] transition-colors text-sm',
        className
      )}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);
