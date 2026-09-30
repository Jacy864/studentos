// 驗收：UI 狀態在刷新/冷啟後保持——tab、Schedule 週/日、Settings 開啟狀態
// 用法：npm run build && npx vite preview & node scripts/reload-verify.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4173/studentos/';
const results = [];
const check = (name, ok) => { results.push([name, ok]); console.log(`${ok ? '✅' : '❌'} ${name}`); };
const activeTab = (p) => p.textContent('.bottom-nav__item.is-active span');
const weekLabel = (p) => p.textContent('.week-nav__label');

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 914 } });
  const p = await ctx.newPage();
  await p.goto(BASE, { timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });

  // 1. Schedule：點 tab → hash 帶 w/d 段 → reload 停留
  await p.click('.bottom-nav__item:has-text("Schedule")');
  await p.waitForTimeout(300);
  check('點 Schedule 後 hash 帶 w/d 段', /#schedule\/w\d+\/d\d+$/.test(p.url()));
  await p.click('.week-nav__btn[aria-label="下一週"]');
  await p.waitForTimeout(200);
  const wBefore = await weekLabel(p);
  await p.reload({ timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });
  check('Schedule 刷新後仍停留', (await activeTab(p)) === 'Schedule');
  check('刷新後週次保留', (await weekLabel(p)) === wBefore);

  // 2. Tasks：刷新停留
  await p.click('.bottom-nav__item:has-text("Tasks")');
  await p.waitForTimeout(300);
  await p.reload({ timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });
  check('Tasks 刷新後仍停留', (await activeTab(p)) === 'Tasks');

  // 3. Settings 開著刷新：仍在 Settings（且底層 tab 不變）
  await p.click('.bottom-nav__item:has-text("Schedule")');
  await p.waitForTimeout(200);
  await p.click('button.gear');
  await p.waitForSelector('.overlay-page', { timeout: 15000 });
  await p.reload({ timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });
  await p.waitForTimeout(500);
  check('Settings 開著刷新後仍在 Settings', Boolean(await p.$('.overlay-page')));
  check('Settings 底層 tab 仍為 Schedule', (await activeTab(p)) === 'Schedule');

  // 4. PWA 冷啟模擬：直接開 start_url（無 hash），靠 LS 還原
  await p.click('.overlay-page .btn-ghost:has-text("返回")');
  await p.waitForTimeout(300);
  await p.click('.bottom-nav__item:has-text("Tasks")');
  await p.waitForTimeout(300);
  await p.goto(BASE, { timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });
  await p.waitForTimeout(300);
  check('冷啟（無 hash）還原上個 tab', (await activeTab(p)) === 'Tasks');

  await ctx.close();
} finally {
  await browser.close();
}

const failed = results.filter(([, ok]) => !ok).length;
console.log(failed === 0 ? '\n全部通過' : `\n${failed} 項未過`);
process.exit(failed === 0 ? 0 : 1);
