import path from 'node:path'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes' }),
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      includeAssets: [
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'logo.png',
        'pwa-192.png',
        'pwa-512.png',
        'icons.svg',
      ],
      manifest: {
        name: 'RCoach',
        short_name: 'RCoach',
        description: 'Coach sportif et suivi athlete',
        theme_color: '#F7F5FB',
        background_color: '#F7F5FB',
        display: 'standalone',
        start_url: '/app',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Main bundle exceeds Workbox default precache limit (2 MiB).
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.graphql\..*\.nhost\.run\/v1$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nhost-graphql',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@rcoach/capacitor-health-connect': path.resolve(
        __dirname,
        './packages/capacitor-health-connect/src/index.ts',
      ),
      '@rcoach/capacitor-wear-bridge': path.resolve(
        __dirname,
        './packages/capacitor-wear-bridge/src/index.ts',
      ),
    },
  },
  server: {
    proxy: {
      '/api/open-food-facts': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/open-food-facts/, ''),
        headers: {
          'User-Agent': 'RCoach/0.1 (contact: app@rcoach.local)',
        },
      },
      '/api/open-food-facts-search': {
        target: 'https://search.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/open-food-facts-search/, ''),
        headers: {
          'User-Agent': 'RCoach/0.1 (contact: app@rcoach.local)',
        },
      },
    },
  },
  preview: {
    proxy: {
      '/api/open-food-facts': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/open-food-facts/, ''),
        headers: {
          'User-Agent': 'RCoach/0.1 (contact: app@rcoach.local)',
        },
      },
      '/api/open-food-facts-search': {
        target: 'https://search.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/open-food-facts-search/, ''),
        headers: {
          'User-Agent': 'RCoach/0.1 (contact: app@rcoach.local)',
        },
      },
    },
  },
})
