import api from "../../../shared/api/client";
import type { CajaDiaApi, DiaHistorialApi, SaldoInicialApi } from "../interfaces/caja/Caja";

const URL_CAJA = "treasury/caja/";
const URL_SALDOS_INICIALES = "treasury/saldos-iniciales/";

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

export async function obtenerSaldosIniciales(): Promise<SaldoInicialApi[]> {
    const { data } = await api.get<SaldoInicialApi[]>(URL_SALDOS_INICIALES);
    return data;
}

/** Solo superusuario. Devuelve el listado completo ya actualizado. */
export async function guardarSaldosIniciales(saldos: { divisa_id: number; monto: string }[]): Promise<SaldoInicialApi[]> {
    const { data } = await api.post<SaldoInicialApi[]>(URL_SALDOS_INICIALES, { saldos });
    return data;
}
