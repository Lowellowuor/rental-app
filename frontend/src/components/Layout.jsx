import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

export default function Layout() {
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER', 'MAIN_TENANT', 'SUB_TENANT'] },
    { path: '/estates', label: 'Estates', icon: BuildingOfficeIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER'] },
    { path: '/houses', label: 'Houses', icon: BuildingOfficeIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER', 'MAIN_TENANT'] },
    { path: '/tenants', label: 'Tenants', icon: UsersIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER', 'MAIN_TENANT'] },
    { path: '/invoices', label: 'Invoices', icon: DocumentTextIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER', 'MAIN_TENANT', 'SUB_TENANT'] },
    { path: '/payment', label: 'Pay', icon: CreditCardIcon, roles: ['SUB_TENANT', 'MAIN_TENANT'] },
    { path: '/arrears', label: 'Arrears', icon: ExclamationTriangleIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER', 'MAIN_TENANT'] },
    { path: '/maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER', 'MAIN_TENANT', 'SUB_TENANT'] },
    { path: '/profile', label: 'Profile', icon: UserCircleIcon, roles: ['SUPER_ADMIN', 'ESTATE_MANAGER', 'MAIN_TENANT', 'SUB_TENANT'] },
  ]

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role) || user?.role === 'SUPER_ADMIN')

  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/30 z-50">
        <div className="flex justify-around items-center py-2 max-w-md mx-auto">
          {visibleItems.map((item) => {
            const activeClass = isActive(item.path)
              ? 'text-blue-600 bg-blue-500/10'
              : 'text-gray-600 hover:text-blue-500'
            return (
              <Link
                key={item.path}
                to={item.path}
                className={"flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all " + activeClass}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
