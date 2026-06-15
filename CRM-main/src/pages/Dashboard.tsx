import { useEffect, useState } from 'react';
import { Users, Megaphone, Send, TrendingUp, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { customersApi, campaignsApi, seedApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import type { Campaign } from '../types';

interface Stats {
  totalCustomers: number;
  activeCampaigns: number;
  messagesToday: number;
  avgDeliveryRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCampaigns: 0,
    messagesToday: 0,
    avgDeliveryRate: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersRes, campaignsRes] = await Promise.all([
        customersApi.list(),
        campaignsApi.list(),
      ]);

      const totalCampaigns = campaignsRes.campaigns || [];
      const activeCampaigns = totalCampaigns.filter(c => c.status === 'running');

      let totalSent = 0;
      let totalDelivered = 0;
      let deliveredCampaigns = 0;

      totalCampaigns.forEach(c => {
        if (c.campaign_stats) {
          totalSent += c.campaign_stats.total_sent;
          totalDelivered += c.campaign_stats.delivered;
          if (c.campaign_stats.total_sent > 0) deliveredCampaigns++;
        }
      });

      setStats({
        totalCustomers: customersRes.total || 0,
        activeCampaigns: activeCampaigns.length,
        messagesToday: totalSent,
        avgDeliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
      });

      setCampaigns(totalCampaigns.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedApi.generate();
      showToast(`Generated ${result.customers} customers and ${result.orders} orders`);
      loadData();
    } catch (err) {
      showToast('Failed to generate seed data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const chartData = campaigns.map(c => ({
    name: c.name.slice(0, 12),
    sent: c.campaign_stats?.total_sent || 0,
    delivered: c.campaign_stats?.delivered || 0,
    opened: c.campaign_stats?.opened || 0,
    clicked: c.campaign_stats?.clicked || 0,
  }));

  const statCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      iconColor: 'text-[#C96442]',
      iconBg: 'bg-[#C96442]/10',
    },
    {
      label: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: Megaphone,
      iconColor: 'text-[#7A8B6F]',
      iconBg: 'bg-[#7A8B6F]/10',
    },
    {
      label: 'Total Messages Sent',
      value: stats.messagesToday,
      icon: Send,
      iconColor: 'text-[#5B8FA8]',
      iconBg: 'bg-[#5B8FA8]/10',
    },
    {
      label: 'Avg Delivery Rate',
      value: `${stats.avgDeliveryRate}%`,
      icon: TrendingUp,
      iconColor: 'text-[#C96442]',
      iconBg: 'bg-[#C96442]/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C96442]" />
      </div>
    );
  }

  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#E8E6DE] shadow-sm p-8 lg:p-10">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C96442]/5 via-transparent to-[#7A8B6F]/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C96442]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7A8B6F]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl lg:text-4xl font-serif text-[#1F1E1D] tracking-tight leading-tight">
              {greeting} — here's how your<br />campaigns are doing
            </h1>
            <p className="text-[#6B6B6B] mt-3 text-base lg:text-lg">
              Your real-time overview of customers, campaigns, and engagement metrics.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {stats.totalCustomers === 0 && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] hover:shadow-lg hover:shadow-[#C96442]/20 disabled:opacity-50 transition-all duration-300 font-medium shrink-0"
              >
                {seeding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Sample Data
                  </>
                )}
              </button>
            )}

            <div className="hidden md:flex relative w-32 h-32 items-center justify-center shrink-0">
              {/* Abstract overlapping terracotta and sage circles */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-[#C96442]/20 to-[#E8845C]/10 opacity-80 blur-[2px] translate-x-1 -translate-y-1 animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-bl from-[#7A8B6F]/20 to-[#9CAF88]/10 opacity-70 blur-[2px] -translate-x-3 translate-y-3 animate-pulse" style={{ animationDuration: '6s' }} />
              {/* Glassmorphic floating card */}
              <div className="relative w-28 h-20 bg-white/40 backdrop-blur-md border border-[#E8E6DE]/60 rounded-xl shadow-xl flex flex-col justify-between p-3 transform rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-md bg-[#C96442]/10 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-[#C96442]" />
                  </div>
                  <span className="text-[8px] uppercase tracking-wider font-bold text-[#C96442] bg-[#C96442]/10 px-1.5 py-0.5 rounded-full">Active</span>
                </div>
                <div>
                  <div className="text-sm font-serif font-bold text-[#1F1E1D] mt-0.5">+24.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#E8E6DE] shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:border-[#C96442]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-[#6B6B6B]">{stat.label}</p>
                <p className="text-3xl font-serif text-[#1F1E1D] mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {campaigns.length > 0 && (
        <div className="bg-white border border-[#E8E6DE] shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-bold text-[#1F1E1D] mb-6">Recent Campaign Performance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#1F1E1D"
                  fontSize={12}
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E8E6DE',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                  }}
                  labelStyle={{ color: '#1F1E1D', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '13px' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                />
                <Bar dataKey="delivered" fill="#C96442" name="Delivered" radius={[0, 4, 4, 0]} />
                <Bar dataKey="opened" fill="#7A8B6F" name="Opened" radius={[0, 4, 4, 0]} />
                <Bar dataKey="clicked" fill="#5B8FA8" name="Clicked" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Empty state */}
      {campaigns.length === 0 && stats.totalCustomers === 0 && (
        <div className="bg-white border border-[#E8E6DE] rounded-2xl p-12 text-center relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C96442]/3 via-transparent to-[#7A8B6F]/3" />
          <div className="max-w-md mx-auto relative z-10">
            <div className="w-24 h-24 rounded-full bg-[#C96442]/10 flex items-center justify-center mx-auto mb-6 border border-[#C96442]/20 shadow-sm">
              <Sparkles className="w-10 h-10 text-[#C96442]" />
            </div>
            <h3 className="text-3xl font-bold text-[#1F1E1D] mb-3">Welcome to Aura</h3>
            <p className="text-[#6B6B6B] text-lg leading-relaxed">
              Get started by generating sample customer data or import your own customers to begin running campaigns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

