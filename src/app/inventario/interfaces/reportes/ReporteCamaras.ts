/** Reporte "Existencias por cámara" (inventario/reportes/existencias-camara/). */
export interface FilaReporteCamara {
    proveedor: string;
    peso_por_caja: string;
    cajas: number;
    kilos: string;
}

export interface TipoReporteCamara {
    tipo: string;
    filas: FilaReporteCamara[];
}

export interface TallaReporteCamara {
    talla: string;
    existencia: string;
    tipos: TipoReporteCamara[];
}

export interface BloqueReporteCamara {
    // "entero" | "colas" | "" (producto sin presentación capturada)
    presentacion: string;
    etiqueta: string;
    subtotal: string;
    tallas: TallaReporteCamara[];
}

export interface CamaraReporte {
    camara: { id: number; nombre: string };
    total: string;
    bloques: BloqueReporteCamara[];
}

export interface ReporteCamarasApi {
    fecha: string;
    camaras: CamaraReporte[];
}

export interface FiltrosReporteCamaras {
    fecha: string;
    camaraId: string;
    empresaId: string;
}
