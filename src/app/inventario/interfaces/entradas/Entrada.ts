import type { Empresa } from "../empresas/Empresa";
import type { Producto } from "../productos/Producto";
import type { Proveedor } from "../proveedores/Proveedor";

export interface EntradaDetalleApi {
    id: number;
    producto: Producto;
    lote_general: number | null;
    lote_general_codigo: string | null;
    lote_proveedor: string;
    camara: number | null;
    cajas: number;
    peso_por_caja: string;
    total_kilos: string;
    costo_por_kilo: string | null;
    precio_venta_planeado: string | null;
    fecha_caducidad: string | null;
    observaciones: string;
    cajas_disponibles: number;
    kilos_disponibles: string;
    // Proveedor de la línea: una entrada puede traer mercancía de varios. En la
    // mitad "de llegada" de un Movimiento entre cámaras se hereda del lote de origen.
    proveedor_origen: Proveedor | null;
    // Documentos del proveedor de esta línea ("" en las líneas de llegada de un traslado).
    factura: string;
    pedimento: string;
    // Factura y recibo del lote raíz. En un lote que llegó por movimiento entre
    // cámaras, la línea propia no tiene documentos: estos suben por la cadena
    // hasta la compra real, y son la llave de búsqueda al registrar salidas.
    factura_origen: string;
    recibo_origen: string;
}

export interface EntradaApi {
    id: number;
    fecha: string;
    // IMPORTADORA, MARISCOS SELECTOS… (catálogo de Empresas). En los traslados
    // entre cámaras se hereda de la entrada de origen.
    empresa: Empresa | null;
    es_internacional: boolean;
    // La mitad "llegada" de un Movimiento entre cámaras, no una compra real.
    es_traslado: boolean;
    // Código del RECIBO INGRESO (LoteGeneral) de las líneas que van a cámara
    // — "" si no tiene. Un recibo puede abarcar varias entradas.
    recibo_ingreso: string;
    detalles: EntradaDetalleApi[];
    // True si la entrada tiene registros en la bitácora de ediciones
    // (ver Auditoría de entradas). Solo lectura, lo calcula el backend.
    editado: boolean;
}

export interface CrearEntradaLineaRequest {
    // Presente solo al editar: identifica la línea existente a actualizar.
    // Ausente = línea nueva.
    id?: number;
    producto_id: number;
    proveedor_id: number;
    factura: string;
    pedimento: string;
    lote_proveedor: string;
    camara: number | null;
    cajas: number;
    peso_por_caja: number;
    total_kilos: number;
    costo_por_kilo: number | null;
    precio_venta_planeado: number | null;
    fecha_caducidad: string | null;
    observaciones: string;
}

export interface CrearEntradaRequest {
    fecha: string;
    empresa_id: number;
    es_internacional: boolean;
    recibo_ingreso: string;
    detalles: CrearEntradaLineaRequest[];
}

/** Proveedores de las líneas de la entrada, sin repetir. */
export function proveedoresDe(entrada: EntradaApi): string[] {
    return [...new Set(entrada.detalles.map((d) => d.proveedor_origen?.nombre).filter((n): n is string => !!n))];
}

/** Facturas de las líneas de la entrada, sin repetir. */
export function facturasDe(entrada: EntradaApi): string[] {
    return [...new Set(entrada.detalles.map((d) => d.factura).filter(Boolean))];
}

/** Pedimentos de las líneas de la entrada, sin repetir. */
export function pedimentosDe(entrada: EntradaApi): string[] {
    return [...new Set(entrada.detalles.map((d) => d.pedimento).filter(Boolean))];
}
