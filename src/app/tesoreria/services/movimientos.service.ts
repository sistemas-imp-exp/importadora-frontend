import client from "../../../shared/api/client";
import type { MovimientoApi, CrearMovimientoRequest, EventoHistorial } from "../interfaces/movimientos/Movimiento";

const URL = "treasury/movimientos/";

export interface FiltroFechasMovimientos {
    fecha?: string;  // un día exacto
    desde?: string;
    hasta?: string;
}

export async function obtenerMovimientos(filtro: FiltroFechasMovimientos = {}): Promise<MovimientoApi[]> {
    const { data } = await client.get<MovimientoApi[]>(URL, { params: filtro });
    return data;
}

export interface RangoFechas {
    desde: string; // 'YYYY-MM-DD'
    hasta: string;
}

/** Primera y última fecha con movimientos (hoy si no hay ninguno). */
export async function obtenerRangoMovimientos(): Promise<RangoFechas> {
    const { data } = await client.get<RangoFechas>(`${URL}rango/`);
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

export async function obtenerHistorialMovimiento(id: number): Promise<EventoHistorial[]> {
    const { data } = await client.get<EventoHistorial[]>(`${URL}${id}/historial/`);
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