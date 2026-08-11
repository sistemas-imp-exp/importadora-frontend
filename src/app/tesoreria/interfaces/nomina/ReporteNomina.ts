export interface FiltrosReporteNomina {
    fechaInicio: string; // 'yyyy-MM-dd'
    fechaFin: string; // 'yyyy-MM-dd'
    ranchoIds: number[];
    bancoIds: number[];
}

export interface LineaReporteNominaApi {
    id: number;
    nomina_id: number;
    semana: { fecha_inicio: string; fecha_fin: string };
    rancho: { id: number; nombre: string };
    banco: { id: number; nombre: string } | null;
    empleado: { id: number; nombre: string; puesto: string };
    numero_cuenta: string;
    nombre_cuenta: string;
    dias_trabajados: string;
    salario_diario: string;
    descuento: string;
    total_bruto: string;
    total_neto: string;
}

export interface ResumenRanchoApi {
    rancho: { id: number; nombre: string };
    empleados: number;
    total_bruto: string;
    total_descuento: string;
    total_neto: string;
}

export interface ResumenBancoApi {
    banco: { id: number; nombre: string } | null;
    empleados: number;
    total_bruto: string;
    total_descuento: string;
    total_neto: string;
}

export interface ResumenReporteNominaApi {
    total: number;
    muestra: LineaReporteNominaApi[];
    muestra_limitada: boolean;
    resumen: ResumenRanchoApi[];
    resumen_banco: ResumenBancoApi[];
}
