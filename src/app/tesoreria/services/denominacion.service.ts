import api from "../../../shared/api/client";
import type { CrearDenominacionRequest, Denominacion } from "../interfaces/denominaciones/Denominacion";

const URL = "treasury/denominaciones/";

export async function obtenerDenominacionesPorDivisa(divisaId: number): Promise<Denominacion[]> {
    const { data } = await api.get<Denominacion[]>(URL, {
        params: { divisa: divisaId },
    });
    return data;
}

export async function crearDenominacion(denominacion: CrearDenominacionRequest): Promise<Denominacion> {
    const { data } = await api.post<Denominacion>(URL, denominacion);
    return data;
}

export async function actualizarDenominacion(denominacion: Denominacion): Promise<Denominacion> {
    const { data } = await api.put<Denominacion>(`${URL}${denominacion.id}/`, denominacion);
    return data;
}

export async function eliminarDenominacion(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
