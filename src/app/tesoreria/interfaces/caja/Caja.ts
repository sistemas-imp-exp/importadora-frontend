import type { User } from "../../../../shared/interfaces/auth";
import type { Divisa } from "../divisas/Divisa";
import type { MovimientoApi } from "../movimientos/Movimiento";

/** Divisa tal como la manda la consulta de caja (sin el flag de activa). */
export interface DivisaCaja {
    id: number;
    codigo: string;
    simbolo: string;
    nombre: string;
}

/** Saldos de un día para una divisa (inventario de caja calculado, no guardado). */
export interface SaldoDivisaDia {
    divisa: DivisaCaja;
    saldo_inicial: string;
    ingresos: string;
    egresos: string;
    saldo_final: string;
    negativo: boolean;
}

/** GET treasury/caja/dia/?fecha= */
export interface CajaDiaApi {
    fecha: string;
    // null: todavía no hay saldos iniciales (apertura) para esa fecha.
    apertura: { id: number; fecha: string } | null;
    saldos: SaldoDivisaDia[];
    negativo: boolean;
    movimientos: MovimientoApi[];
}

/** Un día del historial (solo días con movimientos o con apertura). */
export interface DiaHistorialApi {
    fecha: string;
    apertura: boolean;
    movimientos: number;
    negativo: boolean;
    saldos: { divisa: DivisaCaja; ingresos: string; egresos: string; saldo_final: string }[];
}

/** Saldos iniciales de caja a una fecha (reemplaza la apertura de corte). */
export interface AperturaApi {
    id: number;
    fecha: string;
    observaciones: string;
    saldos: { id: number; divisa: Divisa; monto: string }[];
    creado_por: User;
    editado_por: User | null;
    creado: string;
    modificado: string;
}

export interface GuardarAperturaRequest {
    fecha: string;
    observaciones: string;
    saldos: { divisa_id: number; monto: string }[];
}
