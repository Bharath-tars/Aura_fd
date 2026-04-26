import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Heart, TrendingUp, TrendingDown, Minus, Pencil, Trash2, X, Check } from 'lucide-react'
import { moodApi } from '@/api/mood'
import MoodLogForm from '@/components/mood/MoodLogForm'
import MoodChart from '@/components/mood/MoodChart'
import { cn, getMoodColor, getMoodLabel } from '@/lib/utils'
import type { MoodEntry } from '@/types'

const EMOTIONS = ['happy', 'calm', 'grateful', 'excited', 'sad', 'anxious', 'angry', 'tired', 'hopeful', 'frustrated', 'content', 'overwhelmed']

function EditEntryRow({ entry, onCancel, onSaved }: { entry: MoodEntry; onCancel: () => void; onSaved: () => void }) {
  const qc = useQueryClient()
  const [score, setScore] = useState(entry.score)
  const [emotions, setEmotions] = useState<string[]>(entry.emotions)
  const [notes, setNotes] = useState(entry.notes ?? '')

  const updateMutation = useMutation({
    mutationFn: () => moodApi.update(entry.id, { score, emotions, notes: notes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood-list'] })
      qc.invalidateQueries({ queryKey: ['mood-analytics'] })
      onSaved()
    },
  })

  const toggleEmotion = (e: string) =>
    setEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  return (
    <div className="px-5 py-4 space-y-3 bg-secondary/30">
      <div className="flex items-center gap-3">
        <label htmlFor={`score-${entry.id}`} className="text-xs text-muted-foreground w-12">Score</label>
        <input
          id={`score-${entry.id}`}
          type="range" min={1} max={10} value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className={cn('text-lg font-bold w-6 text-center', getMoodColor(score))}>{score}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {EMOTIONS.map((e) => (
          <button
            key={e}
            onClick={() => toggleEmotion(e)}
            className={cn('text-xs px-2 py-0.5 rounded-full transition', emotions.includes(e) ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground')}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes..."
        className="w-full px-3 py-1.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-2">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60"
        >
          <Check className="w-3 h-3" /> Save
        </button>
        <button type="button" onClick={onCancel} aria-label="Cancel edit" className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default function MoodTracker() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: analytics } = useQuery({
    queryKey: ['mood-analytics'],
    queryFn: () => moodApi.analytics().then((r) => r.data),
  })

  const { data: moodList } = useQuery({
    queryKey: ['mood-list'],
    queryFn: () => moodApi.list(0, 30).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moodApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood-list'] })
      qc.invalidateQueries({ queryKey: ['mood-analytics'] })
      setDeletingId(null)
    },
  })

  const TrendIcon = analytics?.trend === 'rising' ? TrendingUp
    : analytics?.trend === 'falling' ? TrendingDown : Minus

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mood Tracker</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track your emotional patterns over time</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
        >
          <Heart className="w-4 h-4" />
          Log mood
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <MoodLogForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {analytics && analytics.total_entries > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-border p-4 shadow-sm text-center">
              <p className={cn('text-3xl font-bold', getMoodColor(analytics.avg_score))}>
                {analytics.avg_score?.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Avg Mood</p>
              <p className="text-xs font-medium text-foreground">{getMoodLabel(analytics.avg_score)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendIcon className={cn('w-6 h-6', analytics.trend === 'rising' ? 'text-emerald-500' : analytics.trend === 'falling' ? 'text-rose-500' : 'text-muted-foreground')} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Trend</p>
              <p className="text-xs font-medium capitalize text-foreground">{analytics.trend.replace('_', ' ')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 shadow-sm text-center">
              <p className="text-3xl font-bold text-foreground">{analytics.total_entries}</p>
              <p className="text-xs text-muted-foreground mt-1">Entries</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Weekly trend</h2>
            <MoodChart weeklyAvgs={analytics.weekly_avgs} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {analytics.top_positive_factors.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-emerald-600 mb-3">↑ Mood boosters</h3>
                <div className="space-y-1.5">
                  {analytics.top_positive_factors.map((f) => (
                    <span key={f} className="block text-xs text-foreground font-medium px-2.5 py-1 bg-emerald-50 rounded-full w-fit">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {analytics.top_negative_factors.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-rose-600 mb-3">↓ Mood drains</h3>
                <div className="space-y-1.5">
                  {analytics.top_negative_factors.map((f) => (
                    <span key={f} className="block text-xs text-foreground font-medium px-2.5 py-1 bg-rose-50 rounded-full w-fit">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {analytics.insights.length > 0 && (
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
              <h3 className="text-sm font-semibold text-indigo-700 mb-3">AI insights</h3>
              {analytics.insights.map((insight, i) => (
                <p key={i} className="text-sm text-indigo-700 mb-1.5">• {insight}</p>
              ))}
            </div>
          )}
        </>
      )}

      {/* History list */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent entries</h2>
        </div>
        {(!moodList?.data || moodList.data.length === 0) ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">
            No mood entries yet. Log your first mood above.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {moodList.data.map((entry) => (
              <div key={entry.id}>
                {editingId === entry.id ? (
                  <EditEntryRow entry={entry} onCancel={() => setEditingId(null)} onSaved={() => setEditingId(null)} />
                ) : (
                  <div className="flex items-center gap-4 px-5 py-3.5 group">
                    <div className={cn('text-2xl font-bold w-10 text-center', getMoodColor(entry.score))}>
                      {entry.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1 mb-0.5">
                        {entry.emotions.slice(0, 4).map((e) => (
                          <span key={e} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">{e}</span>
                        ))}
                      </div>
                      {entry.notes && <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>}
                    </div>
                    <time className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                    </time>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(entry.id)}
                        aria-label="Edit entry"
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {deletingId === entry.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMutation.mutate(entry.id)}
                            disabled={deleteMutation.isPending}
                            className="text-xs px-2 py-0.5 rounded bg-rose-500 text-white hover:bg-rose-600 transition"
                          >
                            Delete
                          </button>
                          <button onClick={() => setDeletingId(null)} className="text-xs text-muted-foreground hover:text-foreground">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(entry.id)}
                          aria-label="Delete entry"
                          className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
