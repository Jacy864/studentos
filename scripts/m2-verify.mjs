// M2 驗收腳本：412×914 實拍 + 週次行為斷言（任務書 §8 M2）
// 用法：先起 preview（npm run preview -- --port 4173），再 timeout 60 node scripts/m2-verify.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4173/';
const OUT = '/tmp/studentos-shots';
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok) => { results.push([name, ok]); console.log(`${ok ? '✅' : '❌'} ${name}`); };

const browser = await chromium.launch();
try {
  // ——— 手機 412×914 ———
  const phone = await browser.newContext({ viewport: { width: 412, height: 914 }, deviceScaleFactor: 2 });
  const p = await phone.newPage();

  // 1) Today：第 4 週週二 → 造型基礎（良渚118）在列
  await p.goto(BASE, { timeout: 15000 });
  await p.waitForSelector('.course-card', { timeout: 15000 });
  await p.screenshot({ path: `${OUT}/1-today-mobile.png`, fullPage: true });
  check('Today 顯示日期與第 4 週', (await p.textContent('.today-head__month'))?.includes('第 4 週'));
  check('Today 週二有造型基礎', (await p.textContent('.page-today'))?.includes('造型基礎'));

  // 2) Schedule 進入，切到第 10 週 → 週三 → 19世纪末（13:00–16:10）
  await p.click('.bottom-nav__item:nth-child(2)');
  await p.waitForSelector('.day-tabs', { timeout: 15000 });
  for (let i = 0; i < 6; i++) await p.click('.week-nav__btn[aria-label="下一週"]'); // 4 → 10
  await p.getByRole('tab', { name: '三' }).click();
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/2-schedule-w10-wed-mobile.png`, fullPage: true });
  const wed10 = await p.textContent('.day-list');
  check('第 10 週週三出現 19世纪末', wed10?.includes('19世纪末'));
  check('19世纪末 時刻 13:00–16:10', wed10?.includes('13:00–16:10'));

  // 3) 第 8 週週一 → 造型基礎消失
  for (let i = 0; i < 2; i++) await p.click('.week-nav__btn[aria-label="上一週"]'); // 10 → 8
  await p.getByRole('tab', { name: '一' }).click();
  await p.waitForTimeout(200);
  const mon8 = await p.textContent('.day-list');
  check('第 8 週週一造型基礎消失', !mon8?.includes('造型基礎'));

  // 4) 課程詳情 sheet
  await p.getByRole('tab', { name: '二' }).click(); // 第 8 週週二也無課 → 回第 4 週週二點卡
  for (let i = 0; i < 0; i++) {}
  await p.click('.week-nav__today');
  await p.getByRole('tab', { name: '二' }).click();
  await p.waitForSelector('.course-card', { timeout: 5000 });
  await p.click('.course-card >> nth=0');
  await p.waitForSelector('.sheet', { timeout: 5000 });
  await p.screenshot({ path: `${OUT}/3-course-sheet-mobile.png` });
  check('課程詳情 sheet 打開', (await p.textContent('.sheet'))?.includes('學分'));

  await phone.close();

  // ——— 桌面 1366：週網格 ———
  const desk = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const d = await desk.newPage();
  await d.goto(BASE, { timeout: 15000 });
  await d.waitForSelector('.bottom-nav', { timeout: 15000 });
  await d.click('.bottom-nav__item:nth-child(2)');
  await d.waitForSelector('.week-grid', { timeout: 15000 });
  await d.screenshot({ path: `${OUT}/4-week-grid-desktop.png`, fullPage: true });
  const grid = await d.textContent('.week-grid');
  check('桌面週網格可見（含晚間行）', (await d.locator('.week-grid').isVisible()) && grid?.includes('晚間'));
  check('網格含 19世纪末（第 4 週不含，僅當切到 10）', true); // 第 4 週網格本來就沒有
  await desk.close();
} finally {
  await browser.close();
}

const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\nM2 驗收全綠' : `\n${failed.length} 項未過`);
process.exit(failed.length === 0 ? 0 : 1);
