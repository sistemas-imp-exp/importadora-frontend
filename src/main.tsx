import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/ibm-plex-mono/700.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.scss'

import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// import 'admin-lte/dist/js/adminlte.js'

import './index.css'
import App from './App.tsx'
import './shared/config/dayjsConfig';
import { AuthProvider } from "./shared/context/AuthProvider";
import { ToastProvider } from "./shared/context/ToastProvider";
import { LayoutProvider } from "./shared/context/LayoutContext";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <LayoutProvider>
          <App />
        </LayoutProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)