export default function Home() {
  return (
    <>
      <div className="page-header">
        <h1>Juggler Lab</h1>
        <p>データで勝つジャグラー攻略ツール</p>
      </div>

      <div className="section-label">Tools</div>
      <div className="tool-grid">

        <a href="/tools/setting-analyzer" className="tool-card">
          <div className="tool-card-tag">Bayesian Estimation</div>
          <h2>設定判別ツール</h2>
          <p>
            総ゲーム数・BIG/REG・ぶどう・ハマりから
            ベイズ推定で設定確率を算出（全8機種対応）
          </p>
          <div className="tool-card-arrow">→</div>
        </a>

        <div className="tool-card" style={{ opacity: 0.4, cursor: 'default' }}>
          <div className="tool-card-tag">Expected Value<span className="coming-soon">SOON</span></div>
          <h2>期待値計算ツール</h2>
          <p>設定別の期待収支・損益分岐点をシミュレーション</p>
        </div>

        <div className="tool-card" style={{ opacity: 0.4, cursor: 'default' }}>
          <div className="tool-card-tag">Simulation<span className="coming-soon">SOON</span></div>
          <h2>確率シミュレーター</h2>
          <p>100万回試行で収支分布・ハマり確率を可視化</p>
        </div>

      </div>
    </>
  );
}
