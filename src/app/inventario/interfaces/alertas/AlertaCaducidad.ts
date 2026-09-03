import type { NivelCaducidad } from "../../utils/caducidad";

export interface AlertaCaducidadApi {
    id: number;
    camara: string | null;
    proveedor: string | null;
    talla: string;
    tipo: string;
    lote_proveedor: string;
    cajas_disponibles: number;
    kilos_disponibles: string;
    fecha_caducidad: string;
    dias_restantes: number;
    nivel: NivelCaducidad;
}

export interface ConteoPorNivel {
    vencido: number;
    critico: number;
    urgente: number;
    por_vencer: number;
}

export interface AlertasCaducidadResponse {
    total: number;
    conteo_por_nivel: ConteoPorNivel;
    alertas: AlertaCaducidadApi[];
}

export interface FiltrosAlertasCaducidad {
    camaraId: number | "";
    nivel: NivelCaducidad | "";
}
