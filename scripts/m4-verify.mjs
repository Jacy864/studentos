// M4 驗收：manifest 可達、SW 註冊接管、斷網重開可載入（Lighthouse Installable 的核心條件）
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

  // manifest
  const manifest = await p.evaluate(async () => {
    const r = await fetch('manifest.webmanifest');
    return r.ok ? await r.json() : null;
  });
  check('manifest.webmanifest 可達', Boolean(manifest));
  check('manifest：standalone + 3 icons', manifest?.display === 'standalone' && manifest?.icons?.length === 3);

  // SW：註冊 → reload 後接管
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload({ timeout: 15000 });
  await p.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15000 });
  check('Service Worker 已接管頁面', true);

  // 斷網重開
  await ctx.setOffline(true);
  await p.reload({ timeout: 15000 });
  await p.waitForSelector('.bottom-nav', { timeout: 15000 });
  const offlineTxt = await p.textContent('.page-today');
  check('斷網重開能載入（預快取）', Boolean(offlineTxt));
  await p.screenshot({ path: '/tmp/studentos-shots/6-m4-offline.png' });

  await ctx.setOffline(false);
  await ctx.close();
} finally {
  await browser.close();
}

const failed = results.filter(([, ok]) => !ok);
console.log(failed.length === 0 ? '\nM4 PWA 驗收全綠' : `\n${failed.length} 項未過`);
process.exit(failed.length === 0 ? 0 : 1);
