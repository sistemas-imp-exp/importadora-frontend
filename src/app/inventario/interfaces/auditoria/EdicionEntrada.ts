export interface EdicionEntrada {
    id: number;
    // null si la entrada fue eliminada después: la bitácora sobrevive a la baja
    // y conserva el texto en entrada_referencia.
    entrada_id: number | null;
    entrada_referencia: string;
    entrada_existe: boolean;
    linea_id: number | null;
    linea_referencia: string;
    campo: string;
    campo_etiqueta: string;
    valor_anterior: string;
    valor_nuevo: string;
    motivo: string;
    editado_por: string | null;
    editado_en: string;
}

/** Diccionario campo -> etiqueta, tal como lo define el backend en auditoria.py. */
export type CamposEditables = Record<string, string>;

export interface EdicionesEntradaResponse {
    campos_editables: {
        cabecera: CamposEditables;
        lineas: CamposEditables;
    };
    registros: EdicionEntrada[];
}

/** Campos de línea editables por la vía auditada (ver inventario/auditoria.py). */
export interface LineaEdicionAuditada {
    id: number;
    lote_proveedor?: string;
    precio_venta_planeado?: string;
    fecha_caducidad?: string;
    observaciones?: string;
}

export interface CabeceraEdicionAuditada {
    factura?: string;
    pedimento?: string;
}

export interface EditarEntradaAuditadaRequest {
    motivo: string;
    cabecera?: CabeceraEdicionAuditada;
    lineas?: LineaEdicionAuditada[];
}

export interface EditarEntradaAuditadaResponse {
    entrada_id: number;
    tiene_salidas: boolean;
    cambios: EdicionEntrada[];
}
