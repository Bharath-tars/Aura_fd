import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquarePlus, Trash2, Heart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { therapistApi } from '@/api/therapist'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { TherapistMessage, TherapistSession } from '@/types'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatSessionTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─────────────────────────────────────────────────────────────
// ProfileBanner — shown once if gender/age not set
// ─────────────────────────────────────────────────────────────

function ProfileBanner({ onDone }: { onDone: () => void }) {
  const { user, updateUser } = useAuthStore()
  const [gender, setGender] = useState(user?.gender ?? '')
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!gender && !age) { onDone(); return }
    setSaving(true)
    try {
      const res = await authApi.updateProfile({
        ...(gender ? { gender } : {}),
        ...(age ? { age: parseInt(age) } : {}),
      })
      updateUser(res.data)
    } catch { /* non-critical */ }
    setSaving(false)
    onDone()
  }

  return (
    <div className="mx-4 mb-4 bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-violet-800">Personalise your sessions</p>
        <p className="text-xs text-violet-600 mt-0.5">Your therapist can tailor support better with a little context. Totally optional.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="flex-1 min-w-32 px-3 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
          aria-label="Gender"
        >
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
        <input
          type="number"
          min={13}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Age (optional)"
          aria-label="Age"
          className="flex-1 min-w-24 px-3 py-2 text-sm border border-violet-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition"
        >
          {saving ? 'Saving…' : 'Save & continue'}
        </button>
        <button type="button" onClick={onDone} className="px-4 py-2 rounded-xl border border-violet-200 text-sm text-violet-600 hover:bg-violet-100 transition">
          Skip
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: TherapistMessage }) {
  const isUser = msg.role === 'user'
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 shrink-0">
          T
        </div>
      )}
      <div className={`max-w-[75%] space-y-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-violet-600 text-white rounded-br-sm'
              : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm'
          }`}
        >
          {msg.content}
        </div>
        <p className={`text-xs text-slate-400 ${isUser ? 'text-right' : 'text-left'}`} title={time}>{time}</p>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// StreamingBubble
// ─────────────────────────────────────────────────────────────

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 shrink-0">
        T
      </div>
      <div className="max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-white border border-slate-100 text-slate-700 shadow-sm">
          {content}
          <span className="inline-block w-1.5 h-4 bg-violet-400 ml-0.5 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Therapist component
// ─────────────────────────────────────────────────────────────

export default function Therapist() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const [messages, setMessages] = useState<TherapistMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [crisisLevel, setCrisisLevel] = useState(0)
  const [crisisResources, setCrisisResources] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [showProfile, setShowProfile] = useState(!user?.gender && !user?.age)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: sessions = [] } = useQuery<TherapistSession[]>({
    queryKey: ['therapist-sessions'],
    queryFn: () => therapistApi.listSessions().then((r) => r.data.data),
  })

  const { data: fetchedMessages = [] } = useQuery<TherapistMessage[]>({
    queryKey: ['therapist-messages', sessionId],
    queryFn: () => therapistApi.getMessages(sessionId!).then((r) => r.data.data),
    enabled: !!sessionId,
  })

  useEffect(() => {
    if (!isStreaming) setMessages(fetchedMessages)
  }, [fetchedMessages, isStreaming])

  useEffect(() => {
    setCrisisLevel(0); setCrisisResources([]); setStreamingContent(''); setIsStreaming(false)
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const createMutation = useMutation({
    mutationFn: () => therapistApi.createSession(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['therapist-sessions'] })
      navigate(`/therapist/${res.data.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => therapistApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-sessions'] })
      navigate('/therapist')
    },
  })

  const handleSend = async () => {
    if (!sessionId || !input.trim() || isStreaming) return
    const text = input.trim()
    setInput('')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const tempMsg: TherapistMessage = {
      id: `tmp-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    setIsStreaming(true)
    setStreamingContent('')
    setCrisisLevel(0)
    setCrisisResources([])

    let accumulated = ''
    try {
      for await (const event of therapistApi.streamMessage(sessionId, text, controller.signal)) {
        if (controller.signal.aborted) break
        if (event.type === 'token') {
          accumulated += event.content
          setStreamingContent(accumulated)
        } else if (event.type === 'crisis') {
          setCrisisLevel(event.level ?? 0)
          setCrisisResources(event.resources ?? [])
        } else if (event.type === 'done') {
          await queryClient.invalidateQueries({ queryKey: ['therapist-messages', sessionId] })
          queryClient.invalidateQueries({ queryKey: ['therapist-sessions'] })
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages((prev) => [...prev, {
          id: `err-${Date.now()}`, session_id: sessionId, role: 'assistant',
          content: 'Something went wrong. Take a breath — please try again.',
          created_at: new Date().toISOString(),
        }])
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  const activeSession = sessions.find((s) => s.id === sessionId)

  return (
    <div className="flex h-full">
      {/* Sessions sidebar */}
      <div className="w-56 shrink-0 border-r border-slate-100 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition disabled:opacity-50"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence initial={false}>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${
                  session.id === sessionId
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => navigate(`/therapist/${session.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{session.title || 'Session'}</span>
                  <span className="block text-xs text-slate-400 mt-0.5">{formatSessionTime(session.updated_at)}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(session.id) }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {sessions.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-6 px-3">No sessions yet. Start one above.</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {sessionId ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                T
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">{activeSession?.title || 'Your Therapist'}</h2>
                <p className="text-xs text-slate-400">
                  {isStreaming ? <span className="text-violet-500">Listening…</span> : 'Here for you, always'}
                </p>
              </div>
            </div>

            {/* Profile banner */}
            {showProfile && <ProfileBanner onDone={() => setShowProfile(false)} />}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
              {isStreaming && streamingContent && <StreamingBubble content={streamingContent} />}

              {crisisLevel >= 2 && crisisResources.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-rose-700">You're not alone — support is available</p>
                  {crisisResources.map((r, i) => (
                    <p key={i} className="text-sm text-rose-600">{r}</p>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 bg-white border-t border-slate-100">
              <div className="flex items-end gap-3 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                  placeholder="Share what's on your mind…"
                  aria-label="Message"
                  rows={2}
                  className="flex-1 bg-transparent text-sm text-slate-700 resize-none focus:outline-none placeholder:text-slate-400 leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  aria-label="Send message"
                  className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 transition shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.157H13.5a.75.75 0 010 1.5H4.182l-1.903 6.157a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-6">
              <Heart className="w-9 h-9 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Your AI Therapist</h2>
            <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
              A calm, private space to explore your feelings. Your therapist knows your journey and is here to listen — without judgment, at your pace.
            </p>
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-700 transition"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Begin a session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
