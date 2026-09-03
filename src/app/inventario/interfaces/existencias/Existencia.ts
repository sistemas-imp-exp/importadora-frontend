/**
 * Una fila de la foto de inventario, tal como la devuelve
 * `inventario/existencias/`: ya viene aplanada y solo con lotes con existencia.
 */
export interface ExistenciaApi {
    detalle_id: number;
    fecha: string;
    producto_id: number;
    precio_venta_planeado: string | null;
    camara_id: number | null;
    camara_nombre: string;
    proveedor_nombre: string;
    talla: string;
    tipo: string;
    lote_proveedor: string;
    recibo_ingreso: string;
    factura: string;
    peso_por_caja: string | null;
    cajas_disponibles: number;
    total_kilos: string;
    kilos_vendidos: string;
    kilos_disponibles: string;
    costo_por_kilo: string | null;
    fecha_caducidad: string | null;
}
