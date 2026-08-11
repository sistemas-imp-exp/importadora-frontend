import type { Divisa } from "../divisas/Divisa";
import type { CorteCaja, CorteCajaApiResponse } from "./CorteCaja";
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
    corte: CorteCajaApiResponse;
    fecha: string;
    folio: string;
    tipo: TipoMovimiento;
    autorizo: string;
    beneficiario: string;
    concepto: string;
    creado: string;
    modificado: string;
    divisas: MovimientoDivisaApi[];
    editado: boolean;
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
    corte: CorteCaja;
    fecha: Date;
    folio: string;
    tipo: TipoMovimiento;
    autorizo: string;
    beneficiario: string;
    concepto: string;
    creado: Date;
    modificado: Date;
    divisas: MovimientoDivisa[];
    editado: boolean;
    cancelado: boolean;
    fecha_cancelacion: Date | null;
    motivo_cancelacion: string;
    usuario_cancelacion: User | null;
    archivosCount: number;
}

export function mapCorteCajaApiToCorteCaja(api: CorteCajaApiResponse): CorteCaja {
    return {
        id: api.id,
        fecha: new Date(api.fecha),
        cerrado: api.cerrado,
        fecha_cierre: api.fecha_cierre ? new Date(api.fecha_cierre) : null,
        responsable_apertura: api.responsable_apertura,
        responsable_cierre: api.responsable_cierre,
        observaciones: api.observaciones ?? "",
        saldos: api.saldos ?? ""
    };
}

export function mapMovimientoApiToMovimiento(api: MovimientoApi): Movimiento {
    return {
        id: api.id,
        corte: mapCorteCajaApiToCorteCaja(api.corte),
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
        editado: api.editado,
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