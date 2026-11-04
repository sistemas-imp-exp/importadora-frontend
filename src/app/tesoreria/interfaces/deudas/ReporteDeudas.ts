import type { TipoDeudor } from "./Deuda";

/** Reporte general de deudas (treasury/deudores/reporte/): saldos a hoy. */
interface DivisaReporte {
    id: number;
    codigo: string;
    simbolo: string;
}

export interface FilaReporteDeudas {
    deudor: { id: number; nombre: string; tipo: TipoDeudor; tipo_display: string };
    divisa: DivisaReporte;
    abiertas: number;
    // Fecha de la deuda abierta más antigua; null si ya no tiene abiertas.
    desde: string | null;
    total: string;
    abonado: string;
    saldo: string;
}

export interface TotalReporteDeudas {
    divisa: DivisaReporte;
    deudores: number;
    abiertas: number;
    total: string;
    abonado: string;
    saldo: string;
}

export interface ReporteDeudas {
    filas: FilaReporteDeudas[];
    totales: TotalReporteDeudas[];
}

export interface FiltrosReporteDeudas {
    tipo: TipoDeudor | "";
    divisaId: string;
    soloConSaldo: boolean;
}
