import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
  plugins: [react(), versionGenerator()],
  base: '/QLSV/',
})
