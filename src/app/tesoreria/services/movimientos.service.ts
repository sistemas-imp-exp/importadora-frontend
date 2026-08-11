import client from "../../../shared/api/client";
import type { MovimientoApi, CrearMovimientoRequest} from "../interfaces/movimientos/Movimiento";

const URL = "treasury/movimientos/";

export async function obtenerMovimientos(corteId?: number): Promise<MovimientoApi[]> {
    const { data } = await client.get<MovimientoApi[]>(URL, {
        params: corteId ? { corte: corteId } : undefined,
    });
    return data;
}

export async function obtenerMovimiento(id: number): Promise<MovimientoApi> {
    const { data } = await client.get<MovimientoApi>(`${URL}${id}/`);
    return data;
}

export async function crearMovimiento(
    movimiento: CrearMovimientoRequest
): Promise<MovimientoApi> {
    const { data } = await client.post<MovimientoApi>(URL, movimiento);
    return data;
}

export async function actualizarMovimiento(
    id: number,
    movimiento: CrearMovimientoRequest
): Promise<MovimientoApi> {
    const { data } = await client.put<MovimientoApi>(
        `${URL}${id}/`,
        movimiento
    );

    return data;
}

export async function eliminarMovimiento(id: number): Promise<void> {
    await client.delete(`${URL}${id}/`);
}

export async function cancelarMovimiento(
    id: number,
    motivo: string
): Promise<MovimientoApi> {
    const { data } = await client.post<MovimientoApi>(`${URL}${id}/cancelar/`, {
        motivo,
    });
    return data;
}

export type CampoSugerencia = "beneficiario" | "autorizo" | "concepto";

export async function obtenerSugerencias(campo: CampoSugerencia, q: string): Promise<string[]> {
    const { data } = await client.get<string[]>(`${URL}sugerencias/`, {
        params: { campo, q },
    });
    return data;
}

export async function obtenerSiguienteFolio(tipo: "I" | "E"): Promise<string> {
    const { data } = await client.get<{ folio: string }>(`${URL}siguiente_folio/`, {
        params: { tipo },
    });
    return data.folio;
}