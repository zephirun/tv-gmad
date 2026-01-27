import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin para suporte a navegadores antigos (Smart TVs, etc)
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 49', 'firefox >= 52', 'safari >= 10'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      polyfills: [
        'es.promise',
        'es.promise.finally',
        'es.symbol',
        'es.array.iterator',
        'es.object.assign',
        'es.object.keys',
        'es.array.includes',
        'es.string.includes',
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
    sourcemap: false,
    // Otimizações
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  }
})
