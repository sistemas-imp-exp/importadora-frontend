/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Backend al que el servidor de Vite reenvía /api/ en desarrollo (ver
     * vite.config.ts). Si no se define, 127.0.0.1:8000. El navegador siempre
     * usa /api/ del mismo origen, en desarrollo y en producción.
     */
    readonly VITE_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
