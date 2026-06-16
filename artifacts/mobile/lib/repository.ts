import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { Product, Customer, Order, OrderItem, DashboardStats } from './types';

const CACHE_KEYS = {
  products: 'cache:products',
  customers: 'cache:customers',
  orders: 'cache:orders',
};

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) return null;
    return data as T;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, expires: Date.now() + ttlMs }));
  } catch {}
}

async function invalidateCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export const ProductRepository = {
  async getAll(): Promise<Product[]> {
    const cached = await getCached<Product[]>(CACHE_KEYS.products);
    if (cached) return cached;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    const result = data as Product[];
    await setCache(CACHE_KEYS.products, result);
    return result;
  },

  async getAllIncludingInactive(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    if (error) throw error;
    return data as Product[];
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Product;
  },

  async create(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.products);
    return data as Product;
  },

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.products);
    return data as Product;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.products);
  },
};

export const CustomerRepository = {
  async getAll(): Promise<Customer[]> {
    const cached = await getCached<Customer[]>(CACHE_KEYS.customers);
    if (cached) return cached;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    if (error) throw error;
    const result = data as Customer[];
    await setCache(CACHE_KEYS.customers, result);
    return result;
  },

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Customer;
  },

  async create(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.customers);
    return data as Customer;
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.customers);
    return data as Customer;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.customers);
  },
};

export const OrderRepository = {
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(id, name, phone, email, address, notes, created_at), items:order_items(*, product:products(*))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Order[];
  },

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(id, name, phone, email, address, notes, created_at), items:order_items(*, product:products(*))')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Order;
  },

  async create(order: Omit<Order, 'id' | 'created_at' | 'customer' | 'items'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.orders);
    return data as Order;
  },

  async update(id: string, order: Partial<Order>): Promise<Order> {
    const { order_number: _, customer: __, items: ___, ...updateData } = order as Order;
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await invalidateCache(CACHE_KEYS.orders);
    return data as Order;
  },

  async addItem(item: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data as OrderItem;
  },

  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('order_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [ordersRes, monthlyRes, pendingRes, topProductsRes, topCustomersRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('grand_total').gte('order_date', monthStart).neq('status', 'cancelled'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'confirmed', 'preparing', 'ready']),
      supabase.from('order_items').select('product_id, products(name), quantity'),
      supabase.from('orders').select('customer_id, customers(name), grand_total').neq('status', 'cancelled'),
    ]);

    const monthlyRevenue = (monthlyRes.data ?? []).reduce((sum, o) => sum + (o.grand_total ?? 0), 0);

    const productCounts: Record<string, { name: string; count: number }> = {};
    for (const item of topProductsRes.data ?? []) {
      const pid = item.product_id as string;
      const pname = (item.products as unknown as { name: string } | null)?.name ?? 'Unknown';
      if (!productCounts[pid]) productCounts[pid] = { name: pname, count: 0 };
      productCounts[pid].count += (item.quantity as number) ?? 1;
    }
    const top_products = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const customerTotals: Record<string, { name: string; total: number }> = {};
    for (const order of topCustomersRes.data ?? []) {
      const cid = order.customer_id as string;
      const cname = (order.customers as unknown as { name: string } | null)?.name ?? 'Unknown';
      if (!customerTotals[cid]) customerTotals[cid] = { name: cname, total: 0 };
      customerTotals[cid].total += (order.grand_total as number) ?? 0;
    }
    const top_customers = Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      total_orders: ordersRes.count ?? 0,
      monthly_revenue: monthlyRevenue,
      pending_deliveries: pendingRes.count ?? 0,
      top_products,
      top_customers,
    };
  },
};
