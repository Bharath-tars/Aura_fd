import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Sparkles, Save, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { journalApi } from '@/api/journal'
import { cn, getSentimentColor, getSentimentLabel } from '@/lib/utils'

export default function JournalEditor() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId')
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showInsights, setShowInsights] = useState(false)

  const { data: existing } = useQuery({
    queryKey: ['journal-entry', id],
    queryFn: () => journalApi.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setContent(existing.content)
      if (existing.analyzed) setShowInsights(true)
    }
  }, [existing])

  const saveMutation = useMutation({
    mutationFn: () =>
      id
        ? journalApi.update(id, { title, content }).then((r) => r.data)
        : journalApi.create({ title, content, ...(planId ? { plan_id: planId } : {}) }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['journal-list'] })
      if (planId) qc.invalidateQueries({ queryKey: ['plan-journals', planId] })
      qc.setQueryData(['journal-entry', data.id], data)
      if (!id) navigate(`/journal/${data.id}`, { replace: true })
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: () => journalApi.analyze(id || saveMutation.data?.id || '').then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['journal-entry', data.id], data)
      setShowInsights(true)
    },
  })

  const entry = existing || saveMutation.data || analyzeMutation.data
  const canAnalyze = (id || saveMutation.isSuccess) && content.trim().length > 50

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/journal')} className="p-1.5 rounded-lg hover:bg-secondary transition">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">{id ? 'Edit entry' : 'New entry'}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title..."
          className="w-full px-5 py-4 text-lg font-medium bg-transparent border-b border-border focus:outline-none placeholder:text-muted-foreground"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? Write freely — Aura will help you find the patterns..."
          rows={14}
          className="w-full px-5 py-4 text-sm bg-transparent focus:outline-none resize-none placeholder:text-muted-foreground leading-relaxed"
        />
        <div className="flex items-center justify-between px-5 py-3 bg-secondary/50 border-t border-border">
          <span className="text-xs text-muted-foreground">{content.split(/\s+/).filter(Boolean).length} words</span>
          <div className="flex gap-2">
            {canAnalyze && (
              <button
                onClick={() => {
                  if (!id && !saveMutation.data) {
                    saveMutation.mutate(undefined, { onSuccess: () => analyzeMutation.mutate() })
                  } else {
                    analyzeMutation.mutate()
                  }
                }}
                disabled={analyzeMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition disabled:opacity-60"
              >
                {analyzeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI insights
              </button>
            )}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !title.trim() || !content.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition disabled:opacity-60"
            >
              {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      {entry?.analyzed && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/50 transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI Insights</span>
              {entry.sentiment_score !== null && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getSentimentColor(entry.sentiment_score))}>
                  {getSentimentLabel(entry.sentiment_score)}
                </span>
              )}
            </div>
            {showInsights ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showInsights && (
            <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
              {entry.themes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Themes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.themes.map((t) => (
                      <span key={t} className="text-xs px-2.5 py-1 bg-secondary rounded-full text-foreground font-medium">
                        {t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {entry.ai_insights?.map((insight, i) => (
                <div key={i} className="bg-indigo-50/60 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">{insight.title}</p>
                  <p className="text-sm text-indigo-900/80">{insight.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
