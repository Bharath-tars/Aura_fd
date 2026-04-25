import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Plus, Clock, BookOpen, Check, Trash2, Loader2, Target, CheckCircle2,
} from 'lucide-react'
import { wellnessApi } from '@/api/wellness'
import { cn } from '@/lib/utils'
import type { PlanTask, WellnessPlan, JournalListItem } from '@/types'

function statusColor(status: string) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'paused') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function TaskRow({
  task,
  planId,
  onToggle,
  onDelete,
}: {
  task: PlanTask
  planId: string
  onToggle: (task: PlanTask) => void
  onDelete: (taskId: string) => void
}) {
  const qc = useQueryClient()
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [timeVal, setTimeVal] = useState(String(task.time_logged_min || ''))

  const logTimeMutation = useMutation({
    mutationFn: (minutes: number) =>
      wellnessApi.updateTask(planId, task.id, { time_logged_min: minutes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-tasks', planId] })
      setShowTimeInput(false)
    },
  })

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors',
      task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-border',
    )}>
      <button
        onClick={() => onToggle(task)}
        className={cn(
          'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          task.completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-border hover:border-primary',
        )}
      >
        {task.completed && <Check className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-snug',
          task.completed ? 'line-through text-muted-foreground' : 'text-foreground',
        )}>
          {task.title}
        </p>
        {task.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">{task.notes}</p>
        )}

        {showTimeInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={0}
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
              className="w-20 px-2 py-1 text-xs border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="min"
              autoFocus
            />
            <button
              onClick={() => logTimeMutation.mutate(parseInt(timeVal) || 0)}
              disabled={logTimeMutation.isPending}
              className="text-xs px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60"
            >
              {logTimeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
            <button
              onClick={() => setShowTimeInput(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.time_logged_min > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {task.time_logged_min}m
          </span>
        )}
        <button
          onClick={() => { setTimeVal(String(task.time_logged_min || '')); setShowTimeInput(true) }}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          title="Log time"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)

  const { data: plans } = useQuery({
    queryKey: ['wellness-plans'],
    queryFn: () => wellnessApi.listPlans().then((r) => r.data.data),
    staleTime: 30_000,
  })
  const plan: WellnessPlan | undefined = plans?.find((p) => p.id === planId)

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['plan-tasks', planId],
    queryFn: () => wellnessApi.listTasks(planId!).then((r) => r.data),
    enabled: !!planId,
  })

  const { data: journals = [] } = useQuery<JournalListItem[]>({
    queryKey: ['plan-journals', planId],
    queryFn: () => wellnessApi.listPlanJournals(planId!).then((r) => r.data),
    enabled: !!planId,
  })

  const createTaskMutation = useMutation({
    mutationFn: (title: string) => wellnessApi.createTask(planId!, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-tasks', planId] })
      qc.invalidateQueries({ queryKey: ['wellness-plans'] })
      setNewTaskTitle('')
      setShowAddTask(false)
    },
  })

  const toggleTaskMutation = useMutation({
    mutationFn: (task: PlanTask) =>
      wellnessApi.updateTask(planId!, task.id, { completed: !task.completed }),
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: ['plan-tasks', planId] })
      const prev = qc.getQueryData<PlanTask[]>(['plan-tasks', planId])
      qc.setQueryData<PlanTask[]>(['plan-tasks', planId], (old = []) =>
        old.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
      )
      return { prev }
    },
    onError: (_err, _task, ctx) => {
      qc.setQueryData(['plan-tasks', planId], ctx?.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plan-tasks', planId] })
      qc.invalidateQueries({ queryKey: ['wellness-plans'] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => wellnessApi.deleteTask(planId!, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-tasks', planId] })
      qc.invalidateQueries({ queryKey: ['wellness-plans'] })
    },
  })

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Plan not found.{' '}
        <button onClick={() => navigate('/wellness')} className="ml-1 text-primary hover:underline">
          Go back
        </button>
      </div>
    )
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/wellness')}
          className="mt-1 p-1.5 rounded-lg hover:bg-secondary transition text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground truncate">{plan.title}</h1>
            <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full capitalize', statusColor(plan.status))}>
              {plan.status}
            </span>
          </div>
          {plan.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
          )}
          {(plan.start_date || plan.end_date) && (
            <p className="text-xs text-muted-foreground mt-1">
              {plan.start_date} {plan.start_date && plan.end_date && '→'} {plan.end_date}
            </p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm font-semibold text-primary">{plan.progress_pct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${plan.progress_pct}%` }}
          />
        </div>
        {totalCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {completedCount} of {totalCount} tasks completed
          </p>
        )}
      </div>

      {/* Goals */}
      {plan.goals.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Goals</h2>
          </div>
          <div className="space-y-2">
            {plan.goals.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{g.title}</span>
                <span className="text-muted-foreground text-xs">
                  {g.current} → {g.target} {g.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tasks</h2>
            {totalCount > 0 && (
              <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add task
          </button>
        </div>

        {tasksLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                planId={planId!}
                onToggle={(t) => toggleTaskMutation.mutate(t)}
                onDelete={(id) => deleteTaskMutation.mutate(id)}
              />
            ))}
            {tasks.length === 0 && !showAddTask && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks yet. Add your first task above.
              </p>
            )}
          </div>
        )}

        {showAddTask && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) createTaskMutation.mutate(newTaskTitle.trim())
                if (e.key === 'Escape') { setShowAddTask(false); setNewTaskTitle('') }
              }}
              className="flex-1 px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
              placeholder="Task title… (Enter to save, Esc to cancel)"
            />
            <button
              onClick={() => { if (newTaskTitle.trim()) createTaskMutation.mutate(newTaskTitle.trim()) }}
              disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
              className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition"
            >
              {createTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
          </div>
        )}
      </div>

      {/* Linked Journal Entries */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Journal Entries</h2>
          </div>
          <Link
            to={`/journal/new?planId=${planId}`}
            className="text-xs text-primary hover:text-primary/80 font-medium transition"
          >
            + New entry
          </Link>
        </div>

        {journals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No journal entries linked to this plan yet.
          </p>
        ) : (
          <div className="space-y-2">
            {journals.map((entry) => (
              <Link
                key={entry.id}
                to={`/journal/${entry.id}`}
                className="block px-4 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition"
              >
                <p className="text-sm font-medium text-foreground">{entry.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {entry.word_count ? ` · ${entry.word_count} words` : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
