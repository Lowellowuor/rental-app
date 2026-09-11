import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { cn } from '@/lib/cn'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const set = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (formError) setFormError('')
  }

  function validate(v) {
    const e = {}
    if (!v.username.trim()) e.username = 'Username is required.'
    if (!v.password) e.password = 'Password is required.'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setFormError('')

    try {
      await login(values.username.trim(), values.password)
      navigate('/', { replace: true })
    } catch (err) {
      const payload = err?.response?.data
      if (payload?.detail) setFormError(String(payload.detail))
      else if (payload?.fields) {
        const mapped = {}
        for (const [k, v] of Object.entries(payload.fields)) {
          mapped[k] = Array.isArray(v) ? v[0] : String(v)
        }
        setErrors(mapped)
      } else setFormError('Invalid username or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
      <div className="w-full max-w-sm">
        <header className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink text-white shadow-float-lg">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10z" />
            </svg>
          </div>
          <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.02em] text-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            Sign in to manage your properties
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-7 rounded-lg border border-edge bg-surface shadow-card p-6 shadow-float-lg"
        >
          {formError && (
            <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-danger/25 bg-danger/5 p-3.5">
              <svg viewBox="0 0 20 20" className="mt-px size-[18px] shrink-0 text-danger" aria-hidden="true">
                <path d="M10 6.5v4.5M10 14h.01M10 2.5l7.5 13h-15L10 2.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[13.5px] leading-snug text-ink">{formError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="flex items-center gap-1 text-[13px] font-medium text-ink">
              Username
              <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={values.username}
              onChange={(e) => set('username', e.target.value)}
              placeholder="admin"
              className={cn(
                'h-11 w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint',
                'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
                errors.username ? 'border-danger' : 'border-edge'
              )}
            />
            {errors.username && <p role="alert" className="text-[12.5px] font-medium text-danger">{errors.username}</p>}
          </div>

          <div className="mt-4 space-y-1.5">
            <label htmlFor="password" className="flex items-center gap-1 text-[13px] font-medium text-ink">
              Password
              <span className="text-danger" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={values.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
                className={cn(
                  'h-11 w-full rounded-xl border bg-surface px-3.5 pr-11 text-[15px] text-ink placeholder:text-faint',
                  'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
                  errors.password ? 'border-danger' : 'border-edge'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-faint transition-colors hover:bg-canvas hover:text-ink"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p role="alert" className="text-[12.5px] font-medium text-danger">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-semibold text-white',
              'shadow-float transition-all duration-150 ease-out-soft',
              'hover:border-edge-hover hover:shadow-card-hover',
              'disabled:opacity-40 disabled:pointer-events-none'
            )}
          >
            {submitting && (
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-[13.5px] text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-accent-deep hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}