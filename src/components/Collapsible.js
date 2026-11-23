'use client';
import { useState, useId } from 'react';

// 任意入力用の開閉パネル。閉じていても中身の値は保持される
export default function Collapsible({ title, badge, badgeActive = false, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`collapsible ${open ? 'open' : ''}`}>
      <button type="button" className="collapsible-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
        <span className="collapsible-title">{title}</span>
        {badge && <span className={`collapsible-badge ${badgeActive ? 'active' : ''}`}>{badge}</span>}
        <span className="collapsible-chevron" aria-hidden="true" />
      </button>
      <div id={id} className="collapsible-body" hidden={!open}>{children}</div>
    </div>
  );
}
