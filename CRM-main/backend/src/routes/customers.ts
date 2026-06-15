import { Router } from 'express';
import { supabase } from '../supabase.js';
import { handleRouteError } from '../utils/routeError.js';
import { genAI, GEMINI_MODEL } from '../gemini.js';

const router = Router();

router.post('/map-columns', async (req, res) => {
  try {
    const { headers } = req.body;
    if (!Array.isArray(headers) || headers.length === 0) {
      return res.status(400).json({ error: 'Array of headers required' });
    }

    const prompt = `Given a list of CSV column headers, map each to the closest matching field from this list: name, email, phone, city, total_orders, total_spend, last_order_date, tags. If a header doesn't match any field, map it to null. Return ONLY a JSON object mapping each input header to its matched field or null.

Input headers: ${JSON.stringify(headers)}`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json\n?/, '').replace(/```\n?/, '');

    const mapping = JSON.parse(text);
    res.json({ mapping });
  } catch (err) {
    handleRouteError(res, err, 'Failed to map columns');
  }
});

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
