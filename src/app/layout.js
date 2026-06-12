import './globals.css';

export const metadata = {
  title: 'JUGGLER LAB — ジャグラー攻略ツール',
  description: 'ジャグラーシリーズの設定判別・期待値計算などの攻略ツール集',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <a href="/" className="site-logo">
            <div className="gogo-dot" />
            <span>Juggler Lab</span>
          </a>
          <nav className="site-nav">
            <a href="/">ツール</a>
            <a href="/specs">機種情報</a>
          </nav>
        </header>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
