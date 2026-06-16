export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  delivery_date: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  grand_total: number;
  notes: string;
  created_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  line_total: number;
  product?: Product;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'owner' | 'staff';
  full_name: string;
}

export interface DashboardStats {
  total_orders: number;
  monthly_revenue: number;
  pending_deliveries: number;
  top_products: { name: string; count: number }[];
  top_customers: { name: string; total: number }[];
}
