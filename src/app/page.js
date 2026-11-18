export default function Home() {
  return (
    <>
      <div className="main-box">
        <div className="main-title">お知らせ</div>
        <div className="main-content-inner">
          <ul className="news-list">
            <li><span className="news-date">2026/11/19</span><span>設定判別ツールを全8機種に対応しました</span></li>
            <li><span className="news-date">2026/11/15</span><span>じゃぐらぼを公開しました</span></li>
          </ul>
        </div>
      </div>

      <div className="main-box">
        <div className="main-title">攻略ツール</div>
        <div className="main-content-inner">
          <div className="tool-grid">
            <a href="/tools/setting-analyzer" className="tool-card">
              <h3>設定判別ツール</h3>
              <p>総ゲーム数・BIG/REG・ハマりからベイズ推定で設定確率を算出。全8機種対応。</p>
            </a>
            <div className="tool-card disabled">
              <h3>期待値計算<span className="coming-soon-badge">準備中</span></h3>
              <p>設定別の期待収支・損益分岐点をシミュレーション</p>
            </div>
            <div className="tool-card disabled">
              <h3>収支管理<span className="coming-soon-badge">準備中</span></h3>
              <p>日別・機種別の収支を記録して傾向を可視化</p>
            </div>
            <div className="tool-card disabled">
              <h3>確率シミュレーター<span className="coming-soon-badge">準備中</span></h3>
              <p>100万回試行で収支分布・ハマり確率を可視化</p>
            </div>
          </div>
        </div>
      </div>

      <div className="main-box">
        <div className="main-title">人気コンテンツ</div>
        <div className="main-content-inner">
          <ul className="news-list">
            <li><span className="news-date">★</span><span><a href="/tools/setting-analyzer">設定判別ツール</a> - 全8機種のベイズ推定判別</span></li>
            <li><span className="news-date">NEW</span><span>機種スペック一覧（準備中）</span></li>
          </ul>
        </div>
      </div>
    </>
  );
}
