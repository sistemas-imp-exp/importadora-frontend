import api from "../../../shared/api/client";
import type { ExistenciaApi } from "../interfaces/existencias/Existencia";

const URL = "inventario/existencias/";

/**
 * Foto del inventario disponible.
 *
 * `salidaId` incluye además los lotes que esa salida ya consumió (aunque estén
 * en cero), necesario al editarla para poder ver y ajustar sus propias líneas.
 */
export async function obtenerExistencias(salidaId?: number): Promise<ExistenciaApi[]> {
    const params = new URLSearchParams();
    if (salidaId) params.set("salida", String(salidaId));

    const { data } = await api.get<ExistenciaApi[]>(URL, { params });
    return data;
}
