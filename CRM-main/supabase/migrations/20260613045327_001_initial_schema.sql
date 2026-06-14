-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  city TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spend DECIMAL(12,2) DEFAULT 0,
  last_order_date DATE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments table
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filter_rules JSONB NOT NULL DEFAULT '{}',
  customer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'manual' CHECK (created_by IN ('manual', 'ai'))
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'rcs')),
  message_template TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
  ai_generated_message BOOLEAN DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications table
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'opened', 'read', 'clicked')),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign stats table
CREATE TABLE campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  read INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  orders_attributed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers (public access for this demo)
CREATE POLICY "select_customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_customers" ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_customers" ON customers FOR DELETE TO authenticated USING (true);

-- RLS policies for orders
CREATE POLICY "select_orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_orders" ON orders FOR DELETE TO authenticated USING (true);

-- RLS policies for segments
CREATE POLICY "select_segments" ON segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_segments" ON segments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_segments" ON segments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_segments" ON segments FOR DELETE TO authenticated USING (true);

-- RLS policies for campaigns
CREATE POLICY "select_campaigns" ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_campaigns" ON campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_campaigns" ON campaigns FOR DELETE TO authenticated USING (true);

-- RLS policies for communications
CREATE POLICY "select_communications" ON communications FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_communications" ON communications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_communications" ON communications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_communications" ON communications FOR DELETE TO authenticated USING (true);

-- RLS policies for campaign_stats
CREATE POLICY "select_campaign_stats" ON campaign_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_campaign_stats" ON campaign_stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_campaign_stats" ON campaign_stats FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_campaign_stats" ON campaign_stats FOR DELETE TO authenticated USING (true);

-- Indexes for common queries
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_communications_campaign_id ON communications(campaign_id);
CREATE INDEX idx_communications_status ON communications(status);
CREATE INDEX idx_campaigns_segment_id ON campaigns(segment_id);