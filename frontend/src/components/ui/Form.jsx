import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

export function Field({ label, required, hint, error, children }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1 text-[13px] font-medium text-ink">
        {label}
        {required && <span className="text-danger" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {children({ id, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="text-[12.5px] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12.5px] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const fieldBase =
  'w-full rounded-field border bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint ' +
  'transition-shadow duration-150 outline-none ' +
  'focus:border-accent focus:shadow-focus ' +
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-faint'

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, 'h-11', invalid ? 'border-danger' : 'border-line', className)}
      {...props}
    />
  )
})

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldBase,
          'h-11 appearance-none pr-10',
          invalid ? 'border-danger' : 'border-line',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
      >
        <path
          d="M6 8l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
})