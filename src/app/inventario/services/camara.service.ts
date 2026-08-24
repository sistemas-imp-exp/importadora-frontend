import api from "../../../shared/api/client";
import type { Camara } from "../interfaces/camaras/Camara";

const URL = "inventario/camaras/";

export async function obtenerCamaras(): Promise<Camara[]> {
    const { data } = await api.get<Camara[]>(URL);
    return data;
}

export async function crearCamara(camara: Camara): Promise<Camara> {
    const { data } = await api.post<Camara>(URL, camara);
    return data;
}

export async function actualizarCamara(camara: Camara): Promise<Camara> {
    const { data } = await api.put<Camara>(`${URL}${camara.id}/`, camara);
    return data;
}
