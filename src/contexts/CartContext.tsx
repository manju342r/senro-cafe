import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface CartLine {
  menu_item_id: string
  name: string
  price_cents: number
  quantity: number
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  totalCents: number
  addItem: (item: Omit<CartLine, 'quantity'>, qty?: number) => void
  setQuantity: (menuItemId: string, quantity: number) => void
  removeItem: (menuItemId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const KEY = 'mana-katha-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as CartLine[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines))
  }, [lines])

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0)
    const totalCents = lines.reduce((n, l) => n + l.price_cents * l.quantity, 0)

    return {
      lines,
      count,
      totalCents,
      addItem: (item, qty = 1) => {
        setLines((prev) => {
          const existing = prev.find((l) => l.menu_item_id === item.menu_item_id)
          if (existing) {
            return prev.map((l) =>
              l.menu_item_id === item.menu_item_id
                ? { ...l, quantity: l.quantity + qty }
                : l,
            )
          }
          return [...prev, { ...item, quantity: qty }]
        })
      },
      setQuantity: (menuItemId, quantity) => {
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.menu_item_id !== menuItemId)
            : prev.map((l) =>
                l.menu_item_id === menuItemId ? { ...l, quantity } : l,
              ),
        )
      },
      removeItem: (menuItemId) => {
        setLines((prev) => prev.filter((l) => l.menu_item_id !== menuItemId))
      },
      clear: () => setLines([]),
    }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
