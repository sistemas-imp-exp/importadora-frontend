import api from "../../../shared/api/client";
import type { Cliente } from "../interfaces/clientes/Cliente";

const URL = "inventario/clientes/";

export async function obtenerClientes(): Promise<Cliente[]> {
    const { data } = await api.get<Cliente[]>(URL);
    return data;
}

export async function crearCliente(cliente: Cliente): Promise<Cliente> {
    const { data } = await api.post<Cliente>(URL, cliente);
    return data;
}

export async function actualizarCliente(cliente: Cliente): Promise<Cliente> {
    const { data } = await api.put<Cliente>(`${URL}${cliente.id}/`, cliente);
    return data;
}
