import type { Cliente } from "../clientes/Cliente";
import type { Producto } from "../productos/Producto";

export interface SalidaDetalleApi {
    id: number;
    producto: Producto;
    entrada_detalle: number;
    camara: number | null;
    cajas: number;
    total_kilos: string;
    factura_proveedor: string;
    precio_x_kilo: string | null;
    total_venta: string | null;
}

export interface SalidaApi {
    id: number;
    folio_de_salida: string;
    cliente: Cliente;
    fecha: string;
    notas: string;
    detalles: SalidaDetalleApi[];
}

export interface CrearSalidaLineaRequest {
    producto_id: number;
    entrada_detalle: number;
    camara: number | null;
    cajas: number;
    total_kilos: number;
    factura_proveedor: string;
    precio_x_kilo: number | null;
    total_venta: number | null;
}

export interface CrearSalidaRequest {
    folio_de_salida: string;
    cliente_id: number;
    fecha: string;
    notas: string;
    detalles: CrearSalidaLineaRequest[];
}
