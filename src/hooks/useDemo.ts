import { useEffect, useState } from 'react'
import {
  ensureHydrated,
  getDemoState,
  subscribeDemo,
  type DemoState,
} from '@/lib/demoStore'

export function useDemoState() {
  const [state, setState] = useState<DemoState>(() => getDemoState())
  const [ready, setReady] = useState(() => getDemoState().hydrated)

  useEffect(() => {
    let cancelled = false

    const sync = () => {
      if (cancelled) return
      setState(getDemoState())
      setReady(getDemoState().hydrated)
    }

    const unsub = subscribeDemo(sync)

    void ensureHydrated()
      .catch(() => {
        /* hydrateError is on state */
      })
      .finally(sync)

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  return { ...state, ready }
}
