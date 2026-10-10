import { Link, NavLink, Outlet, Navigate } from 'react-router-dom'
import { getAdminProfile, getStaffRole, isStaffLoggedIn, staffLogout } from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { BrandLogo } from '@/components/shared/BrandLogo'

const floorLinks = [
  { to: '/staff/orders', label: 'Orders' },
  { to: '/staff/menu', label: 'Menu' },
  { to: '/staff/analytics', label: 'Analytics' },
  { to: '/staff/ai', label: 'AI' },
]

const adminLinks = [
  { to: '/staff/sales', label: 'Sales' },
  { to: '/staff/customers', label: 'Customers' },
  { to: '/staff/event-bookings', label: 'Event bookings' },
  { to: '/staff/feedback', label: 'Feedback' },
]

export function StaffShell() {
  useDemoState()
  if (!isStaffLoggedIn()) {
    return <Navigate to="/staff/login" replace />
  }

  const role = getStaffRole()
  const isAdminUser = role === 'admin'
  const adminProfile = getAdminProfile()
  const links = isAdminUser ? [...adminLinks, ...floorLinks] : floorLinks

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-forest/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div>
              <p className="font-display text-[1.45rem] font-semibold leading-none text-leaf">
                Maña Katha
              </p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-steam">
                {isAdminUser ? 'Super admin' : 'Staff floor'}
              </p>
              {isAdminUser && adminProfile?.email ? (
                <p className="mt-1 max-w-[14rem] truncate text-[11px] text-steam/80">
                  {adminProfile.email}
                </p>
              ) : null}
            </div>
            {adminProfile?.picture ? (
              <img
                src={adminProfile.picture}
                alt=""
                className="h-9 w-9 rounded-full border border-line object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'is-active text-leaf' : 'text-steam hover:text-foam'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/"
              className="text-sm font-medium tracking-wide text-steam/65 transition hover:text-foam"
            >
              Site
            </Link>
            <button
              type="button"
              onClick={() => {
                staffLogout()
                window.location.href = '/staff/login'
              }}
              className="btn btn-secondary py-1.5 text-sm"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
