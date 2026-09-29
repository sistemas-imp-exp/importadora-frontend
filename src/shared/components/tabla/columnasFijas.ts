import type { CSSProperties } from "react";

/**
 * Estilos de columnas fijas a la izquierda (`.fija-izq` en index.css). Cada
 * columna necesita un ancho fijo para calcular el `left` de la siguiente;
 * con box-sizing border-box (Bootstrap) el ancho ya incluye el padding.
 *
 *   const [expandir, fecha, folio] = columnasFijas(["2.5rem", "6.5rem", "9rem"]);
 */
export function columnasFijas(anchos: string[]): CSSProperties[] {
    const estilos: CSSProperties[] = [];
    let izquierda: string[] = [];
    for (const ancho of anchos) {
        estilos.push({
            left: izquierda.length ? `calc(${izquierda.join(" + ")})` : 0,
            width: ancho,
            minWidth: ancho,
            maxWidth: ancho,
        });
        izquierda = [...izquierda, ancho];
    }
    return estilos;
}
