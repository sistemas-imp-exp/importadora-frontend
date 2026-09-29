import api from "../../../shared/api/client";
import type { AperturaApi, CajaDiaApi, DiaHistorialApi, GuardarAperturaRequest } from "../interfaces/caja/Caja";

const URL_CAJA = "treasury/caja/";
const URL_APERTURAS = "treasury/aperturas/";

/** Saldos por divisa y movimientos de un día ('YYYY-MM-DD'; sin fecha = hoy). */
export async function obtenerCajaDia(fecha?: string): Promise<CajaDiaApi> {
    const { data } = await api.get<CajaDiaApi>(`${URL_CAJA}dia/`, { params: fecha ? { fecha } : undefined });
    return data;
}

/** Días con actividad entre dos fechas, del más reciente al más antiguo. */
export async function obtenerHistorialCaja(desde: string, hasta: string): Promise<DiaHistorialApi[]> {
    const { data } = await api.get<DiaHistorialApi[]>(`${URL_CAJA}historial/`, { params: { desde, hasta } });
    return data;
}

export async function obtenerAperturas(): Promise<AperturaApi[]> {
    const { data } = await api.get<AperturaApi[]>(URL_APERTURAS);
    return data;
}

export async function crearApertura(apertura: GuardarAperturaRequest): Promise<AperturaApi> {
    const { data } = await api.post<AperturaApi>(URL_APERTURAS, apertura);
    return data;
}

export async function actualizarApertura(id: number, apertura: GuardarAperturaRequest): Promise<AperturaApi> {
    const { data } = await api.put<AperturaApi>(`${URL_APERTURAS}${id}/`, apertura);
    return data;
}

export async function eliminarApertura(id: number): Promise<void> {
    await api.delete(`${URL_APERTURAS}${id}/`);
}
