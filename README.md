# JUGGLER LAB

ジャグラー攻略ツール集

## セットアップ

```bash
# 依存パッケージをインストール
npm install

# 開発サーバー起動（http://localhost:3000）
npm run dev

# 本番ビルド
npm run build
npm start
```

## プロジェクト構成

```
src/
  app/
    layout.js          # 共通レイアウト（ヘッダー等）
    page.js            # トップページ（ツール一覧）
    globals.css        # グローバルCSS
    tools/
      setting-analyzer/
        page.js        # 設定判別ツール
  components/          # 共有コンポーネント
  data/
    machines.js        # ジャグラー機種スペックデータ
```

## デプロイ（Vercel）

1. GitHubリポジトリにpush
2. https://vercel.com でGitHubアカウント連携
3. リポジトリを選択してDeploy
4. 以後 git push するたびに自動デプロイ
