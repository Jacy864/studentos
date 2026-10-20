import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Tauri 桌面殼構建（tauri CLI 會設 TAURI_ENV*）：本地資源不需要 SW/離線緩存，
// 且殼內從根路徑提供服務，base 必須相對（Pages 子路徑部署只走瀏覽器版）
const isTauri = !!(process.env.TAURI_ENV || process.env.TAURI_ENV_PLATFORM || process.env.TAURI_ENV_TARGET_TRIPLE)

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 用戶名下子路徑部署（§10.5）：https://<user>.github.io/studentos/
  base: isTauri ? './' : '/studentos/',
  plugins: [
    react(),
    ...(isTauri
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'StudentOS lite',
              short_name: 'StudentOS',
              description: '私人學生日程台：課表（週次制）+ 任務',
              lang: 'zh',
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#FBF8F4',
              theme_color: '#FBF8F4',
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
              // SW 預快取由 content hash 處理（§10.4），部署新版自動失效
              // 註：navigationPreload 實測不適用——它是給 NetworkFirst 導航用的，
              // 我們的導航由 precache 秒回，加了反而竸爭快取路由（workbox 直接拒絕構建）
              cleanupOutdatedCaches: true, // 清掉舊版快取，避免磁盤膨脹
            },
          }),
        ]),
  ],
})
