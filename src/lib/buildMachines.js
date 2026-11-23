// エクセルの行データ（2次元配列）から機種データを組み立てる
// 列は見出しの名前で探すので、列の位置が変わっても動く
export const SHEET_NAME = '基本情報';
const COL = {
  machine: '機種',
  setting: '設定',
  pBig: 'BIG(%)',   // 1Gあたりの確率（例：240/65536 = 0.003662109375）
  pReg: 'REG(%)',
  label: '表示名',  // プルダウンに出す名前。空の機種は出さない
  order: '表示順',
};

export function buildMachines(rows) {
  const want = Object.values(COL);
  const headerIdx = rows.findIndex(r => r && want.every(h => r.includes(h)));
  if (headerIdx < 0) {
    const missing = want.filter(h => !rows.some(r => r && r.includes(h)));
    throw new Error(`見出しが見つかりません：${missing.join('、')}`);
  }
  const idx = Object.fromEntries(Object.entries(COL).map(([k, h]) => [k, rows[headerIdx].indexOf(h)]));

  const machines = [];
  let current = null;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const name = r[idx.machine];
    if (name != null && String(name).trim() !== '') {
      const label = r[idx.label];
      const order = Number(r[idx.order]);
      current = label
        ? { key: String(name), name: String(label), order: Number.isFinite(order) ? order : 999, pBig: [], pReg: [] }
        : null;
      if (current) machines.push(current);
    }
    if (!current) continue;

    const s = Number(r[idx.setting]);
    if (!(s >= 1 && s <= 6)) continue;
    const pBig = Number(r[idx.pBig]);
    const pReg = Number(r[idx.pReg]);
    if (!(pBig > 0 && pBig < 1) || !(pReg > 0 && pReg < 1)) {
      throw new Error(`${current.key} 設定${s} のBIG(%)/REG(%)が正しい数値になっていません（${i + 1}行目）`);
    }
    current.pBig[s - 1] = pBig;
    current.pReg[s - 1] = pReg;
  }

  for (const m of machines) {
    for (let s = 0; s < 6; s++) {
      if (m.pBig[s] == null) throw new Error(`${m.key} の設定${s + 1}のデータが足りません`);
    }
  }
  if (machines.length === 0) throw new Error('表示名が入っている機種がありません');
  return machines.sort((a, b) => a.order - b.order);
}
