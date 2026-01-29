import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin para suporte a navegadores antigos (Smart TVs, etc)
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 40', 'firefox >= 40', 'safari >= 9', 'opera >= 30'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: true,
      polyfills: [
        'es.promise',
        'es.promise.finally',
        'es.symbol',
        'es.symbol.iterator',
        'es.array.iterator',
        'es.object.assign',
        'es.object.keys',
        'es.object.entries',
        'es.object.values',
        'es.array.includes',
        'es.array.find',
        'es.array.find-index',
        'es.string.includes',
        'es.string.starts-with',
        'es.string.ends-with',
        'es.map',
        'es.set',
        'es.weak-map',
        'es.weak-set',
        'web.url',
        'web.url-search-params',
      ]
    })
  ],
  server: {
    host: true, // Libera o acesso via IP (útil para redes)
    port: 3000,
  },
  build: {
    // Compatibilidade com navegadores mais antigos
    target: 'es2015',
    // Gera sourcemaps para debug
    sourcemap: true,
    // Otimizações
    minify: 'terser',
    // Mantém logs para debug
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      }
    }
  }
})
