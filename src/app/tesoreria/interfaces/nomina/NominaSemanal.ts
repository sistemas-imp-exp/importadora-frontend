import type { User } from "../../../../shared/interfaces/auth";
import type { Empleado } from "./Empleado";

export interface NominaDetalle {
    id: number;
    empleado: Empleado;
    dias_trabajados: string;
    salario_diario: string;
    descuento: string;
    total_bruto: string;
    total_neto: string;
}

export interface NominaSemanal {
    id: number;
    fecha_inicio: string;
    fecha_fin: string;
    cerrada: boolean;
    fecha_cierre: string | null;
    cerrada_por: User | null;
    creado_por: User;
    observaciones: string;
    creado: string;
    modificado: string;
    detalles: NominaDetalle[];
    total_bruto: string;
    total_neto: string;
}

export interface NominaDetalleRequest {
    empleado_id: number;
    dias_trabajados: string;
    salario_diario: string;
    descuento: string;
}

export interface NominaSemanalRequest {
    fecha_inicio: string;
    fecha_fin: string;
    observaciones?: string;
    detalles: NominaDetalleRequest[];
}
