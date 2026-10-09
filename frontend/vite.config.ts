import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiProxy = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8765'

  return {
    build: {
      minify: 'oxc',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: (moduleId: string) => {
            const id = moduleId.replaceAll('\\', '/')
            if (!id.includes('/node_modules/')) return null
            if (/\/node_modules\/(@reduxjs\/toolkit|react-redux)\//.test(id)) return 'redux'
            if (/\/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return 'vendor'
            return null
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'WorkSphere',
          short_name: 'WorkSphere',
          description: 'WorkSphere HR workspace — works offline on mobile',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes('/api/mobile/offline-data'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'worksphere-offline-bundle',
                expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 },
                networkTimeoutSeconds: 8,
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'worksphere-api',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 30 },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
    ],
    optimizeDeps: {
      include: ['laravel-echo', 'pusher-js'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxy,
          changeOrigin: true,
        },
      },
    },
  }
})
