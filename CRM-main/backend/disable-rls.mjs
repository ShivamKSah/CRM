import pg from 'pg';

const client = new pg.Client({
  host: 'db.eltrozxuwwsbnbdhauti.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Pratima@1412',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected');

  // Disable RLS on all tables so the publishable key can insert data
  const tables = ['customers', 'orders', 'segments', 'campaigns', 'communications', 'campaign_stats'];
  
  for (const table of tables) {
    await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
    console.log(`  RLS disabled on ${table}`);
  }

  await client.end();
  console.log('\n✅ RLS disabled on all tables. You can now seed.');
}

run().catch(err => {
  console.error('Error:', err.message);
  client.end().catch(() => {});
  process.exit(1);
});
