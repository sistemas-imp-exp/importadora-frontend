import api from "../../../../shared/api/client";
import type { Banco } from "../../interfaces/nomina/Banco";

const URL = "treasury/bancos/";

export async function obtenerBancos(): Promise<Banco[]> {
    const { data } = await api.get<Banco[]>(URL);
    return data;
}

export async function crearBanco(banco: Banco): Promise<Banco> {
    const { data } = await api.post<Banco>(URL, banco);
    return data;
}

export async function actualizarBanco(banco: Banco): Promise<Banco> {
    const { data } = await api.put<Banco>(`${URL}${banco.id}/`, banco);
    return data;
}

export async function eliminarBanco(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
