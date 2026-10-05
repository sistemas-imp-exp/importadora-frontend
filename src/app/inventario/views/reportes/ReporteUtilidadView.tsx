import { Fragment, useEffect, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import SearchableSelect from "../../../../shared/components/SearchableSelect";
import TablaResponsive from "../../../../shared/components/TablaResponsive";
import BotonExpandir from "../../../../shared/components/tabla/BotonExpandir";
import { useFilasExpandibles } from "../../../../shared/components/tabla/useFilasExpandibles";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { formatearFechaNumerica, hoyISO, primerYUltimoDiaDelMesActualISO } from "../../../../shared/utils/fechas";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Cliente } from "../../interfaces/clientes/Cliente";
import type { Empresa } from "../../interfaces/empresas/Empresa";
import type { Producto } from "../../interfaces/productos/Producto";
import type { Proveedor } from "../../interfaces/proveedores/Proveedor";
import type {
    AgrupacionUtilidad,
    FiltrosReporteUtilidad,
    ReporteUtilidadApi,
    TotalesUtilidad,
} from "../../interfaces/reportes/ReporteUtilidad";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerClientes } from "../../services/cliente.service";
import { obtenerEmpresas } from "../../services/empresa.service";
import { obtenerProductos } from "../../services/producto.service";
import { obtenerProveedores } from "../../services/proveedor.service";
import { descargarReporteUtilidad, obtenerReporteUtilidad } from "../../services/reporteUtilidad.service";
import { formatearDinero } from "../../utils/existencias";

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";
const AGRUPACIONES: { valor: AgrupacionUtilidad; etiqueta: string }[] = [
    { valor: "producto", etiqueta: "Producto" },
    { valor: "cliente", etiqueta: "Cliente" },
    { valor: "proveedor", etiqueta: "Proveedor" },
    { valor: "salida", etiqueta: "Salida" },
];

function filtrosIniciales(): FiltrosReporteUtilidad {
    const { primerDia } = primerYUltimoDiaDelMesActualISO();
    return {
        desde: primerDia, hasta: hoyISO(), agrupar: "producto",
        empresaId: "", clienteId: "", proveedorId: "", productoId: "", camaraId: "",
    };
}

function pesos(valor: string | null): string {
    if (valor === null) return "—";
    const n = Number(valor);
    return `${n < 0 ? "−" : ""}$${formatearDinero(Math.abs(n))}`;
}

function margen(valor: string | null): string {
    return valor === null ? "—" : `${valor}%`;
}

function claseSigno(valor: string | null): string {
    return valor !== null && Number(valor) < 0 ? "text-danger" : "";
}

function Tarjeta({ titulo, valor, clase = "", nota }: { titulo: string; valor: string; clase?: string; nota?: string }) {
    return (
        <div className="col-6 col-lg">
            <div className="card mb-0 h-100">
                <div className="card-body py-2">
                    <div className="text-muted small">{titulo}</div>
                    <div className={`fs-5 fw-bold font-tabular-nums ${clase}`}>{valor}</div>
                    {nota && <div className="small text-body-secondary">{nota}</div>}
                </div>
            </div>
        </div>
    );
}

function CeldasTotales({ t }: { t: TotalesUtilidad }) {
    return (
        <>
            <td className="num">{t.lineas.toLocaleString("es-MX")}</td>
            <td className="num">{formatearDinero(Number(t.kilos))}</td>
            <td className="num">{pesos(t.venta)}</td>
            <td className="num">{pesos(t.costo)}</td>
            <td className={`num fw-semibold ${claseSigno(t.utilidad)}`}>{pesos(t.utilidad)}</td>
            <td className={`num ${claseSigno(t.margen)}`}>{margen(t.margen)}</td>
        </>
    );
}

/**
 * Utilidad de las ventas reales de un periodo: venta de cada línea de salida
 * menos kg vendidos × costo/kg del lote. Los traslados entre cámaras no cuentan
 * y las líneas sin precio o sin costo se avisan aparte (no suman).
 */
function ReporteUtilidadView() {
    const { mostrarToast } = useToastContext();
    const [filtros, setFiltros] = useState<FiltrosReporteUtilidad>(filtrosIniciales);
    const [catalogos, setCatalogos] = useState<{
        empresas: Empresa[]; clientes: Cliente[]; proveedores: Proveedor[]; productos: Producto[]; camaras: Camara[];
    }>({ empresas: [], clientes: [], proveedores: [], productos: [], camaras: [] });
    const [reporte, setReporte] = useState<ReporteUtilidadApi | null>(null);
    const [cargando, setCargando] = useState(false);
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);
    const grupos = reporte?.grupos ?? [];
    const { estaExpandida, alternar, alternarTodas, todasExpandidas } = useFilasExpandibles(grupos.map((_, i) => i));

    useEffect(() => {
        Promise.all([obtenerEmpresas(), obtenerClientes(), obtenerProveedores(), obtenerProductos(), obtenerCamaras()])
            .then(([empresas, clientes, proveedores, productos, camaras]) =>
                setCatalogos({ empresas, clientes, proveedores, productos, camaras }))
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function cambiar(cambios: Partial<FiltrosReporteUtilidad>) {
        setFiltros((actual) => ({ ...actual, ...cambios }));
        // La vista previa dejaría de corresponder a los filtros: se descarta.
        setReporte(null);
    }

    async function generar(e?: React.FormEvent) {
        e?.preventDefault();
        setCargando(true);
        try {
            setReporte(await obtenerReporteUtilidad(filtros));
        } catch (err) {
            mostrarToast("Error al generar el reporte", obtenerMensajeError(err), "danger");
        } finally {
            setCargando(false);
        }
    }

    async function descargar(formato: "pdf" | "excel") {
        setDescargando(formato);
        try {
            await descargarReporteUtilidad(filtros, formato);
        } catch (err) {
            mostrarToast("Error al exportar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }

    const fechasValidas = !!filtros.desde && !!filtros.hasta && filtros.desde <= filtros.hasta;
    const agrupado = AGRUPACIONES.find((a) => a.valor === (reporte?.agrupar ?? filtros.agrupar))!.etiqueta;
    const r = reporte?.resumen;

    function selectCatalogo(
        id: string, etiqueta: string, valor: string, campo: keyof FiltrosReporteUtilidad,
        opciones: { id: number; nombre: string }[], todas: string,
    ) {
        return (
            <div className="col-sm-6 col-lg-2">
                <label className={CLASE_ETIQUETA} htmlFor={id}>{etiqueta}</label>
                <select id={id} className="form-select form-select-sm" value={valor} onChange={(e) => cambiar({ [campo]: e.target.value })}>
                    <option value="">{todas}</option>
                    {opciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Utilidad"
                subtitle="Ganancia de las ventas reales: venta menos el costo de los lotes vendidos"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Reportes" },
                    { label: "Utilidad" },
                ]}
            />

            <div className="container-fluid">
                <form className="card card-outline card-primary" onSubmit={generar}>
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-sm-6 col-lg-2">
                                <label className={CLASE_ETIQUETA} htmlFor="util-desde">Desde</label>
                                <input id="util-desde" type="date" className="form-control form-control-sm" value={filtros.desde}
                                    max={filtros.hasta || hoyISO()} onChange={(e) => cambiar({ desde: e.target.value })} required />
                            </div>
                            <div className="col-sm-6 col-lg-2">
                                <label className={CLASE_ETIQUETA} htmlFor="util-hasta">Hasta</label>
                                <input id="util-hasta" type="date" className="form-control form-control-sm" value={filtros.hasta}
                                    min={filtros.desde} max={hoyISO()} onChange={(e) => cambiar({ hasta: e.target.value })} required />
                            </div>
                            <div className="col-sm-6 col-lg-2">
                                <label className={CLASE_ETIQUETA} htmlFor="util-agrupar">Agrupar por</label>
                                <select id="util-agrupar" className="form-select form-select-sm" value={filtros.agrupar}
                                    onChange={(e) => cambiar({ agrupar: e.target.value as AgrupacionUtilidad })}>
                                    {AGRUPACIONES.map((a) => <option key={a.valor} value={a.valor}>{a.etiqueta}</option>)}
                                </select>
                            </div>
                            {selectCatalogo("util-empresa", "Empresa", filtros.empresaId, "empresaId", catalogos.empresas, "Todas")}
                            {selectCatalogo("util-cliente", "Cliente", filtros.clienteId, "clienteId", catalogos.clientes, "Todos")}
                            {selectCatalogo("util-proveedor", "Proveedor", filtros.proveedorId, "proveedorId", catalogos.proveedores, "Todos")}
                            <div className="col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA} htmlFor="util-producto">Producto</label>
                                <SearchableSelect
                                    id="util-producto"
                                    placeholder="Todos"
                                    options={catalogos.productos.map((p) => ({ value: p.id, label: `${p.talla} ${p.tipo}` }))}
                                    value={filtros.productoId === "" ? "" : Number(filtros.productoId)}
                                    onChange={(v) => cambiar({ productoId: v === "" ? "" : String(v) })}
                                />
                            </div>
                            {selectCatalogo("util-camara", "Cámara", filtros.camaraId, "camaraId", catalogos.camaras, "Todas")}
                            <div className="col-12 col-lg d-flex flex-wrap gap-2 justify-content-lg-end">
                                <button type="submit" className="btn btn-primary btn-sm" disabled={cargando || !fechasValidas}>
                                    {cargando
                                        ? <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        : <i className="bi bi-eye me-1" aria-hidden="true"></i>}
                                    Ver reporte
                                </button>
                                {(["excel", "pdf"] as const).map((formato) => (
                                    <button
                                        key={formato}
                                        type="button"
                                        className={`btn btn-sm ${formato === "excel" ? "btn-outline-success" : "btn-outline-danger"}`}
                                        onClick={() => descargar(formato)}
                                        disabled={descargando !== null || !fechasValidas}
                                    >
                                        {descargando === formato
                                            ? <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            : <i className={`bi ${formato === "excel" ? "bi-file-earmark-excel" : "bi-file-earmark-pdf"} me-1`} aria-hidden="true"></i>}
                                        {formato === "excel" ? "Excel" : "PDF"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="small text-body-secondary mt-3 mb-0">
                            <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                            Utilidad = venta − kg vendidos × costo/kg del lote. Solo ventas a clientes (los traslados entre
                            cámaras no cuentan). Las líneas sin precio o cuyo lote no tiene costo no suman y se avisan aparte.
                        </p>
                    </div>
                </form>

                {cargando && <SkeletonTable columnas={7} filas={6} />}

                {!cargando && reporte && r && (
                    <>
                        <div className="row g-2 mb-3">
                            <Tarjeta titulo="Venta" valor={pesos(r.venta)} />
                            <Tarjeta titulo="Costo" valor={pesos(r.costo)} />
                            <Tarjeta titulo="Utilidad" valor={pesos(r.utilidad)} clase={claseSigno(r.utilidad) || "text-success"} />
                            <Tarjeta titulo="Margen" valor={margen(r.margen)} clase={claseSigno(r.margen)} />
                            <Tarjeta titulo="Kg vendidos" valor={formatearDinero(Number(r.kilos))} nota={`${r.lineas - r.incompletas} línea(s) incluidas`} />
                        </div>

                        {r.incompletas > 0 && (
                            <div className="alert alert-warning py-2 small d-flex align-items-center gap-2" role="status">
                                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                                <span>
                                    No incluidas en los totales:{" "}
                                    {reporte.avisos.sin_precio.lineas > 0 && <b>{reporte.avisos.sin_precio.lineas} línea(s) sin precio ({formatearDinero(Number(reporte.avisos.sin_precio.kilos))} kg)</b>}
                                    {reporte.avisos.sin_precio.lineas > 0 && reporte.avisos.sin_costo.lineas > 0 && " y "}
                                    {reporte.avisos.sin_costo.lineas > 0 && <b>{reporte.avisos.sin_costo.lineas} línea(s) de lotes sin costo ({formatearDinero(Number(reporte.avisos.sin_costo.kilos))} kg)</b>}
                                    . Aparecen marcadas en el detalle.
                                </span>
                            </div>
                        )}

                        {grupos.length === 0 ? (
                            <div className="alert alert-light border text-center py-4">
                                <i className="bi bi-graph-up fs-3 d-block mb-2 text-body-secondary" aria-hidden="true"></i>
                                No hay ventas en el periodo con esos filtros.
                            </div>
                        ) : (
                            <div className="card">
                                <div className="card-body p-0">
                                    <TablaResponsive alturaMaxima="70vh">
                                        <table className="table tabla-datos">
                                            <thead>
                                                <tr>
                                                    <th className="text-center" style={{ width: "2.5rem" }}>
                                                        <BotonExpandir expandido={todasExpandidas} onClick={alternarTodas} etiqueta="el detalle de todos" />
                                                    </th>
                                                    <th>{agrupado}</th>
                                                    <th className="num">Líneas</th>
                                                    <th className="num">Kg vendidos</th>
                                                    <th className="num">Venta</th>
                                                    <th className="num">Costo</th>
                                                    <th className="num">Utilidad</th>
                                                    <th className="num">Margen</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grupos.map((g, i) => {
                                                    const abierto = estaExpandida(i);
                                                    return (
                                                        <Fragment key={i}>
                                                            <tr className={`fila-principal ${abierto ? "expandida" : ""}`}>
                                                                <td className="text-center">
                                                                    <BotonExpandir expandido={abierto} onClick={() => alternar(i)}
                                                                        etiqueta={`ventas de ${g.etiqueta}`} controla={`util-detalle-${i}`} />
                                                                </td>
                                                                <td className="fw-semibold">
                                                                    {g.etiqueta}
                                                                    {g.incompletas > 0 && (
                                                                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle ms-2"
                                                                            title="Líneas sin precio o sin costo: no suman">
                                                                            {g.incompletas} incompleta(s)
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <CeldasTotales t={g} />
                                                            </tr>
                                                            {abierto && (
                                                                <tr className="fila-detalle" id={`util-detalle-${i}`}>
                                                                    <td colSpan={8}>
                                                                        <table className="table table-sm tabla-detalle mb-0 border rounded">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>Fecha</th><th>Folio</th><th>Cliente</th><th>Producto</th>
                                                                                    <th>Lote</th><th>Proveedor</th><th>Cámara</th>
                                                                                    <th className="num">Kg</th><th className="num">Precio/kg</th>
                                                                                    <th className="num">Venta</th><th className="num">Costo/kg</th>
                                                                                    <th className="num">Costo</th><th className="num">Utilidad</th>
                                                                                    <th className="num">Margen</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {g.detalle.map((l, j) => (
                                                                                    <tr key={j}>
                                                                                        <td className="text-nowrap">{formatearFechaNumerica(new Date(l.fecha + "T00:00:00"))}</td>
                                                                                        <td className="text-nowrap">{l.folio}</td>
                                                                                        <td className="truncar" title={l.cliente}>{l.cliente}</td>
                                                                                        <td className="text-nowrap">{l.producto}</td>
                                                                                        <td className="text-nowrap">{l.lote}</td>
                                                                                        <td className="truncar" title={l.proveedor}>{l.proveedor}</td>
                                                                                        <td className="text-nowrap">{l.camara}</td>
                                                                                        <td className="num">{formatearDinero(Number(l.kilos))}</td>
                                                                                        <td className="num">{pesos(l.precio_kg)}</td>
                                                                                        <td className="num">{l.estado === "sin_precio" ? <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Sin precio</span> : pesos(l.venta)}</td>
                                                                                        <td className="num">{l.estado === "sin_costo" ? <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Sin costo</span> : pesos(l.costo_kg)}</td>
                                                                                        <td className="num">{pesos(l.costo)}</td>
                                                                                        <td className={`num fw-semibold ${claseSigno(l.utilidad)}`}>{pesos(l.utilidad)}</td>
                                                                                        <td className={`num ${claseSigno(l.margen)}`}>{margen(l.margen)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td></td>
                                                    <td className="fw-bold">Total</td>
                                                    <CeldasTotales t={r} />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </TablaResponsive>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

export default ReporteUtilidadView;
