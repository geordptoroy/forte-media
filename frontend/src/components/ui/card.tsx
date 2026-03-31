import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div className={cn('bg-[#111111] border border-[#222222] rounded-xl', className)} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div className={cn('p-6 pb-0', className)} {...props}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ className, children, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>{children}</h3>
);

export const CardContent: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div className={cn('p-6', className)} {...props}>{children}</div>
);
