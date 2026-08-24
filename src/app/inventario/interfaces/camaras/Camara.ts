export type TipoCamara = "propia" | "tercero";

export interface Camara {
    id: number;
    nombre: string;
    ubicacion: string;
    tipo: TipoCamara;
    empresa: number | null;
    activo: boolean;
}
