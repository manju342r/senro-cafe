import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const SLIDES = [
  { src: '/cafe/hero/10-brunch.jpg', alt: 'Plated café dishes' },
  { src: '/cafe/hero/06-mkc-interior.jpg', alt: 'Maña Katha café interior' },
  { src: '/cafe/hero/08-latte.jpg', alt: 'Coffee toast at Maña Katha' },
  { src: '/cafe/hero/09-rooftop.jpg', alt: 'Warm evening dining room' },
  { src: '/cafe/hero/12-friends.jpg', alt: 'Modern café seating' },
] as const

const INTERVAL_MS = 5600

export function HeroSlideshow() {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  const active = SLIDES[reduceMotion ? 0 : index]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" aria-hidden>
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={active.src}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={active.src}
              alt=""
              className="h-full w-full object-cover"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,9,8,0.78)_0%,rgba(12,9,8,0.38)_52%,rgba(12,9,8,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,9,8,0.88)_0%,transparent_45%,rgba(12,9,8,0.22)_100%)]" />
      </div>

      {!reduceMotion && (
        <div className="pointer-events-auto absolute bottom-9 left-4 z-10 flex gap-1.5 sm:bottom-11 sm:left-6">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show background ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? 'w-7 bg-leaf' : 'w-2.5 bg-foam/35 hover:bg-foam/55'
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
