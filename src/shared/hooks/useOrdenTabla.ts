import { useMemo, useState } from "react";

export type DireccionOrden = "asc" | "desc";

export interface OrdenTabla<K extends string> {
    columna: K;
    direccion: DireccionOrden;
}

/** Cómo leer el valor por el que se ordena cada columna (null = sin dato). */
export type ValoresOrden<T, K extends string> = Record<K, (fila: T) => string | number | null>;

const comparadorTexto = new Intl.Collator("es-MX", { numeric: true, sensitivity: "base" });

/**
 * Orden por columna en el cliente: clic alterna ascendente → descendente →
 * sin orden (el del servidor). Los vacíos van siempre al final, en ambas
 * direcciones, para que no tapen los datos al ordenar. `valores` debe ser una
 * constante fuera del componente (es dependencia del memo).
 */
export function useOrdenTabla<T, K extends string>(filas: T[], valores: ValoresOrden<T, K>) {
    const [orden, setOrden] = useState<OrdenTabla<K> | null>(null);

    const ordenadas = useMemo(() => {
        if (!orden) return filas;
        const leer = valores[orden.columna];
        const signo = orden.direccion === "asc" ? 1 : -1;
        return [...filas].sort((a, b) => {
            const va = leer(a);
            const vb = leer(b);
            if (va === null || va === "") return vb === null || vb === "" ? 0 : 1;
            if (vb === null || vb === "") return -1;
            const resultado =
                typeof va === "number" && typeof vb === "number"
                    ? va - vb
                    : comparadorTexto.compare(String(va), String(vb));
            return resultado * signo;
        });
    }, [filas, orden, valores]);

    function alternar(columna: K) {
        setOrden((actual) => {
            if (actual?.columna !== columna) return { columna, direccion: "asc" };
            return actual.direccion === "asc" ? { columna, direccion: "desc" } : null;
        });
    }

    return { ordenadas, orden, alternar };
}
