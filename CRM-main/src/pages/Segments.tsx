import { useState, useEffect } from 'react';
import { Plus, Target, Users, Sparkles, X, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { segmentsApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import type { Segment, FilterRules } from '../types';

const PAGE_SIZE = 20;

export default function Segments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [totalSegments, setTotalSegments] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadSegments();
  }, [page]);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const result = await segmentsApi.list({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setSegments(result.segments || []);
      setTotalSegments(result.total || 0);
    } catch (err) {
      console.error('Failed to load segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await segmentsApi.delete(id);
      showToast('Segment deleted');
      loadSegments();
    } catch (err) {
      showToast('Failed to delete segment', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalSegments / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1F1E1D] tracking-tight">Segments</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] hover:shadow-lg hover:shadow-[#C96442]/20 transition-all duration-300 font-medium"
        >
          <Plus className="w-5 h-5" />
          New Segment
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C96442]" />
        </div>
      ) : segments.length === 0 ? (
        <div className="bg-white border border-[#E8E6DE] shadow-sm rounded-2xl p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#C96442]/10 flex items-center justify-center mx-auto mb-6 border border-[#C96442]/20">
            <Target className="w-10 h-10 text-[#C96442]" />
          </div>
          <h3 className="text-xl font-bold text-[#1F1E1D] mb-3">No segments yet</h3>
          <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto">
            Create segments to group customers for targeted campaigns based on their spending and behavior.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] hover:shadow-lg hover:shadow-[#C96442]/20 transition-all duration-300 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create First Segment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map(segment => (
              <div
                key={segment.id}
                className="bg-white border border-[#E8E6DE] shadow-sm rounded-2xl p-6 relative group hover:border-[#C96442]/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#7A8B6F]/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-[#7A8B6F]" />
                    </div>
                    <div>
                      <h3 className="text-[#1F1E1D] font-bold tracking-tight text-lg">{segment.name}</h3>
                      <p className="text-xs text-[#6B6B6B] font-medium tracking-wider uppercase mt-0.5">
                        {segment.created_by === 'ai' ? 'AI-assisted' : 'Manual'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(segment.id)}
                    className="text-[#6B6B6B] hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                    aria-label={`Delete segment ${segment.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {segment.description && (
                  <p className="text-[#6B6B6B] text-sm mb-5 leading-relaxed">{segment.description}</p>
                )}

                <div className="flex items-center gap-2 mb-5 text-sm font-medium">
                  <div className="flex items-center gap-1.5 text-[#C96442] bg-[#C96442]/10 px-3 py-1.5 rounded-lg border border-[#C96442]/20">
                    <Users className="w-4 h-4 text-[#C96442]" />
                    <span>{segment.customer_count} matched</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {segment.filter_rules?.min_spend !== undefined && (
                    <span className="px-2.5 py-1 text-xs bg-[#FAF9F5] border border-[#E8E6DE] text-[#6B6B6B] rounded-full">
                    Min ₹{segment.filter_rules.min_spend}
                  </span>
                )}
                  {segment.filter_rules?.max_spend !== undefined && (
                    <span className="px-2.5 py-1 text-xs bg-[#FAF9F5] border border-[#E8E6DE] text-[#6B6B6B] rounded-full">
                      Max ₹{segment.filter_rules.max_spend}
                    </span>
                  )}
                  {segment.filter_rules?.last_order_before_days !== undefined && (
                    <span className="px-2.5 py-1 text-xs bg-[#FAF9F5] border border-[#E8E6DE] text-[#6B6B6B] rounded-full">
                      Idle {segment.filter_rules.last_order_before_days}+ days
                    </span>
                  )}
                  {segment.filter_rules?.cities && segment.filter_rules.cities.length > 0 && (
                    <span className="px-2.5 py-1 text-xs bg-[#FAF9F5] border border-[#E8E6DE] text-[#6B6B6B] rounded-full">
                      {segment.filter_rules.cities.join(', ')}
                    </span>
                  )}
                  {segment.filter_rules?.tags && segment.filter_rules.tags.length > 0 && (
                    <span className="px-2.5 py-1 text-xs bg-[#FAF9F5] border border-[#E8E6DE] text-[#6B6B6B] rounded-full">
                      {segment.filter_rules.tags.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalSegments > PAGE_SIZE && (
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
        <CreateSegmentModal onClose={() => setShowModal(false)} onCreated={loadSegments} />
      )}
    </div>
  );
}

function CreateSegmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const { showToast } = useToast();

  const [rules, setRules] = useState<FilterRules>({});
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;

    setPreviewCount(null);
    setAiLoading(true);
    try {
      const result = await segmentsApi.aiSuggest(aiPrompt);
      setRules(result.filter_rules);
      if (result.segment_name && !name) setName(result.segment_name);
      if (result.segment_description && !description) setDescription(result.segment_description);
      if (result.preview_count !== undefined) setPreviewCount(result.preview_count);
    } catch (err) {
      showToast('Failed to generate segment rules', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Segment name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      await segmentsApi.create({
        name,
        description,
        filter_rules: rules,
      });
      showToast('Segment created successfully');
      onClose();
      onCreated();
    } catch (err) {
      showToast('Failed to create segment', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1F1E1D]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Create segment" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-[#E8E6DE]">
        <div className="flex items-center justify-between p-6 border-b border-[#E8E6DE]">
          <h2 className="text-xl font-bold text-[#1F1E1D] tracking-tight">Create Segment</h2>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#1F1E1D] transition-colors" aria-label="Close create segment dialog">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Mode Toggle */}
          <div className="flex bg-[#FAF9F5] rounded-xl p-1 border border-[#E8E6DE]">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'manual'
                  ? 'bg-white text-[#1F1E1D] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#1F1E1D]'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'ai'
                  ? 'bg-[#C96442]/10 text-[#C96442] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#1F1E1D]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI-Assisted
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Segment Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., High Value Customers"
              className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
            />
          </div>

          {mode === 'ai' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Describe your segment</label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g., Customers who haven't purchased in 60 days and spent over ₹5000"
                  className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] h-28 resize-none transition-all"
                />
              </div>
              <button
                onClick={handleAiSuggest}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#C96442]/10 text-[#C96442] rounded-xl hover:bg-[#C96442]/15 disabled:opacity-50 transition-all font-medium"
              >
                {aiLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Generate Rules with AI
              </button>
              {previewCount !== null && (
                <p className="text-sm text-[#6B6B6B] text-center bg-[#FAF9F5] py-2 rounded-lg border border-[#E8E6DE]">
                  Matches <span className="text-[#C96442] font-bold mx-1">{previewCount}</span> customers
                </p>
              )}
            </div>
          ) : (
            <ManualRulesEditor rules={rules} onChange={setRules} />
          )}

          {/* Preview Rules */}
          {Object.keys(rules).length > 0 && (
            <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-[#6B6B6B] mb-3 font-medium uppercase tracking-widest">Active Filters</p>
              <div className="flex flex-wrap gap-2">
                {rules.min_spend !== undefined && (
                  <span className="px-3 py-1.5 text-xs bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-full">
                    Min Spend: ₹{rules.min_spend}
                  </span>
                )}
                {rules.max_spend !== undefined && (
                  <span className="px-3 py-1.5 text-xs bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-full">
                    Max Spend: ₹{rules.max_spend}
                  </span>
                )}
                {rules.min_orders !== undefined && (
                  <span className="px-3 py-1.5 text-xs bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-full">
                    Min Orders: {rules.min_orders}
                  </span>
                )}
                {rules.last_order_before_days !== undefined && (
                  <span className="px-3 py-1.5 text-xs bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-full">
                    Last Order: {rules.last_order_before_days}+ days ago
                  </span>
                )}
                {rules.cities && rules.cities.length > 0 && (
                  <span className="px-3 py-1.5 text-xs bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-full">
                    Cities: {rules.cities.join(', ')}
                  </span>
                )}
                {rules.tags && rules.tags.length > 0 && (
                  <span className="px-3 py-1.5 text-xs bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-full">
                    Tags: {rules.tags.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[#E8E6DE] bg-[#FAF9F5]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-[#E8E6DE] text-[#1F1E1D] rounded-xl hover:bg-[#FAF9F5] transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl hover:bg-[#B85638] disabled:opacity-50 shadow-sm transition-all font-medium"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Segment
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualRulesEditor({
  rules,
  onChange,
}: {
  rules: FilterRules;
  onChange: (rules: FilterRules) => void;
}) {
  const updateRule = (key: keyof FilterRules, value: any) => {
    onChange({ ...rules, [key]: value });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Min Spend (₹)</label>
          <input
            type="number"
            value={rules.min_spend || ''}
            onChange={e =>
              updateRule('min_spend', e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="0"
            className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Max Spend (₹)</label>
          <input
            type="number"
            value={rules.max_spend || ''}
            onChange={e =>
              updateRule('max_spend', e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="100000"
            className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Min Orders</label>
          <input
            type="number"
            value={rules.min_orders || ''}
            onChange={e =>
              updateRule('min_orders', e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="0"
            className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Idle Time (days+)</label>
          <input
            type="number"
            value={rules.last_order_before_days || ''}
            onChange={e =>
              updateRule(
                'last_order_before_days',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="30"
            className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Cities</label>
        <select
          multiple
          value={rules.cities || []}
          onChange={e => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            updateRule('cities', selected.length > 0 ? selected : undefined);
          }}
          className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] h-32 transition-all"
        >
          <option value="Mumbai" className="py-1">Mumbai</option>
          <option value="Delhi" className="py-1">Delhi</option>
          <option value="Bangalore" className="py-1">Bangalore</option>
          <option value="Chennai" className="py-1">Chennai</option>
          <option value="Hyderabad" className="py-1">Hyderabad</option>
          <option value="Pune" className="py-1">Pune</option>
          <option value="Kolkata" className="py-1">Kolkata</option>
        </select>
        <p className="text-xs text-[#6B6B6B] mt-2 text-right">Hold Ctrl/Cmd to select multiple</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1F1E1D] mb-2">Tags</label>
        <input
          type="text"
          value={(rules.tags || []).join(', ')}
          onChange={e => {
            const tags = e.target.value
              .split(',')
              .map(t => t.trim())
              .filter(Boolean);
            updateRule('tags', tags.length > 0 ? tags : undefined);
          }}
          placeholder="vip, loyal, high_value"
          className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-3 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
        />
      </div>
    </div>
  );
}
