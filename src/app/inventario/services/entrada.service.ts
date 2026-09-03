import api from "../../../shared/api/client";
import type { EntradaApi, CrearEntradaRequest } from "../interfaces/entradas/Entrada";
import type { RespuestaPaginada, ParamsPaginados } from "../../../shared/interfaces/Paginado";
import { construirParams } from "../../../shared/interfaces/Paginado";

const URL = "inventario/entradas/";

/** Listado paginado en el servidor: la tabla completa pesaba 2 MB por carga. */
export async function obtenerEntradas(params: ParamsPaginados = {}): Promise<RespuestaPaginada<EntradaApi>> {
    const { data } = await api.get<RespuestaPaginada<EntradaApi>>(URL, { params: construirParams(params) });
    return data;
}

export interface EntradaResumen {
    id: number;
    fecha: string;
    proveedor: string;
    factura: string;
    editado: boolean;
}

/** Lista ligera (sin lotes) para selectores que necesitan todas las entradas. */
export async function obtenerResumenEntradas(): Promise<EntradaResumen[]> {
    const { data } = await api.get<EntradaResumen[]>(`${URL}resumen/`);
    return data;
}

export async function obtenerEntrada(id: number): Promise<EntradaApi> {
    const { data } = await api.get<EntradaApi>(`${URL}${id}/`);
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
