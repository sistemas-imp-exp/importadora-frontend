import api from "../../../shared/api/client";
import type { Area } from "../interfaces/Area";

const URL = "security/areas/";

export async function obtenerAreas(): Promise<Area[]> {
    const { data } = await api.get<Area[]>(URL);
    return data;
}

export async function crearArea(area: Area): Promise<Area> {
    const { data } = await api.post<Area>(URL, area);
    return data;
}

export async function actualizarArea(area: Area): Promise<Area> {
    const { data } = await api.put<Area>(`${URL}${area.id}/`, area);
    return data;
}

export async function eliminarArea(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
