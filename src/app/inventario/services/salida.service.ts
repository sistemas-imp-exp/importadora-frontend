import api from "../../../shared/api/client";
import type { SalidaApi, CrearSalidaRequest } from "../interfaces/salidas/Salida";

const URL = "inventario/salidas/";

export async function obtenerSalidas(): Promise<SalidaApi[]> {
    const { data } = await api.get<SalidaApi[]>(URL);
    return data;
}

export async function crearSalida(salida: CrearSalidaRequest): Promise<SalidaApi> {
    const { data } = await api.post<SalidaApi>(URL, salida);
    return data;
}
