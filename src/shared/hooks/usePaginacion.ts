import { useState } from "react";

/**
 * Paginación de datos ya en memoria (client-side). `resetKey` identifica el
 * estado de búsqueda/filtros de la tabla (ej. `${busqueda}|${filtro}`):
 * cuando cambia, regresa a la página 1.
 */
export function usePaginacion(totalItems: number, porPagina: number, resetKey: string | number) {
    const [pagina, setPagina] = useState(1);
    const [claveAnterior, setClaveAnterior] = useState(resetKey);

    // Patrón recomendado por React para "resetear" estado cuando algo cambia:
    // ajustarlo durante el render, no en un useEffect (evita el re-render extra).
    if (resetKey !== claveAnterior) {
        setClaveAnterior(resetKey);
        setPagina(1);
    }

    const totalPaginas = Math.max(1, Math.ceil(totalItems / porPagina));
    const paginaSegura = Math.min(Math.max(pagina, 1), totalPaginas);
    const inicio = (paginaSegura - 1) * porPagina;
    const fin = inicio + porPagina;

    return { pagina: paginaSegura, setPagina, totalPaginas, inicio, fin };
}
