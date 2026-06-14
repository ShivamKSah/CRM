import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const API_BASE = 'http://localhost:3000/api';

async function seedCampaigns() {
  console.log('Fetching segments with customers...');
  const { data: segments } = await supabase
    .from('segments')
    .select('*')
    .gt('customer_count', 0)
    .limit(3);

  if (!segments || segments.length === 0) {
    console.log('No segments found with customers. Please generate sample data first.');
    return;
  }

  const campaignsToCreate = [
    {
      name: 'Summer Flash Sale',
      channel: 'whatsapp',
      message_template: 'Hey {name}, our Summer Flash Sale is live! Use code SUMMER20 for 20% off your next purchase.'
    },
    {
      name: 'We Miss You!',
      channel: 'email',
      message_template: 'Hi {name}, we noticed you haven\'t shopped with us in a while. Come back and enjoy free shipping on your next order!'
    },
    {
      name: 'Exclusive VIP Offer',
      channel: 'sms',
      message_template: '{name}, as a VIP, you get early access to our new collection! Check it out now.'
    }
  ];

  for (let i = 0; i < Math.min(segments.length, campaignsToCreate.length); i++) {
    const segment = segments[i];
    const template = campaignsToCreate[i];

    console.log(`Creating campaign: ${template.name} for segment: ${segment.name}`);
    
    // Create Campaign
    const createRes = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        segment_id: segment.id,
        channel: template.channel,
        message_template: template.message_template
      })
    });

    if (!createRes.ok) {
      console.error('Failed to create campaign:', await createRes.text());
      continue;
    }

    const campaign = await createRes.json();
    console.log(`Created campaign ${campaign.id}, launching...`);

    // Launch Campaign
    const launchRes = await fetch(`${API_BASE}/campaigns/${campaign.id}/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!launchRes.ok) {
      console.error('Failed to launch campaign:', await launchRes.text());
    } else {
      const launchData = await launchRes.json();
      console.log(`Launched! Target recipients: ${launchData.total_recipients}`);
    }
  }

  console.log('Done! The channel service will now simulate deliveries over the next 10-20 seconds.');
}

seedCampaigns();
