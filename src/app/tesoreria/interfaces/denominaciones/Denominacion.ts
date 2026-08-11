export type TipoDenominacion = "B" | "M";

export interface Denominacion {
    id: number;
    divisa: number;
    valor: string;
    tipo: TipoDenominacion;
    activa: boolean;
}

export interface CrearDenominacionRequest {
    divisa: number;
    valor: string;
    tipo: TipoDenominacion;
    activa: boolean;
}
