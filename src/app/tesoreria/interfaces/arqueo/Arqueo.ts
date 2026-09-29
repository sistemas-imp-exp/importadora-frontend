import type { User } from "../../../../shared/interfaces/auth";
import type { Divisa } from "../divisas/Divisa";

export type TipoDenominacion = "B" | "M";

export interface Denominacion {
    id: number;
    divisa: number;
    valor: string;
    tipo: TipoDenominacion;
    activa: boolean;
}

export interface ArqueoConteo {
    id: number;
    denominacion: Denominacion;
    piezas: number;
    total: string;
}

export type EstadoArqueoDivisa = "FALTANTE" | "SOBRANTE" | "EXACTO";

export interface ArqueoDivisa {
    id: number;
    divisa: Divisa;
    saldo_inicial: string;
    resultado_esperado: string;
    total_contado: string;
    diferencia: string;
    estado: EstadoArqueoDivisa;
    conteos: ArqueoConteo[];
}

export interface ArqueoCaja {
    id: number;
    // Día arqueado ('YYYY-MM-DD'); puede haber varios arqueos el mismo día.
    fecha: string;
    hora_inicio: string;
    hora_termino: string;
    usuario: User;
    editado_por: User | null;
    editado_en: string | null;
    observaciones: string;
    creado: string;
    modificado: string;
    divisas: ArqueoDivisa[];
    leyenda_totales: string;
}

export interface ConteoRequest {
    denominacion_id: number;
    piezas: number;
}

export interface ArqueoDivisaRequest {
    divisa_id: number;
    conteos: ConteoRequest[];
}

export interface CrearArqueoRequest {
    fecha: string;
    hora_inicio: string;
    observaciones: string;
    divisas: ArqueoDivisaRequest[];
}
