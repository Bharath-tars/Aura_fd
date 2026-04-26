import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart2, Brain, TrendingUp, BookOpen, CheckSquare, Target } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { analyticsApi } from '@/api/analytics'
import StreakBadge from '@/components/dashboard/StreakBadge'

const MOOD_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#60a5fa', '#818cf8']

function moodColor(score: number): string {
  return MOOD_COLORS[Math.min(Math.max(Math.floor(score) - 1, 0), 6)]
}

interface FactorBar { factor: string; delta: number }
interface EmotionBar { emotion: string; count: number }
interface WeekPoint  { week: string; avg: number }

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-4"
    >
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export default function MoodAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
    staleTime: 2 * 60_000,
  })

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const moodTrend: WeekPoint[] = (data?.weekly_avgs ?? []).map(
    (avg, i) => ({ week: `W${i + 1}`, avg: +avg.toFixed(1) }),
  )

  const topFactors: FactorBar[] = (data?.positive_levers ?? [])
    .slice(0, 8)
    .map((l) => ({
      factor: l.factor.replace(/_/g, ' '),
      delta: +Number(l.delta).toFixed(2),
    }))

  const emotionFreq: EmotionBar[] = Object.entries(data?.emotion_freq ?? {})
    .map(([emotion, count]) => ({ emotion, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const avgScore = data?.avg_score ?? 0
  const trend = data?.trend ?? 'stable'
  const totalEntries = data?.total_entries ?? 0
  const js = data?.journal_stats
  const ts = data?.task_stats
  const ws = data?.wellness_stats

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mood Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Patterns and insights drawn from your wellness history
        </p>
      </div>

      {/* Mood summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Avg mood"
          value={`${avgScore.toFixed(1)}/10`}
          color={`text-[${moodColor(avgScore)}]`}
        />
        <StatCard
          label="Trend"
          value={trend.replace('_', ' ')}
          color={trend === 'rising' ? 'text-emerald-600' : trend === 'falling' ? 'text-rose-500' : 'text-slate-600'}
        />
        <StatCard label="Mood logs" value={totalEntries} color="text-slate-800" />
        <StatCard
          label="Top lever"
          value={topFactors[0]?.factor ?? '—'}
          sub={topFactors[0] ? `+${topFactors[0].delta} mood pts` : undefined}
          color="text-slate-800"
        />
      </div>

      <StreakBadge />

      {/* Cross-platform metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journal stats */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-700">Journal</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total entries</span>
              <span className="font-semibold text-slate-800">{js?.total_entries ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">AI-analyzed</span>
              <span className="font-semibold text-slate-800">{js?.analyzed_entries ?? 0}</span>
            </div>
            {js && js.total_entries > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Analysis rate</span>
                <span className="font-semibold text-emerald-600">
                  {Math.round((js.analyzed_entries / js.total_entries) * 100)}%
                </span>
              </div>
            )}
            {js?.avg_sentiment !== null && js?.avg_sentiment !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Avg sentiment</span>
                <span className="font-semibold text-slate-800">{js.avg_sentiment.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Task stats */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-700">Tasks</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Completed</span>
              <span className="font-semibold text-slate-800">
                {ts?.completed_tasks ?? 0} / {ts?.total_tasks ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Completion rate</span>
              <span className="font-semibold text-emerald-600">{ts?.completion_rate ?? 0}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Time logged</span>
              <span className="font-semibold text-slate-800">
                {ts ? `${Math.floor(ts.total_time_logged_min / 60)}h ${ts.total_time_logged_min % 60}m` : '0h 0m'}
              </span>
            </div>
          </div>
        </div>

        {/* Wellness stats */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-700">Wellness Plans</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Active</span>
              <span className="font-semibold text-slate-800">{ws?.active_plans ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Completed</span>
              <span className="font-semibold text-emerald-600">{ws?.completed_plans ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Avg progress</span>
              <span className="font-semibold text-slate-800">{ws?.avg_progress_pct ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mood trend chart */}
      {moodTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Mood over time</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodTrend} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: number) => [`${v}/10`, 'Avg mood']}
              />
              <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factor impact */}
        {topFactors.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-700">What lifts your mood</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topFactors} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="factor" width={90} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: number) => [`+${v} pts`, 'Mood lift']}
                />
                <Bar dataKey="delta" radius={[0, 6, 6, 0]}>
                  {topFactors.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : '#6ee7b7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Emotion frequency */}
        {emotionFreq.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-700">Emotions this period</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={emotionFreq} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="emotion" width={80} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: number) => [v, 'times']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {emotionFreq.map((_, i) => (
                    <Cell key={i} fill={`hsl(${240 + i * 18}, 70%, ${65 + i * 2}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!data && !isLoading && (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">Log a few mood entries to unlock your analytics.</p>
        </div>
      )}
    </div>
  )
}
