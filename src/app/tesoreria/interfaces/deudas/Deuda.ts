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

/** Movimiento de caja ligado a la deuda: egreso "E" = cargo, ingreso "I" = abono (una sola divisa). */
export interface MovimientoDeuda {
    id: number;
    tipo: "I" | "E";
    folio: string;
    fecha: string; // 'YYYY-MM-DD'
    concepto: string;
    /** Lo aplicado a esta deuda; `monto_movimiento` es el total del folio (difieren si se repartió). */
    cantidad: string;
    monto_movimiento: string;
    usuario: User;
    creado: string;
    editado: boolean;
    editado_en: string | null;
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
    // Lo que se debe sin salida de caja (venta a crédito, etc.); 0 si nació de un egreso.
    monto_inicial: string;
    fecha: string; // 'YYYY-MM-DD'
    notas: string;
    // Calculados con los movimientos no cancelados: total = inicial + cargado; saldo = total - abonado.
    cargado: string;
    total: string;
    abonado: string;
    saldo: string;
    estado: EstadoDeuda;
    movimientos: MovimientoDeuda[];
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
    monto_inicial: number;
    fecha: string;
    notas: string;
}

/** Deuda ligada a un movimiento con la parte del movimiento que le toca (`monto`). */
export interface DeudaDeMovimiento {
    id: number;
    concepto: string;
    deudor: { id: number; nombre: string };
    monto: string;
}
