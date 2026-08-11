import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'admin-lte/dist/css/adminlte.min.css'

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