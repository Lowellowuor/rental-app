import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function EstateCard({ estate, className }) {
  const occupancy = estate.house_count || 0
  const units = estate.total_units || 0
  const fill = units ? Math.round((occupancy / units) * 100) : 0

  return (
    <Link
      to={`/estates/${estate.id}`}
      className={cn(
        'group block overflow-hidden rounded-card border border-line bg-surface',
        'transition-all duration-200 hover:border-accent/40 hover:shadow-md',
        'focus-visible:outline-none focus-visible:shadow-focus',
        className
      )}
    >
      <div className="flex items-start gap-4 p-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-field bg-accent-soft text-accent-deep">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
            <path
              d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ink">
              {estate.name}
            </h3>
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 size-4 shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13.5px] text-muted">
            <svg viewBox="0 0 20 20" className="size-3.5 shrink-0" fill="none" aria-hidden="true">
              <path d="M10 18s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="truncate">{estate.location}</span>
          </p>

          <div className="mt-3 flex items-center gap-4 text-[12.5px] text-muted">
            <span className="font-medium text-ink">
              {estate.house_count ?? 0}
              <span className="ml-1 font-normal text-muted">
                {estate.house_count === 1 ? 'house' : 'houses'}
              </span>
            </span>
            <span className="text-line">Â·</span>
            <span>
              <span className="font-medium text-ink">{units}</span>
              <span className="ml-1">units</span>
            </span>
            {estate.manager_name && (
              <>
                <span className="text-line">Â·</span>
                <span className="truncate">{estate.manager_name}</span>
              </>
            )}
          </div>

          {units > 0 && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-pill bg-canvas">
                <div
                  className="h-full rounded-pill bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(fill, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11.5px] text-faint">
                {fill}% of units allocated
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}