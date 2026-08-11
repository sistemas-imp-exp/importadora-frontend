import api from "../../../../shared/api/client";
import type { Puesto } from "../../interfaces/nomina/Puesto";

const URL = "treasury/puestos/";

export async function obtenerPuestos(): Promise<Puesto[]> {
    const { data } = await api.get<Puesto[]>(URL);
    return data;
}

export async function crearPuesto(puesto: Puesto): Promise<Puesto> {
    const { data } = await api.post<Puesto>(URL, puesto);
    return data;
}

export async function actualizarPuesto(puesto: Puesto): Promise<Puesto> {
    const { data } = await api.put<Puesto>(`${URL}${puesto.id}/`, puesto);
    return data;
}

export async function eliminarPuesto(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
