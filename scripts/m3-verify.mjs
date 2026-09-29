// M3 驗收：三處（Today/詳情/Tasks）增刪改同一筆；手動加衝突課 → 警告（任務書 §8 M3）
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/';
const results = [];
const check = (name, ok) => { results.push([name, ok]); console.log(`${ok ? '✅' : '❌'} ${name}`); };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 914 } });
  const p = await ctx.newPage();
  p.on('dialog', (d) => d.accept());
  await p.goto(BASE, { timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });

  // ——— 1) Tasks 新增（掛英語課、今天到期）———
  await p.click('.bottom-nav__item:nth-child(3)');
  await p.waitForSelector('.fab', { timeout: 15000 });
  await p.click('.fab');
  await p.waitForSelector('.sheet input.field', { timeout: 5000 });
  await p.fill('.sheet input.field', '期末報告大綱');
  await p.click('.sheet .field-fold summary');
  await p.selectOption('.field-fold select >> nth=0', 'c2'); // 大学英语1
  await p.fill('.field-fold input[type="date"]', '2026-09-29');
  await p.click('.sheet .btn-primary');
  await p.waitForSelector('.task-row:has-text("期末報告大綱")', { timeout: 5000 });
  check('Tasks 新增「期末報告大綱」', (await p.textContent('.page-tasks'))?.includes('期末報告大綱'));

  // ——— 2) Today 同一筆 ———
  await p.click('.bottom-nav__item:nth-child(1)');
  await p.waitForTimeout(300);
  const today = await p.textContent('.page-today');
  check('Today 的 TASKS 區出現同一筆', today?.includes('期末報告大綱') && today?.includes('大学英语1'));

  // ——— 3) 課程詳情 sheet 同一筆 ———
  await p.click('.bottom-nav__item:nth-child(2)');
  await p.getByRole('tab', { name: '一' }).click();
  await p.waitForSelector('.course-card', { timeout: 5000 });
  const cards = p.locator('.course-card');
  const n = await cards.count();
  let opened = false;
  for (let i = 0; i < n; i++) {
    if ((await cards.nth(i).textContent())?.includes('大学英语1')) {
      await cards.nth(i).click();
      opened = true;
      break;
    }
  }
  check('打開大学英语1 詳情', opened);
  const sheetTxt = await p.textContent('.sheet');
  check('詳情的任務區是同一筆', sheetTxt?.includes('期末報告大綱'));
  await p.click('.sheet__close');

  // ——— 4) Tasks 就地完成 → 已完成區 ———
  await p.click('.bottom-nav__item:nth-child(3)');
  await p.waitForSelector('.task-row', { timeout: 5000 });
  await p.locator('.task-row__check').first().click();
  await p.waitForTimeout(300);
  const doneTxt = await p.textContent('.page-tasks');
  check('勾掉後進已完成（灰+刪除線）', (await p.locator('.task-row.is-done').count()) === 1 && doneTxt?.includes('已完成'));

  // ——— 5) 衝突檢測：加一門週一 1-4 節 3-17 週 ———
  await p.click('.gear');
  await p.waitForSelector('.overlay-page', { timeout: 5000 });
  await p.click('text=+ 新增課程');
  await p.waitForSelector('.sheet--editor', { timeout: 5000 });
  await p.fill('.sheet--editor .field-cell--wide input >> nth=0', '測試衝突課');
  // weekday 預設週一、起 1 節；把「止」設為 4 節；週次預設 3-17
  await p.selectOption('.sc-row__line1 select >> nth=2', '4');
  await p.click('.sheet--editor .btn-primary');
  await p.waitForSelector('.conflict-box', { timeout: 5000 });
  const cTxt = await p.textContent('.conflict-box');
  check('彈出衝突警告並指向造型基礎', cTxt?.includes('衝突') && cTxt?.includes('造型基礎'));
  await p.screenshot({ path: '/tmp/studentos-shots/5-m3-conflict.png' });

  // 仍要儲存 → 課程數 6；再刪掉還原
  await p.click('.sheet--editor .btn-primary');
  await p.waitForTimeout(400);
  const cnt = await p.textContent('.overlay-page');
  check('確認後課程入庫（6 門）', cnt?.includes('課程（6）'));
  await p.locator('.settings-course-list__item', { hasText: '測試衝突課' }).click();
  await p.waitForSelector('.sheet--editor', { timeout: 5000 });
  await p.locator('.sheet--editor .btn-ghost', { hasText: '刪除課程' }).click();
  await p.waitForTimeout(400);
  check('刪除後還原 5 門', (await p.textContent('.overlay-page'))?.includes('課程（5）'));

  await ctx.close();
} finally {
  await browser.close();
}

const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\nM3 驗收全綠' : `\n${failed.length} 項未過`);
process.exit(failed.length === 0 ? 0 : 1);
