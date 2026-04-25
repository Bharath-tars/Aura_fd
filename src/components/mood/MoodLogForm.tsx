import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Send } from 'lucide-react'
import { moodApi } from '@/api/mood'
import { cn, getMoodLabel } from '@/lib/utils'

const EMOTIONS = ['anxious', 'content', 'tired', 'hopeful', 'frustrated', 'calm', 'overwhelmed', 'grateful', 'lonely', 'excited']
const FACTORS = ['exercise', 'poor_sleep', 'good_sleep', 'work_stress', 'social_time', 'nature', 'creative_work', 'conflict', 'relaxation', 'nutrition']

interface Props {
  compact?: boolean
  onSuccess: () => void
}

export default function MoodLogForm({ compact, onSuccess }: Props) {
  const qc = useQueryClient()
  const [score, setScore] = useState(5)
  const [emotions, setEmotions] = useState<string[]>([])
  const [factors, setFactors] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () => moodApi.log({ score, emotions, factors, notes: notes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood-analytics'] })
      qc.invalidateQueries({ queryKey: ['mood-list'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setEmotions([])
      setFactors([])
      setNotes('')
      onSuccess()
    },
  })

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  const scoreColor = score >= 7 ? 'text-emerald-500' : score >= 4 ? 'text-amber-500' : 'text-rose-500'

  return (
    <div className="space-y-4">
      {/* Score slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">How are you feeling?</span>
          <span className={cn('text-lg font-bold', scoreColor)}>{score} <span className="text-sm font-normal">— {getMoodLabel(score)}</span></span>
        </div>
        <input
          type="range" min={1} max={10} value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-primary h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Struggling</span><span>Thriving</span>
        </div>
      </div>

      {/* Emotions */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">What emotions are present?</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => toggle(emotions, setEmotions, e)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                emotions.includes(e)
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Factors */}
      {!compact && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">What's influencing your mood?</p>
          <div className="flex flex-wrap gap-1.5">
            {FACTORS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggle(factors, setFactors, f)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  factors.includes(f)
                    ? 'bg-accent text-white'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {!compact && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes? (optional)"
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none transition"
        />
      )}

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition"
      >
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Log mood
      </button>

      {mutation.isSuccess && (
        <p className="text-center text-sm text-emerald-600 font-medium">✓ Mood logged</p>
      )}
    </div>
  )
}
