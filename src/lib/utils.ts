import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function getMoodColor(score: number): string {
  if (score >= 8) return 'text-emerald-500'
  if (score >= 6) return 'text-green-500'
  if (score >= 4) return 'text-yellow-500'
  if (score >= 2) return 'text-orange-500'
  return 'text-rose-500'
}

export function getMoodLabel(score: number): string {
  if (score >= 9) return 'Thriving'
  if (score >= 7) return 'Good'
  if (score >= 5) return 'Okay'
  if (score >= 3) return 'Low'
  return 'Struggling'
}

export function getSentimentColor(score: number | null): string {
  if (score === null) return 'bg-muted text-muted-foreground'
  if (score > 0.3) return 'bg-emerald-100 text-emerald-700'
  if (score > -0.3) return 'bg-slate-100 text-slate-600'
  return 'bg-rose-100 text-rose-700'
}

export function getSentimentLabel(score: number | null): string {
  if (score === null) return 'Not analyzed'
  if (score > 0.3) return 'Positive'
  if (score > -0.3) return 'Neutral'
  return 'Difficult'
}
