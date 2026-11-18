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
          <main className="main">
            {children}
          </main>
        </div>
        <footer className="site-footer">
          <div>© 2026 じゃぐらぼ | <a href="#">運営情報</a> | <a href="#">プライバシーポリシー</a> | <a href="#">お問い合わせ</a></div>
        </footer>
      </body>
    </html>
  );
}
