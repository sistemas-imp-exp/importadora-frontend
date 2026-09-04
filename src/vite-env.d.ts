/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * URL base del API. Si no se define, se usa el loopback (127.0.0.1).
     *
     * Importa que el default sea loopback y no la IP de la LAN: el navegador
     * salta la resolución de proxy para localhost/127.0.0.1, pero no para una
     * IP de red, así que apuntar a la LAN hace que cada petición dependa de
     * WPAD y del DNS — y se vuelve lenta cuando la red lo está.
     */
    readonly VITE_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
