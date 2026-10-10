export type UserRole = 'customer' | 'staff' | 'admin'

/** Floor staff vs super-admin (owner) session roles. */
export type StaffRole = 'staff' | 'admin'

export interface AdminProfile {
  email: string
  name: string
  picture: string | null
}

export type OrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export interface MenuCategory {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string
  price_cents: number
  prep_time_seconds: number
  is_available: boolean
  image_url: string | null
  display_order: number
}

export interface Ingredient {
  id: string
  name: string
  unit: string
  cost_per_unit_cents: number
  current_stock: number
}

export interface RecipeIngredient {
  id: string
  menu_item_id: string
  ingredient_id: string
  quantity: number
}

export interface Order {
  id: string
  customer_name: string
  status: OrderStatus
  total_cents: number
  tracking_token: string
  estimated_ready_at: string | null
  accepted_at: string | null
  preparing_at: string | null
  ready_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  idempotency_key?: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  item_name: string
  item_price_cents: number
  quantity: number
  customizations: Record<string, string>
  prep_time_seconds: number
}

export interface OrderStatusEvent {
  id: string
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  notes: string | null
  created_at: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  events: OrderStatusEvent[]
}

export interface CustomerSummary {
  name: string
  order_count: number
  completed_count: number
  cancelled_count: number
  total_spent_cents: number
  last_order_at: string
  avg_order_cents: number
}

export interface SalesOverview {
  revenue_cents: number
  gross_cents: number
  cancelled_cents: number
  order_count: number
  completed_count: number
  cancelled_count: number
  active_count: number
  aov_cents: number
  completion_rate: number
  by_status: Record<OrderStatus, number>
  top_items: { name: string; quantity: number; revenue_cents: number }[]
  recent_orders: OrderWithItems[]
  daily: { date: string; revenue_cents: number; orders: number }[]
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
}

/** Prices stored in paise (1/100 INR). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
