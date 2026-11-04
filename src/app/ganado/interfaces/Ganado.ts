export type Sexo = "H" | "M";
export type EstadoAnimal = "ACTIVO" | "VENDIDO" | "MUERTO" | "CANCELADO";
export type TipoMovimiento = "ALTA" | "BAJA" | "TRASPASO";
export type MotivoMovimiento = "" | "COMPRA" | "NACIMIENTO" | "REGALO" | "VENTA" | "MUERTE";

export interface Referencia {
    id: number;
    nombre: string;
}

export interface UsuarioBreve {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
}

export interface Rancho {
    id: number;
    nombre: string;
    activo: boolean;
    notas: string;
    cabezas?: number;
}

export interface Especie {
    id: number;
    nombre: string;
    activo: boolean;
}

export interface Categoria {
    id: number;
    especie_id: number;
    especie_nombre?: string;
    nombre: string;
    /** Vacío = aplica a hembras y machos. */
    sexo: Sexo | "";
    orden: number;
    activo: boolean;
}

export interface Animal {
    id: number;
    folio: string;
    arete_1: string;
    arete_2: string;
    arete_3: string;
    arete: string;
    identificacion: string;
    especie: Referencia;
    categoria: Referencia;
    sexo: Sexo;
    sexo_nombre: string;
    raza: string;
    fecha_nacimiento: string | null;
    notas: string;
    rancho: Referencia | null;
    estado: EstadoAnimal;
    estado_nombre: string;
}

export interface AnimalRequest {
    arete_1: string;
    arete_2: string;
    arete_3: string;
    especie_id: number;
    categoria_id: number;
    sexo: Sexo;
    raza: string;
    fecha_nacimiento: string | null;
    notas: string;
}

/** Renglón de un alta: con arete, uno; sin arete, puede ser una cantidad. */
export interface AnimalNuevo extends AnimalRequest {
    cantidad: number;
}

/** Animal activo de un rancho para elegir en bajas y traspasos. */
export interface AnimalSeleccion {
    id: number;
    folio: string;
    arete: string;
    identificacion: string;
    especie: string;
    categoria: string;
    sexo: Sexo;
    raza: string;
}

export interface Movimiento {
    id: number;
    folio: string;
    tipo: TipoMovimiento;
    tipo_nombre: string;
    motivo: MotivoMovimiento;
    motivo_nombre: string;
    fecha: string;
    rancho: Referencia;
    rancho_destino: Referencia | null;
    contraparte: string;
    importe: string | null;
    notas: string;
    cabezas: number;
    resumen: string;
    usuario: UsuarioBreve;
    creado: string;
    editado_por: UsuarioBreve | null;
    editado_en: string | null;
    cancelado: boolean;
    motivo_cancelacion: string;
    usuario_cancelacion: UsuarioBreve | null;
    cancelado_en: string | null;
    animales?: AnimalSeleccion[];
}

export interface MovimientoRequest {
    tipo: TipoMovimiento;
    motivo: MotivoMovimiento;
    fecha: string;
    rancho_id: number;
    rancho_destino_id: number | null;
    contraparte: string;
    importe: string | null;
    notas: string;
    animales?: AnimalNuevo[];
    animal_ids?: number[];
}

export interface EditarMovimientoRequest {
    fecha: string;
    contraparte: string;
    importe: string | null;
    notas: string;
}

export interface EventoHistorial {
    clase: "movimiento" | "edicion";
    fecha: string;
    usuario: UsuarioBreve;
    // movimiento
    id?: number;
    folio?: string;
    tipo?: TipoMovimiento;
    tipo_nombre?: string;
    motivo_nombre?: string;
    rancho?: string;
    rancho_destino?: string;
    contraparte?: string;
    notas?: string;
    cancelado?: boolean;
    motivo_cancelacion?: string;
    // edición
    momento?: string;
    cambios?: { campo: string; antes: string; despues: string }[];
}

export interface HistorialAnimal {
    animal: Animal;
    eventos: EventoHistorial[];
}

export interface FilaInventario {
    especie: string;
    categoria: string;
    hembras: number;
    machos: number;
    con_arete: number;
    sin_arete: number;
    total: number;
}

export interface AnimalInventario {
    id: number;
    folio: string;
    arete_1: string;
    arete_2: string;
    arete_3: string;
    especie: string;
    categoria: string;
    sexo: Sexo;
    raza: string;
    fecha_nacimiento: string | null;
    notas: string;
}

export interface InventarioGanado {
    fecha: string;
    ranchos: { rancho: Referencia; filas: FilaInventario[]; total: number; animales?: AnimalInventario[] }[];
    totales: Partial<Record<"hembras" | "machos" | "con_arete" | "sin_arete" | "total", number>>;
}

export interface FilaBalance {
    rancho: Referencia;
    inicial: number;
    compras: number;
    nacimientos: number;
    regalos: number;
    recibidos: number;
    enviados: number;
    ventas: number;
    muertes: number;
    final: number;
}

export interface MovimientoReporte {
    id: number;
    folio: string;
    fecha: string;
    tipo: TipoMovimiento;
    tipo_nombre: string;
    motivo: MotivoMovimiento;
    motivo_nombre: string;
    rancho: string;
    rancho_destino: string;
    cabezas: number;
    resumen: string;
    animales: string;
    contraparte: string;
    importe: string | null;
    notas: string;
}

export interface ReporteMovimientos {
    desde: string;
    hasta: string;
    balance: FilaBalance[];
    movimientos: MovimientoReporte[];
}
