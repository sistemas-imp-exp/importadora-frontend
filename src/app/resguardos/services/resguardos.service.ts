import api from "../../../shared/api/client";
import { construirParams, type ParamsPaginados } from "../../../shared/interfaces/Paginado";
import type { ExistenciaApi } from "../../inventario/interfaces/existencias/Existencia";
import type { CrearRetiroRequest, RespuestaResguardos, Retiro } from "../interfaces/Resguardo";

// Ruta propia (no /inventario/ ni /cartera/): la usan las dos áreas.
const URL = "resguardos/";

export interface FiltrosResguardos extends ParamsPaginados {
    estado: "pendiente" | "entregado" | "todos";
    clienteId: number | "";
}

export async function obtenerResguardos(filtros: FiltrosResguardos): Promise<RespuestaResguardos> {
    const params = construirParams(filtros);
    params.set("estado", filtros.estado);
    if (filtros.clienteId) params.set("cliente", String(filtros.clienteId));
    const { data } = await api.get<RespuestaResguardos>(URL, { params });
    return data;
}

export async function obtenerClientesConResguardo(): Promise<{ id: number; nombre: string }[]> {
    const { data } = await api.get<{ id: number; nombre: string }[]>(`${URL}clientes/`);
    return data;
}

/** Lotes con existencia de esos productos: de dónde se puede entregar un retiro. */
export async function obtenerLotesParaRetiro(productos: number[]): Promise<ExistenciaApi[]> {
    const params = new URLSearchParams();
    for (const id of productos) params.append("producto", String(id));
    const { data } = await api.get<ExistenciaApi[]>(`${URL}lotes/`, { params });
    return data;
}

export async function registrarRetiro(retiro: CrearRetiroRequest): Promise<Retiro> {
    const { data } = await api.post<Retiro>(`${URL}retiros/`, retiro);
    return data;
}

export async function cancelarRetiro(id: number): Promise<void> {
    await api.delete(`${URL}retiros/${id}/`);
}
