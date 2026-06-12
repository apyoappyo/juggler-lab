export default function Home() {
  return (
    <>
      <div className="page-header">
        <h1>JUGGLER LAB</h1>
        <p>ジャグラー攻略ツール集</p>
      </div>

      <div className="section-label">ツール一覧</div>
      <div className="tool-grid">

        <a href="/tools/setting-analyzer" className="tool-card">
          <div className="tool-card-tag">Bayesian Estimation</div>
          <h2>設定判別ツール</h2>
          <p>
            総ゲーム数・BIG/REG回数・ハマりゲーム数から
            ベイズ推定で設定別の確率を算出
          </p>
          <div className="tool-card-arrow">→</div>
        </a>

        <div className="tool-card" style={{ opacity: 0.5, cursor: 'default' }}>
          <div className="tool-card-tag">Expected Value<span className="coming-soon">COMING SOON</span></div>
          <h2>期待値計算ツール</h2>
          <p>設定別の期待収支・損益分岐点をシミュレーション</p>
        </div>

        <div className="tool-card" style={{ opacity: 0.5, cursor: 'default' }}>
          <div className="tool-card-tag">Balance Tracker<span className="coming-soon">COMING SOON</span></div>
          <h2>収支管理</h2>
          <p>日別・機種別の収支を記録して傾向を可視化</p>
        </div>

      </div>
    </>
  );
}
