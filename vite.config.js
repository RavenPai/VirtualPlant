import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const BACKGROUND_GIFS = {
  '/backgrounds/clear-day.gif': 'background-gifs/normal-day.gif',
  '/backgrounds/clear-night.gif': 'background-gifs/normal-night.gif',
  '/backgrounds/rain-day.gif': 'background-gifs/rainy-day.gif',
  '/backgrounds/rain-night.gif': 'background-gifs/rainy-night.gif',
  '/backgrounds/snow-day.gif': 'background-gifs/snow-day.gif',
  '/backgrounds/snow-night.gif': 'background-gifs/snow-night.gif',
}

function serveBackgroundGifs() {
  return {
    name: 'serve-background-gifs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        const rel = BACKGROUND_GIFS[url]
        if (!rel) return next()
        const file = path.resolve(rel)
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/gif')
        fs.createReadStream(file).on('error', next).pipe(res)
      })
    },
    writeBundle(options) {
      const destDir = path.join(options.dir, 'backgrounds')
      fs.mkdirSync(destDir, { recursive: true })
      for (const [url, rel] of Object.entries(BACKGROUND_GIFS)) {
        fs.copyFileSync(path.resolve(rel), path.join(destDir, url.split('/').pop()))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), serveBackgroundGifs()],
  server: {
    watch: {
      ignored: ['**/background-gifs/**'],
    },
  },
})
