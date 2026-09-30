import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 用戶名下子路徑部署（§10.5）：https://<user>.github.io/studentos/
  base: '/studentos/',
  plugins: [
    react(),
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
        cleanupOutdatedCaches: true,   // 清掉舊版快取，避免磁盤膨脹
      },
    }),
  ],
})
