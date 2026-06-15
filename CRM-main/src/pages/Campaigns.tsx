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
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF9F5] text-[#6B6B6B] border border-[#E8E6DE] rounded-full text-xs font-medium w-fit">
            <Clock className="w-3.5 h-3.5" />
            Draft
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#7A8B6F]/10 text-[#7A8B6F] border border-[#7A8B6F]/20 rounded-full text-xs font-medium w-fit">
            <Send className="w-3.5 h-3.5" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#5B8FA8]/10 text-[#5B8FA8] border border-[#5B8FA8]/20 rounded-full text-xs font-medium w-fit">
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
      whatsapp: 'text-[#7A8B6F]',
      sms: 'text-[#5B8FA8]',
      email: 'text-[#C96442]',
      rcs: 'text-[#D4A574]',
    };
    return <Send className={`w-4 h-4 ${colors[channel] || 'text-[#6B6B6B]'}`} />;
  };

  const totalPages = Math.max(1, Math.ceil(totalCampaigns / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1F1E1D] tracking-tight">Campaigns</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] hover:shadow-lg hover:shadow-[#C96442]/20 transition-all duration-300 font-medium"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C96442]" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-[#E8E6DE] shadow-sm rounded-2xl p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#C96442]/10 flex items-center justify-center mx-auto mb-6 border border-[#C96442]/20">
            <Megaphone className="w-10 h-10 text-[#C96442]" />
          </div>
          <h3 className="text-xl font-bold text-[#1F1E1D] mb-3">No campaigns yet</h3>
          <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto">
            Create campaigns to send targeted messages to your customers based on their segment.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] hover:shadow-lg hover:shadow-[#C96442]/20 transition-all duration-300 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-[#E8E6DE] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAF9F5] border-b border-[#E8E6DE]">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                    Campaign
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                    Segment
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                    Channel
                  </th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-4 text-right text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                    Sent
                  </th>
                  <th scope="col" className="px-5 py-4 text-right text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                    Delivered
                  </th>
                  <th scope="col" className="px-5 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
                <tbody className="divide-y divide-[#E8E6DE]/60">
                  {campaigns.map(campaign => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-[#FAF9F5] cursor-pointer transition-colors group"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#C96442]/10 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-[#C96442]" />
                          </div>
                          <div>
                            <p className="text-[#1F1E1D] font-medium group-hover:text-[#C96442] transition-colors text-base">{campaign.name}</p>
                            {campaign.ai_generated_message && (
                              <span className="text-xs text-[#C96442] flex items-center gap-1 mt-1">
                                <Sparkles className="w-3 h-3" />
                                AI-generated
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B]">
                          <Users className="w-4 h-4 text-[#6B6B6B]" />
                          {campaign.segments?.name || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(campaign.channel)}
                          <span className="text-[#1F1E1D] capitalize">{campaign.channel}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(campaign.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[#1F1E1D] font-medium">{campaign.campaign_stats?.total_sent || 0}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[#6B6B6B]">{campaign.campaign_stats?.delivered || 0}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(campaign.id);
                          }}
                          className="text-[#6B6B6B] hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
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
    <div className="fixed inset-0 bg-[#1F1E1D]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Create campaign" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-[#E8E6DE]">
        <div className="flex items-center justify-between p-6 border-b border-[#E8E6DE]">
          <div>
            <h2 className="text-xl font-bold text-[#1F1E1D] tracking-tight">
              {step === 1 ? 'Create Campaign' : step === 2 ? 'Write Message' : 'Review & Launch'}
            </h2>
            <p className="text-[#6B6B6B] text-sm mt-1">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#1F1E1D] transition-colors" aria-label="Close create campaign dialog">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#1F1E1D] mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Diwali Sale 2025"
                  className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F1E1D] mb-2">
                  Target Segment
                </label>
                <select
                  value={segmentId}
                  onChange={e => setSegmentId(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all appearance-none"
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
                <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Channel</label>
                <div className="grid grid-cols-2 gap-3">
                  {channels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setChannel(ch.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                        channel === ch.id
                          ? 'bg-[#C96442]/10 border-[#C96442]/30 text-[#C96442] shadow-sm'
                          : 'bg-white border-[#E8E6DE] text-[#6B6B6B] hover:border-[#C96442]/20 hover:bg-[#FAF9F5]'
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
                <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Campaign Goal (for AI)</label>
                <input
                  type="text"
                  value={campaignGoal}
                  onChange={e => setCampaignGoal(e.target.value)}
                  placeholder="Describe the campaign goal (e.g. Win-back inactive customers)"
                  className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#1F1E1D]">Message Template</label>
                  <button
                    onClick={handleGenerateMessage}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C96442]/10 text-[#C96442] rounded-lg hover:bg-[#C96442]/15 text-sm disabled:opacity-50 transition-all font-medium border border-[#C96442]/20"
                  >
                    {generating ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#C96442]" />
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
                  className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] h-32 resize-none transition-all"
                />
                <p className="text-xs text-[#6B6B6B] mt-2">
                  Use {'{name}'} for personalization. Max {channel === 'email' ? '300' : '160'}{' '}
                  characters.
                </p>
              </div>

              <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-5 shadow-sm">
                <p className="text-sm text-[#6B6B6B] mb-3 font-medium uppercase tracking-widest">Preview</p>
                <div className="bg-white border border-[#E8E6DE] rounded-xl p-4 text-[#1F1E1D]">
                  {message.replace('{name}', 'John') || (
                    <span className="text-[#6B6B6B] italic">Your message will appear here...</span>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E6DE] pb-3">
                  <span className="text-[#6B6B6B]">Campaign Name</span>
                  <span className="text-[#1F1E1D] font-medium">{name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#E8E6DE] pb-3">
                  <span className="text-[#6B6B6B]">Segment</span>
                  <span className="text-[#1F1E1D] font-medium">
                    {segments.find(s => s.id === segmentId)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#E8E6DE] pb-3">
                  <span className="text-[#6B6B6B]">Channel</span>
                  <span className="text-[#1F1E1D] font-medium capitalize">{channel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B6B6B]">Target Customers</span>
                  <span className="text-[#C96442] font-bold bg-[#C96442]/10 px-3 py-1 rounded-full text-sm">
                    {segments.find(s => s.id === segmentId)?.customer_count || 0}
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-5">
                <p className="text-sm text-[#6B6B6B] mb-3 font-medium uppercase tracking-widest">Message</p>
                <p className="text-[#1F1E1D] bg-white p-4 rounded-xl border border-[#E8E6DE]">{message}</p>
              </div>

              <div className="bg-[#C96442]/5 border border-[#C96442]/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#C96442] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#C96442]/80 leading-relaxed">
                  <strong className="text-[#C96442] block mb-1">Ready to launch?</strong>
                  Launching will immediately start sending messages to all customers in this
                  segment.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t border-[#E8E6DE] bg-[#FAF9F5]">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2.5 bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-xl hover:bg-[#FAF9F5] disabled:opacity-50 transition-all font-medium"
          >
            Back
          </button>

          <div className="flex gap-3">
            {step < 2 ? (
              <button
                onClick={step === 1 ? handleCreateCampaign : () => setStep(step + 1)}
                disabled={saving || !name.trim() || !segmentId}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] disabled:opacity-50 transition-all font-medium shadow-sm"
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
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] transition-all font-medium shadow-sm"
              >
                Review
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#7A8B6F] text-white rounded-xl hover:bg-[#6B7C60] disabled:opacity-50 transition-all font-medium shadow-sm"
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
