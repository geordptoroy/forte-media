import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSpendRange(range: string): string {
  const labels: Record<string, string> = {
    '0-999': '< R$1K',
    '1000-9999': 'R$1K–R$10K',
    '10000-49999': 'R$10K–R$50K',
    '50000-99999': 'R$50K–R$100K',
    '100000-499999': 'R$100K–R$500K',
    '500000-999999': 'R$500K–R$1M',
    '1000000+': '> R$1M',
  };
  return labels[range] || range;
}

export function formatImpressionsRange(range: string): string {
  const labels: Record<string, string> = {
    '0-9999': '< 10K',
    '10000-99999': '10K–100K',
    '100000-499999': '100K–500K',
    '500000-999999': '500K–1M',
    '1000000-4999999': '1M–5M',
    '5000000-9999999': '5M–10M',
    '10000000+': '> 10M',
  };
  return labels[range] || range;
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 25) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 18) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (score >= 10) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getTrendIcon(trend?: string): string {
  if (trend === 'growing') return '↑';
  if (trend === 'declining') return '↓';
  return '→';
}

export function getTrendColor(trend?: string): string {
  if (trend === 'growing') return 'text-green-400';
  if (trend === 'declining') return 'text-red-400';
  return 'text-gray-400';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
