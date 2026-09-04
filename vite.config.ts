import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Sin esto Vite solo escucha en localhost y el `dev` no es alcanzable desde
  // otros equipos de la red (hoy había que acordarse de pasar --host).
  server: {
    host: true,
  },
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
