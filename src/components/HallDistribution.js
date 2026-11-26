'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

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

const same = (a, b) => a && b && a.every((v, i) => v === b[i]);
export const customName = (i) => `プリセット${i + 1}`;

// 今の配分の名前。決まったプリセット → 自分のプリセット → カスタム の順で探す
export function presetName(w, custom = []) {
  const p = PRESETS.find(p => same(p.w, w));
  if (p) return p.name;
  const i = custom.findIndex(c => same(c, w));
  return i >= 0 ? customName(i) : 'カスタム';
}

// 6つの割合 ⇔ 5つのつまみの位置（累積和）
const toHandles = w => w.slice(0, 5).reduce((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []);
const toWeights = h => [h[0], ...h.slice(1).map((v, i) => v - h[i]), STEPS - h[4]];

export default function HallDistribution({ weights, onChange, custom = [], onSaveCustom }) {
  const trackRef = useRef(null);
  const handles = toHandles(weights);
  // ドラッグ中も常に最新の配分を参照する（古い値と比べると出発点に戻れなくなる）
  const latest = useRef(weights);
  useEffect(() => { latest.current = weights; }, [weights]);

  const moveHandle = useCallback((idx, pos) => {
    const h = toHandles(latest.current);
    const min = idx === 0 ? 0 : h[idx - 1];
    const max = idx === 4 ? STEPS : h[idx + 1];
    const next = Math.max(min, Math.min(max, pos));
    if (next === h[idx]) return;
    h[idx] = next;
    const w = toWeights(h);
    latest.current = w; // 次のpointermoveが再描画より先に来ても正しく比べられるように
    onChange(w);
  }, [onChange]);

  const posFromEvent = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    return Math.round(((e.clientX - rect.left) / rect.width) * STEPS);
  };

  // バーのどこを押しても「押した位置に一番近いつまみ」を掴む
  // （つまみ同士が近いと当たり判定が重なって、隣のつまみを掴んでしまうのを防ぐ）
  const startDrag = (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const start = posFromEvent(e);
    const exact = (e.clientX - trackRef.current.getBoundingClientRect().left) / trackRef.current.getBoundingClientRect().width * STEPS;
    const dist = handles.map(h => Math.abs(h - exact));
    const nearest = Math.min(...dist);
    const candidates = dist.map((d, i) => (d - nearest < 0.5 ? i : -1)).filter(i => i >= 0);
    // 候補が1つならすぐ決定。同じ位置に重なっているときは引っ張った方向で決める
    let target = candidates.length === 1 ? candidates[0] : null;
    if (target !== null) el.querySelectorAll('.hall-handle')[target]?.focus({ preventScroll: true });
    const onMove = (ev) => {
      const pos = posFromEvent(ev);
      if (target === null) {
        if (pos === start) return;
        target = pos < start ? candidates[0] : candidates[candidates.length - 1];
        el.querySelectorAll('.hall-handle')[target]?.focus({ preventScroll: true });
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

  const current = presetName(weights, custom);

  // 保存ボタン：空き or 同じ配分ならすぐ保存。別の配分が入っているときは2回押しで上書き
  const [saveState, setSaveState] = useState({}); // { [slot]: 'confirm' | 'done' }
  const timers = useRef({});
  const flash = (slot, state) => {
    clearTimeout(timers.current[slot]);
    setSaveState(s => ({ ...s, [slot]: state }));
    timers.current[slot] = setTimeout(() => setSaveState(s => ({ ...s, [slot]: undefined })), state === 'confirm' ? 3000 : 1500);
  };
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);
  const onSave = (slot) => {
    const existing = custom[slot];
    if (existing && !same(existing, weights) && saveState[slot] !== 'confirm') { flash(slot, 'confirm'); return; }
    onSaveCustom?.(slot, weights);
    flash(slot, 'done');
  };

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

      <div className="hall-mine">
        {custom.map((w, i) => {
          const st = saveState[i];
          return (
            <div key={i} className="hall-mine-item">
              <button
                type="button"
                className={`hall-preset ${same(w, weights) ? 'active' : ''}`}
                disabled={!w}
                onClick={() => w && onChange([...w])}
              >
                {customName(i)}{!w && <span className="hall-mine-empty">（未保存）</span>}
              </button>
              <button
                type="button"
                className={`hall-save ${st ?? ''}`}
                onClick={() => onSave(i)}
                aria-label={`今の配分を${customName(i)}に保存`}
              >
                {st === 'confirm' ? '上書きする？' : st === 'done' ? '保存しました ✓' : '保存'}
              </button>
            </div>
          );
        })}
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

      <div className="hall-hit" onPointerDown={startDrag}>
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
            onKeyDown={onKey(i)}
            role="slider"
            aria-label={`設定${i + 1}と設定${i + 2}の境目`}
            aria-valuemin={0}
            aria-valuemax={STEPS}
            aria-valuenow={h}
          />
        ))}
      </div>
      </div>
      <div className="hall-scale"><span>0</span><span>60</span></div>
    </div>
  );
}
