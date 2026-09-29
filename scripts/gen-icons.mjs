// 產生 PWA icons：192 / 512 / maskable-512（透明圓角 + 全出血兩版）
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

mkdirSync('public/icons', { recursive: true });
const svg = readFileSync('public/favicon.svg', 'utf8');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  const shoot = async (size, html, file, omitBackground) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html);
    await page.screenshot({ path: `public/icons/${file}`, omitBackground });
    console.log(`✓ ${file}`);
  };

  const wrap = (inner) => `<!doctype html><body style="margin:0;background:transparent">
    <div style="width:100vw;height:100vh">${inner}</div></body>`;

  for (const n of [192, 512]) {
    await shoot(n, wrap(svg.replace(/viewBox/, 'style="width:100%;height:100%" viewBox')), `icon-${n}.png`, true);
  }

  // maskable：全出血 Tiffany 底，內容縮到 80% 安全區
  await shoot(512, wrap(`<svg style="width:100%;height:100%" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#0ABAB5"/>
    <g transform="translate(6.4 6.4) scale(0.8)">
      <rect x="14" y="20" width="8" height="24" rx="2" fill="#FBF8F4"/>
      <rect x="28" y="12" width="8" height="32" rx="2" fill="#FBF8F4" opacity="0.85"/>
      <rect x="42" y="26" width="8" height="18" rx="2" fill="#DE886D"/>
    </g>
  </svg>`), 'icon-maskable-512.png', false);
} finally {
  await browser.close();
}
