import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X, Sparkles } from 'lucide-react';
import { chatApi, segmentsApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import type { ChatAction, FilterRules } from '../types';

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}

const STARTER_PROMPTS = [
  'Who should I target for a re-engagement campaign?',
  'Draft a WhatsApp message for high-value customers',
  'How did my last campaign perform?',
  "Find customers who haven't ordered in 60 days",
];

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-md w-fit">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

function ActionButtons({
  actions,
  onCreateSegment,
  onCreateCampaign,
}: {
  actions: ChatAction[];
  onCreateSegment: (action: ChatAction) => void;
  onCreateCampaign: (action: ChatAction) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, idx) => {
        if (action.type === 'create_segment') {
          return (
            <button
              key={idx}
              onClick={() => onCreateSegment(action)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300 transition-colors shadow-sm"
            >
              Create this segment →
            </button>
          );
        }
        if (action.type === 'create_campaign') {
          return (
            <button
              key={idx}
              onClick={() => onCreateCampaign(action)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-sm"
            >
              Set up this campaign →
            </button>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chatApi.send(trimmed, conversationHistory);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
          actions: response.actions?.length ? response.actions : undefined,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSegment = async (action: ChatAction) => {
    if (!action.filter_rules) {
      showToast('Missing segment filter rules', 'error');
      return;
    }

    try {
      await segmentsApi.create({
        name: action.segment_name || 'AI Suggested Segment',
        description: action.segment_description,
        filter_rules: action.filter_rules as FilterRules,
      });
      showToast('Segment created successfully');
      setIsOpen(false);
      navigate('/segments');
    } catch {
      showToast('Failed to create segment', 'error');
    }
  };

  const handleCreateCampaign = (action: ChatAction) => {
    setIsOpen(false);
    navigate('/campaigns', {
      state: {
        prefillCampaign: {
          segment_name: action.segment_name,
          channel: action.channel || 'whatsapp',
          message: action.message || '',
          name: action.segment_name ? `${action.segment_name} Campaign` : '',
        },
      },
    });
  };

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        className={`fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/25'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Panel backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Side panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-[58] w-[380px] max-w-[100vw] bg-white border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-sm tracking-tight">AI Assistant</h2>
              <p className="text-xs text-slate-500 font-medium">Aura AI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-slate-900 p-1.5 hover:bg-slate-200 rounded-lg transition-all"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {messages.length === 0 && !isLoading && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 text-center pt-2 pb-2">
                Ask me about segments, campaigns, or performance.
              </p>
              <div className="flex flex-col gap-2.5">
                {STARTER_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-sm px-4 py-3 rounded-xl bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-md'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                <div className="max-w-[85%] mt-2">
                  <ActionButtons
                    actions={msg.actions}
                    onCreateSegment={handleCreateSegment}
                    onCreateCampaign={handleCreateCampaign}
                  />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <ThinkingDots />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 shrink-0 bg-white">
          <div className="flex gap-2">
            <label htmlFor="ai-chat-input" className="sr-only">Message AI Assistant</label>
            <input
              id="ai-chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3 font-medium uppercase tracking-widest">Powered by Gemini</p>
        </div>
      </aside>
    </>
  );
}
