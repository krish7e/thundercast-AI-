// ─── AI Insights & Recommendations card ──────────────────────────────────
import React from 'react';
import { BrainCircuit, AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { AI_INSIGHTS } from '../data/mockData';
import { pct } from '../utils/format';

const icons = { critical: AlertOctagon, warning: AlertTriangle, info: Info, success: CheckCircle2 };
const colors = { critical: 'var(--red)', warning: 'var(--orange)', info: 'var(--blue)', success: 'var(--green)' };

export default function AiInsights({ confidence }: { confidence: number }) {
  return (
    <div className="card fade-in">
      <div className="card-h">
        <div className="accent" style={{ background: 'linear-gradient(180deg,var(--purple),var(--cyan))' }} />
        <h3>AI Insights & Recommendations</h3>
        <BrainCircuit size={15} className="glow-purple" style={{ marginLeft: 4 }} />
      </div>
      <div className="card-body" style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          {AI_INSIGHTS.map((ins, i) => {
            const Icon = icons[ins.tone];
            return (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'rgba(13,22,46,.6)', border: '1px solid var(--stroke)', borderRadius: 10, padding: '8px 10px' }}>
                <Icon size={15} style={{ color: colors[ins.tone], marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>{ins.text}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 120 }}>
          <div className="conf-ring">
            <svg width="92" height="92">
              <circle cx="46" cy="46" r="38" fill="none" stroke="#16234a" strokeWidth="8" />
              <circle cx="46" cy="46" r="38" fill="none" stroke="url(#cg)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${confidence * 239} 239`} />
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="val glow-cyan">{pct(confidence)}</div>
          </div>
          <div className="metric-label">AI Confidence</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center' }}>ThunderCast-Net v3.2<br />ConvLSTM ensemble</div>
        </div>
      </div>
    </div>
  );
}
