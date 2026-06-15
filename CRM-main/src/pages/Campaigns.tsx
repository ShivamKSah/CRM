import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Users, Send, CheckCircle, Clock, Sparkles, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { campaignsApi, segmentsApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import type { Campaign, Segment, CampaignPrefill } from '../types';

const PAGE_SIZE = 20;

export default function Campaigns() {
  const location = useLocation();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [page, setPage] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [campaignPrefill, setCampaignPrefill] = useState<CampaignPrefill | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [page]);

  useEffect(() => {
    const prefill = (location.state as { prefillCampaign?: CampaignPrefill } | null)
      ?.prefillCampaign;
    if (prefill) {
      setCampaignPrefill(prefill);
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, segmentsRes] = await Promise.all([
        campaignsApi.list({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        segmentsApi.list({ limit: 100 }), // Get enough segments for the dropdown
      ]);
      setCampaigns(campaignsRes.campaigns || []);
      setTotalCampaigns(campaignsRes.total || 0);
      setSegments(segmentsRes.segments || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await campaignsApi.delete(id);
      showToast('Campaign deleted');
      loadData();
    } catch (err) {
      showToast('Failed to delete campaign', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/20 rounded-full text-xs font-medium w-fit">
            <Clock className="w-3.5 h-3.5" />
            Draft
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-medium w-fit">
            <Send className="w-3.5 h-3.5" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]',
      sms: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
      email: 'text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]',
      rcs: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    };
    return <Send className={`w-4 h-4 ${colors[channel] || 'text-slate-400'}`} />;
  };

  const totalPages = Math.max(1, Math.ceil(totalCampaigns / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 font-medium"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6 border border-indigo-100">
            <Megaphone className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">No campaigns yet</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Create campaigns to send targeted messages to your customers based on their segment.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Campaign
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Segment
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Channel
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Sent
                  </th>
                  <th scope="col" className="px-5 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Delivered
                  </th>
                  <th scope="col" className="px-5 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map(campaign => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-slate-900 font-medium group-hover:text-indigo-600 transition-colors text-base">{campaign.name}</p>
                            {campaign.ai_generated_message && (
                              <span className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                                <Sparkles className="w-3 h-3" />
                                AI-generated
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" />
                          {campaign.segments?.name || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(campaign.channel)}
                          <span className="text-slate-700 capitalize">{campaign.channel}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(campaign.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-slate-900 font-medium">{campaign.campaign_stats?.total_sent || 0}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-slate-600">{campaign.campaign_stats?.delivered || 0}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(campaign.id);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                          aria-label={`Delete campaign ${campaign.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalCampaigns > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page <span className="text-slate-900 font-medium">{page + 1}</span> of <span className="text-slate-900 font-medium">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CreateCampaignModal
          segments={segments}
          prefill={campaignPrefill}
          onClose={() => {
            setShowModal(false);
            setCampaignPrefill(null);
          }}
          onCreated={loadData}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({
  segments,
  prefill,
  onClose,
  onCreated,
}: {
  segments: Segment[];
  prefill?: CampaignPrefill | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const matchedSegment = prefill?.segment_name
    ? segments.find(s => s.name.toLowerCase() === prefill.segment_name!.toLowerCase())
    : undefined;

  const [step, setStep] = useState(prefill?.message && matchedSegment ? 2 : 1);
  const [name, setName] = useState(prefill?.name || '');
  const [segmentId, setSegmentId] = useState(matchedSegment?.id || '');
  const [channel, setChannel] = useState(prefill?.channel || 'sms');
  const [message, setMessage] = useState(prefill?.message || '');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!prefill?.segment_name || segmentId) return;
    const match = segments.find(
      s => s.name.toLowerCase() === prefill.segment_name!.toLowerCase()
    );
    if (match) {
      setSegmentId(match.id);
      if (prefill.message) {
        setStep(2);
      }
    }
  }, [segments, prefill, segmentId]);

  const channels = [
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'sms', label: 'SMS' },
    { id: 'email', label: 'Email' },
    { id: 'rcs', label: 'RCS' },
  ];

  const handleGenerateMessage = async () => {
    if (!campaignId) return;

    if (!campaignGoal.trim()) {
      showToast('Please describe the campaign goal first', 'error');
      return;
    }

    setGenerating(true);
    try {
      const result = await campaignsApi.generateMessage(campaignId, campaignGoal, channel);
      setMessage(result.message);
    } catch (err) {
      showToast('Failed to generate message', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!name.trim() || !segmentId) {
      showToast('Name and segment are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const campaign = await campaignsApi.create({
        name,
        segment_id: segmentId,
        channel,
        message_template: message || 'Hello {name}, check out our latest offers!',
      });
      setCampaignId(campaign.id);
      setStep(2);
    } catch (err) {
      showToast('Failed to create campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLaunch = async () => {
    if (!campaignId) return;

    setSaving(true);
    try {
      await campaignsApi.launch(campaignId);
      showToast('Campaign launched successfully');
      onClose();
      onCreated();
    } catch (err) {
      showToast('Failed to launch campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Create campaign" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {step === 1 ? 'Create Campaign' : step === 2 ? 'Write Message' : 'Review & Launch'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close create campaign dialog">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Diwali Sale 2025"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Segment
                </label>
                <select
                  value={segmentId}
                  onChange={e => setSegmentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">Select a segment</option>
                  {segments.map(segment => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name} ({segment.customer_count} customers)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Channel</label>
                <div className="grid grid-cols-2 gap-3">
                  {channels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setChannel(ch.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                        channel === ch.id
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Goal (for AI)</label>
                <input
                  type="text"
                  value={campaignGoal}
                  onChange={e => setCampaignGoal(e.target.value)}
                  placeholder="Describe the campaign goal (e.g. Win-back inactive customers)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Message Template</label>
                  <button
                    onClick={handleGenerateMessage}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm disabled:opacity-50 transition-all font-medium border border-indigo-100"
                  >
                    {generating ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Generate with AI
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hi {name}, check out our exclusive offers just for you!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-32 resize-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Use {'{name}'} for personalization. Max {channel === 'email' ? '300' : '160'}{' '}
                  characters.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-slate-500 mb-3 font-medium uppercase tracking-widest">Preview</p>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900">
                  {message.replace('{name}', 'John') || (
                    <span className="text-slate-400 italic">Your message will appear here...</span>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-slate-500">Campaign Name</span>
                  <span className="text-slate-900 font-medium">{name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-slate-500">Segment</span>
                  <span className="text-slate-900 font-medium">
                    {segments.find(s => s.id === segmentId)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-slate-500">Channel</span>
                  <span className="text-slate-900 font-medium capitalize">{channel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Target Customers</span>
                  <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm">
                    {segments.find(s => s.id === segmentId)?.customer_count || 0}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="text-sm text-slate-500 mb-3 font-medium uppercase tracking-widest">Message</p>
                <p className="text-slate-900 bg-white p-4 rounded-xl border border-slate-200">{message}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong className="text-amber-900 block mb-1">Ready to launch?</strong>
                  Launching will immediately start sending messages to all customers in this
                  segment.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all font-medium"
          >
            Back
          </button>

          <div className="flex gap-3">
            {step < 2 ? (
              <button
                onClick={step === 1 ? handleCreateCampaign : () => setStep(step + 1)}
                disabled={saving || !name.trim() || !segmentId}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-medium shadow-sm"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                Continue
              </button>
            ) : step === 2 ? (
              <button
                onClick={() => {
                  if (!message.trim()) {
                    showToast('Please enter or generate a message before reviewing', 'error');
                    return;
                  }
                  setStep(3);
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-sm"
              >
                Review
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 drop-shadow-sm" />
                    Launch Campaign
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
