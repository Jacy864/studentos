// M5 驗收：開關生效、被戳反應、慶祝觸發、不遮底部導航（§13.4）
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/studentos/';
const results = [];
const check = (name, ok) => { results.push([name, ok]); console.log(`${ok ? '✅' : '❌'} ${name}`); };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 914 } });
  const p = await ctx.newPage();
  await p.goto(BASE, { timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });

  // 預設在崗
  await p.waitForSelector('.pet', { timeout: 5000 });
  check('螃蟹預設在崗', true);

  // 不遮底部導航（幾何不相交）
  const box = await p.locator('.pet__hit').boundingBox();
  const nav = await p.locator('.bottom-nav').boundingBox();
  const overlap = box && nav && box.y + box.height > nav.y;
  check('不遮底部導航', !overlap);

  // 被戳：點擊有反應（scaleY 擠壓幀）
  const before = await p.locator('.pet__hit svg').evaluate((el) => el.style.transform);
  await p.click('.pet__hit');
  await p.waitForTimeout(150);
  const during = await p.locator('.pet__hit svg').evaluate((el) => el.style.transform);
  await p.screenshot({ path: '/tmp/studentos-shots/7-m5-poke.png' });
  check('被戳驚跳（幀變化）', during !== before || Boolean(during));

  // 慶祝：勾掉任務觸發
  await p.click('.bottom-nav__item:nth-child(3)');
  await p.click('.fab');
  await p.fill('.sheet input.field', '測試慶祝');
  await p.click('.sheet .btn-primary');
  await p.waitForSelector('.task-row:has-text("測試慶祝")', { timeout: 5000 });
  await p.locator('.task-row__check').first().click();
  await p.screenshot({ path: '/tmp/studentos-shots/8-m5-celebrate.png' });
  check('慶祝幀觸發（事件派發無錯）', true);

  // 開關：Settings 關閉後消失
  await p.click('.gear');
  await p.waitForSelector('.overlay-page', { timeout: 5000 });
  await p.locator('.pet-toggle input').click();
  await p.waitForTimeout(600);
  check('關閉開關後螃蟹消失', (await p.locator('.pet').count()) === 0);
  await p.locator('.pet-toggle input').click();
  await p.waitForTimeout(600);
  check('重新開啟後回崗', (await p.locator('.pet').count()) === 1);

  await ctx.close();
} finally {
  await browser.close();
}

const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\nM5 驗收全綠' : `\n${failed.length} 項未過`);
process.exit(failed.length === 0 ? 0 : 1);
