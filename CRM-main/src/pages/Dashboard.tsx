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
      color: 'text-violet-400',
      bg: 'bg-violet-500/20',
      gradient: 'from-violet-500 to-indigo-500',
    },
    {
      label: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: Megaphone,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/20',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Total Messages Sent',
      value: stats.messagesToday,
      icon: Send,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/20',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      label: 'Avg Delivery Rate',
      value: `${stats.avgDeliveryRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      gradient: 'from-emerald-500 to-teal-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        {stats.totalCustomers === 0 && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all duration-300 font-medium"
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </div>
        ))}
      </div>

      {/* Chart */}
      {campaigns.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Campaign Performance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#475569"
                  fontSize={12}
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '13px' }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                />
                <Bar dataKey="delivered" fill="#6366f1" name="Delivered" radius={[0, 4, 4, 0]} />
                <Bar dataKey="opened" fill="#0ea5e9" name="Opened" radius={[0, 4, 4, 0]} />
                <Bar dataKey="clicked" fill="#10b981" name="Clicked" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {campaigns.length === 0 && stats.totalCustomers === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-slate-50" />
          <div className="max-w-md mx-auto relative z-10">
            <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-sm">
              <Sparkles className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3">Welcome to Aura</h3>
            <p className="text-slate-500 text-lg leading-relaxed">
              Get started by generating sample customer data or import your own customers to begin running campaigns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

