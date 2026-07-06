import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// Tự động tạo/cập nhật public/version.json mỗi khi build
const versionGenerator = () => {
  return {
    name: 'version-generator',
    buildStart() {
      const publicDir = path.resolve('public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(publicDir, 'version.json'),
        JSON.stringify({ version: Date.now() })
      );
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    versionGenerator(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },
      manifest: {
        name: 'Quản Lý Sinh Viên',
        short_name: 'QLSV',
        description: 'Phần mềm Quản lý Sinh viên',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      }
    })
  ],
  base: '/QLSV/',
})
