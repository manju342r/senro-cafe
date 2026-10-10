// CaféOS shared domain types. Mirror the Supabase schema (001_cafeos.sql).

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
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
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
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  status: OrderStatus;
  total_cents: number;
  tracking_token: string;
  estimated_ready_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  item_price_cents: number;
  quantity: number;
  customizations: { note?: string } & Record<string, unknown>;
  prep_time_seconds: number | null;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented' | 'evaluated';
  created_at: string;
}

/** Legal transitions — must match transition_order() in SQL. */
export const NEXT: Record<OrderStatus, OrderStatus[]> = {
  received: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: 'Received',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Display paise as rupees. All money fields are integer paise. */
export function inr(cents: number): string {
  return `₹${(cents / 100).toFixed(2)}`;
}
