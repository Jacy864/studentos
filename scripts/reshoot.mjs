// 一次性重拍 8 張驗收截圖（最終版含桌寵）。腳本可自行退出。
// 前置：npm run preview -- --port 4173（dist 已 build）
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/studentos/';
const OUT = '/tmp/studentos-shots';

const browser = await chromium.launch();
const phone = await browser.newContext({ viewport: { width: 412, height: 914 }, deviceScaleFactor: 2 });
try {
  // 1) Today
  const p = await phone.newPage();
  await p.goto(BASE, { timeout: 15000 });
  await p.waitForSelector('.course-card', { timeout: 15000 });
  await p.waitForSelector('.pet', { timeout: 5000 });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/1-today-mobile.png` });

  // 2) Schedule 第10週週三
  await p.click('.bottom-nav__item:nth-child(2)');
  await p.waitForSelector('.day-tabs', { timeout: 15000 });
  for (let i = 0; i < 6; i++) await p.click('.week-nav__btn[aria-label="下一週"]');
  await p.getByRole('tab', { name: '三' }).click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/2-schedule-w10-wed-mobile.png` });

  // 3) 課程詳情 sheet（回今天）
  await p.click('.week-nav__today');
  await p.getByRole('tab', { name: '二' }).click();
  await p.waitForSelector('.course-card', { timeout: 5000 });
  await p.click('.course-card >> nth=0');
  await p.waitForSelector('.sheet', { timeout: 5000 });
  await p.screenshot({ path: `${OUT}/3-course-sheet-mobile.png` });
  await p.click('.sheet__close');
  await p.waitForTimeout(200);

  // 7) 戳螃蟹（回 Today）
  await p.click('.bottom-nav__item:nth-child(1)');
  await p.waitForSelector('.pet', { timeout: 5000 });
  await p.click('.pet__hit');
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${OUT}/7-m5-poke.png` });
  await p.waitForTimeout(800);

  // 8) 慶祝：新增任務並勾掉
  await p.click('.bottom-nav__item:nth-child(3)');
  await p.click('.fab');
  await p.waitForSelector('.sheet input.field', { timeout: 5000 });
  await p.fill('.sheet input.field', '測試慶祝');
  await p.click('.sheet .btn-primary');
  await p.waitForSelector('.task-row:has-text("測試慶祝")', { timeout: 5000 });
  await p.locator('.task-row__check').first().click();
  await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/8-m5-celebrate.png` });
  await phone.close();

  // 5) 衝突警告（獨立 context）
  const c2 = await browser.newContext({ viewport: { width: 412, height: 914 } });
  const q = await c2.newPage();
  q.on('dialog', (d) => d.accept());
  await q.goto(BASE, { timeout: 15000 });
  await q.waitForSelector('.bottom-nav', { timeout: 15000 });
  await q.click('.gear');
  await q.waitForSelector('.overlay-page', { timeout: 5000 });
  await q.click('text=+ 新增課程');
  await q.waitForSelector('.sheet--editor', { timeout: 5000 });
  await q.fill('.sheet--editor .field-cell--wide input >> nth=0', '測試衝突課');
  await q.selectOption('.sc-row__line1 select >> nth=2', '4');
  await q.click('.sheet--editor .btn-primary');
  await q.waitForSelector('.conflict-box', { timeout: 5000 });
  await q.screenshot({ path: `${OUT}/5-m3-conflict.png` });
  await c2.close();

  // 6) 斷網重開（獨立 context，先讓 SW 接管）
  const c3 = await browser.newContext({ viewport: { width: 412, height: 914 } });
  const r = await c3.newPage();
  await r.goto(BASE, { timeout: 15000 });
  await r.waitForSelector('.bottom-nav', { timeout: 15000 });
  await r.evaluate(() => navigator.serviceWorker.ready);
  await r.reload({ timeout: 15000 });
  await r.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15000 });
  await c3.setOffline(true);
  await r.reload({ timeout: 15000 });
  await r.waitForSelector('.pet', { timeout: 15000 });
  await r.screenshot({ path: `${OUT}/6-m4-offline.png` });
  await c3.close();

  // 4) 桌面週網格
  const desk = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const d = await desk.newPage();
  await d.goto(BASE, { timeout: 15000 });
  await d.waitForSelector('.bottom-nav', { timeout: 15000 });
  await d.click('.bottom-nav__item:nth-child(2)');
  await d.waitForSelector('.week-grid', { timeout: 15000 });
  await d.screenshot({ path: `${OUT}/4-week-grid-desktop.png` });
  await desk.close();
} finally {
  await browser.close();
}
console.log('reshot 8 screenshots →', OUT);
