import api from "../../../../shared/api/client";
import type { Rancho } from "../../interfaces/nomina/Rancho";

const URL = "treasury/ranchos/";

export async function obtenerRanchos(): Promise<Rancho[]> {
    const { data } = await api.get<Rancho[]>(URL);
    return data;
}

export async function crearRancho(rancho: Rancho): Promise<Rancho> {
    const { data } = await api.post<Rancho>(URL, rancho);
    return data;
}

export async function actualizarRancho(rancho: Rancho): Promise<Rancho> {
    const { data } = await api.put<Rancho>(`${URL}${rancho.id}/`, rancho);
    return data;
}

export async function eliminarRancho(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
