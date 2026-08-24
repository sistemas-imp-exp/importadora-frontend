export type Presentacion = "" | "entero" | "colas";

export interface Producto {
    id: number;
    talla: string;
    tipo: string;
    categoria: string;
    presentacion: Presentacion;
    activo: boolean;
}
