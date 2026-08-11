export type TipoFiltro = "todos" | "I" | "E";
export type EstadoFiltro = "todos" | "activos" | "cancelados";

export interface FiltrosReporteMovimientos {
    fechaInicio: string; // 'yyyy-MM-dd'
    fechaFin: string; // 'yyyy-MM-dd'
    beneficiario: string;
    corteId: number | null;
    tipo: TipoFiltro;
    estado: EstadoFiltro;
    divisaIds: number[];
}

export interface LineaReporteApi {
    id: number;
    movimiento_id: number;
    folio: string;
    fecha: string;
    corte: number | null;
    tipo: "I" | "E";
    autorizo: string;
    beneficiario: string;
    concepto: string;
    divisa: { id: number; codigo: string; simbolo: string };
    cantidad: string;
    cancelado: boolean;
    editado: boolean;
}

export interface ResumenDivisaApi {
    divisa: { id: number; codigo: string; nombre: string; simbolo: string };
    ingresos: string;
    egresos: string;
    neto: string;
    movimientos_activos: number;
    movimientos_cancelados: number;
}

export interface ResumenReporteMovimientosApi {
    total: number;
    muestra: LineaReporteApi[];
    muestra_limitada: boolean;
    resumen: ResumenDivisaApi[];
}
