import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Flame, BookOpen, Target, MessageCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { analyticsApi } from '@/api/analytics'
import { moodApi } from '@/api/mood'
import MoodLogForm from '@/components/mood/MoodLogForm'
import MoodChart from '@/components/mood/MoodChart'
import { cn, getMoodLabel } from '@/lib/utils'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  })

  const { data: moodData } = useQuery({
    queryKey: ['mood-analytics'],
    queryFn: () => moodApi.analytics().then((r) => r.data),
  })

  const TrendIcon = dashboard?.mood_trend === 'rising' ? TrendingUp
    : dashboard?.mood_trend === 'falling' ? TrendingDown : Minus
  const trendColor = dashboard?.mood_trend === 'rising' ? 'text-emerald-500'
    : dashboard?.mood_trend === 'falling' ? 'text-rose-500' : 'text-muted-foreground'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {user?.username} 👋
        </h1>
        <p className="text-muted-foreground mt-0.5">How are you feeling today?</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Wellness Score',
            value: dashboard?.wellness_score?.toFixed(0) ?? '—',
            sub: 'out of 100',
            icon: '✦',
            color: 'bg-indigo-50 text-indigo-600',
          },
          {
            label: 'Streak',
            value: dashboard?.current_streak ?? 0,
            sub: `days (best: ${dashboard?.longest_streak ?? 0})`,
            icon: '🔥',
            color: 'bg-orange-50 text-orange-600',
          },
          {
            label: 'Mood (avg)',
            value: dashboard?.mood_avg_7d?.toFixed(1) ?? '—',
            sub: <span className={cn('flex items-center gap-1', trendColor)}><TrendIcon className="w-3 h-3" />{dashboard?.mood_trend ?? '—'}</span>,
            icon: '💙',
            color: 'bg-blue-50 text-blue-600',
          },
          {
            label: 'Journals',
            value: dashboard?.total_journal_entries ?? 0,
            sub: `${dashboard?.active_plans ?? 0} active plans`,
            icon: '📔',
            color: 'bg-emerald-50 text-emerald-600',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border p-4 shadow-sm"
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm mb-3', stat.color)}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick mood log */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Log today's mood</h2>
        <MoodLogForm compact onSuccess={() => {}} />
      </div>

      {/* Mood chart */}
      {moodData && moodData.total_entries > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Mood trend (4 weeks)</h2>
          <MoodChart weeklyAvgs={moodData.weekly_avgs} />
        </div>
      )}

      {/* AI Insights */}
      {(dashboard?.top_insights?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-3">Your insights</h2>
          <div className="space-y-2.5">
            {dashboard?.top_insights.map((insight, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                  {i + 1}
                </span>
                <p className="text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/coach', icon: MessageCircle, label: 'Talk to coach', color: 'bg-indigo-500' },
          { to: '/journal/new', icon: BookOpen, label: 'Write journal', color: 'bg-emerald-500' },
          { to: '/wellness', icon: Target, label: 'View plans', color: 'bg-purple-500' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
