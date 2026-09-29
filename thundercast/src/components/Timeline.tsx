// ─── Nowcast timeline: Now, +15, +30, +45, +60, +120 with radar thumbnails
import React, { useEffect, useRef } from 'react';
import type { RadarFrame } from '../types';
import { dbzColor } from '../utils/format';

export const TIMELINE_STEPS = [0, 15, 30, 45, 60, 120];
const stepLabel = (t: number) => (t === 0 ? 'NOW' : `+${t}m`);

function Thumb({ frame }: { frame: RadarFrame }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const n = frame.grid.length;
    cv.width = n; cv.height = n;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, n, n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const v = frame.grid[r][c];
      if (v < 6) continue;
      ctx.fillStyle = dbzColor(v);
      ctx.fillRect(c, r, 1.2, 1.2);
    }
  }, [frame]);
  return <canvas ref={ref} />;
}

interface Props {
  frames: RadarFrame[];
  selected: number;
  onSelect: (t: number) => void;
  steps?: number[];
}

export default function Timeline({ frames, selected, onSelect, steps = TIMELINE_STEPS }: Props) {
  return (
    <div className="tl-strip">
      {steps.map((t) => {
        const f = frames.find((fr) => fr.t === t);
        return (
          <div key={t} className={`tl-frame ${selected === t ? 'sel' : ''}`} onClick={() => onSelect(t)} title={`Forecast ${stepLabel(t)}`}>
            {f ? <Thumb frame={f} /> : <div style={{ aspectRatio: '1.15' }} />}
            <div className="lab">{stepLabel(t)}</div>
          </div>
        );
      })}
    </div>
  );
}
