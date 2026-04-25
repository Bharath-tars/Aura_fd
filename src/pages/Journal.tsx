import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Plus, BookOpen } from 'lucide-react'
import { journalApi } from '@/api/journal'
import { cn, getSentimentColor, getSentimentLabel } from '@/lib/utils'

export default function Journal() {
  const { data, isLoading } = useQuery({
    queryKey: ['journal-list'],
    queryFn: () => journalApi.list().then((r) => r.data),
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
          <Link
            key={entry.id}
            to={`/journal/${entry.id}`}
            className="block bg-white rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
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
        ))}
      </div>
    </div>
  )
}
