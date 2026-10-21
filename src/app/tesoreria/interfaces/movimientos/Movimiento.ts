import type { Divisa } from "../divisas/Divisa";
import type { User } from "../../../../shared/interfaces/auth";
import type { DeudaDeMovimiento } from "../deudas/Deuda";
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
    // Deudas a las que abona (un ingreso puede repartirse) o carga (un egreso, solo una).
    deudas: DeudaDeMovimiento[];
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
    deudas: DeudaDeMovimiento[];
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
        deudas: api.deudas ?? [],
    };
}

export function mapMovimientosApiToMovimientos(api: MovimientoApi[]): Movimiento[] {
    return api.map(mapMovimientoApiToMovimiento);
}

export interface CambioMovimiento {
    campo: string;
    antes: string;
    despues: string;
}

interface EventoBase {
    fecha: string;
    usuario: User | null;
}

/** Evento de la línea de tiempo de un movimiento (GET movimientos/<id>/historial/). */
export type EventoHistorial =
    | (EventoBase & { tipo: "registro" })
    // `cambios` vacío: edición anterior a la bitácora, sin detalle.
    | (EventoBase & { tipo: "edicion"; cambios: CambioMovimiento[] })
    | (EventoBase & { tipo: "cancelacion"; motivo: string })
    | (EventoBase & { tipo: "adjunto" | "adjunto_quitado"; archivo: string });

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
    // Deudas ligadas, en la divisa de cada deuda: un ingreso abona y puede
    // repartirse entre varias (los montos suman el total); un egreso carga a
    // una sola por el total. [] quita el reparto. `nueva_deuda` crea la deuda
    // junto con el egreso.
    aplicaciones?: { deuda_id: number; monto?: number }[];
    nueva_deuda?: { deudor_id: number; concepto: string };
}