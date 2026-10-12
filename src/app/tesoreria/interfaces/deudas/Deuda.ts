import type { Divisa } from "../divisas/Divisa";
import type { User } from "../../../../shared/interfaces/auth";

export type TipoDeudor = "T" | "E";

export const TIPOS_DEUDOR: Record<TipoDeudor, string> = {
    T: "Trabajador",
    E: "Externo",
};

export interface Deudor {
    id: number;
    nombre: string;
    tipo: TipoDeudor;
    telefono: string;
    notas: string;
    activo: boolean;
    usuario: User;
    creado: string;
    deudas_abiertas: number;
}

export interface DeudorRequest {
    nombre: string;
    tipo: TipoDeudor;
    telefono: string;
    notas: string;
    activo: boolean;
}

export type EstadoDeuda = "abierta" | "pagada" | "cancelada";

/** Un abono es el ingreso de caja ligado a la deuda (una sola divisa). */
export interface Abono {
    id: number;
    folio: string;
    fecha: string; // 'YYYY-MM-DD'
    concepto: string;
    cantidad: string;
    usuario: User;
    creado: string;
    cancelado: boolean;
    fecha_cancelacion: string | null;
    motivo_cancelacion: string;
    usuario_cancelacion: User | null;
}

export interface Deuda {
    id: number;
    deudor: { id: number; nombre: string; tipo: TipoDeudor };
    concepto: string;
    divisa: Divisa;
    monto: string;
    fecha: string; // 'YYYY-MM-DD'
    notas: string;
    // Calculados con los abonos no cancelados.
    abonado: string;
    saldo: string;
    estado: EstadoDeuda;
    abonos: Abono[];
    usuario: User;
    creado: string;
    editado_por: User | null;
    editado_en: string | null;
    cancelada: boolean;
    fecha_cancelacion: string | null;
    motivo_cancelacion: string;
    usuario_cancelacion: User | null;
}

export interface DeudaRequest {
    deudor_id: number;
    concepto: string;
    divisa_id: number;
    monto: number;
    fecha: string;
    notas: string;
}

/** Resumen de la deuda que trae un movimiento que es abono. */
export interface DeudaDeMovimiento {
    id: number;
    concepto: string;
    deudor: { id: number; nombre: string };
}
