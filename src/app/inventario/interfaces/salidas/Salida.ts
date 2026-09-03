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
    notas: string;
    // Datos del lote de origen que publica el backend en la propia línea: la
    // tabla ya no tiene que buscarlos recorriendo todas las entradas.
    lote_proveedor: string;
    proveedor_nombre: string;
}

export interface SalidaApi {
    id: number;
    folio_de_salida: string;
    // null cuando la salida es la mitad "salida" de un Movimiento entre cámaras,
    // no una venta real — ver MovimientoCamaraCrearSerializer en el backend.
    cliente: Cliente | null;
    fecha: string;
    notas: string;
    detalles: SalidaDetalleApi[];
}

export interface CrearSalidaLineaRequest {
    // Presente solo al editar: identifica la línea existente a actualizar.
    // Ausente = línea nueva.
    id?: number;
    producto_id: number;
    entrada_detalle: number;
    cajas: number;
    total_kilos: number;
    // factura_proveedor y camara NO se envían: el backend los calcula heredándolos
    // del ENTRADA_DETALLE de origen (SalidaSerializer._factura_del_lote). La cámara
    // de una venta no es editable — solo cambia vía Movimientos entre cámaras.
    precio_x_kilo: number | null;
    total_venta: number | null;
    notas: string;
}

export interface CrearSalidaRequest {
    folio_de_salida: string;
    cliente_id: number;
    fecha: string;
    notas: string;
    detalles: CrearSalidaLineaRequest[];
}
