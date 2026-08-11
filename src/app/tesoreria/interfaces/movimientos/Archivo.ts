import type { User } from "../../../../shared/interfaces/auth";

export interface ArchivoMovimientoApi {
    id: number;
    url: string;
    movimiento: number;
    nombre_original: string;
    tipo_contenido: string;
    tamano: number;
    subido_por: User;
    subido_en: string;
}

export interface ArchivoMovimiento {
    id: number;
    url: string;
    movimiento: number;
    nombreOriginal: string;
    tipoContenido: string;
    tamano: number;
    subidoPor: User;
    subidoEn: Date;
}

export function mapArchivoApiToArchivo(api: ArchivoMovimientoApi): ArchivoMovimiento {
    return {
        id: api.id,
        url: api.url,
        movimiento: api.movimiento,
        nombreOriginal: api.nombre_original,
        tipoContenido: api.tipo_contenido,
        tamano: api.tamano,
        subidoPor: api.subido_por,
        subidoEn: new Date(api.subido_en),
    };
}

// Extensiones aceptadas por el backend (treasury/models.py: MovimientoArchivo.EXTENSIONES_PERMITIDAS).
export const EXTENSIONES_PERMITIDAS = ["png", "jpg", "jpeg", "xlsx", "pdf"];
export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB
