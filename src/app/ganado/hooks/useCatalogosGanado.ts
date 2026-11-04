import { useCallback, useEffect, useState } from "react";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import type { Categoria, Especie, Rancho } from "../interfaces/Ganado";
import { obtenerCategorias, obtenerEspecies, obtenerRanchos } from "../services/ganado.service";

/** Ranchos, especies y categorías; `recargar` después de editar un catálogo. */
export function useCatalogosGanado(onError?: (mensaje: string) => void) {
    const [ranchos, setRanchos] = useState<Rancho[]>([]);
    const [especies, setEspecies] = useState<Especie[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);

    const recargar = useCallback(async () => {
        try {
            const [r, e, c] = await Promise.all([obtenerRanchos(), obtenerEspecies(), obtenerCategorias()]);
            setRanchos(r);
            setEspecies(e);
            setCategorias(c);
        } catch (err) {
            onError?.(obtenerMensajeError(err));
        } finally {
            setCargando(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const temporizador = setTimeout(recargar, 0);
        return () => clearTimeout(temporizador);
    }, [recargar]);

    return { ranchos, especies, categorias, cargando, recargar };
}
