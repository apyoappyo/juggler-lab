'use client';

import { useState, useCallback, useEffect } from 'react';
import { loadMachines } from '@/lib/loadMachines';
import HallDistribution, { DEFAULT_WEIGHTS, STEPS, S_COLORS, presetName } from './HallDistribution';
import Collapsible from './Collapsible';

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

// ゲーム数・BB・RBで判別。weights＝ホールの設定配分（60分割、合計60）＝事前確率
function analyze({ totalG, bigCount, regCount, m, weights }) {
  const logL = [];
  for (let s = 0; s < 6; s++) {
    const pBig = m.pBig[s];
    const pReg = m.pReg[s];
    logL.push(
      Math.log(weights[s] / STEPS)  // 0/60の設定は -Infinity → 0%
      + logBinomialPMF(bigCount, totalG, pBig)
      + logBinomialPMF(regCount, totalG, pReg)
    );
  }
  const maxLL = Math.max(...logL);
  const exps = logL.map(ll => Math.exp(ll - maxLL));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / total);
}

export default function SettingAnalyzer({ showSpecTable = true }) {
  const [machines, setMachines] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [machine, setMachine] = useState('');
  const [totalG, setTotalG] = useState('');
  const [bigCount, setBigCount] = useState('');
  const [regCount, setRegCount] = useState('');
  const [results, setResults] = useState(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  useEffect(() => {
    loadMachines()
      .then(list => { setMachines(list); setMachine(list[0].key); })
      .catch(e => setLoadError(e.message));
  }, []);

  const current = machines?.find(m => m.key === machine);

  const runAnalysis = useCallback(() => {
    const g = parseInt(totalG) || 0;
    const b = parseInt(bigCount) || 0;
    const r = parseInt(regCount) || 0;
    if (g < 100 || b + r === 0) {
      alert('総ゲーム数とボーナス回数を入力してください');
      return;
    }
    if (b + r > g) {
      alert('ボーナス回数が総ゲーム数を超えています');
      return;
    }
    if (!current) return;
    setResults({ totalG: g, bigCount: b, regCount: r, m: current });
  }, [totalG, bigCount, regCount, current]);

  // 配分を動かしたら、表示中の結果もその場で計算し直す
  const shown = results && { ...results, posteriors: analyze({ ...results, weights }) };
  const distName = presetName(weights);

  const numProps = { type: 'number', inputMode: 'numeric', pattern: '[0-9]*', min: '0' };
  const fmtRate = (p) => `1/${(1 / p).toFixed(1)}`;

  if (loadError) {
    return <div className="form-section load-msg error">機種データの読み込みに失敗しました：{loadError}</div>;
  }
  if (!machines) {
    return <div className="form-section load-msg">機種データを読み込み中…</div>;
  }

  return (
    <>
      <div className="form-section">
        <label className="form-label" htmlFor="machine-select">機種</label>
        <select
          id="machine-select"
          className="machine-dropdown"
          value={machine}
          onChange={e => { setMachine(e.target.value); setResults(null); }}
        >
          {machines.map(m => (
            <option key={m.key} value={m.key}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <div className="form-label">データ入力</div>
        <div className="input-row">
          <div className="input-group">
            <label>総ゲーム数</label>
            <input {...numProps} placeholder="3000" value={totalG} onChange={e => setTotalG(e.target.value)} />
          </div>
          <div className="input-group">
            <label>BB回数</label>
            <input {...numProps} placeholder="10" value={bigCount} onChange={e => setBigCount(e.target.value)} />
          </div>
          <div className="input-group">
            <label>RB回数</label>
            <input {...numProps} placeholder="8" value={regCount} onChange={e => setRegCount(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-section optional-section">
        <div className="form-label">任意入力</div>
        <Collapsible title="ホールの設定配分" badge={distName} badgeActive={distName !== '設定均等'}>
          <HallDistribution weights={weights} onChange={setWeights} />
        </Collapsible>
      </div>

      <div className="form-section" style={{ borderBottom: 'none' }}>
        <button className="btn-primary" onClick={runAnalysis}>判 定 開 始</button>
      </div>

      {shown && (() => {
        const results = shown;
        const m = results.m;
        const { posteriors } = results;
        const maxProb = Math.max(...posteriors);
        const maxIdx = posteriors.indexOf(maxProb);
        const highProb = posteriors[3] + posteriors[4] + posteriors[5];
        const lowProb = posteriors[0] + posteriors[1] + posteriors[2];
        return (
          <div className="result-section" style={{ borderTop: '1px solid var(--border-light)' }}>
            <div className="result-header">
              <div className="result-title">判定結果</div>
              <div className="result-stats">
                BB {results.bigCount ? `1/${(results.totalG / results.bigCount).toFixed(1)}` : '—'}
                {' / '}RB {results.regCount ? `1/${(results.totalG / results.regCount).toFixed(1)}` : '—'}
              </div>
            </div>

            <div className="bar-list">
              {posteriors.map((p, i) => {
                const pct = p * 100;
                const barWidth = Math.max(Math.round(p / maxProb * 100), 1);
                return (
                  <div key={i} className={`bar-row ${i === maxIdx ? 'top' : ''}`}>
                    <div className="bar-meta">
                      <span className="bar-label" style={{ color: S_COLORS[i] }}>設定{i + 1}</span>
                      <span className="bar-pct" style={{ color: S_COLORS[i] }}>
                        {pct === 0 ? 0 : pct < 0.1 ? pct.toFixed(2) : pct < 1 ? pct.toFixed(1) : Math.round(pct)}%
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
                {distName !== '設定均等' && ` ／ 設定配分「${distName}」を反映`}
              </div>
            </div>

            {showSpecTable && (
              <table className="spec-table">
                <thead>
                  <tr><th>設定</th><th>BB</th><th>RB</th><th>合成</th></tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className={i === maxIdx ? 'top' : ''}>
                      <td style={{ fontWeight: 700, color: S_COLORS[i] }}>設定{i + 1}</td>
                      <td>{fmtRate(m.pBig[i])}</td>
                      <td>{fmtRate(m.pReg[i])}</td>
                      <td style={{ fontWeight: 700 }}>{fmtRate(m.pBig[i] + m.pReg[i])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}
    </>
  );
}
