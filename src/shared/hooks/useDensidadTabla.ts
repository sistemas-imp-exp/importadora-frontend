import { useState } from "react";

export type DensidadTabla = "normal" | "compacta";

/**
 * Densidad de filas de una tabla, recordada por pantalla en este navegador.
 * Es una preferencia de lectura (quien revisa cientos de registros quiere más
 * filas por pantalla), no un dato del negocio: por eso vive en localStorage.
 */
export function useDensidadTabla(clave: string): [DensidadTabla, (densidad: DensidadTabla) => void] {
    const llave = `densidad-tabla:${clave}`;
    const [densidad, setDensidad] = useState<DensidadTabla>(() => {
        try {
            return localStorage.getItem(llave) === "compacta" ? "compacta" : "normal";
        } catch {
            return "normal";
        }
    });

    function cambiar(nueva: DensidadTabla) {
        setDensidad(nueva);
        try {
            localStorage.setItem(llave, nueva);
        } catch {
            // Sin almacenamiento disponible la preferencia solo dura la sesión.
        }
    }

    return [densidad, cambiar];
}
