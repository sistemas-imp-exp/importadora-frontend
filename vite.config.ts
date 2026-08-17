import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // AdminLTE y Bootstrap usan @import y funciones de color legacy en su
        // propio SCSS (dentro de node_modules) — no es código nuestro que
        // podamos migrar; se silencian esas categorías hasta que AdminLTE
        // actualice su fuente a la sintaxis moderna de Sass.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
})
