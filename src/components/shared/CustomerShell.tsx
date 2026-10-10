import { Link, NavLink, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { ChatWidget } from '@/components/chat/ChatWidget'

function linkClass(isActive: boolean) {
  return `nav-link ${isActive ? 'is-active text-leaf' : 'text-steam hover:text-foam'}`
}

export function CustomerShell() {
  const { count } = useCart()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
          <Link to="/" className="group min-w-0 transition opacity-95 hover:opacity-100">
            <BrandLogo size="md" showWordmark />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-6">
            <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
              Home
            </NavLink>
            <NavLink to="/menu" className={({ isActive }) => linkClass(isActive)}>
              Menu
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => linkClass(isActive)}>
              About
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => linkClass(isActive)}>
              Events
            </NavLink>
            <NavLink to="/visit" className={({ isActive }) => linkClass(isActive)}>
              Visit
            </NavLink>
            <NavLink to="/cart" className={({ isActive }) => linkClass(isActive)}>
              Cart
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-clay px-1.5 text-[11px] font-semibold text-ink"
                >
                  {count}
                </motion.span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
      <ChatWidget />
    </div>
  )
}
