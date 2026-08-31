import api from "../../../shared/api/client";
import type { EntradaApi, CrearEntradaRequest } from "../interfaces/entradas/Entrada";

const URL = "inventario/entradas/";

export async function obtenerEntradas(): Promise<EntradaApi[]> {
    const { data } = await api.get<EntradaApi[]>(URL);
    return data;
}

export async function crearEntrada(entrada: CrearEntradaRequest): Promise<EntradaApi> {
    const { data } = await api.post<EntradaApi>(URL, entrada);
    return data;
}

export async function actualizarEntrada(id: number, entrada: CrearEntradaRequest): Promise<EntradaApi> {
    const { data } = await api.put<EntradaApi>(`${URL}${id}/`, entrada);
    return data;
}

export async function eliminarEntrada(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
