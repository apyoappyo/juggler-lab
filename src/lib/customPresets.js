'use client';
import { useState, useEffect, useCallback } from 'react';

// 自分で作るプリセット（プリセット1・2）。このブラウザの中だけに保存する
const KEY = 'juggler-lab:hall-presets:v1';
const SLOTS = 2;
const TOTAL = 60;

const valid = (w) =>
  Array.isArray(w) && w.length === 6 &&
  w.every(v => Number.isInteger(v) && v >= 0) &&
  w.reduce((a, b) => a + b, 0) === TOTAL;

export function useCustomPresets() {
  const [slots, setSlots] = useState(Array(SLOTS).fill(null));

  // ページを開いたときに読み込む（読めない・壊れていても空のまま動く）
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (Array.isArray(saved)) {
        setSlots(Array.from({ length: SLOTS }, (_, i) => (valid(saved[i]) ? saved[i] : null)));
      }
    } catch { /* プライベートモード等で使えないときは保存なしで動く */ }
  }, []);

  const save = useCallback((slot, weights) => {
    setSlots(prev => {
      const next = prev.map((w, i) => (i === slot ? [...weights] : w));
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* 保存できなくても画面上は反映 */ }
      return next;
    });
  }, []);

  return [slots, save];
}
