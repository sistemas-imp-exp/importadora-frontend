import type { Producto } from "../productos/Producto";
import type { Proveedor } from "../proveedores/Proveedor";

export interface EntradaDetalleApi {
    id: number;
    producto: Producto;
    lote_general: number | null;
    lote_proveedor: string;
    camara: number | null;
    cajas: number;
    peso_por_caja: string | null;
    total_kilos: string;
    costo_por_kilo: string | null;
    precio_venta_planeado: string | null;
    observaciones: string;
}

export interface EntradaApi {
    id: number;
    fecha: string;
    proveedor: Proveedor;
    factura: string;
    pedimento: string;
    detalles: EntradaDetalleApi[];
}

export interface CrearEntradaLineaRequest {
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
    detalles: CrearEntradaLineaRequest[];
}
