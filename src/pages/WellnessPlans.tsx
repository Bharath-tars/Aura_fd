import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Target, Loader2, Sparkles } from 'lucide-react'
import { wellnessApi } from '@/api/wellness'
import { cn } from '@/lib/utils'
import type { WellnessPlan } from '@/types'

function PlanCard({ plan, onStatusChange }: { plan: WellnessPlan; onStatusChange: (id: string, status: string) => void }) {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {plan.ai_generated && <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />}
            <h3 className="font-semibold text-foreground truncate">{plan.title}</h3>
          </div>
          {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
        </div>
        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-3', statusColors[plan.status])}>
          {plan.status}
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span><span>{Math.round(plan.progress_pct)}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${plan.progress_pct}%` }} />
        </div>
      </div>

      {/* Goals */}
      {plan.goals.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Goals</p>
          <div className="space-y-1">
            {plan.goals.slice(0, 3).map((goal, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                <span className="text-foreground">{goal.title}</span>
                <span className="text-muted-foreground ml-auto text-xs">→ {goal.target} {goal.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {plan.activities.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Activities</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.activities.slice(0, 5).map((act, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-secondary rounded-full text-foreground">
                {act.name} · {act.frequency}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {plan.status === 'active' && (
          <>
            <button onClick={() => onStatusChange(plan.id, 'paused')} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition">Pause</button>
            <button onClick={() => onStatusChange(plan.id, 'completed')} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition">Complete</button>
          </>
        )}
        {plan.status === 'paused' && (
          <button onClick={() => onStatusChange(plan.id, 'active')} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition">Resume</button>
        )}
      </div>
    </div>
  )
}

export default function WellnessPlans() {
  const qc = useQueryClient()
  const [generating, setGenerating] = useState(false)
  const [focus, setFocus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['wellness-plans'],
    queryFn: () => wellnessApi.listPlans().then((r) => r.data.data),
  })

  const generateMutation = useMutation({
    mutationFn: () => wellnessApi.generatePlan(focus || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellness-plans'] })
      setGenerating(false)
      setFocus('')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      wellnessApi.updatePlan(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wellness-plans'] }),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Wellness Plans</h1>
          <p className="text-muted-foreground text-sm mt-0.5">AI-personalized programs built for you</p>
        </div>
        <button
          onClick={() => setGenerating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
        >
          <Sparkles className="w-4 h-4" />
          Generate plan
        </button>
      </div>

      {generating && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <p className="font-medium text-foreground">What would you like to focus on?</p>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. I want to reduce anxiety and sleep better... (optional)"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setGenerating(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition">Cancel</button>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {!isLoading && (!data || data.length === 0) && !generating && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No wellness plans yet</p>
          <p className="text-muted-foreground text-sm mt-1">Let AI generate a personalized plan based on your data</p>
          <button
            onClick={() => setGenerating(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
          >
            <Sparkles className="w-4 h-4" /> Generate my plan
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {data?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />
        ))}
      </div>
    </div>
  )
}
