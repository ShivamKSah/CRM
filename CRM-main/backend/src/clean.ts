import { supabase } from './supabase.js';

async function clean() {
  console.log('Cleaning database using Supabase client...');
  const tables = ['campaign_stats', 'communications', 'campaigns', 'segments', 'orders', 'customers'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.error(`Error deleting from ${table}:`, error.message);
    } else {
      console.log(`  Cleared ${table}`);
    }
  }
  console.log('Done cleaning!');
}

clean().catch(err => {
  console.error(err);
  process.exit(1);
});
