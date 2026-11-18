'use client';

import { useState, useCallback } from 'react';
import { MACHINES, DENOM } from '@/data/machines';

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

function analyze({ totalG, bigCount, regCount, hamaris, machineKey }) {
  const m = MACHINES[machineKey];
  const logPrior = Math.log(1 / 6);
  const logLikelihoods = [];
  for (let s = 0; s < 6; s++) {
    const pBig = m.big[s] / DENOM;
    const pReg = m.reg[s] / DENOM;
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

const S_COLORS = ['#888888', '#999999', '#4a9050', '#d49500', '#e8611e', '#c8102e'];

export default function SettingAnalyzer({ showSpecTable = true }) {
  const [machine, setMachine] = useState('myjug');
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
    const posteriors = analyze({ totalG: g, bigCount: b, regCount: r, hamaris, machineKey: machine });
    setResults({ posteriors, totalG: g, bigCount: b, regCount: r });
  }, [totalG, bigCount, regCount, hamaris, machine]);

  const maxProb = results ? Math.max(...results.posteriors) : 0;
  const highProb = results ? results.posteriors[3] + results.posteriors[4] + results.posteriors[5] : 0;
  const lowProb = results ? results.posteriors[0] + results.posteriors[1] + results.posteriors[2] : 0;
  const fmtRate = (rand) => `1/${(DENOM / rand).toFixed(1)}`;

  return (
    <>
      <div className="form-section">
        <div className="form-label">機種選択</div>
        <div className="machine-select">
          {machineKeys.map(key => (
            <button
              key={key}
              onClick={() => { setMachine(key); setResults(null); }}
              className={`machine-btn ${machine === key ? 'active' : ''}`}
            >
              {MACHINES[key].short}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-label">基本データ</div>
        <div className="input-row">
          <div className="input-group">
            <label>総ゲーム数</label>
            <input type="number" placeholder="3000" min="0" value={totalG} onChange={e => setTotalG(e.target.value)} />
          </div>
          <div className="input-group">
            <label>BIG回数</label>
            <input type="number" placeholder="10" min="0" value={bigCount} onChange={e => setBigCount(e.target.value)} />
          </div>
          <div className="input-group">
            <label>REG回数</label>
            <input type="number" placeholder="8" min="0" value={regCount} onChange={e => setRegCount(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div className="form-label" style={{ marginBottom: 0 }}>ハマりゲーム数（任意）</div>
          <button className="btn-add" onClick={() => setShowModal(true)}>＋ 追加</button>
        </div>
        <div className="hamari-area">
          {hamaris.length === 0 ? (
            <span className="hamari-empty">大きなハマりがあれば追加</span>
          ) : (
            hamaris.map((g, i) => (
              <div key={i} className="hamari-tag">
                {g}G
                <button onClick={() => removeHamari(i)}>×</button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="form-section" style={{ borderBottom: 'none' }}>
        <button className="btn-primary" onClick={runAnalysis}>判 定 開 始</button>
      </div>

      {results && (() => {
        const m = MACHINES[machine];
        const maxIdx = results.posteriors.indexOf(maxProb);
        return (
          <div className="result-section" style={{ borderTop: '1px solid var(--border-light)' }}>
            <div className="result-header">
              <div className="result-title">判定結果</div>
              <div className="result-stats">
                BIG 1/{Math.round(results.totalG / (results.bigCount || 1))} / REG 1/{Math.round(results.totalG / (results.regCount || 1))}
              </div>
            </div>

            <div className="bar-list">
              {results.posteriors.map((p, i) => {
                const pct = p * 100;
                const barWidth = Math.max(Math.round(p / maxProb * 100), 1);
                const isTop = i === maxIdx;
                return (
                  <div key={i} className={`bar-row ${isTop ? 'top' : ''}`}>
                    <div className="bar-meta">
                      <span className="bar-label" style={{ color: S_COLORS[i] }}>設定{i + 1}</span>
                      <span className="bar-pct" style={{ color: S_COLORS[i] }}>
                        {pct < 0.1 ? pct.toFixed(2) : pct < 1 ? pct.toFixed(1) : Math.round(pct)}%
                      </span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${barWidth}%`, background: S_COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="verdict-box">
              <div className="verdict-text">
                {highProb > 0.65 ? (
                  <>高設定（4〜6）合算 <strong style={{ color: 'var(--red)' }}>{Math.round(highProb * 100)}%</strong> — 設定{maxIdx + 1}が最有力</>
                ) : lowProb > 0.65 ? (
                  <>低設定（1〜3）合算 <strong>{Math.round(lowProb * 100)}%</strong> — 設定{maxIdx + 1}が最有力</>
                ) : (
                  <>最有力は設定{maxIdx + 1}（{Math.round(maxProb * 100)}%）— データ不足で断定不可</>
                )}
              </div>
              <div className="verdict-note">
                {results.totalG < 2000 && '※ 2000G未満のため信頼性は低め'}
                {results.totalG >= 2000 && results.totalG < 5000 && '傾向は見えるが確定的ではありません'}
                {results.totalG >= 5000 && '十分なサンプル数'}
                {hamaris.length > 0 && ` ／ ハマり${hamaris.length}回反映済み`}
              </div>
            </div>

            {showSpecTable && (
              <table className="spec-table">
                <thead>
                  <tr>
                    <th>設定</th>
                    <th>BIG</th>
                    <th>REG</th>
                    <th>合成</th>
                  </tr>
                </thead>
                <tbody>
                  {[0,1,2,3,4,5].map(i => (
                    <tr key={i} className={i === maxIdx ? 'top' : ''}>
                      <td style={{ fontWeight: 700, color: S_COLORS[i] }}>設定{i+1}</td>
                      <td>{fmtRate(m.big[i])}</td>
                      <td>{fmtRate(m.reg[i])}</td>
                      <td style={{ fontWeight: 700 }}>{fmtRate(m.big[i] + m.reg[i])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h3>ハマりゲーム数を入力</h3>
            <input type="number" placeholder="350" min="1" value={hamariInput}
              onChange={e => setHamariInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addHamari(); }}
              autoFocus />
            <div className="modal-btns">
              <button className="modal-cancel" onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="modal-add" onClick={addHamari}>追加</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
