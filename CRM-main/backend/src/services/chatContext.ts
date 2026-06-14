import { supabase } from '../supabase.js';

export interface ChatContext {
  total_customers: number;
  total_campaigns: number;
  recent_campaign_stats: Array<{
    name: string;
    channel: string;
    status: string;
    total_sent: number;
    delivery_rate: number;
    open_rate: number;
  }>;
  top_segments: Array<{
    name: string;
    customer_count: number;
  }>;
  current_date: string;
}

export async function fetchChatContext(): Promise<ChatContext> {
  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  const { count: campaignCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true });

  const { data: recentCampaigns } = await supabase
    .from('campaigns')
    .select('name, channel, status, campaign_stats(total_sent, delivery_rate, open_rate)')
    .order('created_at', { ascending: false })
    .limit(3);

  const recentCampaignStats = (recentCampaigns ?? []).map(campaign => {
    const stats = Array.isArray(campaign.campaign_stats)
      ? campaign.campaign_stats[0]
      : campaign.campaign_stats;

    return {
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      total_sent: stats?.total_sent ?? 0,
      delivery_rate: stats?.delivery_rate ?? 0,
      open_rate: stats?.open_rate ?? 0,
    };
  });

  const { data: segments } = await supabase
    .from('segments')
    .select('name, customer_count')
    .order('customer_count', { ascending: false })
    .limit(5);

  return {
    total_customers: customerCount ?? 0,
    total_campaigns: campaignCount ?? 0,
    recent_campaign_stats: recentCampaignStats,
    top_segments: (segments ?? []).map(s => ({
      name: s.name,
      customer_count: s.customer_count,
    })),
    current_date: new Date().toISOString(),
  };
}
