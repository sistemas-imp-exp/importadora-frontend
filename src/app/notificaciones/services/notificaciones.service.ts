import api from "../../../shared/api/client";
import type { RespuestaPaginada } from "../../../shared/interfaces/Paginado";
import type {
    AreaBreve,
    CanalDisponible,
    DetalleHilo,
    HiloNotificacion,
    Notificacion,
    NuevoMensajeRequest,
    ResumenNotificaciones,
} from "../interfaces/Notificacion";

const BASE = "notificaciones/";

export async function obtenerResumen(): Promise<ResumenNotificaciones> {
    const { data } = await api.get<ResumenNotificaciones>(`${BASE}resumen/`);
    return data;
}

export interface FiltroHilos {
    pagina: number;
    porPagina: number;
    soloNoLeidas?: boolean;
    area?: string;
    tipo?: string;
}

export async function obtenerHilos(filtro: FiltroHilos): Promise<RespuestaPaginada<HiloNotificacion>> {
    const params = new URLSearchParams({ page: String(filtro.pagina), por_pagina: String(filtro.porPagina) });
    if (filtro.soloNoLeidas) params.set("no_leidas", "1");
    if (filtro.area) params.set("area", filtro.area);
    if (filtro.tipo) params.set("tipo", filtro.tipo);
    const { data } = await api.get<RespuestaPaginada<HiloNotificacion>>(BASE, { params });
    return data;
}

export async function obtenerHilo(id: number): Promise<DetalleHilo> {
    const { data } = await api.get<DetalleHilo>(`${BASE}${id}/`);
    return data;
}

export async function marcarHiloLeido(id: number): Promise<void> {
    await api.post(`${BASE}${id}/leer/`);
}

export async function marcarTodasLeidas(): Promise<void> {
    await api.post(`${BASE}leer-todas/`);
}

export async function enviarMensaje(datos: NuevoMensajeRequest): Promise<Notificacion> {
    const { data } = await api.post<Notificacion>(BASE, datos);
    return data;
}

export async function responderHilo(id: number, mensaje: string, areaOrigen?: string): Promise<Notificacion> {
    const { data } = await api.post<Notificacion>(`${BASE}${id}/responder/`, {
        mensaje,
        ...(areaOrigen ? { area_origen: areaOrigen } : {}),
    });
    return data;
}

export async function obtenerCanales(): Promise<CanalDisponible[]> {
    const { data } = await api.get<CanalDisponible[]>(`${BASE}canales/`);
    return data;
}

export async function obtenerAreasNotificaciones(): Promise<AreaBreve[]> {
    const { data } = await api.get<AreaBreve[]>(`${BASE}areas/`);
    return data;
}
