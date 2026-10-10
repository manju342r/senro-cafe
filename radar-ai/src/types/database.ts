// CaféOS database types (mirrors supabase/migrations/001_cafeos.sql).
// Keep in sync with the migration; regenerate when the schema changes.

export type UserRole = 'customer' | 'staff' | 'admin';
export type OrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  prep_time_seconds: number;
  is_available: boolean;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit_cents: number;
  current_stock: number;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  status: OrderStatus;
  total_cents: number;
  tracking_token: string;
  idempotency_key: string | null;
  estimated_ready_at: string | null;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  item_price_cents: number;
  quantity: number;
  customizations: Record<string, unknown>;
  prep_time_seconds: number | null;
  created_at: string;
}

export interface OrderStatusEvent {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export type RecommendationStatus =
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'implemented'
  | 'evaluated';

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  evidence: unknown[];
  metrics: Record<string, unknown> | null;
  status: RecommendationStatus;
  approved_by: string | null;
  approved_at: string | null;
  implemented_at: string | null;
  created_at: string;
}

// Minimal Database shape for the typed Supabase client.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      menu_categories: { Row: MenuCategory };
      menu_items: { Row: MenuItem };
      ingredients: { Row: Ingredient };
      recipe_ingredients: { Row: RecipeIngredient };
      orders: { Row: Order };
      order_items: { Row: OrderItem };
      order_status_events: { Row: OrderStatusEvent };
      recommendations: { Row: Recommendation };
    };
  };
}

/** Legal status transitions (mirrors transition_order() in SQL). */
export const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export function isLegalTransition(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || (LEGAL_TRANSITIONS[from] ?? []).includes(to);
}

export function formatCents(cents: number, currency = '₹'): string {
  return `${currency}${(cents / 100).toFixed(2)}`;
}
