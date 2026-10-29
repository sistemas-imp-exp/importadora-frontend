/** Usuario resumido que manda el API de Cartera en el rastro de cada registro. */
export interface UsuarioCartera {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
}

export interface EmpresaCartera {
    id: number;
    nombre: string;
}

export interface UltimoPago {
    fecha: string; // 'YYYY-MM-DD'
    monto: string | null;
}

/** Cliente (catálogo de Inventario) con datos de cobranza y saldo por empresa. */
export interface ClienteCartera {
    id: number;
    nombre: string;
    activo: boolean;
    celular: string;
    pagare: boolean;
    notas: string;
    /** {empresa_id: saldo} */
    saldos: Record<string, string>;
    saldo_conjunto: string;
    ultimo_pago: UltimoPago | null;
    /** Líneas de venta pendientes de verificar contra la nota. */
    ventas_por_verificar: number;
    /** Líneas con diferencia reportada o sin precio (esperan a Inventario). */
    ventas_con_diferencia: number;
}

export interface ClienteCarteraRequest {
    nombre: string;
    activo: boolean;
    celular: string;
    pagare: boolean;
    notas: string;
}

export type TipoRenglon = "inicial" | "venta" | "pago" | "cargo" | "abono";

export interface RenglonEstadoCuenta {
    id: number | null;
    fecha: string;
    tipo: TipoRenglon;
    empresa: string;
    referencia: string;
    concepto: string;
    cargo: string;
    abono: string;
    /** Saldo corrido; null si el renglón está cancelado (no lo mueve). */
    saldo: string | null;
    cancelado: boolean;
    motivo_cancelacion: string;
    /** Solo en ventas: las líneas de la salida. */
    detalle: {
        linea_id: number; folio_salida: string; nota: string; origen: string; producto: string; kilos: string;
        precio_kilo: string | null; importe: string | null; estado: EstadoVenta;
    }[];
}

interface MovimientoCartera {
    id: number;
    cliente: { id: number; nombre: string };
    empresa: EmpresaCartera;
    fecha: string;
    monto: string;
    notas: string;
    usuario: UsuarioCartera;
    creado: string;
    editado_por: UsuarioCartera | null;
    editado_en: string | null;
    cancelado: boolean;
    fecha_cancelacion: string | null;
    usuario_cancelacion: UsuarioCartera | null;
    motivo_cancelacion: string;
}

export type TipoPago = "T" | "E" | "A" | "AA";

export const TIPOS_PAGO: { value: TipoPago; label: string; corto: string }[] = [
    { value: "T", label: "Transferencia", corto: "T" },
    { value: "E", label: "Efectivo", corto: "E" },
    { value: "A", label: "Efectivo a Tesorería", corto: "A" },
    { value: "AA", label: "Efectivo Arriaga / Mapastepec", corto: "AA" },
];

export interface IngresoTesoreria {
    id: number;
    folio: string;
    fecha: string;
    beneficiario: string;
    concepto: string;
    monto: string;
}

/** Sin cliente = pago por identificar: no mueve ningún saldo hasta asignarlo. */
export interface PagoCliente extends Omit<MovimientoCartera, "cliente"> {
    cliente: { id: number; nombre: string } | null;
    por_identificar: boolean;
    identificado_por: UsuarioCartera | null;
    identificado_en: string | null;
    tipo: TipoPago;
    tipo_display: string;
    referencia: string;
    ingreso_tesoreria: (Omit<IngresoTesoreria, "monto"> & { cancelado: boolean }) | null;
}

export interface PagoClienteRequest {
    /** null = por identificar. */
    cliente_id: number | null;
    empresa_id: number;
    tipo: TipoPago;
    referencia: string;
    notas: string;
    /** Con ingreso de Tesorería, fecha y monto salen de él. */
    ingreso_tesoreria_id: number | null;
    fecha?: string;
    monto?: number;
}

export type Naturaleza = "C" | "A";

export interface AjusteCliente extends MovimientoCartera {
    naturaleza: Naturaleza;
    naturaleza_display: string;
    concepto: string;
    es_traspaso: boolean;
    contraparte: { id: number; empresa: string; naturaleza: Naturaleza } | null;
}

export interface AjusteClienteRequest {
    cliente_id: number;
    empresa_id: number;
    naturaleza: Naturaleza;
    concepto: string;
    fecha: string;
    monto: number;
    notas: string;
}

export interface TraspasoRequest {
    cliente_id: number;
    origen_id: number;
    destino_id: number;
    concepto: string;
    fecha: string;
    monto: number;
    notas: string;
}

export interface ResumenCartera {
    fecha_corte: string | null;
    empresas: { id: number; nombre: string; por_cobrar: string; a_favor: string; cobrado_mes: string }[];
    clientes_con_saldo: number;
    /** Pagos activos sin cliente, por empresa. */
    por_identificar: { empresa_id: number; cantidad: number; monto: string }[];
    /** Líneas de venta (salidas a cliente) por estado de verificación. */
    ventas: { pendientes: number; diferencia: number; sin_precio: number; verificadas: number };
    mayores_saldos: { id: number; nombre: string; saldo_conjunto: string }[];
}

export interface FiltroMovimientos {
    cliente?: number;
    empresa?: number;
    desde?: string;
    hasta?: string;
    estado?: "activo" | "cancelado";
    tipo?: TipoPago;
    q?: string;
    /** true: solo pagos sin cliente; false: solo identificados. */
    por_identificar?: boolean;
}

// --- Ventas (salidas de Inventario) y su verificación ---------------------------

export type EstadoVenta = "pendiente" | "verificada" | "diferencia" | "sin_precio";

export interface LineaVenta {
    id: number;
    producto: string;
    lote: string;
    camara: string;
    cajas: number;
    kilos: string;
    precio_kilo: string | null;
    importe: string | null;
    estado: EstadoVenta;
    /** Había revisión, pero Inventario corrigió la línea después: hay que revisarla de nuevo. */
    corregida_por_inventario: boolean;
    comentario: string;
    verificado_por: string | null;
    verificado_en: string | null;
}

/** Una salida de Inventario a un cliente (en una empresa) con sus líneas. */
export interface VentaCliente {
    salida_id: number;
    folio_salida: string;
    nota_salida: string;
    fecha: string;
    empresa: EmpresaCartera;
    lineas: LineaVenta[];
    total: string;
}
