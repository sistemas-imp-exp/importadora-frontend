import api from "../../../shared/api/client";
import type { Producto } from "../interfaces/productos/Producto";

const URL = "inventario/productos/";

export async function obtenerProductos(): Promise<Producto[]> {
    const { data } = await api.get<Producto[]>(URL);
    return data;
}

export async function crearProducto(producto: Producto): Promise<Producto> {
    const { data } = await api.post<Producto>(URL, producto);
    return data;
}

export async function actualizarProducto(producto: Producto): Promise<Producto> {
    const { data } = await api.put<Producto>(`${URL}${producto.id}/`, producto);
    return data;
}
