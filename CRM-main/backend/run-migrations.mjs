import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use direct host/port/user/password config to force IPv6 resolution
const client = new pg.Client({
  host: 'db.eltrozxuwwsbnbdhauti.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Pratima@1412',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log('Connecting to Supabase database (direct connection)...');
  await client.connect();
  console.log('Connected!');

  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`\nRunning migration: ${file}`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file} applied successfully`);
    } catch (err) {
      if (err.code === '42P07' || err.code === '42710' || (err.message && err.message.includes('already exists'))) {
        console.log(`  ⚠ ${file} skipped (objects already exist)`);
      } else {
        console.error(`  ✗ ${file} failed:`, err.message);
        throw err;
      }
    }
  }

  await client.end();
  console.log('\n✅ All migrations complete!');
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  client.end().catch(() => {});
  process.exit(1);
});
