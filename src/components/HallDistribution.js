'use client';

import { useRef, useCallback } from 'react';

export const STEPS = 60;
// 設定1〜6：青・水色・緑・黄色・オレンジ・赤
export const S_COLORS = ['#1f5fd6', '#22a6e0', '#2e9e4f', '#e0b000', '#f07a1a', '#d81b2c'];

export const PRESETS = [
  { name: '設定均等', w: [10, 10, 10, 10, 10, 10] },
  { name: '通常営業', w: [16, 15, 12, 10, 4, 3] },
  { name: '悪質営業', w: [25, 15, 10, 6, 3, 1] },
  { name: '小イベント', w: [15, 10, 10, 10, 9, 6] },
  { name: '大イベント', w: [5, 5, 5, 10, 20, 15] },
];
export const DEFAULT_WEIGHTS = PRESETS[0].w;

export const fraction = (k) => `${k}/${STEPS}`;
// 26.666… → 26.7、10 → 10
export const percent = (k) => `${Number(((k / STEPS) * 100).toFixed(1))}%`;

export function presetName(w) {
  const p = PRESETS.find(p => p.w.every((v, i) => v === w[i]));
  return p ? p.name : 'カスタム';
}

// 6つの割合 ⇔ 5つのつまみの位置（累積和）
const toHandles = w => w.slice(0, 5).reduce((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []);
const toWeights = h => [h[0], ...h.slice(1).map((v, i) => v - h[i]), STEPS - h[4]];

export default function HallDistribution({ weights, onChange }) {
  const trackRef = useRef(null);
  const handles = toHandles(weights);

  const moveHandle = useCallback((idx, pos) => {
    const h = toHandles(weights);
    const min = idx === 0 ? 0 : h[idx - 1];
    const max = idx === 4 ? STEPS : h[idx + 1];
    const next = Math.max(min, Math.min(max, pos));
    if (next === h[idx]) return;
    h[idx] = next;
    onChange(toWeights(h));
  }, [weights, onChange]);

  const posFromEvent = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    return Math.round(((e.clientX - rect.left) / rect.width) * STEPS);
  };

  const startDrag = (idx) => (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    // 同じ位置につまみが重なっているときは、引っ張った方向で動かすつまみを決める
    const start = handles[idx];
    const stacked = handles.map((h, i) => (h === start ? i : -1)).filter(i => i >= 0);
    let target = stacked.length > 1 ? null : idx;
    const onMove = (ev) => {
      const pos = posFromEvent(ev);
      if (target === null) {
        if (pos === start) return;
        target = pos < start ? stacked[0] : stacked[stacked.length - 1];
      }
      moveHandle(target, pos);
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  };

  const onKey = (idx) => (e) => {
    const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (d) { e.preventDefault(); moveHandle(idx, handles[idx] + d); }
  };

  const current = presetName(weights);

  return (
    <div className="hall-dist">
      <div className="hall-presets">
        {PRESETS.map(p => (
          <button
            key={p.name}
            type="button"
            className={`hall-preset ${current === p.name ? 'active' : ''}`}
            onClick={() => onChange([...p.w])}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="hall-labels">
        {weights.map((w, i) => (
          <div key={i} className="hall-label" style={{ color: S_COLORS[i] }}>
            <span className="hall-label-s">設定{i + 1}</span>
            <span className="hall-label-f">{fraction(w)}</span>
            <span className="hall-label-p">（{percent(w)}）</span>
          </div>
        ))}
      </div>

      <div className="hall-track" ref={trackRef}>
        {weights.map((w, i) => (
          <div key={i} className="hall-seg" style={{ width: `${(w / STEPS) * 100}%`, background: S_COLORS[i] }} />
        ))}
        {handles.map((h, i) => (
          <button
            key={i}
            type="button"
            className="hall-handle"
            style={{ left: `${(h / STEPS) * 100}%` }}
            onPointerDown={startDrag(i)}
            onKeyDown={onKey(i)}
            role="slider"
            aria-label={`設定${i + 1}と設定${i + 2}の境目`}
            aria-valuemin={0}
            aria-valuemax={STEPS}
            aria-valuenow={h}
          />
        ))}
      </div>
      <div className="hall-scale"><span>0</span><span>60</span></div>
    </div>
  );
}
