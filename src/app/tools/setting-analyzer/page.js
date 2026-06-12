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

    const logLBig = logBinomialPMF(bigCount, totalG, pBig);
    const logLReg = logBinomialPMF(regCount, totalG, pReg);

    let logLGrape = 0;
    if (grapeCount > 0 && m.grape[s] !== null) {
      const pGrape = m.grape[s] / DENOM;
      const trialG = Math.max(totalG - (bigCount + regCount) * 25, totalG * 0.8);
      logLGrape = logBinomialPMF(grapeCount, Math.round(trialG), pGrape);
    }

    let logLHamari = 0;
    for (const g of hamaris) {
      logLHamari += g * Math.log(1 - pBonus);
    }

    logLikelihoods.push(logPrior + logLBig + logLReg + logLGrape + logLHamari);
  }

  const maxLL = Math.max(...logLikelihoods);
  const exps = logLikelihoods.map(ll => Math.exp(ll - maxLL));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / total);
}

// ============================================================
// 色定義
// ============================================================
const S_COLORS = ['#5a5a8a', '#6a6aa0', '#50a080', '#ddaa00', '#ff8844', '#00ff88'];

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
  const fmtRate = (rand) => `1/${(DENOM / rand).toFixed(1)}`;

  // Shared styles
  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
  };

  return (
    <>
      <div className="page-header">
        <h1>設定判別</h1>
        <p>Bayesian Estimation — 65536分母ベース</p>
      </div>

      {/* 機種選択 */}
      <div className="section-label">Machine</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px', marginBottom: '24px'
      }}>
        {machineKeys.map(key => (
          <button
            key={key}
            onClick={() => { setMachine(key); setResults(null); }}
            style={{
              background: machine === key ? 'var(--green-muted)' : 'var(--surface)',
              border: `1px solid ${machine === key ? 'rgba(0,255,136,0.3)' : 'var(--border)'}`,
              color: machine === key ? 'var(--green)' : 'var(--text-secondary)',
              padding: '10px 4px',
              borderRadius: '8px',
              fontSize: '0.66rem',
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
              lineHeight: 1.3,
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
            }}
          >
            {MACHINES[key].short}
          </button>
        ))}
      </div>

      <hr className="divider" />

      {/* 基本データ */}
      <div className="section-label">Data Input</div>
      <div className="input-row">
        <div className="input-group">
          <label>総ゲーム数</label>
          <input type="number" placeholder="3000" min="0"
            value={totalG} onChange={e => setTotalG(e.target.value)} />
        </div>
        <div className="input-group">
          <label>BIG</label>
          <input type="number" placeholder="10" min="0"
            value={bigCount} onChange={e => setBigCount(e.target.value)} />
        </div>
        <div className="input-group">
          <label>REG</label>
          <input type="number" placeholder="8" min="0"
            value={regCount} onChange={e => setRegCount(e.target.value)} />
        </div>
      </div>

      {/* ぶどう */}
      {hasGrape && (
        <div style={{ marginBottom: '20px' }}>
          <div className="input-group" style={{ maxWidth: '200px' }}>
            <label>ぶどう回数</label>
            <input type="number" placeholder="500" min="0"
              value={grapeCount} onChange={e => setGrapeCount(e.target.value)} />
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '6px', letterSpacing: '0.02em' }}>
            設定差が大きい重要パラメータ
          </div>
        </div>
      )}

      <hr className="divider" />

      {/* ハマり */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Hamari</div>
          <button className="btn-ghost" onClick={() => setShowModal(true)}>＋ 追加</button>
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          minHeight: '42px', padding: '10px',
          ...cardStyle,
          alignItems: 'center',
        }}>
          {hamaris.length === 0 ? (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', width: '100%', textAlign: 'center' }}>
              大きなハマりがあれば追加（任意）
            </span>
          ) : (
            hamaris.map((g, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)',
                borderRadius: '6px', padding: '5px 12px',
                fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--amber)',
              }}>
                {g}G
                <button onClick={() => removeHamari(i)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', padding: 0, lineHeight: 1 }}
                >×</button>
              </div>
            ))
          )}
        </div>
      </div>

      <button className="btn-primary" onClick={runAnalysis} style={{ marginBottom: '32px' }}>ANALYZE</button>

      {/* 結果 */}
      {results && (() => {
        const m = MACHINES[machine];
        const maxIdx = results.posteriors.indexOf(maxProb);
        return (
          <div>
            {/* ヘッダー stats */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: '20px', flexWrap: 'wrap', gap: '8px',
            }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Result</div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                BIG 1/{Math.round(results.totalG / (results.bigCount || 1))}
                {' / '}REG 1/{Math.round(results.totalG / (results.regCount || 1))}
                {results.grapeCount > 0 && ` / ぶどう 1/${(results.totalG / results.grapeCount).toFixed(2)}`}
              </span>
            </div>

            {/* バーチャート */}
            <div style={{ ...cardStyle, padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.posteriors.map((p, i) => {
                  const pct = p * 100;
                  const barWidth = Math.max(Math.round(p / maxProb * 100), 1);
                  const isTop = i === maxIdx;
                  return (
                    <div key={i}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        marginBottom: '5px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: '0.72rem', fontWeight: 700,
                            color: S_COLORS[i], minWidth: '36px',
                          }}>
                            S{i + 1}
                          </span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--text-secondary)' }}>
                            BIG{fmtRate(m.big[i])} REG{fmtRate(m.reg[i])}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: isTop ? '1.2rem' : '0.95rem',
                          fontWeight: 800,
                          color: isTop ? S_COLORS[i] : S_COLORS[i],
                          opacity: isTop ? 1 : 0.7,
                        }}>
                          {pct < 0.1 ? pct.toFixed(2) : pct < 1 ? pct.toFixed(1) : Math.round(pct)}%
                        </span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          width: `${barWidth}%`,
                          background: isTop
                            ? `linear-gradient(90deg, ${S_COLORS[i]}66, ${S_COLORS[i]})`
                            : `${S_COLORS[i]}88`,
                          boxShadow: isTop ? `0 0 12px ${S_COLORS[i]}44` : 'none',
                          transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 判定カード */}
            <div style={{
              ...cardStyle,
              borderLeft: `3px solid ${S_COLORS[maxIdx]}`,
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.15em',
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                }}>Verdict</span>
                <span style={{
                  fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.08em',
                  color: highProb > 0.65 ? '#001a0d' : lowProb > 0.65 ? '#1a1a2e' : 'var(--text-secondary)',
                  background: highProb > 0.65 ? 'var(--green)' : lowProb > 0.65 ? '#5a5a8a' : 'var(--surface2)',
                  padding: '2px 8px', borderRadius: '4px',
                }}>
                  {highProb > 0.65 ? '高設定濃厚' : lowProb > 0.65 ? '低設定濃厚' : '判別困難'}
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--white)', lineHeight: 1.7 }}>
                {highProb > 0.65 ? (
                  <>高設定（4〜6）合算 <strong style={{ color: 'var(--green)' }}>{Math.round(highProb * 100)}%</strong> — 設定{maxIdx + 1}が最有力</>
                ) : lowProb > 0.65 ? (
                  <>低設定（1〜3）合算 <strong style={{ color: '#9090b0' }}>{Math.round(lowProb * 100)}%</strong> — 設定{maxIdx + 1}が最有力</>
                ) : (
                  <>最有力は設定{maxIdx + 1}（{Math.round(maxProb * 100)}%）— データ不足で断定不可</>
                )}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {results.totalG < 2000 && '⚠ 2000G未満 — 信頼性は低め'}
                {results.totalG >= 2000 && results.totalG < 5000 && 'ℹ 傾向は見えるが確定的ではない'}
                {results.totalG >= 5000 && '✓ 十分なサンプル数'}
                {results.grapeCount > 0 && ' ／ ぶどう確率反映済み'}
                {hamaris.length > 0 && ` ／ ハマり${hamaris.length}回反映済み`}
              </div>
            </div>

            {/* 理論値テーブル */}
            <div style={{ ...cardStyle }}>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.15em',
                color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px',
              }}>
                {currentMachine.name}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontFamily: 'var(--mono)', fontSize: '0.68rem',
                }}>
                  <thead>
                    <tr>
                      {['', 'BIG', 'REG', '合成', ...(hasGrape ? ['ぶどう'] : [])].map((h, i) => (
                        <th key={i} style={{
                          padding: '8px 6px', textAlign: i === 0 ? 'left' : 'center',
                          color: 'var(--text-secondary)', fontWeight: 600,
                          borderBottom: '1px solid var(--border)',
                          fontSize: '0.6rem', letterSpacing: '0.08em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0,1,2,3,4,5].map(i => (
                      <tr key={i} style={{
                        background: i === maxIdx ? 'rgba(0,255,136,0.04)' : 'transparent',
                      }}>
                        <td style={{ padding: '7px 6px', color: S_COLORS[i], fontWeight: 700, fontSize: '0.72rem' }}>S{i+1}</td>
                        <td style={{ padding: '7px 6px', textAlign: 'center', color: 'var(--text)' }}>{fmtRate(m.big[i])}</td>
                        <td style={{ padding: '7px 6px', textAlign: 'center', color: 'var(--text)' }}>{fmtRate(m.reg[i])}</td>
                        <td style={{ padding: '7px 6px', textAlign: 'center', color: 'var(--white)', fontWeight: 600 }}>{fmtRate(m.big[i] + m.reg[i])}</td>
                        {hasGrape && <td style={{ padding: '7px 6px', textAlign: 'center', color: 'var(--text)' }}>
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
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div style={{
            background: 'var(--surface-solid)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '28px',
            width: 'min(360px, calc(100vw - 32px))',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--white)', marginBottom: '18px' }}>
              ハマりゲーム数
            </h3>
            <input type="number" placeholder="350" min="1"
              value={hamariInput}
              onChange={e => setHamariInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addHamari(); }}
              autoFocus
              style={{
                width: '100%', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: '10px',
                color: 'var(--white)', fontFamily: 'var(--mono)',
                fontSize: '1.5rem', padding: '14px', textAlign: 'center',
                outline: 'none', marginBottom: '16px',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => setShowModal(false)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', padding: '12px', borderRadius: '8px',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 600,
                }}>キャンセル</button>
              <button onClick={addHamari}
                style={{
                  background: 'var(--green)', border: 'none',
                  color: '#001a0d', padding: '12px', borderRadius: '8px',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '0.82rem',
                }}>追加</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
