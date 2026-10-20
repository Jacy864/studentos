// 產生 Tauri 圖標：32/128/256/512 PNG + 多尺寸 BMP ICO（任務欄/資源管理器/安裝器用）
// 用法：node scripts/gen-tauri-icons.mjs（源圖 public/favicon.svg）
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('src-tauri/icons', { recursive: true });
const svg = readFileSync('public/favicon.svg', 'utf8');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();

  // 1) PNG：透明底，viewport 即尺寸（沿用 gen-icons.mjs 的做法）
  const wrap = (inner) => `<!doctype html><body style="margin:0;background:transparent">
    <div style="width:100vw;height:100vh">${inner}</div></body>`;
  const svgStyled = svg.replace(/viewBox/, 'style="width:100%;height:100%" viewBox');
  for (const [n, file] of [[32, '32x32.png'], [128, '128x128.png'], [256, '128x128@2x.png'], [512, 'icon.png']]) {
    await page.setViewportSize({ width: n, height: n });
    await page.setContent(wrap(svgStyled));
    await page.screenshot({ path: `src-tauri/icons/${file}`, omitBackground: true });
    console.log(`✓ ${file}`);
  }

  // 2) icon.ico：16–256 全 BMP 條目（兼容舊 shell，不賭 PNG-in-ICO 支持）
  const icoB64 = await page.evaluate(async ({ svgSrc, sizes }) => {
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgSrc)));
    await img.decode();
    const bmp = (n) => {
      const cv = document.createElement('canvas');
      cv.width = n; cv.height = n;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, n, n);
      const { data } = ctx.getImageData(0, 0, n, n);
      const row = n * 4, andRow = Math.ceil(n / 32) * 4, andSize = andRow * n;
      const buf = new ArrayBuffer(40 + row * n + andSize);
      const dv = new DataView(buf);
      dv.setUint32(0, 40, true);
      dv.setInt32(4, n, true);
      dv.setInt32(8, n * 2, true);              // XOR + AND 兩倍高
      dv.setUint16(12, 1, true);
      dv.setUint16(14, 32, true);
      dv.setUint32(20, row * n + andSize, true);
      const u8 = new Uint8Array(buf);
      for (let y = 0; y < n; y++) {             // 像素自底向上、轉 BGRA
        const s = (n - 1 - y) * row, d = 40 + y * row;
        for (let x = 0; x < row; x += 4) {
          u8[d + x] = data[s + x + 2];
          u8[d + x + 1] = data[s + x + 1];
          u8[d + x + 2] = data[s + x];
          u8[d + x + 3] = data[s + x + 3];
        }
      }
      return buf;                               // AND mask 全零 = 交給 alpha
    };
    const entries = sizes.map((n) => ({ n, buf: bmp(n) }));
    const total = 6 + entries.length * 16 + entries.reduce((a, e) => a + e.buf.byteLength, 0);
    const out = new ArrayBuffer(total);
    const dv = new DataView(out);
    const u8 = new Uint8Array(out);
    dv.setUint16(0, 0, true);
    dv.setUint16(2, 1, true);
    dv.setUint16(4, entries.length, true);
    let offset = 6 + entries.length * 16;
    entries.forEach((e, i) => {
      const p = 6 + i * 16;
      dv.setUint8(p, e.n >= 256 ? 0 : e.n);
      dv.setUint8(p + 1, e.n >= 256 ? 0 : e.n);
      dv.setUint16(p + 4, 1, true);
      dv.setUint16(p + 6, 32, true);
      dv.setUint32(p + 8, e.buf.byteLength, true);
      dv.setUint32(p + 12, offset, true);
      u8.set(new Uint8Array(e.buf), offset);
      offset += e.buf.byteLength;
    });
    let bin = '';
    const bytes = new Uint8Array(out);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }, { svgSrc: svg.replace('<svg ', '<svg width="64" height="64" '), sizes: [16, 24, 32, 48, 64, 128, 256] });

  writeFileSync('src-tauri/icons/icon.ico', Buffer.from(icoB64, 'base64'));
  console.log('✓ icon.ico（16/24/32/48/64/128/256）');
} finally {
  await browser.close();
}
