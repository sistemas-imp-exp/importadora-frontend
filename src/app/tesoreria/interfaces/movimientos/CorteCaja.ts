import type { User } from '../../../../shared/interfaces/auth';
import type { Divisa } from '../divisas/Divisa';

export interface SaldoCajaApiResponse {

    id: number;

    corte: number;

    divisa: Divisa;

    saldo_inicial: string;

    saldo_final: string;

    saldo_fisico: string | null;

    diferencia: string | null;
}

export interface CorteCajaApiResponse {

    id: number;

    fecha: string;

    cerrado: boolean;

    fecha_cierre: string | null;

    responsable_apertura: User;

    responsable_cierre: User;

    observaciones: string;

    saldos: SaldoCajaApiResponse[];
}

export interface CorteCaja {
    id: number;
    fecha: Date;
    cerrado: boolean;
    fecha_cierre: Date | null;   // antes: Date (sin null → bug de tipo)
    responsable_apertura: User;
    responsable_cierre: User;
    observaciones: string;
    saldos: SaldoCajaApiResponse[]; // usamos el shape crudo, ver nota abajo
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
        saldos: api.saldos,
    };
}