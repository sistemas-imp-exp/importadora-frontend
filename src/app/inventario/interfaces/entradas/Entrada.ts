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
    peso_por_caja: string | null;
    total_kilos: string;
    costo_por_kilo: string | null;
    precio_venta_planeado: string | null;
    observaciones: string;
    cajas_disponibles: number;
}

export interface EntradaApi {
    id: number;
    fecha: string;
    // null cuando la entrada es la mitad "llegada" de un Movimiento entre cámaras,
    // no una compra real — ver MovimientoCamaraCrearSerializer en el backend.
    proveedor: Proveedor | null;
    factura: string;
    pedimento: string;
    // Código del RECIBO INGRESO (LoteGeneral) que agrupa las líneas que van a
    // resguardo — "" si la entrada no tiene uno.
    recibo_ingreso: string;
    detalles: EntradaDetalleApi[];
}

export interface CrearEntradaLineaRequest {
    // Presente solo al editar: identifica la línea existente a actualizar.
    // Ausente = línea nueva.
    id?: number;
    producto_id: number;
    lote_proveedor: string;
    camara: number | null;
    cajas: number;
    peso_por_caja: number | null;
    total_kilos: number;
    costo_por_kilo: number | null;
    precio_venta_planeado: number | null;
    observaciones: string;
}

export interface CrearEntradaRequest {
    fecha: string;
    proveedor_id: number;
    factura: string;
    pedimento: string;
    recibo_ingreso: string;
    detalles: CrearEntradaLineaRequest[];
}
