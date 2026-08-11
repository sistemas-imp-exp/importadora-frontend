import api from "../../../../shared/api/client";
import type { NominaSemanal, NominaSemanalRequest } from "../../interfaces/nomina/NominaSemanal";

const URL = "treasury/nominas/";

export async function obtenerNominas(): Promise<NominaSemanal[]> {
    const { data } = await api.get<NominaSemanal[]>(URL);
    return data;
}

// El backend ordena por fecha_inicio descendente, así que la primera no
// cerrada de la lista es la más reciente sin cerrar. No hay endpoint
// dedicado (a diferencia de corte de caja) porque aquí sí es válido tener
// más de una semana sin cerrar a la vez.
export async function obtenerNominaAbierta(): Promise<NominaSemanal | null> {
    const nominas = await obtenerNominas();
    return nominas.find((n) => !n.cerrada) ?? null;
}

export async function obtenerNomina(id: number): Promise<NominaSemanal> {
    const { data } = await api.get<NominaSemanal>(`${URL}${id}/`);
    return data;
}

export async function crearNomina(payload: NominaSemanalRequest): Promise<NominaSemanal> {
    const { data } = await api.post<NominaSemanal>(URL, payload);
    return data;
}

export async function actualizarNomina(id: number, payload: NominaSemanalRequest): Promise<NominaSemanal> {
    const { data } = await api.put<NominaSemanal>(`${URL}${id}/`, payload);
    return data;
}

export async function cerrarNomina(id: number): Promise<NominaSemanal> {
    const { data } = await api.post<NominaSemanal>(`${URL}${id}/cerrar/`);
    return data;
}
