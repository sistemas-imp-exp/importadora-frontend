import type { Cliente } from "../clientes/Cliente";
import type { Producto } from "../productos/Producto";

export interface SalidaDetalleApi {
    id: number;
    producto: Producto;
    // null en una venta en resguardo: se vende por producto, sin lote.
    entrada_detalle: number | null;
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
    // null sin lote (venta en resguardo).
    peso_por_caja: string | null;
    // Diferencia que Cartera encontró contra la nota en papel; se va sola al corregir la línea.
    aviso_cartera?: { comentario: string; usuario: string; fecha: string } | null;
    // En una venta en resguardo, todo lo vendido; y lo que ya se llevó con retiros.
    cajas_resguardo: number;
    kilos_resguardo: string;
    kilos_retirados: string;
    // En un retiro: la línea de venta cuyo resguardo entrega.
    retiro_de: number | null;
}

export interface SalidaApi {
    id: number;
    // null en una venta en resguardo: no sale de cámara.
    folio_de_salida: string | null;
    // Venta por producto que el cliente deja guardada; se entrega con retiros.
    es_resguardo: boolean;
    // null cuando la salida es la mitad "salida" de un Movimiento entre cámaras,
    // no una venta real — ver MovimientoCamaraCrearSerializer en el backend.
    cliente: Cliente | null;
    fecha: string;
    notas: string;
    detalles: SalidaDetalleApi[];
    // Retiro de resguardo: folio propio (RES-0001) y la venta que entrega. Se
    // registra y cancela desde Resguardos, no desde Salidas.
    folio_retiro: string | null;
    venta_resguardo: { id: number; folio_de_salida: string | null; notas: string; referencia: string } | null;
}

/** Cómo nombrar una salida: su folio, o su nota si no salió de cámara. */
export function referenciaSalida(salida: { folio_de_salida: string | null; notas: string }): string {
    return salida.folio_de_salida ?? `Nota ${salida.notas}`;
}

export interface CrearSalidaLineaRequest {
    // Presente solo al editar: identifica la línea existente a actualizar.
    // Ausente = línea nueva.
    id?: number;
    producto_id: number;
    // Ausente en una venta en resguardo (sin lote).
    entrada_detalle?: number;
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
    // true: venta en resguardo (por producto, sin lote ni folio de salida).
    es_resguardo: boolean;
    folio_de_salida: string;
    cliente_id: number;
    fecha: string;
    notas: string;
    detalles: CrearSalidaLineaRequest[];
}
