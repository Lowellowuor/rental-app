import { cn } from '@/lib/cn'

export default function Card({ children, className, padded = true, hover = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-lg border border-edge bg-surface shadow-card',
        'transition-all duration-200 ease-out-soft',
        hover && 'hover:border-edge-hover hover:shadow-card-hover',
        padded && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {title && (
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}