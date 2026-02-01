import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import prerender from '@prerenderer/rollup-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // Build-time prerendering for public marketing routes (SSG). This generates
        // real HTML at build time while keeping the SPA behavior + hydration.
        prerender({
          routes: [
            '/',
            '/features',
            '/how-it-works',
            '/pricing',
            '/faq',
            '/get-started',
            '/demo/jetbiz',
            '/demo/jetviz',
            '/savings',
            '/contact'
          ],
          renderer: '@prerenderer/renderer-jsdom',
          rendererOptions: {
            // Wait until the app signals it's ready to snapshot.
            renderAfterDocumentEvent: 'prerender-ready',
          },
        }) as any,
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: undefined,
          }
        }
      }
    };
});