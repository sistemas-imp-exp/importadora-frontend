import type { User } from "../../../../shared/interfaces/auth";
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
    saldos: SaldoDivisaDia[];
    negativo: boolean;
    movimientos: MovimientoApi[];
}

/** Un día del historial (solo días con movimientos). */
export interface DiaHistorialApi {
    fecha: string;
    movimientos: number;
    negativo: boolean;
    saldos: { divisa: DivisaCaja; ingresos: string; egresos: string; saldo_final: string }[];
}

/** GET/POST treasury/saldos-iniciales/: saldo inicial de caja por divisa (sin fecha). */
export interface SaldoInicialApi {
    divisa: DivisaCaja;
    monto: string;
    editado_por: User | null;
    editado_en: string | null;
}
