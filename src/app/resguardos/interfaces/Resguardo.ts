/** Producto de una venta que el cliente dejó guardado, y cuánto falta entregar. */
export interface LineaResguardo {
    id: number;
    producto_id: number;
    producto: string;
    cajas_resguardo: number;
    kilos_resguardo: string;
    kilos_retirados: string;
    kilos_pendientes: string;
}

export interface LineaRetiro {
    retiro_de: number;
    producto: string;
    lote_proveedor: string;
    proveedor: string;
    camara: string;
    cajas: number;
    kilos: string;
}

/** Entrega parcial de un resguardo: folio propio, salida de cámara y nota. */
export interface Retiro {
    id: number;
    folio_retiro: string;
    folio_de_salida: string;
    notas: string;
    /** Armado con líneas ya capturadas en una salida normal: al cancelarlo regresan a ella. */
    entrega_ligada: boolean;
    fecha: string;
    kilos: string;
    cajas: number;
    registrado_por: string | null;
    lineas: LineaRetiro[];
}

export type EstadoResguardo = "pendiente" | "entregado";

/** Una venta con resguardo (una nota), con lo pendiente por producto y sus retiros. */
export interface Resguardo {
    id: number;
    // null si la venta se quedó completa en resguardo (no salió de cámara).
    folio_de_salida: string | null;
    referencia: string;
    notas: string;
    fecha: string;
    cliente: { id: number; nombre: string };
    kilos_resguardo: string;
    kilos_retirados: string;
    kilos_pendientes: string;
    estado: EstadoResguardo;
    lineas: LineaResguardo[];
    retiros: Retiro[];
}

export interface RespuestaResguardos {
    count: number;
    results: Resguardo[];
    /** Kilos por entregar de todo lo filtrado (no solo la página). */
    kilos_pendientes: string;
}

/** Línea sin precio de una salida normal que en realidad entregó parte de un resguardo. */
export interface EntregaCapturada {
    id: number;
    producto_id: number;
    producto: string;
    fecha: string;
    notas: string;
    lote_proveedor: string;
    proveedor: string;
    camara: string;
    cajas: number;
    kilos: string;
}

export interface LigarEntregaRequest {
    venta: number;
    folio_de_salida: string;
    lineas: { linea: number; retiro_de: number }[];
}

export interface CrearRetiroRequest {
    venta: number;
    fecha: string;
    folio_de_salida: string;
    notas: string;
    detalles: { retiro_de: number; entrada_detalle: number; cajas: number; total_kilos: number }[];
}
