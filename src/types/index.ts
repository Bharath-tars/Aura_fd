export interface User {
  id: string
  username: string
  email: string
  timezone: string
  notification_time: string
  onboarding_complete: boolean
  gender: string | null
  age: number | null
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface MoodEntry {
  id: string
  score: number
  energy_level: number | null
  emotions: string[]
  factors: string[]
  notes: string | null
  created_at: string
}

export interface MoodAnalytics {
  total_entries: number
  avg_score: number
  avg_energy: number | null
  trend: 'rising' | 'falling' | 'stable' | 'insufficient_data'
  weekly_avgs: number[]
  emotion_freq: Record<string, number>
  factor_freq: Record<string, number>
  top_positive_factors: string[]
  top_negative_factors: string[]
  insights: string[]
}

export interface AIInsight {
  title: string
  body: string
  type: 'theme' | 'pattern' | 'recommendation' | 'reflection'
}

export interface JournalEntry {
  id: string
  plan_id: string | null
  title: string
  content: string
  ai_insights: AIInsight[] | null
  sentiment_score: number | null
  themes: string[]
  word_count: number
  analyzed: boolean
  created_at: string
  updated_at: string
}

export interface JournalListItem {
  id: string
  plan_id: string | null
  title: string
  themes: string[]
  sentiment_score: number | null
  word_count: number
  analyzed: boolean
  created_at: string
}

export interface Goal {
  title: string
  target: string
  unit: string
  current: string
  deadline: string | null
}

export interface Activity {
  name: string
  frequency: string
  duration_min: number
  category: string
}

export interface WellnessPlan {
  id: string
  title: string
  description: string | null
  goals: Goal[]
  activities: Activity[]
  start_date: string | null
  end_date: string | null
  status: 'active' | 'paused' | 'completed'
  ai_generated: boolean
  progress_pct: number
  created_at: string
}

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  crisis_level: number
  created_at: string
}

export interface JournalStats {
  total_entries: number
  analyzed_entries: number
  avg_sentiment: number | null
}

export interface TaskStats {
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  total_time_logged_min: number
}

export interface WellnessStats {
  active_plans: number
  completed_plans: number
  avg_progress_pct: number
}

export interface Dashboard {
  wellness_score: number
  current_streak: number
  longest_streak: number
  mood_avg_7d: number | null
  mood_avg_30d: number | null
  mood_trend: 'rising' | 'falling' | 'stable' | 'insufficient_data'
  total_journal_entries: number
  active_plans: number
  top_insights: string[]
  positive_levers: { factor: string; delta: number }[]
  // Full mood analytics
  avg_score: number
  trend: 'rising' | 'falling' | 'stable' | 'insufficient_data'
  total_entries: number
  weekly_avgs: number[]
  emotion_freq: Record<string, number>
  top_positive_factors: string[]
  top_negative_factors: string[]
  // Cross-platform
  journal_stats: JournalStats
  task_stats: TaskStats
  wellness_stats: WellnessStats
}

export interface TherapistSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface TherapistMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Streak {
  current_streak: number
  longest_streak: number
  last_checkin_date: string | null
}

export interface PlanTask {
  id: string
  plan_id: string
  title: string
  notes: string | null
  completed: boolean
  time_logged_min: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  skip: number
  limit: number
  has_more: boolean
  message: string
}
