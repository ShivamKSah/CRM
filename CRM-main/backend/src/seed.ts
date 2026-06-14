import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { loadEnv, requireEnv } from './config/loadEnv.js';

loadEnv();

const HINDI_FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Priya', 'Ananya', 'Rahul', 'Amit', 'Pooja', 'Neha',
  'Deepak', 'Sanjay', 'Kavita', 'Rohan', 'Ishaan', 'Diya', 'Vikram', 'Sneha', 'Rajesh', 'Meera',
];
const SOUTH_FIRST = [
  'Karthik', 'Lakshmi', 'Venkat', 'Deepa', 'Murugan', 'Meenakshi', 'Arun', 'Divya', 'Ravi',
  'Kavya', 'Suresh', 'Aparna', 'Nair', 'Priya', 'Harish', 'Swathi', 'Gopal', 'Anjali', 'Senthil',
];
const COMMON_LAST = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Rao', 'Joshi', 'Agarwal',
  'Mehta', 'Shah', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Chopra', 'Malhotra', 'Kapoor', 'Desai',
];

const CITY_WEIGHTS: Array<{ city: string; weight: number }> = [
  { city: 'Mumbai', weight: 25 },
  { city: 'Delhi', weight: 20 },
  { city: 'Bangalore', weight: 20 },
  { city: 'Chennai', weight: 15 },
  { city: 'Hyderabad', weight: 10 },
  { city: 'Pune', weight: 10 },
];

const CUSTOMER_TAGS = [
  'vip',
  'churned',
  'new',
  'repeat',
  'discount-seeker',
  'fashion',
  'beauty',
  'food',
] as const;

const ORDER_CATEGORIES = ['fashion', 'beauty', 'food', 'electronics', 'home'] as const;

const PRODUCTS: Record<(typeof ORDER_CATEGORIES)[number], string[]> = {
  fashion: ['Floral Kurta', 'Linen Shirt', 'Denim Jacket', 'Silk Saree', 'Casual Palazzo', 'Embroidered Top'],
  beauty: ['Vitamin C Serum', 'Hydrating Face Wash', 'Matte Lipstick', 'Hair Growth Oil', 'Sunscreen SPF 50', 'Night Cream'],
  food: ['Cold Brew Pack', 'Masala Oats Box', 'Almond Butter Jar', 'Green Tea Sampler', 'Protein Granola', 'Dark Chocolate Bar'],
  electronics: ['Wireless Earbuds', 'Power Bank 10000mAh', 'Smart LED Bulb', 'USB-C Hub', 'Bluetooth Speaker'],
  home: ['Cotton Bedsheet Set', 'Scented Candle', 'Storage Basket', 'Ceramic Planter', 'Throw Cushion Cover'],
};

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

const PREBUILT_SEGMENTS = [
  {
    name: 'High Value VIPs',
    description: 'Customers with lifetime spend above ₹20,000',
    filter_rules: { min_spend: 20000 },
  },
  {
    name: 'At-Risk Churners',
    description: 'Repeat buyers inactive for 90+ days',
    filter_rules: { last_order_before_days: 90, min_orders: 3 },
  },
  {
    name: 'New Shoppers',
    description: 'Recent first-time or second-time buyers',
    filter_rules: { max_orders: 2, last_order_after_days: 30 },
  },
  {
    name: 'Bangalore Fashion Fans',
    description: 'Fashion-tagged customers in Bangalore',
    filter_rules: { cities: ['Bangalore'], tags: ['fashion'] },
  },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeightedCity(): string {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const { city, weight } of CITY_WEIGHTS) {
    cumulative += weight;
    if (roll <= cumulative) return city;
  }
  return CITY_WEIGHTS[0].city;
}

function generateName(): { first: string; last: string; full: string } {
  const pool = Math.random() < 0.5 ? HINDI_FIRST : SOUTH_FIRST;
  const first = randomChoice(pool);
  const last = randomChoice(COMMON_LAST);
  return { first, last, full: `${first} ${last}` };
}

function generateEmail(first: string, last: string): string {
  const domain = randomChoice(EMAIL_DOMAINS);
  const suffix = randomInt(1, 9999);
  return `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@${domain}`;
}

function generatePhone(): string {
  const digits = Array.from({ length: 10 }, () => randomInt(0, 9)).join('');
  return `+91${digits}`;
}

function pickCustomerTags(): string[] {
  const count = randomInt(0, 3);
  const pool = [...CUSTOMER_TAGS];
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = randomInt(0, pool.length - 1);
    selected.push(pool.splice(idx, 1)[0]);
  }
  return selected;
}

/** Weight ~70% of orders into the most recent 6 months. */
function randomOrderDate(): Date {
  const now = Date.now();
  const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
  const eighteenMonthsMs = 18 * 30 * 24 * 60 * 60 * 1000;

  if (Math.random() < 0.7) {
    return new Date(now - sixMonthsMs + Math.random() * sixMonthsMs);
  }

  const olderWindowStart = now - eighteenMonthsMs;
  const olderWindowEnd = now - sixMonthsMs;
  return new Date(olderWindowStart + Math.random() * (olderWindowEnd - olderWindowStart));
}

function createSupabase(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function updateCustomerStats(supabase: SupabaseClient, customerId: string): Promise<void> {
  const { data: orders } = await supabase
    .from('orders')
    .select('amount, created_at')
    .eq('customer_id', customerId);

  if (!orders?.length) return;

  const totalOrders = orders.length;
  const totalSpend = orders.reduce((sum, o) => sum + Number(o.amount), 0);
  const lastOrderDate = orders
    .map(o => new Date(o.created_at))
    .sort((a, b) => b.getTime() - a.getTime())[0]
    .toISOString()
    .split('T')[0];

  await supabase
    .from('customers')
    .update({
      total_orders: totalOrders,
      total_spend: totalSpend,
      last_order_date: lastOrderDate,
    })
    .eq('id', customerId);
}

export interface SeedResult {
  skipped: boolean;
  message: string;
  customers?: number;
  orders?: number;
  segments?: number;
}

export async function runSeed(supabase?: SupabaseClient): Promise<SeedResult> {
  const client = supabase ?? createSupabase();

  const { count: existingCustomers, error: countError } = await client
    .from('customers')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  if (existingCustomers && existingCustomers > 0) {
    return {
      skipped: true,
      message: 'Seed data already exists — skipping (idempotent)',
      customers: existingCustomers,
    };
  }

  const customers = Array.from({ length: 200 }, () => {
    const { first, last, full } = generateName();
    return {
      name: full,
      email: generateEmail(first, last),
      phone: generatePhone(),
      city: pickWeightedCity(),
      total_orders: 0,
      total_spend: 0,
      last_order_date: null as string | null,
      tags: pickCustomerTags(),
    };
  });

  const { data: insertedCustomers, error: customerError } = await client
    .from('customers')
    .insert(customers)
    .select('id');

  if (customerError) {
    throw new Error(`Failed to insert customers: ${customerError.message}`);
  }

  if (!insertedCustomers?.length) {
    throw new Error('No customers were inserted');
  }

  const orders = Array.from({ length: 800 }, () => {
    const customer = randomChoice(insertedCustomers);
    const category = randomChoice(ORDER_CATEGORIES);
    return {
      customer_id: customer.id,
      amount: parseFloat((Math.random() * (8000 - 200) + 200).toFixed(2)),
      product_name: randomChoice(PRODUCTS[category]),
      category,
      status: 'completed',
      created_at: randomOrderDate().toISOString(),
    };
  });

  const { data: insertedOrders, error: orderError } = await client
    .from('orders')
    .insert(orders)
    .select('id');

  if (orderError) {
    throw new Error(`Failed to insert orders: ${orderError.message}`);
  }

  const uniqueCustomerIds = [...new Set(orders.map(o => o.customer_id))];
  for (const customerId of uniqueCustomerIds) {
    await updateCustomerStats(client, customerId);
  }

  let segmentsCreated = 0;
  for (const segment of PREBUILT_SEGMENTS) {
    const customerCount = await countMatchingCustomersForClient(client, segment.filter_rules);

    const { error: segmentError } = await client.from('segments').insert({
      name: segment.name,
      description: segment.description,
      filter_rules: segment.filter_rules,
      customer_count: customerCount,
      created_by: 'manual',
    });

    if (segmentError) {
      throw new Error(`Failed to insert segment "${segment.name}": ${segmentError.message}`);
    }
    segmentsCreated++;
  }

  return {
    skipped: false,
    message: 'Seed data generated successfully',
    customers: insertedCustomers.length,
    orders: insertedOrders?.length ?? 800,
    segments: segmentsCreated,
  };
}

/** Uses shared matching logic with the provided Supabase client. */
async function countMatchingCustomersForClient(
  supabase: SupabaseClient,
  filterRules: Record<string, unknown>
): Promise<number> {
  // Re-use module by temporarily using global supabase import pattern — inline query to avoid circular deps
  let query = supabase.from('customers').select('*');

  if (filterRules.min_spend !== undefined) {
    query = query.gte('total_spend', filterRules.min_spend as number);
  }
  if (filterRules.max_orders !== undefined) {
    query = query.lte('total_orders', filterRules.max_orders as number);
  }
  if (filterRules.min_orders !== undefined) {
    query = query.gte('total_orders', filterRules.min_orders as number);
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
    throw new Error(error.message);
  }
  return data?.length ?? 0;
}

async function main(): Promise<void> {
  try {
    requireEnv('SUPABASE_URL');
    requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    const result = await runSeed();
    console.log(result.message);
    if (!result.skipped) {
      console.log(`  Customers: ${result.customers}`);
      console.log(`  Orders:    ${result.orders}`);
      console.log(`  Segments:  ${result.segments}`);
    } else {
      console.log(`  Existing customers: ${result.customers}`);
    }
  } catch (err) {
    console.error('Seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

const isDirectRun = process.argv[1]?.includes('seed.ts');
if (isDirectRun) {
  void main();
}
