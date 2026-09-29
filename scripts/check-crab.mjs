// 一次性驗證：裁出 .pet 區域放大截圖 + 讀取 SVG 渲染幾何，確認螃蟹真的畫出來了
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 914 }, deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/studentos/', { timeout: 15000 });
  await p.waitForSelector('.pet', { timeout: 5000 });
  await p.waitForTimeout(400);
  await p.locator('.pet').screenshot({ path: '/tmp/studentos-shots/crab-crop.png' });
  const stats = await p.evaluate(() => {
    const svg = document.querySelector('.pet svg');
    const r = svg.getBoundingClientRect();
    const cs = getComputedStyle(svg);
    return {
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      rects: svg.querySelectorAll('rect').length,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
    };
  });
  console.log(JSON.stringify(stats));
  await ctx.close();
} finally {
  await browser.close();
}
