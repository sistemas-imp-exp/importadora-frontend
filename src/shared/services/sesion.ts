import axios from "axios";
import type { SesionResponse } from "../interfaces/auth";

/**
 * Sesión del navegador:
 * - El access token vive solo en memoria (nunca en localStorage): si alguien
 *   lograra inyectar código en la página no encontraría tokens guardados.
 * - El refresh token lo guarda el navegador en una cookie httpOnly que el
 *   código no puede leer; se manda solo a /api/auth/.
 * Recargar la página pide un access nuevo con esa cookie (renovarSesion).
 */

// Siempre el mismo origen: en producción IIS reenvía /api/ a waitress y en
// desarrollo lo hace el proxy de Vite (vite.config.ts).
export const BASE_URL = "/api/";

let accessToken: string | null = null;

export const sesion = {
    getAccess: () => accessToken,
    setAccess: (token: string | null) => {
        accessToken = token;
    },
};

// Sin interceptores: renovar nunca debe pasar por el interceptor de "api".
const authClient = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
});

let renovando: Promise<SesionResponse> | null = null;

/** Pide un access nuevo con la cookie. Varias llamadas a la vez comparten la misma petición. */
export function renovarSesion(): Promise<SesionResponse> {
    if (!renovando) {
        renovando = authClient
            .post<SesionResponse>("auth/refresh/")
            .then(({ data }) => {
                accessToken = data.access;
                return data;
            })
            .finally(() => {
                renovando = null;
            });
    }
    return renovando;
}

export type MotivoSalida = "manual" | "inactividad" | "expirada";

const CLAVE_SALIDA = "sesion_cerrada";
const CLAVE_MOTIVO = "motivo_salida";

/** Anula el refresh en el servidor, borra la cookie y avisa a las demás pestañas. */
export async function cerrarSesionServidor(motivo: MotivoSalida = "manual") {
    try {
        await authClient.post("auth/logout/", { motivo });
    } catch {
        // Aunque falle la red, localmente la sesión se cierra igual.
    }
    terminarSesionLocal(motivo);
}

export function terminarSesionLocal(motivo: MotivoSalida) {
    accessToken = null;
    try {
        sessionStorage.setItem(CLAVE_MOTIVO, motivo);
        localStorage.setItem(CLAVE_SALIDA, String(Date.now()));
    } catch {
        // Almacenamiento bloqueado: solo se pierde el aviso entre pestañas.
    }
}

/** Para el login: por qué se cerró la sesión. */
export function leerMotivoSalida(): MotivoSalida | null {
    try {
        return sessionStorage.getItem(CLAVE_MOTIVO) as MotivoSalida | null;
    } catch {
        return null;
    }
}

export function limpiarMotivoSalida() {
    try {
        sessionStorage.removeItem(CLAVE_MOTIVO);
    } catch {
        // sin almacenamiento disponible
    }
}

/** Otra pestaña cerró sesión. */
export function alCerrarseEnOtraPestana(callback: () => void) {
    function escuchar(e: StorageEvent) {
        if (e.key === CLAVE_SALIDA) callback();
    }
    window.addEventListener("storage", escuchar);
    return () => window.removeEventListener("storage", escuchar);
}

// Versiones anteriores guardaban los tokens y el usuario en localStorage.
try {
    ["ACCESS_TOKEN", "REFRESH_TOKEN", "USER"].forEach((clave) => localStorage.removeItem(clave));
} catch {
    // sin almacenamiento disponible
}
