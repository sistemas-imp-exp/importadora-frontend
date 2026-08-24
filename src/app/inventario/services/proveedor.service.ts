import api from "../../../shared/api/client";
import type { Proveedor } from "../interfaces/proveedores/Proveedor";

const URL = "inventario/proveedores/";

export async function obtenerProveedores(): Promise<Proveedor[]> {
    const { data } = await api.get<Proveedor[]>(URL);
    return data;
}

export async function crearProveedor(proveedor: Proveedor): Promise<Proveedor> {
    const { data } = await api.post<Proveedor>(URL, proveedor);
    return data;
}

export async function actualizarProveedor(proveedor: Proveedor): Promise<Proveedor> {
    const { data } = await api.put<Proveedor>(`${URL}${proveedor.id}/`, proveedor);
    return data;
}
