// PWA 啟動性能基準：cold(無SW) / warm(SW) / offline(SW) 三模式，CPU 4x 節流模擬手機。可自行退出。
import { chromium } from 'playwright';

const URL = 'http://localhost:4173/studentos/';
const LABEL = process.argv[2] || 'run';
const browser = await chromium.launch();

async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 914 } });
  return ctx;
}

async function measure(page) {
  const r = await page.evaluate(() => {
    const p = performance.getEntriesByType('paint');
    const fcp = p.find((x) => x.name === 'first-contentful-paint');
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      fcp: fcp ? Math.round(fcp.startTime) : -1,
      dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : -1,
      load: nav ? Math.round(nav.loadEventEnd) : -1,
    };
  });
  return r;
}

async function withThrottle(ctx, fn) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const r = await fn(page);
  await page.close();
  return r;
}

const results = { cold: [], warm: [], offline: [] };
try {
  for (let i = 0; i < 3; i++) {
    // cold：全新 context，首訪 SW 尚未接管
    let ctx = await newCtx();
    results.cold.push(await withThrottle(ctx, (p) => (async () => {
      await p.goto(URL, { waitUntil: 'load', timeout: 20000 });
      await p.waitForSelector('.today-head', { timeout: 10000 });
      return measure(p);
    })()));
    await ctx.close();

    // warm：先裝好 SW，再導航測量
    ctx = await newCtx();
    await withThrottle(ctx, (p) => (async () => {
      await p.goto(URL, { waitUntil: 'load', timeout: 20000 });
      await p.waitForSelector('.today-head', { timeout: 10000 });
      await p.evaluate(() => navigator.serviceWorker.ready);
      await p.waitForTimeout(300);
      return null;
    })());
    results.warm.push(await withThrottle(ctx, (p) => (async () => {
      await p.goto(URL, { waitUntil: 'load', timeout: 20000 });
      await p.waitForSelector('.today-head', { timeout: 10000 });
      return measure(p);
    })()));

    // offline：SW 全離線啟動
    await ctx.setOffline(true);
    results.offline.push(await withThrottle(ctx, (p) => (async () => {
      await p.goto('about:blank');
      await p.goto(URL, { waitUntil: 'load', timeout: 20000 });
      await p.waitForSelector('.today-head', { timeout: 10000 });
      return measure(p);
    })()));
    await ctx.setOffline(false);
    await ctx.close();
  }
} finally {
  await browser.close();
}

const med = (a, k) => {
  const s = a.map((x) => x[k]).sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
console.log(`=== ${LABEL} ===`);
for (const [k, v] of Object.entries(results)) {
  console.log(`${k.padEnd(7)} FCP=${String(med(v, 'fcp')).padStart(5)}ms  DCL=${String(med(v, 'dcl')).padStart(5)}ms  LOAD=${String(med(v, 'load')).padStart(5)}ms`);
}
