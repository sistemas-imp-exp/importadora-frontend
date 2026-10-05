import type { User } from "../../../../shared/interfaces/auth";

export interface MovimientoCamaraApi {
    id: number;
    entrada_detalle_origen: number;
    salida_detalle: number;
    entrada_detalle_destino: number;
    camara_origen: number;
    camara_destino: number;
    fecha: string;
    cajas: number;
    // Descripción del lote movido, ya resuelta por el backend.
    lote_origen: string;
    // Recibo de ingreso en la cámara de origen y en la de destino. El de destino
    // es el heredado del origen hasta que se captura uno propio (recibo_destino_propio).
    recibo_origen: string;
    recibo_destino: string;
    recibo_destino_propio: boolean;
    kilos: string;
    proveedor: string;
    factura: string;
    empresa: string;
    fecha_caducidad: string | null;
    // Lo que queda hoy en destino de lo movido (ya descontadas sus salidas).
    cajas_disponibles_destino: number;
    kilos_disponibles_destino: string;
    creado_por: User | null;
}

export interface CrearMovimientoCamaraRequest {
    entrada_detalle_origen: number;
    camara_destino: number;
    fecha: string;
    cajas: number;
    total_kilos: number;
    /** Opcional: sin él, la mercancía conserva el recibo de origen. */
    recibo_destino?: string;
}
