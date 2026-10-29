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
    // Diferencia que Cartera encontró contra la nota en papel; se va sola al corregir la línea.
    aviso_cartera?: { comentario: string; usuario: string; fecha: string } | null;
    // Parte de lo vendido que el cliente deja guardado (se cobra todo; del lote
    // solo sale lo entregado) y lo que ya se llevó de eso con retiros.
    cajas_resguardo: number;
    kilos_resguardo: string;
    kilos_retirados: string;
    // En un retiro: la línea de venta cuyo resguardo entrega.
    retiro_de: number | null;
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
    // Retiro de resguardo: folio propio (RES-0001) y la venta que entrega. Se
    // registra y cancela desde Resguardos, no desde Salidas.
    folio_retiro: string | null;
    venta_resguardo: { id: number; folio_de_salida: string; notas: string } | null;
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
    cajas_resguardo: number;
    kilos_resguardo: number;
}

export interface CrearSalidaRequest {
    folio_de_salida: string;
    cliente_id: number;
    fecha: string;
    notas: string;
    detalles: CrearSalidaLineaRequest[];
}
