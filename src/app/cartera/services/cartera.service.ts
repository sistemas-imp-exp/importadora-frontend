import api from "../../../shared/api/client";
import { descargarBlob } from "../../../shared/utils/descargarArchivo";
import type {
    AjusteCliente, AjusteClienteRequest, ClienteCartera, ClienteCarteraRequest, EmpresaCartera, FiltroMovimientos,
    EstadoVenta, IngresoTesoreria, PagoCliente, PagoClienteRequest, RenglonEstadoCuenta, ResumenCartera,
    TraspasoRequest, VentaCliente,
} from "../interfaces/Cartera";

const BASE = "cartera/";
const PDF = "application/pdf";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function obtenerResumen(): Promise<ResumenCartera> {
    const { data } = await api.get<ResumenCartera>(`${BASE}resumen/`);
    return data;
}

export async function obtenerEmpresas(): Promise<EmpresaCartera[]> {
    const { data } = await api.get<EmpresaCartera[]>(`${BASE}empresas/`);
    return data;
}

// --- Clientes ---------------------------------------------------------------

export async function obtenerClientes(filtro: { q?: string; activo?: boolean; con_saldo?: boolean } = {}): Promise<ClienteCartera[]> {
    const { data } = await api.get<ClienteCartera[]>(`${BASE}clientes/`, { params: filtro });
    return data;
}

export async function obtenerCliente(id: number): Promise<ClienteCartera> {
    const { data } = await api.get<ClienteCartera>(`${BASE}clientes/${id}/`);
    return data;
}

export async function crearCliente(cliente: ClienteCarteraRequest): Promise<ClienteCartera> {
    const { data } = await api.post<ClienteCartera>(`${BASE}clientes/`, cliente);
    return data;
}

export async function actualizarCliente(id: number, cliente: ClienteCarteraRequest): Promise<ClienteCartera> {
    const { data } = await api.put<ClienteCartera>(`${BASE}clientes/${id}/`, cliente);
    return data;
}

export async function obtenerEstadoCuenta(id: number, empresa?: number): Promise<RenglonEstadoCuenta[]> {
    const { data } = await api.get<RenglonEstadoCuenta[]>(`${BASE}clientes/${id}/estado-cuenta/`, { params: { empresa } });
    return data;
}

export async function descargarEstadoCuenta(id: number, formato: "pdf" | "excel", empresa?: number): Promise<void> {
    const params = new URLSearchParams();
    if (empresa) params.set("empresa", String(empresa));
    await descargarBlob(
        `${BASE}clientes/${id}/estado-cuenta/${formato}/`,
        formato === "pdf" ? PDF : XLSX,
        `estado_cuenta_cliente_${id}.${formato === "pdf" ? "pdf" : "xlsx"}`,
        params,
    );
}

// --- Pagos ------------------------------------------------------------------

export async function obtenerPagos(filtro: FiltroMovimientos = {}): Promise<PagoCliente[]> {
    const { data } = await api.get<PagoCliente[]>(`${BASE}pagos/`, { params: filtro });
    return data;
}

export async function crearPago(pago: PagoClienteRequest): Promise<PagoCliente> {
    const { data } = await api.post<PagoCliente>(`${BASE}pagos/`, pago);
    return data;
}

export async function actualizarPago(id: number, pago: PagoClienteRequest): Promise<PagoCliente> {
    const { data } = await api.put<PagoCliente>(`${BASE}pagos/${id}/`, pago);
    return data;
}

/** Asigna el cliente a un pago por identificar (se aplica con la fecha original del pago). */
export async function identificarPago(id: number, clienteId: number): Promise<PagoCliente> {
    const { data } = await api.post<PagoCliente>(`${BASE}pagos/${id}/identificar/`, { cliente_id: clienteId });
    return data;
}

export async function cancelarPago(id: number, motivo: string): Promise<PagoCliente> {
    const { data } = await api.post<PagoCliente>(`${BASE}pagos/${id}/cancelar/`, { motivo });
    return data;
}

export async function obtenerIngresosTesoreria(filtro: { q?: string; desde?: string; hasta?: string; pago?: number }): Promise<IngresoTesoreria[]> {
    const { data } = await api.get<IngresoTesoreria[]>(`${BASE}ingresos-tesoreria/`, { params: filtro });
    return data;
}

// --- Ajustes ----------------------------------------------------------------

export async function obtenerAjustes(filtro: FiltroMovimientos = {}): Promise<AjusteCliente[]> {
    const { data } = await api.get<AjusteCliente[]>(`${BASE}ajustes/`, { params: filtro });
    return data;
}

export async function crearAjuste(ajuste: AjusteClienteRequest): Promise<AjusteCliente> {
    const { data } = await api.post<AjusteCliente>(`${BASE}ajustes/`, ajuste);
    return data;
}

export async function actualizarAjuste(id: number, ajuste: AjusteClienteRequest): Promise<AjusteCliente> {
    const { data } = await api.put<AjusteCliente>(`${BASE}ajustes/${id}/`, ajuste);
    return data;
}

export async function crearTraspaso(traspaso: TraspasoRequest): Promise<AjusteCliente[]> {
    const { data } = await api.post<AjusteCliente[]>(`${BASE}ajustes/traspaso/`, traspaso);
    return data;
}

export async function cancelarAjuste(id: number, motivo: string): Promise<AjusteCliente> {
    const { data } = await api.post<AjusteCliente>(`${BASE}ajustes/${id}/cancelar/`, { motivo });
    return data;
}

// --- Ventas -----------------------------------------------------------------

export interface FiltroVentas {
    estado?: EstadoVenta;
    empresa?: number;
    desde?: string;
    hasta?: string;
}

export async function obtenerVentasCliente(id: number, filtro: FiltroVentas = {}): Promise<VentaCliente[]> {
    const { data } = await api.get<VentaCliente[]>(`${BASE}clientes/${id}/ventas/`, { params: filtro });
    return data;
}

/** Marca líneas como verificadas, con diferencia (comentario obligatorio) o de vuelta a pendientes. */
export async function verificarVentas(
    lineas: number[], estado: "verificada" | "diferencia" | "pendiente", comentario = "",
): Promise<void> {
    await api.post(`${BASE}ventas/verificar/`, { lineas, estado, comentario });
}

// --- Reportes ---------------------------------------------------------------

export interface ReporteSaldos {
    empresas: EmpresaCartera[];
    /** {empresa_id: monto} de pagos sin cliente, en negativo (como en el Excel del área). */
    por_identificar: Record<string, string>;
    filas: {
        cliente: { id: number; nombre: string };
        saldos: Record<string, string>;
        saldo_conjunto: string;
        ultimo_pago: { fecha: string; monto: string | null } | null;
        celular: string;
        pagare: boolean;
    }[];
}

export interface FiltroReporteSaldos {
    q?: string;
    con_saldo?: boolean;
}

export async function obtenerReporteSaldos(filtro: FiltroReporteSaldos): Promise<ReporteSaldos> {
    const { data } = await api.get<ReporteSaldos>(`${BASE}reportes/saldos/`, { params: filtro });
    return data;
}

/** `resumido`: PDF vertical solo con cliente, saldo por empresa y conjunto. */
export async function descargarReporteSaldos(formato: "pdf" | "excel", filtro: FiltroReporteSaldos, resumido = false): Promise<void> {
    const params = new URLSearchParams();
    if (filtro.q) params.set("q", filtro.q);
    if (filtro.con_saldo) params.set("con_saldo", "1");
    if (resumido) params.set("resumido", "1");
    await descargarBlob(
        `${BASE}reportes/saldos/${formato}/`,
        formato === "pdf" ? PDF : XLSX,
        `saldos_clientes.${formato === "pdf" ? "pdf" : "xlsx"}`,
        params,
    );
}

// --- Utilidad real ----------------------------------------------------------

export type EstadoUtilidad = "completa" | "sin_precio" | "sin_costo";

/** Una línea de venta como en la hoja Registro del área. */
export interface FilaUtilidad {
    linea_id: number;
    fecha: string;
    lote: string;
    nota: string;
    folio_salida: string;
    proveedor: string;
    cliente: string;
    producto: string;
    kilos: string;
    precio: string | null;
    venta: string | null;
    /** El capturado por Cartera o, si falta, el del lote (costo_capturado = false). */
    costo_unitario: string | null;
    costo_capturado: boolean;
    costo: string | null;
    utilidad: string | null;
    margen: string | null;
    /** Gasto operativo vigente en la fecha de la venta. */
    gasto_por_kilo: string;
    estado: EstadoUtilidad;
}

export interface ResumenUtilidad {
    lineas: number;
    kilos: string;
    venta: string;
    costo: string;
    utilidad: string;
    margen: string | null;
    gasto_operativo: string;
    utilidad_real: string;
    margen_real: string | null;
    sin_precio: number;
    sin_costo: number;
    costo_propuesto: number;
}

export interface UtilidadReal {
    desde: string;
    hasta: string;
    gasto_por_kilo: string;
    filas: FilaUtilidad[];
    resumen: ResumenUtilidad;
}

export interface FiltroUtilidad {
    desde: string;
    hasta: string;
    cliente?: number;
}

export interface GastoOperativo {
    id: number;
    por_kilo: string;
    vigente_desde: string;
    usuario: string | null;
    creado: string;
}

export async function obtenerUtilidadReal(filtro: FiltroUtilidad): Promise<UtilidadReal> {
    const { data } = await api.get<UtilidadReal>(`${BASE}utilidad/`, { params: filtro });
    return data;
}

export async function descargarUtilidadReal(filtro: FiltroUtilidad): Promise<void> {
    const params = new URLSearchParams({ desde: filtro.desde, hasta: filtro.hasta });
    if (filtro.cliente) params.set("cliente", String(filtro.cliente));
    await descargarBlob(`${BASE}utilidad/excel/`, XLSX, `utilidad_real_${filtro.desde}_${filtro.hasta}.xlsx`, params);
}

/** Costo por venta; null vuelve al propuesto del lote. */
export async function guardarCostosVenta(costos: { linea_id: number; costo_unitario: number | null }[]): Promise<number> {
    const { data } = await api.post<{ cambios: number }>(`${BASE}utilidad/costos/`, { costos });
    return data.cambios;
}

export async function obtenerHistorialCosto(lineaId: number): Promise<{ fecha: string; anterior: string | null; nuevo: string | null; usuario: string }[]> {
    const { data } = await api.get(`${BASE}utilidad/costos/${lineaId}/historial/`);
    return data;
}

export async function obtenerGastosOperativos(): Promise<GastoOperativo[]> {
    const { data } = await api.get<GastoOperativo[]>(`${BASE}utilidad/gastos-operativos/`);
    return data;
}

export async function crearGastoOperativo(gasto: { por_kilo: number; vigente_desde: string }): Promise<GastoOperativo> {
    const { data } = await api.post<GastoOperativo>(`${BASE}utilidad/gastos-operativos/`, gasto);
    return data;
}

/** Los pagos de la pantalla (mismos filtros) en PDF o Excel. */
export async function descargarPagos(formato: "pdf" | "excel", filtro: FiltroMovimientos): Promise<void> {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtro)) {
        if (valor !== undefined && valor !== "") params.set(clave, String(valor));
    }
    await descargarBlob(`${BASE}pagos/${formato}/`, formato === "pdf" ? PDF : XLSX,
        `pagos_clientes.${formato === "pdf" ? "pdf" : "xlsx"}`, params);
}
