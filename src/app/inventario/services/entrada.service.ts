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
