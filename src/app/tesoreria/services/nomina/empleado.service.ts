import api from "../../../../shared/api/client";
import type { Empleado, EmpleadoRequest } from "../../interfaces/nomina/Empleado";

const URL = "treasury/empleados/";

export async function obtenerEmpleados(ranchoId?: number): Promise<Empleado[]> {
    const { data } = await api.get<Empleado[]>(URL, {
        params: ranchoId ? { rancho: ranchoId } : undefined,
    });
    return data;
}

export async function crearEmpleado(empleado: EmpleadoRequest): Promise<Empleado> {
    const { data } = await api.post<Empleado>(URL, empleado);
    return data;
}

export async function actualizarEmpleado(empleado: EmpleadoRequest): Promise<Empleado> {
    const { data } = await api.put<Empleado>(`${URL}${empleado.id}/`, empleado);
    return data;
}

export async function eliminarEmpleado(id: number): Promise<void> {
    await api.delete(`${URL}${id}/`);
}
