import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  LANDLORD: 'Landlord',
  ESTATE_MANAGER: 'Estate Manager',
  CARETAKER: 'Caretaker',
  AGENT: 'Agent',
  ACCOUNTANT: 'Accountant',
  TENANT: 'Tenant',
  SUB_TENANT: 'Sub-tenant',
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    alternate_phone: user?.alternate_phone || '',
    national_id: user?.national_id || '',
    kra_pin: user?.kra_pin || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username

  const set = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await api.patch('/auth/profile/', values)
      if (refreshUser) await refreshUser()
      setSuccess('Profile updated')
      setEditing(false)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader title="Profile" subtitle="Your account and details" />

      <section className="mt-6 rounded-lg border border-edge bg-surface shadow-card p-5 shadow-float">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-soft text-[22px] font-semibold text-accent-deep">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-ink">
              {fullName}
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-muted">@{user?.username}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-accent-deep">
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
              {user?.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-success/10 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-success">
                  <svg viewBox="0 0 20 20" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 10l3 3 7-7" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/5 p-3.5">
          <p className="text-[13.5px] text-ink">{error}</p>
        </div>
      )}

      {success && (
        <div role="status" className="mt-4 rounded-xl border border-success/25 bg-success/5 p-3.5">
          <p className="text-[13.5px] text-ink">{success}</p>
        </div>
      )}

      <section className="mt-5 rounded-lg border border-edge bg-surface shadow-card p-5 shadow-float">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Personal details
          </h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex h-8 items-center rounded-lg border border-edge bg-canvas px-3 text-[12.5px] font-medium text-ink transition-all duration-150 ease-out-soft hover:bg-surface hover:shadow-float"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name" value={values.first_name} onChange={(v) => set('first_name', v)} />
              <Field label="Last name" value={values.last_name} onChange={(v) => set('last_name', v)} />
            </div>
            <Field label="Email" type="email" value={values.email} onChange={(v) => set('email', v)} />
            <Field label="Alternate phone" value={values.alternate_phone} onChange={(v) => set('alternate_phone', v)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="National ID" value={values.national_id} onChange={(v) => set('national_id', v)} />
              <Field label="KRA PIN" value={values.kra_pin} onChange={(v) => set('kra_pin', v)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Emergency contact" value={values.emergency_contact_name} onChange={(v) => set('emergency_contact_name', v)} />
              <Field label="Emergency phone" value={values.emergency_contact_phone} onChange={(v) => set('emergency_contact_phone', v)} />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setError('')
                  setSuccess('')
                }}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-edge bg-surface shadow-card text-[15px] font-semibold text-ink shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-white shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-4 space-y-3.5">
            <Row label="Email" value={user?.email || '—'} />
            <Row label="Phone" value={user?.phone_number || '—'} />
            <Row label="Alternate phone" value={user?.alternate_phone || '—'} />
            <Row label="National ID" value={user?.national_id || '—'} />
            <Row label="KRA PIN" value={user?.kra_pin || '—'} />
            <Row label="Emergency contact" value={user?.emergency_contact_name || '—'} />
            <Row label="Emergency phone" value={user?.emergency_contact_phone || '—'} />
          </dl>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-edge bg-surface shadow-card p-5 shadow-float">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
          Account
        </h3>
        <button
          onClick={handleLogout}
          className={cn(
            'mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger/5 text-[15px] font-semibold text-danger',
            'transition-all duration-150 ease-out-soft',
            'hover:bg-danger/10'
          )}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sign out
        </button>
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-ink">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 w-full rounded-lg border border-edge bg-surface shadow-card px-3.5 text-[15px] text-ink',
          'placeholder:text-faint transition-shadow duration-150',
          'focus:border-accent focus:outline-none focus:shadow-focus'
        )}
      />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-edge/60 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="text-right text-[13.5px] font-medium text-ink">{value}</dd>
    </div>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <header>
      <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      {subtitle && <p className="mt-0.5 text-[13.5px] text-muted">{subtitle}</p>}
    </header>
  )
}