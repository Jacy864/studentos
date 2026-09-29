# StudentOS lite

私人、單人用的學生日程台 PWA：學校課表（**節次制＋週次制**，課程按週次自動出現/消失）＋ 個人任務。
無帳號、無後端、無雲端，資料只存瀏覽器 IndexedDB，隨時 JSON 匯出帶走。

- 設計：Tiffany 藍 × Claude 珊瑚 撞色系統（Tiffany 是結構的光，Coral 是情感的光）
- 主要設備：Xiaomi 15 Pro（412–480 CSS px）；桌面 ≥1200 為擴展體驗（完整週網格）
- 課表規則：學期 17 週，`weekOf()` 以學期起始日（預設 2026-09-07）推算

## 本地開發

```bash
npm install
npm run dev            # 開發伺服器
npm test               # 週次 fixture / 匯出匯入 roundtrip / 衝突檢測
npm run check:tokens   # design-tokens.json 與 CSS variables 同源校驗
```

瀏覽器驗收腳本（先 `npm run preview -- --port 4173` 另開終端，再跑）：

```bash
node scripts/m2-verify.mjs   # Today/Schedule 行為（412×914 實拍）
node scripts/m3-verify.mjs   # 任務三處同步 + 衝突警告
node scripts/m4-verify.mjs   # manifest / Service Worker / 斷網重開
```

## 構建與部署（GitHub Pages）

```bash
npm run build   # 產物在 dist/，vite base 已設 /studentos/
```

推送 `main` 後 GitHub Actions 自動構建部署（`.github/workflows/deploy.yml`）。
倉庫 Settings → Pages → Source 選 **GitHub Actions**（只需設一次）。
網址：`https://<user>.github.io/studentos/`

手機安裝：Chrome 打開網址 → 選單 →「添加到主屏幕 / 安裝應用」。

## Figma 導入三分鐘

設計稿要「看得見、改得動」，兩條路：

**1. Design tokens（顏色/間距/字號）**
`design/design-tokens.json` 是 W3C Design Tokens 格式，與代碼的 CSS variables 同源（`npm run check:tokens` 校驗）。
Figma 裝 **Design Tokens**（或 Tokens Studio）插件 → import 該 JSON → 一鍵生成 Color styles。改完 export 回 JSON 交給 agent 更新兩側。

**2. 真實頁面 → 可編輯圖層**
部署上線後，Figma 裝 **html.to.design** 插件 → 貼上網址 → mobile frame `412×914` → 導入。
Today / Schedule / Tasks 都能導成圖層化設計稿（非截圖），之後在 Figma 自由改。
改完的版面導出 SVG/PNG ＋一句話描述交回 agent 照圖改代碼；`.fig` 檔 agent 打不開。

## 資料安全

- 一切資料只在這台裝置的瀏覽器裡（IndexedDB），無任何上傳
- Settings → 資料 → 匯出 JSON = 完整備份；匯入前會強制自動備份現有資料
