import api from "../../../shared/api/client";
import type { MovimientoCamaraApi, CrearMovimientoCamaraRequest } from "../interfaces/movimientos/MovimientoCamara";

const URL = "inventario/movimientos-camara/";

export async function obtenerMovimientos(): Promise<MovimientoCamaraApi[]> {
    const { data } = await api.get<MovimientoCamaraApi[]>(URL);
    return data;
}

/** Recibo de ingreso de la mercancía en la cámara destino; vacío vuelve al heredado. */
export async function editarReciboMovimiento(id: number, recibo: string): Promise<MovimientoCamaraApi> {
    const { data } = await api.patch<MovimientoCamaraApi>(`${URL}${id}/recibo/`, { recibo });
    return data;
}

export async function crearMovimiento(movimiento: CrearMovimientoCamaraRequest): Promise<MovimientoCamaraApi> {
    const { data } = await api.post<MovimientoCamaraApi>(URL, movimiento);
    return data;
}
