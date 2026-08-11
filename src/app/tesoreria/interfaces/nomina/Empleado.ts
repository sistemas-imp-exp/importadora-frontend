import type { Rancho } from "./Rancho";
import type { Puesto } from "./Puesto";
import type { Banco } from "./Banco";

export interface Empleado {
    id: number;
    rancho: Rancho;
    puesto: Puesto;
    nombre: string;
    salario_diario: string;
    numero_cuenta: string;
    banco: Banco | null;
    nombre_cuenta: string;
    activo: boolean;
}

export interface EmpleadoRequest {
    id: number;
    rancho_id: number;
    puesto_id: number;
    nombre: string;
    salario_diario: string;
    numero_cuenta: string;
    banco_id: number | null;
    nombre_cuenta: string;
    activo: boolean;
}
