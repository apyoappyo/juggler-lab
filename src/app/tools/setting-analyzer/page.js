import SettingAnalyzer from '@/components/SettingAnalyzer';

export const metadata = {
  title: '設定判別ツール - じゃぐらぼ',
  description: '総ゲーム数・BIG・REG・ハマりからベイズ推定でジャグラーの設定を判別',
};

export default function SettingAnalyzerPage() {
  return (
    <div className="main-box">
      <div className="tool-header">
        <div className="breadcrumb"><a href="/">トップ</a> &gt; 設定判別</div>
        <h1>設定判別ツール</h1>
        <p>総ゲーム数・BIG・REG・ハマりからベイズ推定で設定を判別</p>
      </div>
      <SettingAnalyzer showSpecTable={true} />
    </div>
  );
}
