import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    tag: 'AI REASONING',
    title: 'Offer Ladders',
    body: 'Calculates the optimal discount or perk step-down to maximize conversion while protecting margin.',
  },
  {
    tag: 'SEGMENT PREVIEW',
    title: 'Instant Counts',
    body: 'See how many customers match rules before creating segments, powered by unified query logic.',
  },
  {
    tag: 'CALLBACK PROOF',
    title: 'Send Monitor',
    body: 'Track queued, sent, and delivered receipts with real-time status updates.',
  },
  {
    tag: 'LEARNING LOOP',
    title: 'Performance Stats',
    body: 'Closes the loop with conversion results and attribution instead of stopping at message copy.',
  },
];

const STATS = [
  { value: '200', label: 'CUSTOMERS' },
  { value: '800', label: 'ORDERS' },
  { value: '4', label: 'SEGMENTS' },
];

export default function LandingPage() {
  const [pressed, setPressed] = useState(false);

  return (
    <main
      className="min-h-screen w-full select-none"
      style={{ backgroundColor: '#FAF9F5', fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-[#E8E6DE]">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: 'monospace', color: '#1F1E1D' }}
          >
            AURA
          </span>
        </div>
        <span
          className="text-xs font-bold tracking-[0.2em] uppercase"
          style={{ fontFamily: 'monospace', color: '#C96442' }}
        >
          D2C DEMO CRM
        </span>
      </nav>

      {/* Hero + feature grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 px-6 md:px-10 pb-10">

        {/* LEFT - headline + cta */}
        <div className="flex flex-col justify-center pr-0 lg:pr-16 pt-8 lg:pt-16 pb-10">
          {/* Tag */}
          <div
            className="inline-block self-start border px-3 py-1 text-xs font-bold tracking-[0.18em] uppercase mb-8"
            style={{ borderColor: '#1F1E1D', color: '#1F1E1D', fontFamily: 'monospace' }}
          >
            RETENTION ENGINE LIVE
          </div>

          {/* Headline */}
          <h1
            className="text-[clamp(44px,8vw,80px)] font-black leading-[0.92] tracking-tight mb-6"
            style={{ color: '#1F1E1D' }}
          >
            Retention<br />
            Reasoning<br />
            Engine
          </h1>

          {/* Subtext */}
          <p
            className="text-[15px] leading-relaxed mb-10 max-w-sm"
            style={{ color: '#6B6B6B', fontFamily: 'sans-serif' }}
          >
            Aura turns lapsed D2C customers into timed,&nbsp;
            <span className="font-semibold" style={{ color: '#C96442' }}>margin-aware plays</span> with AI reasoning,&nbsp;
            <span className="font-semibold" style={{ color: '#C96442' }}>personalized offer ladders</span>, delivery receipts,
            and an automated <span className="font-semibold" style={{ color: '#C96442' }}>feedback loop</span>.
          </p>

          {/* 3D Retro Tactile Button */}
          <div className="self-start">
            <Link
              to="/dashboard"
              onMouseDown={() => setPressed(true)}
              onMouseUp={() => setPressed(false)}
              onMouseLeave={() => setPressed(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                backgroundColor: '#C96442',
                color: '#FAF9F5',
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '13px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                padding: '14px 32px',
                border: '2px solid #A24B2D',
                borderRadius: '4px',
                cursor: 'pointer',
                userSelect: 'none',
                boxShadow: pressed
                  ? '1px 1px 0 #A24B2D, 2px 2px 0 #A24B2D'
                  : '4px 4px 0 #A24B2D, 8px 8px 0 rgba(162, 75, 45, 0.15)',
                transform: pressed ? 'translate(3px, 3px)' : 'translate(0, 0)',
                transition: 'box-shadow 80ms ease, transform 80ms ease',
                textDecoration: 'none',
              }}
            >
              Enter CRM Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* RIGHT - bento feature grid + milestone card */}
        <div className="flex flex-col gap-4 pt-8 lg:pt-16">

          {/* 2x2 feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.tag}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E6DE',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}
                className="hover:border-[#C96442]/30 transition-all duration-300"
              >
                <div
                  className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2"
                  style={{ color: '#C96442', fontFamily: 'monospace' }}
                >
                  {f.tag}
                </div>
                <div
                  className="text-[18px] font-bold leading-tight mb-2"
                  style={{ color: '#1F1E1D' }}
                >
                  {f.title}
                </div>
                <div
                  className="text-[13px] leading-relaxed"
                  style={{ color: '#6B6B6B', fontFamily: 'sans-serif', fontWeight: 400 }}
                >
                  {f.body}
                </div>
              </div>
            ))}
          </div>

          {/* Milestone card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8E6DE',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-[10px] font-bold tracking-[0.2em] uppercase"
                style={{ color: '#1F1E1D', fontFamily: 'monospace' }}
              >
                CRM ARCHITECTURE
              </div>
              <div
                style={{
                  backgroundColor: '#7A8B6F',
                  color: '#FAF9F5',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  padding: '3px 10px',
                  borderRadius: '6px',
                }}
              >
                STABLE
              </div>
            </div>
            <div
              className="text-[17px] font-bold mb-4 font-serif text-[#1F1E1D]"
            >
              Unified Customer-Order Attribution Loop
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#E8E6DE] pt-4">
              {[
                '1. Dynamic segmentation rules',
                '2. Delivery status simulations',
                '3. ROI metric attribution loop',
              ].map((step, i) => (
                <div key={i} className="text-[13px]" style={{ fontFamily: 'sans-serif' }}>
                  <span className="font-bold" style={{ color: '#C96442' }}>{step.split('.')[0]}.</span>
                  <span style={{ color: '#6B6B6B' }}>{step.split('.').slice(1).join('.')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 md:mx-10 border-t border-[#E8E6DE]" />

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-[#E8E6DE] divide-y md:divide-y-0 md:divide-x">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="py-8 flex flex-col items-center justify-center bg-white md:bg-transparent"
          >
            <span
              className="text-[48px] font-bold leading-none font-serif"
              style={{ color: '#C96442' }}
            >
              {s.value}
            </span>
            <span
              className="text-[10px] font-bold tracking-[0.22em] uppercase mt-2"
              style={{ color: '#6B6B6B', fontFamily: 'monospace' }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
