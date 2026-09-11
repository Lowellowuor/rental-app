import { useEffect, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import { Footer, FormError, Modal } from './AddHouseModal'

export default function AssignHouseModal({ isOpen, onClose, house, onSuccess }) {
  const [tenants, setTenants] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setQuery('')
    setSelected(null)
    setFormError('')
    setSubmitting(false)
    setLoading(true)

    api
      .get('/auth/list/')
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data.results ?? []
        setTenants(list.filter((u) => u.role === 'TENANT' || u.role === 'SUB_TENANT'))
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen || !house) return null

  const filtered = tenants.filter((t) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      t.username?.toLowerCase().includes(q) ||
      t.phone_number?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q)
    )
  })

  async function handleAssign() {
    if (!selected) return

    setSubmitting(true)
    setFormError('')

    try {
      await api.patch(`/properties/houses/${house.id}/`, { main_tenant: selected })
      if (onSuccess) onSuccess()
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Could not assign tenant.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnassign() {
    setSubmitting(true)
    setFormError('')

    try {
      await api.patch(`/properties/houses/${house.id}/`, { main_tenant: null })
      if (onSuccess) onSuccess()
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Could not unassign tenant.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={house.main_tenant_username ? 'Change tenant' : 'Assign tenant'}
      subtitle={house.house_number}
      onClose={onClose}
    >
      <div className="px-6 pb-6 pt-5">
        <FormError message={formError} />

        <div className="relative mb-3">
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenants"
            className={cn(
              'h-11 w-full rounded-lg border border-edge bg-surface shadow-card pl-10 pr-4 text-[15px] text-ink',
              'placeholder:text-faint transition-shadow duration-150',
              'focus:border-accent focus:outline-none focus:shadow-focus'
            )}
          />
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-6 text-center text-[13px] text-muted">Loading tenants…</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">No tenants found.</p>
          ) : (
            filtered.map((t) => {
              const initials = (t.first_name?.[0] || t.username?.[0] || '?').toUpperCase()
              const fullName = [t.first_name, t.last_name].filter(Boolean).join(' ') || t.username
              const isSelected = selected === t.id

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border bg-surface p-3 text-left transition-all duration-150 ease-out-soft',
                    isSelected ? 'border-accent ring-2 ring-accent/20' : 'border-edge hover:-translate-y-0.5 hover:shadow-float'
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent-deep">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{fullName}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">
                      {t.phone_number || t.email || '@' + t.username}
                    </p>
                  </div>
                  {isSelected && (
                    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="mt-5 flex gap-2.5">
          {house.main_tenant && (
            <button
              type="button"
              onClick={handleUnassign}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-danger/25 bg-danger/5 px-4 text-[14px] font-semibold text-danger transition-all duration-150 ease-out-soft hover:bg-danger/10 disabled:opacity-50"
            >
              Unassign
            </button>
          )}
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selected || submitting}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-white shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover disabled:opacity-40 disabled:pointer-events-none"
          >
            {submitting ? 'Assigning…' : 'Assign tenant'}
          </button>
        </div>
      </div>
    </Modal>
  )
}