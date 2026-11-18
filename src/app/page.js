import SettingAnalyzer from '@/components/SettingAnalyzer';

export default function Home() {
  return (
    <>
      {/* 仮のタイトルイラスト枠 */}
      <div className="hero-banner">
        <div className="hero-banner-inner">
          <div className="hero-title">じゃぐらぼ</div>
          <div className="hero-sub">ジャグラー徹底攻略 — 設定判別・期待値・立ち回り</div>
        </div>
      </div>

      {/* ホームのメイン：設定判別ツール */}
      <div className="main-box featured">
        <div className="main-title">設定判別ツール</div>
        <SettingAnalyzer showSpecTable={false} />
      </div>

      {/* 下：ツール一覧 */}
      <div className="main-box">
        <div className="main-title">攻略ツール</div>
        <div className="main-content-inner">
          <div className="tool-grid">
            <a href="/tools/setting-analyzer" className="tool-card">
              <h3>設定判別ツール</h3>
              <p>ベイズ推定で全8機種の設定確率を算出</p>
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

      {/* お知らせ */}
      <div className="main-box">
        <div className="main-title">お知らせ</div>
        <div className="main-content-inner">
          <ul className="news-list">
            <li><span className="news-date">2026/11/19</span><span>設定判別ツールを全8機種に対応しました</span></li>
            <li><span className="news-date">2026/11/15</span><span>じゃぐらぼを公開しました</span></li>
          </ul>
        </div>
      </div>

      {/* 攻略記事 */}
      <div className="main-box">
        <div className="main-title">攻略記事</div>
        <div className="main-content-inner">
          <ul className="news-list">
            <li><span className="news-date">準備中</span><span>ジャグラー初心者講座</span></li>
            <li><span className="news-date">準備中</span><span>設定判別の基礎知識</span></li>
            <li><span className="news-date">準備中</span><span>立ち回りの基本と応用</span></li>
          </ul>
        </div>
      </div>
    </>
  );
}
