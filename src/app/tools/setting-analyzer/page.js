'use client';

import { useState, useCallback } from 'react';
import { MACHINES, DENOM } from '@/data/machines';

// ============================================================
// ベイズ推定ロジック（65536分母ベース）
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

function analyze({ totalG, bigCount, regCount, grapeCount, hamaris, machineKey }) {
  const m = MACHINES[machineKey];
  const logPrior = Math.log(1 / 6);
  const logLikelihoods = [];

  for (let s = 0; s < 6; s++) {
    const pBig = m.big[s] / DENOM;
    const pReg = m.reg[s] / DENOM;
    const pBonus = pBig + pReg;

    // BIG尤度
    const logLBig = logBinomialPMF(bigCount, totalG, pBig);
    // REG尤度
    const logLReg = logBinomialPMF(regCount, totalG, pReg);

    // ぶどう尤度（データがある設定のみ）
    let logLGrape = 0;
    if (grapeCount > 0 && m.grape[s] !== null) {
      const pGrape = m.grape[s] / DENOM;
      // ぶどうが落ちた回数 = grapeCount
      // ぶどうの試行回数 ≈ 総G数 - ボーナス中G数
      // ボーナス中は約25G×(BIG+REG)回分を除外
      const trialG = Math.max(totalG - (bigCount + regCount) * 25, totalG * 0.8);
      logLGrape = logBinomialPMF(grapeCount, Math.round(trialG), pGrape);
    }

    // ハマり尤度
    let logLHamari = 0;
    for (const g of hamaris) {
      logLHamari += g * Math.log(1 - pBonus);
    }

    logLikelihoods.push(logPrior + logLBig + logLReg + logLGrape + logLHamari);
  }

  // log-sum-exp
  const maxLL = Math.max(...logLikelihoods);
  const exps = logLikelihoods.map(ll => Math.exp(ll - maxLL));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / total);
}

// ============================================================
// バー色
// ============================================================
const BAR_COLORS = ['#6060a0', '#7070b0', '#50a080', '#ddaa00', '#ff8844', '#00ff88'];
const LABEL_COLORS = ['#9090b0', '#a0a0c0', '#80c0a0', '#ddaa00', '#ff8844', '#00ff88'];

// ============================================================
// コンポーネント
// ============================================================
export default function SettingAnalyzer() {
  const [machine, setMachine] = useState('myjug');
  const [totalG, setTotalG] = useState('');
  const [bigCount, setBigCount] = useState('');
  const [regCount, setRegCount] = useState('');
  const [grapeCount, setGrapeCount] = useState('');
  const [hamaris, setHamaris] = useState([]);
  const [hamariInput, setHamariInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState(null);

  const machineKeys = Object.keys(MACHINES);
  const currentMachine = MACHINES[machine];
  const hasGrape = currentMachine.grape.some(v => v !== null);

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
    const gr = parseInt(grapeCount) || 0;
    if (g < 100 || b + r === 0) {
      alert('総ゲーム数とボーナス回数を入力してください');
      return;
    }
    const posteriors = analyze({
      totalG: g, bigCount: b, regCount: r, grapeCount: gr,
      hamaris, machineKey: machine
    });
    setResults({ posteriors, totalG: g, bigCount: b, regCount: r, grapeCount: gr });
  }, [totalG, bigCount, regCount, grapeCount, hamaris, machine]);

  const maxProb = results ? Math.max(...results.posteriors) : 0;
  const highProb = results ? results.posteriors[3] + results.posteriors[4] + results.posteriors[5] : 0;
  const lowProb = results ? results.posteriors[0] + results.posteriors[1] + results.posteriors[2] : 0;

  // 理論値表示用
  const fmtRate = (rand) => `1/${(DENOM / rand).toFixed(1)}`;

  return (
    <>
      <div className="page-header">
        <h1>設定判別ツール</h1>
        <p>ベイズ推定 × 65536分母 × ぶどう確率</p>
      </div>

      {/* 機種選択 */}
      <div className="section-label">機種選択</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px', marginBottom: '20px'
      }}>
        {machineKeys.map(key => (
          <button
            key={key}
            onClick={() => { setMachine(key); setResults(null); }}
            style={{
              background: machine === key ? 'var(--green-glow)' : 'var(--surface)',
              border: `1px solid ${machine === key ? 'var(--green)' : 'var(--border)'}`,
              color: machine === key ? 'var(--green)' : 'var(--muted)',
              padding: '8px 4px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
              lineHeight: 1.3,
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
          <input type="number" placeholder="3000" min="0"
            value={totalG} onChange={e => setTotalG(e.target.value)} />
        </div>
        <div className="input-group">
          <label>BIG回数</label>
          <input type="number" placeholder="10" min="0"
            value={bigCount} onChange={e => setBigCount(e.target.value)} />
        </div>
        <div className="input-group">
          <label>REG回数</label>
          <input type="number" placeholder="8" min="0"
            value={regCount} onChange={e => setRegCount(e.target.value)} />
        </div>
      </div>

      {/* ぶどうカウント */}
      {hasGrape && (
        <>
          <div className="section-label">ぶどうカウント（任意）</div>
          <div style={{ marginBottom: '20px' }}>
            <div className="input-group" style={{ maxWidth: '200px' }}>
              <label>ぶどう回数</label>
              <input type="number" placeholder="500" min="0"
                value={grapeCount} onChange={e => setGrapeCount(e.target.value)} />
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '6px' }}>
              ぶどう確率は設定差が大きい重要要素です
            </div>
          </div>
        </>
      )}

      <hr className="divider" />

      {/* ハマり */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="section-label" style={{ marginBottom: 0 }}>ハマりゲーム数（任意）</div>
          <button className="btn-ghost" onClick={() => setShowModal(true)}>＋ 追加</button>
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          minHeight: '38px', padding: '8px',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px',
        }}>
          {hamaris.length === 0 ? (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', width: '100%', textAlign: 'center', alignSelf: 'center' }}>
              大きなハマりがあれば追加（判別への影響は小さめ）
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
                <button onClick={() => removeHamari(i)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                >×</button>
              </div>
            ))
          )}
        </div>
      </div>

      <button className="btn-primary" onClick={runAnalysis} style={{ marginBottom: '28px' }}>判　別　開　始</button>

      {/* 結果 */}
      {results && (() => {
        const m = MACHINES[machine];
        const maxIdx = results.posteriors.indexOf(maxProb);
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '0.85rem', color: 'var(--white)', letterSpacing: '0.1em' }}>設定別 事後確率</h2>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--muted)' }}>
                BIG 1/{Math.round(results.totalG / (results.bigCount || 1))} / REG 1/{Math.round(results.totalG / (results.regCount || 1))}
                {results.grapeCount > 0 && ` / ぶどう 1/${(results.totalG / results.grapeCount).toFixed(2)}`}
              </span>
            </div>

            {/* バーチャート */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.posteriors.map((p, i) => {
                const pct = (p * 100);
                const barWidth = Math.round(p / maxProb * 100);
                const isTop = i === maxIdx;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 'bold', color: LABEL_COLORS[i] }}>
                        設定{i + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>
                          BIG {fmtRate(m.big[i])} / REG {fmtRate(m.reg[i])}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 'bold', color: LABEL_COLORS[i] }}>
                          {pct < 0.1 ? pct.toFixed(2) : pct < 1 ? pct.toFixed(1) : Math.round(pct)}%
                        </span>
                      </div>
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
                  <>高設定（4〜6）の合算 <strong style={{ color: 'var(--green)' }}>{Math.round(highProb * 100)}%</strong> — 設定{maxIdx + 1}が最有力</>
                ) : lowProb > 0.65 ? (
                  <>低設定（1〜3）の合算 <strong style={{ color: '#9090b0' }}>{Math.round(lowProb * 100)}%</strong> — 設定{maxIdx + 1}が最有力</>
                ) : (
                  <>判別困難 — 最有力は設定{maxIdx + 1}（{Math.round(maxProb * 100)}%）だがデータ不足</>
                )}
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {results.totalG < 2000 && '⚠ 2000G未満のため信頼性は低めです。'}
                {results.totalG >= 2000 && results.totalG < 5000 && 'ℹ ある程度の傾向は見えますが確定的ではありません。'}
                {results.totalG >= 5000 && '✓ 十分なサンプル数です。'}
                {results.grapeCount > 0 && ' ぶどう確率を判別に反映済み。'}
                {hamaris.length > 0 && ` ハマり${hamaris.length}回の情報を反映済み。`}
              </div>
            </div>

            {/* 理論値テーブル */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: '8px', textTransform: 'uppercase' }}>
                {currentMachine.name} 理論値
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontFamily: 'var(--mono)', fontSize: '0.72rem',
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--muted)' }}>設定</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--muted)' }}>BIG</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--muted)' }}>REG</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--muted)' }}>合成</th>
                      {hasGrape && <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--muted)' }}>ぶどう</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {[0,1,2,3,4,5].map(i => (
                      <tr key={i} style={{
                        borderBottom: '1px solid var(--border)',
                        background: i === maxIdx && results ? 'var(--green-glow)' : 'transparent',
                      }}>
                        <td style={{ padding: '6px 8px', color: LABEL_COLORS[i], fontWeight: 'bold' }}>設定{i+1}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text)' }}>{fmtRate(m.big[i])}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text)' }}>{fmtRate(m.reg[i])}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text)' }}>{fmtRate(m.big[i] + m.reg[i])}</td>
                        {hasGrape && <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text)' }}>
                          {m.grape[i] !== null ? `1/${(DENOM / m.grape[i]).toFixed(2)}` : '—'}
                        </td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* モーダル */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div style={{
            background: '#16161f', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px',
            width: 'min(360px, calc(100vw - 32px))',
          }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--white)', marginBottom: '16px' }}>
              ハマりゲーム数を入力
            </h3>
            <input type="number" placeholder="350" min="1"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--muted)', padding: '10px', borderRadius: '6px',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.85rem',
                }}>キャンセル</button>
              <button onClick={addHamari}
                style={{
                  background: 'var(--green)', border: 'none',
                  color: '#001a0d', padding: '10px', borderRadius: '6px',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '0.85rem',
                }}>追　加</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
