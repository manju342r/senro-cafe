import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { SiteFooter } from '@/components/shared/SiteFooter'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'

function linkClass(isActive: boolean, onHero: boolean) {
  if (onHero) {
    return `nav-link ${isActive ? 'is-active text-leaf' : 'text-foam/80 hover:text-foam'}`
  }
  return `nav-link ${isActive ? 'is-active text-leaf' : 'text-steam hover:text-foam'}`
}

export function CustomerShell() {
  const { count } = useCart()
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) {
      setScrolled(false)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const overHero = isHome && !scrolled

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`z-20 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'
        } ${
          overHero
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-line bg-ink/80 backdrop-blur-xl'
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 sm:py-3">
          <Link to="/" className="group min-w-0 transition opacity-95 hover:opacity-100">
            <BrandLogo size="md" showWordmark />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-6">
            <NavLink to="/" end className={({ isActive }) => linkClass(isActive, overHero)}>
              Home
            </NavLink>
            <NavLink to="/menu" className={({ isActive }) => linkClass(isActive, overHero)}>
              Menu
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => linkClass(isActive, overHero)}>
              About
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => linkClass(isActive, overHero)}>
              Events
            </NavLink>
            <NavLink to="/visit" className={({ isActive }) => linkClass(isActive, overHero)}>
              Visit
            </NavLink>
            <NavLink to="/cart" className={({ isActive }) => linkClass(isActive, overHero)}>
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
            <button
              type="button"
              className="btn btn-primary min-h-9 px-3.5 py-1.5 text-sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mana-katha-toggle-feedback'))
              }}
            >
              Feedback
            </button>
          </nav>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
      <FeedbackWidget />
      <ChatWidget />
    </div>
  )
}
