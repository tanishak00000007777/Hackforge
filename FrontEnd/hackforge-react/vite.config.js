import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const studioSrc = fileURLToPath(new URL('../EditorWindow/src', import.meta.url))

/* Tailwind v4 emits its whole default theme onto `:root,:host`. Five of those
 * names (--radius-sm/md/lg/full, --font-mono) are also defined by this app's
 * index.css with different values, and the studio's stylesheet loads last, so
 * Tailwind would silently reshape every radius in the organizer dashboard.
 *
 * Rewriting the one selector to `.studio-root` confines the whole theme block
 * instead of patching the names we happen to collide on today. All
 * @tailwindcss/vite plugins are enforce:"pre", so a post transform sees their
 * generated CSS on the serve path; build substitutes after the transform
 * chain, so the emitted asset has to be patched separately. */
function scopeTailwindTheme(selector = ':where(.studio-root, .lovable-canvas-root)') {
  const SCOPED = /:root\s*,\s*:host/g
  return {
    name: 'hackforge:scope-tailwind-theme',
    enforce: 'post',
    transform(code, id) {
      if (!id.includes('.css') || !SCOPED.test(code)) return null
      return { code: code.replace(SCOPED, selector), map: null }
    },
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) continue
        asset.source = String(asset.source).replace(SCOPED, selector)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), scopeTailwindTheme()],
  resolve: {
    // The website studio lives in ../EditorWindow and imports itself as `@/…`.
    // Aliasing rather than copying keeps one source of truth for its 300+ files.
    alias: { '@': studioSrc },
    // Studio files sit outside this package, so a bare `react` import there
    // could resolve to EditorWindow/node_modules and give us a second React
    // copy -- which breaks every hook with "Invalid hook call".
    dedupe: ['react', 'react-dom', 'react-router-dom', 'zustand'],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    // Vite refuses to serve files outside the project root without this.
    fs: { allow: ['..'] },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
