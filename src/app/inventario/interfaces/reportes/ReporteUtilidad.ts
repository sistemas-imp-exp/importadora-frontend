export type AgrupacionUtilidad = "producto" | "cliente" | "proveedor" | "salida";
export type EstadoLineaUtilidad = "completa" | "sin_precio" | "sin_costo";

export interface FiltrosReporteUtilidad {
    desde: string;
    hasta: string;
    agrupar: AgrupacionUtilidad;
    empresaId: string;
    clienteId: string;
    proveedorId: string;
    productoId: string;
    camaraId: string;
}

/** Montos como texto decimal; margen en porcentaje ("17.9") o null si no hubo venta completa. */
export interface TotalesUtilidad {
    lineas: number;
    incompletas: number;
    kilos: string;
    venta: string;
    costo: string;
    utilidad: string;
    margen: string | null;
}

export interface LineaUtilidadApi {
    salida_id: number;
    fecha: string;
    folio: string;
    cliente: string;
    producto: string;
    lote: string;
    proveedor: string;
    camara: string;
    kilos: string;
    precio_kg: string | null;
    venta: string | null;
    costo_kg: string | null;
    costo: string | null;
    utilidad: string | null;
    margen: string | null;
    estado: EstadoLineaUtilidad;
}

export interface GrupoUtilidadApi extends TotalesUtilidad {
    etiqueta: string;
    detalle: LineaUtilidadApi[];
}

/** GET inventario/reportes/utilidad/ */
export interface ReporteUtilidadApi {
    agrupar: AgrupacionUtilidad;
    resumen: TotalesUtilidad;
    avisos: Record<"sin_precio" | "sin_costo", { lineas: number; kilos: string }>;
    grupos: GrupoUtilidadApi[];
}
