import { Router } from 'express';
import { supabase } from '../supabase.js';
import { handleRouteError } from '../utils/routeError.js';

const router = Router();

router.post('/bulk', async (req, res) => {
  try {
    const customers = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: 'Array of customers required' });
    }

    const formattedCustomers = customers.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone || null,
      city: c.city || null,
      total_orders: c.total_orders || 0,
      total_spend: c.total_spend || 0,
      last_order_date: c.last_order_date || null,
      tags: c.tags || []
    }));

    const { data, error } = await supabase
      .from('customers')
      .upsert(formattedCustomers, { onConflict: 'email', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error('Bulk insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ inserted: data?.length || 0, customers: data });
  } catch (err) {
    handleRouteError(res, err, 'Failed to ingest customers');
  }
});

router.get('/', async (req, res) => {
  try {
    const { city, min_spend, last_order_before, tags, search, limit = 50, offset = 0 } = req.query;

    let query = supabase.from('customers').select('*', { count: 'exact' });

    if (city) {
      query = query.ilike('city', city as string);
    }
    if (min_spend) {
      query = query.gte('total_spend', parseFloat(min_spend as string));
    }
    if (last_order_before) {
      query = query.lte('last_order_date', last_order_before as string);
    }
    if (tags) {
      const tagArray = (tags as string).split(',').map(t => t.trim());
      query = query.contains('tags', tagArray);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ customers: data, total: count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch customers');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*, orders(*)')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch customer', 500);
  }
});

export default router;
