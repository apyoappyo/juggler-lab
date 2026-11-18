import './globals.css';

export const metadata = {
  title: 'じゃぐらぼ - ジャグラー徹底攻略',
  description: 'ジャグラーシリーズの設定判別・期待値計算などの攻略ツール集',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <a href="/" className="site-logo">🎰 じゃぐらぼ</a>
            <div className="site-search">
              <input type="text" placeholder="機種名・ツール名で検索" />
            </div>
          </div>
        </header>
        <nav className="global-nav">
          <div className="global-nav-inner">
            <a href="/">トップ</a>
            <a href="/tools/setting-analyzer">設定判別</a>
            <a href="/tools">ツール一覧</a>
            <a href="/machines">機種情報</a>
            <a href="/guide">攻略記事</a>
          </div>
        </nav>
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-box">
              <div className="sidebar-title">ツール</div>
              <ul className="sidebar-list">
                <li><a href="/tools/setting-analyzer">設定判別ツール</a></li>
                <li><a href="#">期待値計算</a></li>
                <li><a href="#">収支管理</a></li>
                <li><a href="#">確率シミュレーター</a></li>
              </ul>
            </div>
            <div className="sidebar-box">
              <div className="sidebar-title">機種</div>
              <ul className="sidebar-list">
                <li><a href="#">マイジャグラーV</a></li>
                <li><a href="#">ファンキージャグラー2</a></li>
                <li><a href="#">ハッピージャグラーVⅢ</a></li>
                <li><a href="#">ゴーゴージャグラー3</a></li>
                <li><a href="#">アイムジャグラーEX</a></li>
                <li><a href="#">ガールズSS</a></li>
                <li><a href="#">ミスタージャグラー</a></li>
                <li><a href="#">ウルトラミラクル</a></li>
              </ul>
            </div>
            <div className="sidebar-box">
              <div className="sidebar-title">記事カテゴリ</div>
              <ul className="sidebar-list">
                <li><a href="#">立ち回り</a></li>
                <li><a href="#">設定判別</a></li>
                <li><a href="#">初心者講座</a></li>
                <li><a href="#">収支報告</a></li>
              </ul>
            </div>
          </aside>
          <main className="main">
            {children}
          </main>
          <aside className="ad-column">
            <div className="ad-box">広告枠<br/>300×250</div>
            <div className="ad-box">広告枠<br/>300×250</div>
          </aside>
        </div>
        <footer className="site-footer">
          <div>© 2026 じゃぐらぼ | <a href="#">運営情報</a> | <a href="#">プライバシーポリシー</a> | <a href="#">お問い合わせ</a></div>
        </footer>
      </body>
    </html>
  );
}
