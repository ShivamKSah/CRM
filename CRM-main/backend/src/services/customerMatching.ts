import { supabase } from '../supabase.js';

export async function getMatchingCustomers(
  filterRules: Record<string, unknown>
): Promise<Array<Record<string, unknown>>> {
  let query = supabase.from('customers').select('*');

  if (filterRules.min_spend !== undefined) {
    query = query.gte('total_spend', filterRules.min_spend as number);
  }
  if (filterRules.max_spend !== undefined) {
    query = query.lte('total_spend', filterRules.max_spend as number);
  }
  if (filterRules.min_orders !== undefined) {
    query = query.gte('total_orders', filterRules.min_orders as number);
  }
  if (filterRules.max_orders !== undefined) {
    query = query.lte('total_orders', filterRules.max_orders as number);
  }
  if (filterRules.last_order_before_days !== undefined) {
    const date = new Date();
    date.setDate(date.getDate() - (filterRules.last_order_before_days as number));
    query = query.lte('last_order_date', date.toISOString().split('T')[0]);
  }
  if (filterRules.last_order_after_days !== undefined) {
    const date = new Date();
    date.setDate(date.getDate() - (filterRules.last_order_after_days as number));
    query = query.gte('last_order_date', date.toISOString().split('T')[0]);
  }
  if (Array.isArray(filterRules.cities) && filterRules.cities.length > 0) {
    query = query.in('city', filterRules.cities as string[]);
  }
  if (Array.isArray(filterRules.tags) && filterRules.tags.length > 0) {
    query = query.contains('tags', filterRules.tags as string[]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Query error:', error);
    return [];
  }

  return data || [];
}

export async function countMatchingCustomers(
  filterRules: Record<string, unknown>
): Promise<number> {
  const customers = await getMatchingCustomers(filterRules);
  return customers.length;
}
