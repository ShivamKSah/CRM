import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eltrozxuwwsbnbdhauti.supabase.co';
const supabaseKey = 'sb_publishable_zHkvseHCx_3Yn6BRIpDkvQ_plW9hkcv';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDb() {
  console.log('Clearing database...');
  
  await supabase.from('communications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('segments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Database cleared successfully!');
}

clearDb().catch(console.error);
