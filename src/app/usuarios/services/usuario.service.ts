import api from "../../../shared/api/client";
import type { Usuario } from "../interfaces/Usuario";

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
