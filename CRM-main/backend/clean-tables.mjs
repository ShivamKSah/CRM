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

  // Clean tables in correct order (respect foreign keys)
  const tables = ['campaign_stats', 'communications', 'campaigns', 'segments', 'orders', 'customers'];
  
  for (const table of tables) {
    await client.query(`TRUNCATE TABLE ${table} CASCADE`);
    console.log(`  Truncated ${table}`);
  }

  await client.end();
  console.log('\n✅ All tables cleaned. Ready for fresh seed.');
}

run().catch(err => {
  console.error('Error:', err.message);
  client.end().catch(() => {});
  process.exit(1);
});
