import api from "../../../shared/api/client";
import type { Divisa } from "../interfaces/divisas/Divisa";

const URL = "treasury/divisas/";

export async function obtenerDivisas(): Promise<Divisa[]> {
    const { data } = await api.get<Divisa[]>(URL);
    return data;
}

export async function obtenerDivisa(id: number): Promise<Divisa> {
    const { data } = await api.get<Divisa>(`${URL}${id}/`);
    return data;
}

export async function crearDivisa(divisa: Divisa): Promise<Divisa> {
    const { data } = await api.post<Divisa>(URL, divisa);
    return data;
}

export async function actualizarDivisa(divisa: Divisa): Promise<Divisa> {
    const { data } = await api.put<Divisa>(`${URL}${divisa.id}/`, divisa);
    return data;
}

export async function eliminarDivisa(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}