import type { Divisa } from "../divisas/Divisa";
import type { User } from "../../../../shared/interfaces/auth";
import dayjs from 'dayjs';

export type TipoMovimiento = "I" | "E";

export interface MovimientoDivisaApi {
    id: number;
    divisa: Divisa;
    cantidad: string;
}

export interface MovimientoApi {
    id: number;
    // Día de la hoja física ('YYYY-MM-DD'); puede ser anterior a la captura.
    fecha: string;
    folio: string;
    tipo: TipoMovimiento;
    autorizo: string;
    beneficiario: string;
    concepto: string;
    creado: string;
    modificado: string;
    divisas: MovimientoDivisaApi[];
    // Quién lo capturó / editó por última vez: siempre el usuario con sesión.
    usuario: User;
    editado: boolean;
    editado_por: User | null;
    editado_en: string | null;
    cancelado: boolean;
    fecha_cancelacion: string | null;
    motivo_cancelacion: string;
    usuario_cancelacion: User | null;
    archivos_count: number;
}

export interface MovimientoDivisa {
    id: number;
    divisa: Divisa;
    cantidad: number;
}

export interface Movimiento {
    id: number;
    fecha: Date;
    folio: string;
    tipo: TipoMovimiento;
    autorizo: string;
    beneficiario: string;
    concepto: string;
    creado: Date;
    modificado: Date;
    divisas: MovimientoDivisa[];
    usuario: User;
    editado: boolean;
    editado_por: User | null;
    editado_en: Date | null;
    cancelado: boolean;
    fecha_cancelacion: Date | null;
    motivo_cancelacion: string;
    usuario_cancelacion: User | null;
    archivosCount: number;
}

export function mapMovimientoApiToMovimiento(api: MovimientoApi): Movimiento {
    return {
        id: api.id,
        // dayjs interpreta 'YYYY-MM-DD' como fecha local (sin corrimiento por zona horaria).
        fecha: dayjs(api.fecha).toDate(),
        folio: api.folio,
        tipo: api.tipo,
        autorizo: api.autorizo,
        beneficiario: api.beneficiario,
        concepto: api.concepto,
        creado: new Date(api.creado),
        modificado: new Date(api.modificado),
        divisas: api.divisas.map((item) => ({
            id: item.id,
            divisa: item.divisa,
            cantidad: Number(item.cantidad),
        })),
        usuario: api.usuario,
        editado: api.editado,
        editado_por: api.editado_por,
        editado_en: api.editado_en ? new Date(api.editado_en) : null,
        cancelado: api.cancelado,
        fecha_cancelacion: api.fecha_cancelacion ? dayjs(api.fecha_cancelacion).toDate() : null,
        motivo_cancelacion: api.motivo_cancelacion ?? "",
        usuario_cancelacion: api.usuario_cancelacion,
        archivosCount: api.archivos_count,
    };
}

export function mapMovimientosApiToMovimientos(api: MovimientoApi[]): Movimiento[] {
    return api.map(mapMovimientoApiToMovimiento);
}

export interface CrearMovimientoRequest {
    fecha: string; // 'YYYY-MM-DD'
    folio: string;
    tipo: TipoMovimiento;
    autorizo: string;
    beneficiario: string;
    concepto: string;
    divisas: {
        divisa_id: number;
        cantidad: number;
    }[];
}