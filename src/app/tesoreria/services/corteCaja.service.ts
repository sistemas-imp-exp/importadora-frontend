import api from "../../../shared/api/client";
import type { CorteCaja, CorteCajaApiResponse } from "../interfaces/movimientos/CorteCaja";
import { mapCorteCajaApiToCorteCaja } from "../interfaces/movimientos/CorteCaja";

const URL = "treasury/cortes/";

export async function obtenerCorteAbierto(): Promise<CorteCaja | null> {
    const { data } = await api.get<CorteCajaApiResponse[]>(URL);
    const cortesAbiertos = data.filter(c => !c.cerrado);

    if (cortesAbiertos.length > 1) {
        throw new Error("Error del servidor: se encontraron múltiples cajas abiertas simultáneamente.");
    }

    // ya NO lanzamos error si no hay corte abierto: es un estado válido,
    // significa "hoy toca abrir uno nuevo", no una falla.
    return cortesAbiertos.length === 1 ? mapCorteCajaApiToCorteCaja(cortesAbiertos[0]) : null;
}

export interface AbrirCorteRequest {
    fecha: string; // 'YYYY-MM-DD'
    // responsable_apertura_id: string;
    observaciones?: string;
}

export async function abrirCorte(payload: AbrirCorteRequest): Promise<CorteCaja> {
    const { data } = await api.post<CorteCajaApiResponse>(URL, payload);
    return mapCorteCajaApiToCorteCaja(data);
}

export async function cerrarCorte(id: number): Promise<CorteCaja> {
    // El físico por divisa ya no se manda desde el cliente: el servidor lo toma
    // del arqueo más reciente de este corte (o lo deja sin capturar si no hubo arqueo).
    // La hora de cierre también la calcula el servidor (timezone.now() en
    // America/Mexico_City) para no depender del reloj/zona del navegador.
    const { data } = await api.post<CorteCajaApiResponse>(`${URL}${id}/close/`, {});
    return mapCorteCajaApiToCorteCaja(data);
}

export async function obtenerCortes(): Promise<CorteCaja[]> {
    const { data } = await api.get<CorteCajaApiResponse[]>(URL);
    return data.map(mapCorteCajaApiToCorteCaja);
}

export async function obtenerCorte(id: number): Promise<CorteCaja> {
    const { data } = await api.get<CorteCajaApiResponse>(`${URL}${id}/`);
    return mapCorteCajaApiToCorteCaja(data);
}