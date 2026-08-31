export interface MovimientoCamaraApi {
    id: number;
    entrada_detalle_origen: number;
    salida_detalle: number;
    entrada_detalle_destino: number;
    camara_origen: number;
    camara_destino: number;
    fecha: string;
    cajas: number;
}

export interface CrearMovimientoCamaraRequest {
    entrada_detalle_origen: number;
    camara_destino: number;
    fecha: string;
    cajas: number;
    total_kilos: number;
}
