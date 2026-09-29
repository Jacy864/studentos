// 校驗 design/design-tokens.json 與 src/index.css 的 CSS variables 同源（§12.1）
// 用法：node scripts/check-tokens.mjs
import { readFileSync } from 'node:fs';

const css = readFileSync('src/index.css', 'utf8');
const tokens = JSON.parse(readFileSync('design/design-tokens.json', 'utf8'));

const cssVars = {};
for (const m of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) cssVars[m[1]] = m[2].trim();

const tokenColors = Object.entries(tokens.color).map(([k, v]) => {
  const varName = k === 'tiffanyDeep' ? 'tiffany-deep' : k === 'tiffanyTint' ? 'tiffany-tint'
    : k === 'coralDeep' ? 'coral-deep' : k === 'coralTint' ? 'coral-tint' : k;
  return [varName, v.value.toUpperCase()];
});

let fail = 0;
for (const [name, value] of tokenColors) {
  const inCss = cssVars[name];
  if (!inCss) { console.error(`❌ tokens 有 ${name}，CSS variables 沒有`); fail++; continue; }
  if (inCss.toUpperCase() !== value) { console.error(`❌ ${name} 漂移：tokens=${value} css=${inCss}`); fail++; }
  else console.log(`✓ ${name} = ${value}`);
}

if (fail > 0) { console.error(`\n${fail} 項不同源，請同步後再提交`); process.exit(1); }
console.log('\ntokens 與 CSS variables 同源 ✓');
