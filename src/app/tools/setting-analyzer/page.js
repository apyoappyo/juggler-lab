'use client';

import { useState, useCallback } from 'react';
import { MACHINES } from '@/data/machines';

// ============================================================
// ベイズ推定ロジック
// ============================================================
function logFactorial(n) {
  if (n <= 1) return 0;
  let r = 0;
  for (let i = 2; i <= n; i++) r += Math.log(i);
  return r;
}

function logBinomialPMF(k, n, p) {
  if (p <= 0) return k === 0 ? 0 : -Infinity;
  if (p >= 1) return k === n ? 0 : -Infinity;
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k)
    + k * Math.log(p) + (n - k) * Math.log(1 - p);
}

function analyze(totalG, bigCount, regCount, hamaris, machineKey) {
  const m = MACHINES[machineKey];
  const logPrior = Math.log(1 / 6);
  const logLikelihoods = [];

  for (let s = 0; s < 6; s++) {
    const pBig = m.big[s];
    const pReg = m.reg[s];
    const pBonus = pBig + pReg;
    const logLBig = logBinomialPMF(bigCount, totalG, pBig);
    const logLReg = logBinomialPMF(regCount, totalG, pReg);
    let logLHamari = 0;
    for (const g of hamaris) {
      logLHamari += g * Math.log(1 - pBonus);
    }
    logLikelihoods.push(logPrior + logLBig + logLReg + logLHamari);
  }

  const maxLL = Math.max(...logLikelihoods);
  const exps = logLikelihoods.map(ll => Math.exp(ll - maxLL));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / total);
}

// ============================================================
// バーの色
// ============================================================
const BAR_COLORS = [
  '#6060a0', '#7070b0', '#50a080',
  '#ddaa00', '#ff8844', '#00ff88',
];
const LABEL_COLORS = [
  '#9090b0', '#a0a0c0', '#80c0a0',
  '#ddaa00', '#ff8844', '#00ff88',
];

// ============================================================
// コンポーネント
// ============================================================
export default function SettingAnalyzer() {
  const [machine, setMachine] = useState('fanky2');
  const [totalG, setTotalG] = useState('');
  const [bigCount, setBigCount] = useState('');
  const [regCount, setRegCount] = useState('');
  const [hamaris, setHamaris] = useState([]);
  const [hamariInput, setHamariInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState(null);

  const machineKeys = Object.keys(MACHINES);

  const addHamari = useCallback(() => {
    const val = parseInt(hamariInput);
    if (!val || val < 1) return;
    setHamaris(prev => [...prev, val]);
    setHamariInput('');
    setShowModal(false);
  }, [hamariInput]);

  const removeHamari = useCallback((i) => {
    setHamaris(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const runAnalysis = useCallback(() => {
    const g = parseInt(totalG) || 0;
    const b = parseInt(bigCount) || 0;
    const r = parseInt(regCount) || 0;
    if (g < 100 || b + r === 0) {
      alert('総ゲーム数とボーナス回数を入力してください');
      return;
    }
    const posteriors = analyze(g, b, r, hamaris, machine);
    setResults({ posteriors, totalG: g, bigCount: b, regCount: r });
  }, [totalG, bigCount, regCount, hamaris, machine]);

  const maxProb = results ? Math.max(...results.posteriors) : 0;
  const highProb = results ? results.posteriors[3] + results.posteriors[4] + results.posteriors[5] : 0;
  const lowProb = results ? results.posteriors[0] + results.posteriors[1] + results.posteriors[2] : 0;

  return (
    <>
      <div className="page-header">
        <h1>設定判別ツール</h1>
        <p>ベイズ推定 × ハマり尤度</p>
      </div>

      {/* 機種選択 */}
      <div className="section-label">機種選択</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px', marginBottom: '20px'
      }}>
        {machineKeys.map(key => (
          <button
            key={key}
            onClick={() => setMachine(key)}
            style={{
              background: machine === key ? 'var(--green-glow)' : 'var(--surface)',
              border: `1px solid ${machine === key ? 'var(--green)' : 'var(--border)'}`,
              color: machine === key ? 'var(--green)' : 'var(--muted)',
              padding: '10px 6px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
              lineHeight: 1.4,
              transition: 'all 0.15s',
            }}
          >
            {MACHINES[key].short}
          </button>
        ))}
      </div>

      <hr className="divider" />

      {/* 基本データ */}
      <div className="section-label">基本データ</div>
      <div className="input-row">
        <div className="input-group">
          <label>総ゲーム数</label>
          <input
            type="number" placeholder="3000" min="0"
            value={totalG} onChange={e => setTotalG(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>BIG回数</label>
          <input
            type="number" placeholder="10" min="0"
            value={bigCount} onChange={e => setBigCount(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>REG回数</label>
          <input
            type="number" placeholder="8" min="0"
            value={regCount} onChange={e => setRegCount(e.target.value)}
          />
        </div>
      </div>

      <hr className="divider" />

      {/* ハマり */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="section-label" style={{ marginBottom: 0 }}>ハマりゲーム数</div>
          <button className="btn-ghost" onClick={() => setShowModal(true)}>＋ 追加</button>
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          minHeight: '38px', padding: '8px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px',
        }}>
          {hamaris.length === 0 ? (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', width: '100%', textAlign: 'center', alignSelf: 'center' }}>
              ハマりを追加してください（任意）
            </span>
          ) : (
            hamaris.map((g, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)',
                borderRadius: '4px', padding: '4px 10px',
                fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--amber)',
              }}>
                {g}G
                <button
                  onClick={() => removeHamari(i)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                >×</button>
              </div>
            ))
          )}
        </div>
      </div>

      <button className="btn-primary" onClick={runAnalysis}>判　別　開　始</button>

      {/* 結果 */}
      {results && (
        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '0.85rem', color: 'var(--white)', letterSpacing: '0.1em' }}>設定別 事後確率</h2>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--muted)' }}>
              BIG 1/{Math.round(results.totalG / (results.bigCount || 1))} / REG 1/{Math.round(results.totalG / (results.regCount || 1))}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.posteriors.map((p, i) => {
              const pct = Math.round(p * 100);
              const barWidth = Math.round(p / maxProb * 100);
              const isTop = p === maxProb;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 'bold', color: LABEL_COLORS[i] }}>
                      設定{i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 'bold', color: LABEL_COLORS[i] }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: '10px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      width: `${barWidth}%`,
                      background: i >= 4 ? `linear-gradient(90deg, ${BAR_COLORS[i]}88, ${BAR_COLORS[i]})` : BAR_COLORS[i],
                      boxShadow: isTop ? `0 0 8px ${BAR_COLORS[i]}88` : 'none',
                      transition: 'width 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 判定 */}
          <div style={{
            marginTop: '24px', padding: '14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', borderLeft: '3px solid var(--green)',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: '6px', textTransform: 'uppercase' }}>
              判定
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--white)', lineHeight: 1.6 }}>
              {highProb > 0.65 ? (
                <>高設定（4〜6）の合算確率は <strong style={{ color: 'var(--green)' }}>{Math.round(highProb * 100)}%</strong>。設定{results.posteriors.indexOf(maxProb) + 1}が最有力です。</>
              ) : lowProb > 0.65 ? (
                <>低設定（1〜3）の合算確率は <strong style={{ color: '#9090b0' }}>{Math.round(lowProb * 100)}%</strong>。設定{results.posteriors.indexOf(maxProb) + 1}が最有力です。</>
              ) : (
                <>データが拮抗しており断定困難。最有力は設定{results.posteriors.indexOf(maxProb) + 1}（{Math.round(maxProb * 100)}%）ですが、根拠は薄いです。</>
              )}
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              ※ サンプル数が少ない場合、結果の信頼性は低くなります
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            background: '#16161f', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px',
            width: 'min(360px, calc(100vw - 32px))',
          }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--white)', marginBottom: '16px' }}>
              ハマりゲーム数を入力
            </h3>
            <input
              type="number" placeholder="350" min="1"
              value={hamariInput}
              onChange={e => setHamariInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addHamari(); }}
              autoFocus
              style={{
                width: '100%', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: '6px',
                color: 'var(--white)', fontFamily: 'var(--mono)',
                fontSize: '1.4rem', padding: '12px', textAlign: 'center',
                outline: 'none', marginBottom: '14px',
              }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '14px', textAlign: 'center' }}>
              100G以上のハマりを目安に入力
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--muted)', padding: '10px', borderRadius: '6px',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.85rem',
                }}
              >キャンセル</button>
              <button
                onClick={addHamari}
                style={{
                  background: 'var(--green)', border: 'none',
                  color: '#001a0d', padding: '10px', borderRadius: '6px',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '0.85rem',
                }}
              >追　加</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
