import api from "../../../shared/api/client";
import { descargarBlob } from "../../../shared/utils/descargarArchivo";
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

/** La tabla completa en Excel (sin paginar), con la misma búsqueda que la pantalla. */
export async function descargarSalidasExcel(busqueda: string): Promise<void> {
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set("busqueda", busqueda.trim());
    await descargarBlob(`${URL}excel/`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "salidas.xlsx", params);
}

export interface SalidaDeRecibo {
    id: number;
    salida_id: number;
    fecha: string;
    folio_de_salida: string | null;
    folio_retiro: string | null;
    // null en un traslado a otra cámara.
    cliente: string | null;
    talla: string;
    tipo: string;
    camara: string;
    cajas: number;
    total_kilos: string;
    notas: string;
}

/** Salidas que ha tenido un recibo de ingreso (ventas, retiros y traslados), una fila por línea. */
export async function obtenerSalidasDeRecibo(recibo: string): Promise<{ recibo: string; total_kilos: string; lineas: SalidaDeRecibo[] }> {
    const { data } = await api.get(`${URL}por-recibo/`, { params: { recibo } });
    return data;
}
