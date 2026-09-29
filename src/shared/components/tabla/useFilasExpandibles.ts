import { useState } from "react";

/** Qué filas maestras de una tabla están desplegadas (patrón maestro-detalle). */
export function useFilasExpandibles(idsVisibles: number[]) {
    const [expandidas, setExpandidas] = useState<Set<number>>(new Set());

    const todasExpandidas = idsVisibles.length > 0 && idsVisibles.every((id) => expandidas.has(id));

    function alternar(id: number) {
        setExpandidas((actual) => {
            const copia = new Set(actual);
            if (copia.has(id)) copia.delete(id);
            else copia.add(id);
            return copia;
        });
    }

    function alternarTodas() {
        setExpandidas(todasExpandidas ? new Set() : new Set(idsVisibles));
    }

    return { estaExpandida: (id: number) => expandidas.has(id), alternar, alternarTodas, todasExpandidas };
}
