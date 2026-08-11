import axios from "axios";


export function obtenerMensajeError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (data?.detail) {
            return data.detail;
        }

        if (typeof data === "object" && data !== null) {
            const mensaje = extraerPrimerMensaje(data);
            if (mensaje) return mensaje;
        }

        if (error.request && !error.response) {
            return "No hay conexión con el servidor.";
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Ocurrió un error inesperado.";
}

// Recorre estructuras anidadas (objetos y arrays) hasta encontrar el primer string
function extraerPrimerMensaje(valor: unknown): string | null {
    if (typeof valor === "string") return valor;

    if (Array.isArray(valor)) {
        for (const item of valor) {
            const mensaje = extraerPrimerMensaje(item);
            if (mensaje) return mensaje;
        }
        return null;
    }

    if (typeof valor === "object" && valor !== null) {
        for (const val of Object.values(valor)) {
            const mensaje = extraerPrimerMensaje(val);
            if (mensaje) return mensaje;
        }
        return null;
    }

    return null;
}