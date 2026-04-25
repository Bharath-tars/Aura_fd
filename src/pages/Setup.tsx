import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  username: z.string().min(2, 'At least 2 characters').max(50),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  timezone: z.string().default('UTC'),
  notification_time: z.string().default('09:00'),
})

type FormData = z.infer<typeof schema>

const steps = [
  { label: 'Your name', fields: ['username'] as const },
  { label: 'Account details', fields: ['email', 'password'] as const },
  { label: 'Preferences', fields: ['notification_time'] as const },
]

export default function Setup() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      notification_time: '09:00',
    },
  })

  const nextStep = async () => {
    const valid = await trigger(steps[step].fields as Parameters<typeof trigger>[0])
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await authApi.register(data)
      setAuth(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      const detail = e?.response?.data?.detail ?? 'Registration failed. Please try again.'
      if (detail.toLowerCase().includes('already')) {
        navigate('/login')
        return
      }
      setError(detail)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Start your journey</h1>
          <p className="text-muted-foreground text-sm mt-1">Your AI wellness companion awaits</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_s, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary w-8' : 'bg-border w-4'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Step {step + 1} — {steps[step].label}
                </h2>

                {step === 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Your name</label>
                    <input
                      {...register('username')}
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                      placeholder="How should Aura call you?"
                    />
                    {errors.username && <p className="text-rose-500 text-xs mt-1">{errors.username.message}</p>}
                  </div>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                        placeholder="you@example.com"
                      />
                      {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                      <input
                        {...register('password')}
                        type="password"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                        placeholder="Min. 8 characters"
                      />
                      {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Daily check-in time
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">When should Aura remind you to check in?</p>
                    <input
                      {...register('notification_time')}
                      type="time"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-rose-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition"
                >
                  Back
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Start my journey
                </button>
              )}
            </div>
          </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
