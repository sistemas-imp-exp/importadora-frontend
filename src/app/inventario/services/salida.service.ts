import api from "../../../shared/api/client";
import type { SalidaApi, CrearSalidaRequest } from "../interfaces/salidas/Salida";
import type { RespuestaPaginada, ParamsPaginados } from "../../../shared/interfaces/Paginado";
import { construirParams } from "../../../shared/interfaces/Paginado";

const URL = "inventario/salidas/";

/** Listado paginado en el servidor: la tabla completa pesaba 2.4 MB por carga. */
export async function obtenerSalidas(params: ParamsPaginados = {}): Promise<RespuestaPaginada<SalidaApi>> {
    const { data } = await api.get<RespuestaPaginada<SalidaApi>>(URL, { params: construirParams(params) });
    return data;
}

export async function crearSalida(salida: CrearSalidaRequest): Promise<SalidaApi> {
    const { data } = await api.post<SalidaApi>(URL, salida);
    return data;
}

export async function actualizarSalida(id: number, salida: CrearSalidaRequest): Promise<SalidaApi> {
    const { data } = await api.put<SalidaApi>(`${URL}${id}/`, salida);
    return data;
}

export async function eliminarSalida(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
