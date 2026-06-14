import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

router.post('/bulk', async (req, res) => {
  try {
    const orders = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'Array of orders required' });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(orders)
      .select();

    if (error) {
      console.error('Bulk insert orders error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Update customer stats for affected customers
    const customerIds = [...new Set(orders.map(o => o.customer_id))];

    for (const customerId of customerIds) {
      await updateCustomerStats(customerId);
    }

    res.json({ inserted: data?.length || 0, orders: data });
  } catch (err) {
    console.error('Bulk orders error:', err);
    res.status(500).json({ error: 'Failed to ingest orders' });
  }
});

export async function updateCustomerStats(customerId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select('amount, created_at')
    .eq('customer_id', customerId);

  if (!orders || orders.length === 0) return;

  const totalOrders = orders.length;
  const totalSpend = orders.reduce((sum, o) => sum + Number(o.amount), 0);
  const lastOrderDate = orders
    .map(o => new Date(o.created_at))
    .sort((a, b) => b.getTime() - a.getTime())[0]
    .toISOString().split('T')[0];

  await supabase
    .from('customers')
    .update({
      total_orders: totalOrders,
      total_spend: totalSpend,
      last_order_date: lastOrderDate
    })
    .eq('id', customerId);
}

router.get('/', async (req, res) => {
  try {
    const { customer_id, limit = 50, offset = 0 } = req.query;

    let query = supabase.from('orders').select('*, customers(name, email)');

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ orders: data });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
