export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  total_orders: number;
  total_spend: number;
  last_order_date: string | null;
  tags?: string[];
  created_at: string;
  orders?: Order[];
}

export interface Order {
  id: string;
  customer_id: string;
  amount: number;
  product_name: string;
  category: string;
  status: string;
  created_at: string;
  customers?: { name: string; email: string };
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  filter_rules: FilterRules;
  customer_count: number;
  created_at: string;
  created_by: 'manual' | 'ai';
}

export interface FilterRules {
  min_spend?: number;
  max_spend?: number;
  min_orders?: number;
  max_orders?: number;
  last_order_before_days?: number;
  last_order_after_days?: number;
  cities?: string[];
  tags?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  segment_id: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'rcs';
  message_template: string;
  status: 'draft' | 'running' | 'completed';
  ai_generated_message: boolean;
  scheduled_at: string | null;
  created_at: string;
  segments?: Segment;
  campaign_stats?: CampaignStats;
}

export interface CampaignStats {
  id: string;
  campaign_id: string;
  total_sent: number;
  delivered: number;
  failed: number;
  opened: number;
  read: number;
  clicked: number;
  orders_attributed: number;
  updated_at: string;
  delivery_rate?: number;
  open_rate?: number;
  click_rate?: number;
  breakdown?: Record<string, number>;
}

export interface Communication {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: string;
  message: string;
  status: string;
  sent_at: string | null;
  updated_at: string;
  customers?: Customer;
}

export interface ChatAction {
  type: string;
  segment_name?: string;
  segment_description?: string;
  channel?: string;
  message?: string;
  filter_rules?: FilterRules;
}

export interface CampaignPrefill {
  name?: string;
  segment_name?: string;
  channel?: string;
  message?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}
