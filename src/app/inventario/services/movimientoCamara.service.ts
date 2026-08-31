import api from "../../../shared/api/client";
import type { MovimientoCamaraApi, CrearMovimientoCamaraRequest } from "../interfaces/movimientos/MovimientoCamara";

const URL = "inventario/movimientos-camara/";

export async function obtenerMovimientos(): Promise<MovimientoCamaraApi[]> {
    const { data } = await api.get<MovimientoCamaraApi[]>(URL);
    return data;
}

export async function crearMovimiento(movimiento: CrearMovimientoCamaraRequest): Promise<MovimientoCamaraApi> {
    const { data } = await api.post<MovimientoCamaraApi>(URL, movimiento);
    return data;
}
