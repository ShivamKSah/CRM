import * as fs from 'fs';
import * as path from 'path';

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

const CITY_WEIGHTS = [
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
];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

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

function generateName() {
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

function randomOrderDate(): string {
  const now = Date.now();
  const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * sixMonthsMs).toISOString().split('T')[0];
}

async function generateCsv() {
  const rows: string[] = [];
  // CSV Header
  rows.push('name,email,phone,city,total_orders,total_spend,last_order_date,tags');

  for (let i = 0; i < 20; i++) {
    const { first, last, full } = generateName();
    const email = generateEmail(first, last);
    const phone = generatePhone();
    const city = pickWeightedCity();
    const totalOrders = randomInt(0, 10);
    const totalSpend = totalOrders > 0 ? randomInt(500, 25000) : 0;
    const lastOrderDate = totalOrders > 0 ? randomOrderDate() : '';
    const tags = `"${pickCustomerTags().join(',')}"`; // Wrap tags in quotes for CSV parsing

    rows.push(`${full},${email},${phone},${city},${totalOrders},${totalSpend},${lastOrderDate},${tags}`);
  }

  const outputDir = path.resolve(process.cwd(), 'backend', 'test-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'sample_customers.csv');
  fs.writeFileSync(outputPath, rows.join('\n'));
  
  console.log(`Generated sample CSV at ${outputPath}`);
}

generateCsv().catch(console.error);
