/** Resumen por cliente (resguardos/resumen/), como la hoja RESUMEN RESG. del área. */
export interface FilaResumenResguardo {
    linea_id: number;
    venta_id: number;
    fecha: string;
    nota: string;
    folio_de_salida: string | null;
    talla: string;
    // De los lotes ya entregados o, sin entregas, de la nota de la carga inicial; "" si no se sabe.
    proveedor: string;
    kilos: string;
    // null si la venta no tiene precio: entonces no suma al total.
    precio: string | null;
    total: string | null;
    observacion: string;
}

export interface ClienteResumenResguardo {
    cliente: { id: number; nombre: string };
    kilos: string;
    total: string;
    sin_precio: number;
    filas: FilaResumenResguardo[];
}

export interface ResumenResguardos {
    clientes: ClienteResumenResguardo[];
    kilos: string;
    total: string;
}
