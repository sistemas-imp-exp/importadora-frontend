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
    fecha_caducidad: string | null;
    observaciones: string;
    cajas_disponibles: number;
    kilos_disponibles: string;
    // Proveedor real del lote. En una entrada normal es el mismo que entrada.proveedor;
    // en la mitad "de llegada" de un Movimiento entre cámaras, entrada.proveedor es null
    // (no es una compra real) pero esto sí conserva de dónde vino el producto.
    proveedor_origen: Proveedor | null;
    // Factura y recibo del lote raíz. En un lote que llegó por movimiento entre
    // cámaras, la entrada propia no tiene documentos: estos suben por la cadena
    // hasta la compra real, y son la llave de búsqueda al registrar salidas.
    factura_origen: string;
    recibo_origen: string;
}

export interface EntradaApi {
    id: number;
    fecha: string;
    // null cuando la entrada es la mitad "llegada" de un Movimiento entre cámaras,
    // no una compra real — ver MovimientoCamaraCrearSerializer en el backend.
    proveedor: Proveedor | null;
    es_internacional: boolean;
    factura: string;
    pedimento: string;
    // Código del RECIBO INGRESO (LoteGeneral) que agrupa las líneas que van a
    // resguardo — "" si la entrada no tiene uno.
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
    lote_proveedor: string;
    camara: number | null;
    cajas: number;
    peso_por_caja: number | null;
    total_kilos: number;
    costo_por_kilo: number | null;
    precio_venta_planeado: number | null;
    fecha_caducidad: string | null;
    observaciones: string;
}

export interface CrearEntradaRequest {
    fecha: string;
    proveedor_id: number;
    es_internacional: boolean;
    factura: string;
    pedimento: string;
    recibo_ingreso: string;
    detalles: CrearEntradaLineaRequest[];
}
