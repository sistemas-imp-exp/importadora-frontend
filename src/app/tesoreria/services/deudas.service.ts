import client from "../../../shared/api/client";
import { descargarBlob } from "../../../shared/utils/descargarArchivo";
import type { Deuda, DeudaRequest, Deudor, DeudorRequest, EstadoDeuda } from "../interfaces/deudas/Deuda";

const URL_DEUDORES = "treasury/deudores/";
const URL_DEUDAS = "treasury/deudas/";

export interface FiltroDeudores {
    q?: string;
    activo?: boolean;
    con_deuda_abierta?: boolean;
}

export async function obtenerDeudores(filtro: FiltroDeudores = {}): Promise<Deudor[]> {
    const { data } = await client.get<Deudor[]>(URL_DEUDORES, { params: filtro });
    return data;
}

export async function crearDeudor(deudor: DeudorRequest): Promise<Deudor> {
    const { data } = await client.post<Deudor>(URL_DEUDORES, deudor);
    return data;
}

export async function actualizarDeudor(id: number, deudor: DeudorRequest): Promise<Deudor> {
    const { data } = await client.put<Deudor>(`${URL_DEUDORES}${id}/`, deudor);
    return data;
}

export async function descargarEstadoCuenta(deudor: Deudor, formato: "pdf" | "excel"): Promise<void> {
    const pdf = formato === "pdf";
    await descargarBlob(
        `${URL_DEUDORES}${deudor.id}/estado-cuenta/${formato}/`,
        pdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `estado_cuenta_${deudor.id}.${pdf ? "pdf" : "xlsx"}`,
    );
}

export interface FiltroDeudas {
    deudor?: number;
    estado?: EstadoDeuda;
    q?: string;
}

export async function obtenerDeudas(filtro: FiltroDeudas = {}): Promise<Deuda[]> {
    const { data } = await client.get<Deuda[]>(URL_DEUDAS, { params: filtro });
    return data;
}

export async function obtenerDeuda(id: number): Promise<Deuda> {
    const { data } = await client.get<Deuda>(`${URL_DEUDAS}${id}/`);
    return data;
}

export async function crearDeuda(deuda: DeudaRequest): Promise<Deuda> {
    const { data } = await client.post<Deuda>(URL_DEUDAS, deuda);
    return data;
}

export async function actualizarDeuda(id: number, deuda: DeudaRequest): Promise<Deuda> {
    const { data } = await client.put<Deuda>(`${URL_DEUDAS}${id}/`, deuda);
    return data;
}

export async function cancelarDeuda(id: number, motivo: string): Promise<Deuda> {
    const { data } = await client.post<Deuda>(`${URL_DEUDAS}${id}/cancelar/`, { motivo });
    return data;
}
