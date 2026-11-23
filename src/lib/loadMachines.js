'use client';
import { buildMachines, SHEET_NAME } from './buildMachines';

export const EXCEL_URL = '/data/probability.xlsx';

let cache = null; // 同じページ内で何度も読み込まない

export function loadMachines() {
  if (!cache) {
    cache = (async () => {
      const res = await fetch(EXCEL_URL);
      if (!res.ok) throw new Error(`エクセルを読み込めませんでした（${res.status}）`);
      const blob = await res.blob();
      const { default: readExcelFile } = await import('read-excel-file/browser');
      const sheets = await readExcelFile(blob);
      const sheet = sheets.find(s => s.sheet === SHEET_NAME);
      if (!sheet) throw new Error(`シート「${SHEET_NAME}」が見つかりません`);
      return buildMachines(sheet.data);
    })().catch(e => { cache = null; throw e; });
  }
  return cache;
}
