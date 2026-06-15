import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  BookOpen,
  MousePointer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { campaignsApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import type { Campaign, CampaignStats, Communication } from '../types';

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 3000;

const COMM_STATUSES = [
  'queued',
  'sent',
  'delivered',
  'failed',
  'opened',
  'read',
  'clicked',
] as const;

const FUNNEL_COLORS = ['#C96442', '#D4845C', '#7A8B6F', '#5B8FA8', '#8B7355'];

function normalizeCampaignStats(raw: unknown): CampaignStats | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] as CampaignStats) ?? null;
  return raw as CampaignStats;
}

function pct(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CommStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: 'bg-[#FAF9F5] text-[#6B6B6B] border-[#E8E6DE]',
    sent: 'bg-[#5B8FA8]/10 text-[#5B8FA8] border-[#5B8FA8]/20',
    delivered: 'bg-[#7A8B6F]/10 text-[#7A8B6F] border-[#7A8B6F]/20',
    failed: 'bg-red-50 text-red-500 border-red-200',
    opened: 'bg-[#5B8FA8]/10 text-[#5B8FA8] border-[#5B8FA8]/20',
    read: 'bg-[#C96442]/10 text-[#C96442] border-[#C96442]/20',
    clicked: 'bg-[#8B7355]/10 text-[#8B7355] border-[#8B7355]/20',
  };

  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full border text-xs font-medium capitalize w-fit ${
        styles[status] ?? 'bg-[#FAF9F5] text-[#6B6B6B] border-[#E8E6DE]'
      }`}
    >
      {status}
    </span>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return (
        <span className="px-3 py-1 bg-[#FAF9F5] text-[#6B6B6B] border border-[#E8E6DE] rounded-full text-sm font-medium w-fit">
          Draft
        </span>
      );
    case 'running':
      return (
        <span className="px-3 py-1 bg-[#7A8B6F]/10 text-[#7A8B6F] border border-[#7A8B6F]/20 rounded-full text-sm font-medium w-fit">
          Running
        </span>
      );
    case 'completed':
      return (
        <span className="px-3 py-1 bg-[#5B8FA8]/10 text-[#5B8FA8] border border-[#5B8FA8]/20 rounded-full text-sm font-medium w-fit">
          Completed
        </span>
      );
    default:
      return null;
  }
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [commTotal, setCommTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const loadCommunications = useCallback(
    async (campaignId: string, filter: string, pageNum: number) => {
      const result = await campaignsApi.getCommunications(campaignId, {
        status: filter || undefined,
        limit: PAGE_SIZE,
        offset: pageNum * PAGE_SIZE,
      });
      setCommunications(result.communications ?? []);
      setCommTotal(result.total ?? 0);
    },
    []
  );

  const refreshLiveData = useCallback(async () => {
    if (!id) return;

    const [statsData, campaignData] = await Promise.all([
      campaignsApi.getStats(id),
      campaignsApi.get(id),
    ]);

    setStats(statsData);
    setCampaign({
      ...campaignData,
      campaign_stats: statsData,
    });

    await loadCommunications(id, statusFilter, page);
  }, [id, statusFilter, page, loadCommunications]);

  useEffect(() => {
    if (!id) return;

    const loadInitial = async () => {
      try {
        setLoading(true);
        const campaignData = await campaignsApi.get(id);
        setCampaign(campaignData);
        setStats(normalizeCampaignStats(campaignData.campaign_stats));
        await Promise.all([campaignsApi.getStats(id).then(setStats), loadCommunications(id, '', 0)]);
      } catch (err) {
        console.error('Failed to load campaign:', err);
        showToast('Failed to load campaign', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, [id, showToast, loadCommunications]);

  useEffect(() => {
    if (!id || loading) return;
    loadCommunications(id, statusFilter, page).catch(err =>
      console.error('Failed to load communications:', err)
    );
  }, [id, statusFilter, page, loading, loadCommunications]);

  useEffect(() => {
    if (!id || campaign?.status !== 'running') return;

    const interval = setInterval(() => {
      refreshLiveData().catch(err => console.error('Live refresh failed:', err));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [id, campaign?.status, refreshLiveData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C96442]" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B6B6B]">Campaign not found</p>
      </div>
    );
  }

  const totalSent = stats?.total_sent ?? 0;
  const delivered = stats?.delivered ?? 0;
  const failed = stats?.failed ?? 0;
  const opened = stats?.opened ?? 0;
  const read = stats?.read ?? 0;
  const clicked = stats?.clicked ?? 0;

  const statCards = [
    {
      label: 'Total Sent',
      value: totalSent,
      rate: null as string | null,
      icon: Send,
      color: 'text-[#6B6B6B]',
      bg: 'bg-[#FAF9F5] border border-[#E8E6DE]',
    },
    {
      label: 'Delivered',
      value: delivered,
      rate: stats?.delivery_rate != null ? `${Math.round(stats.delivery_rate * 100)}%` : pct(delivered, totalSent),
      icon: CheckCircle,
      color: 'text-[#7A8B6F]',
      bg: 'bg-[#7A8B6F]/5 border border-[#7A8B6F]/15',
    },
    {
      label: 'Failed',
      value: failed,
      rate: pct(failed, totalSent),
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50 border border-red-100',
    },
    {
      label: 'Opened',
      value: opened,
      rate: stats?.open_rate != null ? `${Math.round(stats.open_rate * 100)}%` : pct(opened, delivered),
      icon: Eye,
      color: 'text-[#5B8FA8]',
      bg: 'bg-[#5B8FA8]/5 border border-[#5B8FA8]/15',
    },
    {
      label: 'Read',
      value: read,
      rate: pct(read, opened),
      icon: BookOpen,
      color: 'text-[#C96442]',
      bg: 'bg-[#C96442]/5 border border-[#C96442]/15',
    },
    {
      label: 'Clicked',
      value: clicked,
      rate: stats?.click_rate != null ? `${Math.round(stats.click_rate * 100)}%` : pct(clicked, opened),
      icon: MousePointer,
      color: 'text-[#8B7355]',
      bg: 'bg-[#8B7355]/5 border border-[#8B7355]/15',
    },
  ];

  const funnelStages = [
    { stage: 'Sent', count: totalSent, dropOff: null as string | null },
    {
      stage: 'Delivered',
      count: delivered,
      dropOff: totalSent > 0 ? pct(totalSent - delivered, totalSent) : null,
    },
    {
      stage: 'Opened',
      count: opened,
      dropOff: delivered > 0 ? pct(delivered - opened, delivered) : null,
    },
    {
      stage: 'Read',
      count: read,
      dropOff: opened > 0 ? pct(opened - read, opened) : null,
    },
    {
      stage: 'Clicked',
      count: clicked,
      dropOff: read > 0 ? pct(read - clicked, read) : null,
    },
  ];

  const totalPages = Math.max(1, Math.ceil(commTotal / PAGE_SIZE));
  const isLive = campaign.status === 'running';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/campaigns')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#E8E6DE] text-[#6B6B6B] hover:text-[#1F1E1D] hover:bg-[#FAF9F5] transition-all shadow-sm"
            aria-label="Back to campaigns"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h1 className="text-2xl font-bold text-[#1F1E1D] tracking-tight">{campaign.name}</h1>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A8B6F]/10 border border-[#7A8B6F]/20 text-[#7A8B6F] text-xs font-medium tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7A8B6F] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7A8B6F]" />
                  </span>
                  LIVE
                </span>
              )}
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-[#6B6B6B] text-sm font-medium">
              <span className="text-[#1F1E1D]">{campaign.segments?.name ?? 'Segment'}</span>
              <span className="mx-2 text-[#E8E6DE]">•</span>
              <span className="uppercase tracking-wider text-[#6B6B6B]">{campaign.channel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {statCards.map(card => (
          <div
            key={card.label}
            className="bg-white border border-[#E8E6DE] rounded-2xl p-5 hover:-translate-y-1 hover:border-[#C96442]/20 hover:shadow-md transition-all duration-300 group shadow-sm"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-3xl font-serif text-[#1F1E1D] tracking-tight">{card.value.toLocaleString()}</p>
            {card.rate !== null && (
              <p className="text-xs text-[#6B6B6B] font-medium mt-1">{card.rate} conversion</p>
            )}
            <p className="text-sm text-[#6B6B6B] mt-2 font-medium tracking-wide uppercase">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel chart */}
      <div className="bg-white border border-[#E8E6DE] shadow-sm rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#1F1E1D] mb-1">Engagement Funnel</h3>
        <p className="text-sm text-[#6B6B6B] mb-8">Drop-off between each stage</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelStages} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}>
              <XAxis
                dataKey="stage"
                stroke="#6B6B6B"
                tick={{ fill: '#1F1E1D' }}
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E8E6DE' }}
              />
              <YAxis 
                stroke="#6B6B6B" 
                tick={{ fill: '#1F1E1D' }} 
                fontSize={12} 
                tickLine={false} 
                axisLine={{ stroke: '#E8E6DE' }} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E8E6DE',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
                }}
                labelStyle={{ color: '#1F1E1D', fontWeight: 'bold', marginBottom: '8px' }}
                itemStyle={{ color: '#6B6B6B' }}
                formatter={(value: number, _name, props) => {
                  const drop = (props.payload as { dropOff: string | null }).dropOff;
                  return [
                    drop ? `${value} (${drop} drop-off)` : value,
                    'Count',
                  ];
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={64}>
                {funnelStages.map((_, index) => (
                  <Cell key={index} fill={FUNNEL_COLORS[index]} />
                ))}
                <LabelList
                  dataKey="dropOff"
                  position="top"
                  formatter={(v: string) => (v ? `−${v}` : '')}
                  fill="#6B6B6B"
                  fontSize={11}
                  fontWeight="500"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Message template */}
      <div className="bg-white border border-[#E8E6DE] shadow-sm rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#1F1E1D] mb-4">Message Template</h3>
        <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-5 text-[#1F1E1D] text-sm leading-relaxed">
          {campaign.message_template}
        </div>
      </div>

      {/* Communications table */}
      <div className="bg-white border border-[#E8E6DE] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E8E6DE] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#1F1E1D]">Communications Log</h3>
            <p className="text-sm text-[#6B6B6B] mt-1">{commTotal.toLocaleString()} total messages processed</p>
          </div>
          <label htmlFor="comm-status-filter" className="sr-only">Filter by status</label>
          <select
            id="comm-status-filter"
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-[#E8E6DE] rounded-xl px-4 py-2.5 text-sm text-[#1F1E1D] focus:outline-none focus:ring-1 focus:ring-[#C96442] appearance-none shadow-sm transition-all pr-10 relative custom-select-arrow"
          >
            <option value="">All Statuses</option>
            {COMM_STATUSES.map(s => (
              <option key={s} value={s} className="py-1">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAF9F5]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                  Customer
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Channel</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Message</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                  Timeline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6DE]/60">
              {communications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#6B6B6B] text-sm bg-[#FAF9F5]">
                    No communications found matching the filter
                  </td>
                </tr>
              ) : (
                communications.map(comm => (
                  <tr key={comm.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="px-6 py-4 text-sm text-[#1F1E1D] font-medium">
                      {comm.customers?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B] capitalize">{comm.channel}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B] max-w-xs truncate" title={comm.message}>
                      {truncate(comm.message, 60)}
                    </td>
                    <td className="px-6 py-4">
                      <CommStatusBadge status={comm.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B6B] whitespace-nowrap">
                      {formatDateTime(comm.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {commTotal > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-[#E8E6DE] flex items-center justify-between bg-[#FAF9F5]">
            <p className="text-sm text-[#6B6B6B]">
              Page <span className="text-[#1F1E1D] font-medium">{page + 1}</span> of <span className="text-[#1F1E1D] font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-[#E8E6DE] text-[#1F1E1D] hover:bg-[#FAF9F5] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-[#E8E6DE] text-[#1F1E1D] hover:bg-[#FAF9F5] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
