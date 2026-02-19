import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import localApiPlugin from './vite-local-api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    localApiPlugin(),
    // Plugin para suporte a navegadores antigos (Smart TVs / WebOS)
    legacy({
      targets: ['chrome >= 38', 'safari >= 9', 'firefox >= 40', 'opera >= 25'],
      additionalLegacyPolyfills: [
        'regenerator-runtime/runtime',
        'whatwg-fetch'
      ],
      renderLegacyChunks: true,
      modernPolyfills: false,
      polyfills: [
        'es.promise',
        'es.promise.finally',
        'es.object.assign',
        'es.array.includes',
        'es.array.find',
        'es.string.includes',
        'es.map',
        'es.set',
      ]
    })
  ],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    target: 'es2015',
    // Sourcemap desativado em prod para build mais rápido
    // (ative com SOURCEMAP=true se precisar debugar)
    sourcemap: process.env.SOURCEMAP === 'true',
    // esbuild é ~10x mais rápido que terser
    minify: 'esbuild',
    esbuildOptions: {
      // Mantém console.log para debug no WebOS
      drop: [],
    },
    rollupOptions: {
      output: {
        // Divide o bundle em chunks menores para cache melhor
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    }
  }
})
