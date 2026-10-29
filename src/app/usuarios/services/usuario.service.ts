import api from "../../../shared/api/client";
import type { RespuestaPaginada } from "../../../shared/interfaces/Paginado";
import type { EventoAcceso, Usuario } from "../interfaces/Usuario";

const URL = "auth/usuarios/";

export async function obtenerUsuarios(): Promise<Usuario[]> {
    const { data } = await api.get<Usuario[]>(URL);
    return data;
}

export async function crearUsuario(usuario: Usuario): Promise<Usuario> {
    const { data } = await api.post<Usuario>(URL, usuario);
    return data;
}

export async function actualizarUsuario(usuario: Usuario): Promise<Usuario> {
    const { data } = await api.patch<Usuario>(`${URL}${usuario.id}/`, usuario);
    return data;
}

/** Saca al usuario de todos los equipos donde tenga sesión abierta. */
export async function cerrarSesionesUsuario(id: number): Promise<void> {
    await api.post(`${URL}${id}/cerrar-sesiones/`);
}

/** Quita el bloqueo por intentos fallidos sin esperar los 15 minutos. */
export async function desbloquearUsuario(id: number): Promise<Usuario> {
    const { data } = await api.post<Usuario>(`${URL}${id}/desbloquear/`);
    return data;
}

export interface FiltroBitacora {
    pagina: number;
    porPagina: number;
    busqueda?: string;
    evento?: string;
    desde?: string;
    hasta?: string;
}

export async function obtenerBitacora(filtro: FiltroBitacora): Promise<RespuestaPaginada<EventoAcceso>> {
    const params = new URLSearchParams({ page: String(filtro.pagina), por_pagina: String(filtro.porPagina) });
    if (filtro.busqueda?.trim()) params.set("busqueda", filtro.busqueda.trim());
    if (filtro.evento) params.set("evento", filtro.evento);
    if (filtro.desde) params.set("desde", filtro.desde);
    if (filtro.hasta) params.set("hasta", filtro.hasta);
    const { data } = await api.get<RespuestaPaginada<EventoAcceso>>("auth/bitacora/", { params });
    return data;
}
