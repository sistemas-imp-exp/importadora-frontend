import type { ExistenciaApi } from "../interfaces/existencias/Existencia";

/** Un lote con existencia, listo para elegirse como origen de una salida. */
export interface LoteDisponible {
    entradaDetalleId: number;
    productoId: number;
    productoNombre: string;
    talla: string;
    tipo: string;
    loteProveedor: string;
    camaraOrigen: number | null;
    camaraNombre: string;
    pesoPorCaja: string | null;
    cajasDisponibles: number;
    kilosDisponibles: string;
    precioVentaPlaneado: string | null;
    proveedorNombre: string;
    factura: string;
    recibo: string;
    fechaCaducidad: string | null;
}

/**
 * Construye los lotes elegibles a partir de la foto de existencias.
 *
 * `yaReservado` suma de vuelta las cajas que la salida en edición ya tenía
 * tomadas de un lote: al guardar se reemplazan, no se suman encima — el backend
 * hace el mismo ajuste en su validate(). Esos lotes vienen incluidos porque la
 * petición usa `?salida=<id>`, así que aparecen aunque hayan quedado en cero.
 */
export function construirLotesDisponibles(
    existencias: ExistenciaApi[],
    yaReservado: Record<number, number> = {}
): LoteDisponible[] {
    return existencias.map((item) => ({
        entradaDetalleId: item.detalle_id,
        productoId: item.producto_id,
        productoNombre: `${item.talla} ${item.tipo}`,
        talla: item.talla,
        tipo: item.tipo,
        loteProveedor: item.lote_proveedor,
        camaraOrigen: item.camara_id,
        camaraNombre: item.camara_nombre,
        pesoPorCaja: item.peso_por_caja,
        cajasDisponibles: item.cajas_disponibles + (yaReservado[item.detalle_id] ?? 0),
        kilosDisponibles: item.kilos_disponibles,
        precioVentaPlaneado: item.precio_venta_planeado,
        proveedorNombre: item.proveedor_nombre,
        factura: item.factura === "—" ? "" : item.factura,
        recibo: item.recibo_ingreso === "—" ? "" : item.recibo_ingreso,
        fechaCaducidad: item.fecha_caducidad,
    }));
}

/** Coincidencia por documento (factura/recibo) y también por producto o lote. */
export function loteCoincide(lote: LoteDisponible, termino: string): boolean {
    const t = termino.trim().toLowerCase();
    if (!t) return true;
    return (
        lote.factura.toLowerCase().includes(t) ||
        lote.recibo.toLowerCase().includes(t) ||
        lote.loteProveedor.toLowerCase().includes(t) ||
        lote.talla.toLowerCase().includes(t) ||
        lote.tipo.toLowerCase().includes(t) ||
        lote.proveedorNombre.toLowerCase().includes(t) ||
        lote.camaraNombre.toLowerCase().includes(t)
    );
}
