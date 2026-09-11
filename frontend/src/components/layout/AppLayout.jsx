import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { cn } from '@/lib/cn'

const MANAGER_ROLES = ['ADMIN', 'LANDLORD', 'ESTATE_MANAGER']

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Home',
    roles: null,
    icon: <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10z" />,
  },
  {
    to: '/estates',
    label: 'Estates',
    roles: [...MANAGER_ROLES, 'CARETAKER', 'AGENT'],
    icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
  },
  {
    to: '/tenants',
    label: 'Tenants',
    roles: [...MANAGER_ROLES, 'CARETAKER'],
    icon: <path d="M16 14a4 4 0 0 0-8 0M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 21a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6" />,
  },
  {
    to: '/invoices',
    label: 'Invoices',
    roles: null,
    icon: <path d="M6 3h9l5 5v13H6zM14 3v6h6M9 13h6M9 17h6" />,
  },
  {
    to: '/payment',
    label: 'Pay',
    roles: ['TENANT', 'SUB_TENANT'],
    icon: <path d="M2 8h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8zM2 8l3-4h14l3 4M6 14h2" />,
  },
  {
    to: '/arrears',
    label: 'Arrears',
    roles: [...MANAGER_ROLES, 'ACCOUNTANT'],
    icon: <path d="M12 8v5M12 17h.01M10.3 3.3l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0z" />,
  },
  {
    to: '/maintenance',
    label: 'Maintenance',
    roles: null,
    icon: <path d="M14.7 6.3a4 4 0 1 0 3 3L21 6l-3-3-3.3 3.3zM10 13l-7 7 1 1 7-7" />,
  },
  {
    to: '/profile',
    label: 'Profile',
    roles: null,
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
  },
]

function canSee(item, user) {
  if (!item.roles) return true
  return item.roles.includes(user?.role)
}

export default function AppLayout() {
  const { user } = useAuth()
  const items = NAV_ITEMS.filter((i) => canSee(i, user))
  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()

  return (
    <div className="min-h-dvh bg-canvas">
      <FloatingHeader user={user} initials={initials} />

      <div className="flex">
        <FloatingSidebar items={items} user={user} initials={initials} />

        <main className="min-h-dvh w-full md:pl-[17.5rem]">
          <div className="pt-20 pb-24 md:pt-24 md:pb-10">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomTabs items={items} />
    </div>
  )
}

function FloatingHeader({ user, initials }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-3">
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-3',
          'h-14 rounded-full border border-edge bg-surface/95 pl-3 pr-2 backdrop-blur-xl',
          'shadow-card'
        )}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-ink text-white">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10z" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Rentals
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>

          <Link
            to="/profile"
            aria-label="Profile"
            className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-canvas"
          >
            <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-[12.5px] font-semibold text-accent-deep">
              {initials}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function FloatingSidebar({ items, user, initials }) {
  return (
    <aside
      className={cn(
        'fixed left-4 top-24 z-30 hidden w-60 md:block',
        'rounded-2xl border border-edge bg-surface shadow-card'
      )}
    >
      <nav className="space-y-0.5 overflow-y-auto p-2.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-[13.5px] transition-colors',
                isActive
                  ? 'bg-canvas font-semibold text-ink'
                  : 'font-medium text-muted hover:bg-canvas hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    'size-[18px] shrink-0',
                    isActive ? 'text-ink' : 'text-muted group-hover:text-ink'
                  )}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? 2.1 : 1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-edge px-3 py-2.5">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-canvas"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-deep">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-medium text-ink">
              {user?.username}
            </p>
            <p className="truncate text-[10.5px] uppercase tracking-[0.06em] text-faint">
              {user?.role}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  )
}

function BottomTabs({ items }) {
  const mobile = items.slice(0, 5)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-surface/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {mobile.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10.5px] transition-colors',
                isActive ? 'font-semibold text-ink' : 'font-medium text-faint hover:text-muted'
              )
            }
          >
            {({ isActive }) => (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className={cn('size-[22px]', isActive ? 'text-ink' : 'text-faint')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? 2.1 : 1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}