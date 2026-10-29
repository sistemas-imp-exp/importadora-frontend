import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  // En desarrollo el navegador habla con /api/ del mismo origen (igual que en
  // producción con IIS) y Vite lo reenvía al backend. Así la cookie del refresh
  // token (SameSite=Strict, solo /api/auth/) funciona sin CORS ni credenciales
  // cruzadas. VITE_API_URL (.env.local) solo elige a qué backend reenviar.
  const backend = env.VITE_API_URL ? new URL(env.VITE_API_URL).origin : 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    // Sin esto Vite solo escucha en localhost y el `dev` no es alcanzable desde
    // otros equipos de la red (hoy había que acordarse de pasar --host).
    server: {
      host: true,
      proxy: {
        '/api': { target: backend, changeOrigin: false, xfwd: true },
        '/media': { target: backend, changeOrigin: false },
      },
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
  }
})
