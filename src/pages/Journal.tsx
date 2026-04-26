import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, BookOpen, Trash2 } from 'lucide-react'
import { journalApi } from '@/api/journal'
import { cn, getSentimentColor, getSentimentLabel } from '@/lib/utils'

export default function Journal() {
  const qc = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['journal-list'],
    queryFn: () => journalApi.list().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => journalApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-list'] })
      setDeletingId(null)
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Reflect, discover, grow</p>
        </div>
        <Link
          to="/journal/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          New entry
        </Link>
      </div>

      {isLoading && <div className="text-muted-foreground text-sm">Loading...</div>}

      {!isLoading && (!data?.data || data.data.length === 0) && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Your journal is empty</p>
          <p className="text-muted-foreground text-sm mt-1">Write your first entry — AI will unlock insights for you</p>
          <Link
            to="/journal/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Start writing
          </Link>
        </div>
      )}

      <div className="grid gap-3">
        {data?.data.map((entry) => (
          <div key={entry.id} className="group relative bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <Link
              to={`/journal/${entry.id}`}
              className="block p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{entry.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {entry.themes.slice(0, 4).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                        {t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <time className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), 'MMM d')}
                  </time>
                  {entry.analyzed && (
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getSentimentColor(entry.sentiment_score))}>
                      {getSentimentLabel(entry.sentiment_score)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{entry.word_count} words</span>
                </div>
              </div>
            </Link>

            {/* Delete controls */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {deletingId === entry.id ? (
                <div className="flex items-center gap-1 bg-white rounded-lg border border-border shadow-sm px-2 py-1">
                  <span className="text-xs text-muted-foreground">Delete?</span>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(entry.id)}
                    disabled={deleteMutation.isPending}
                    className="text-xs px-2 py-0.5 rounded bg-rose-500 text-white hover:bg-rose-600 transition disabled:opacity-60"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setDeletingId(entry.id) }}
                  aria-label="Delete entry"
                  className="p-1.5 rounded-lg bg-white border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-200 transition shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
