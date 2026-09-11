import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

const variants = {
  primary: 'bg-ink text-white hover:bg-ink/90 active:scale-[.985] shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas active:scale-[.985]',
  ghost: 'bg-transparent text-muted hover:bg-canvas hover:text-ink',
}

const sizes = {
  sm: 'h-9 px-3.5 text-[13px] rounded-[10px]',
  md: 'h-11 px-5 text-[15px] rounded-field',
  lg: 'h-13 px-6 text-[16px] rounded-field',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:shadow-focus',
        'disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
})