import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType  : 'prompt',
      srcDir        : 'src',
      filename      : 'sw.ts',
      strategies    : 'injectManifest', 
      injectManifest: {
        swSrc : 'src/sw.ts',
        swDest: 'sw.js',
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      
      // Service Worker Strategy
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        
        // Cache strategies per route
        runtimeCaching: [
          // API: menus (cacheable, jarang berubah)
          {
            urlPattern: /^https?:\/\/.*\/api\/menus/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-menus-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 jam
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // API: orders (network first, fallback cache)
          {
            urlPattern: /^https?:\/\/.*\/api\/(customer|cashier|courier|manager)\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-dynamic-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60, // 1 jam
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          // Static assets
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
              },
            },
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 tahun
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      // PWA Manifest
      manifest: {
        name: 'POS Delivery Order',
        short_name: 'POS App',
        description: 'Aplikasi POS dan Delivery Order',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: 'icons/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: 'icons/android-icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'icons/android-icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: 'icons/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Buat Pesanan',
            short_name: 'Pesan',
            description: 'Buat pesanan baru',
            url: '/cashier/orders/new',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }],
          },
          {
            name: 'Menu',
            short_name: 'Menu',
            description: 'Lihat daftar menu',
            url: '/customer/menu',
            icons: [{ src: 'icons/icon-96x96.png', sizes: '96x96' }],
          },
        ],
      },

      // Dev options
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
    server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
