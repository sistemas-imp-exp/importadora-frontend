import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../../shared/hooks/useAuth";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { hoyISO } from "../../../../shared/utils/fechas";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerEmpresas } from "../../services/empresa.service";
import { obtenerProductos } from "../../services/producto.service";
import { obtenerProveedores } from "../../services/proveedor.service";
import FiltroChipMultiple from "../../../../shared/components/FiltroChipMultiple";
import type { OpcionFiltro } from "../../../../shared/components/FiltroChip";
import type { Producto } from "../../interfaces/productos/Producto";
import type { Proveedor } from "../../interfaces/proveedores/Proveedor";
import {
    descargarReporteCamarasExcel,
    descargarReporteCamarasPdf,
    obtenerReporteCamaras,
} from "../../services/reporteCamaras.service";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Empresa } from "../../interfaces/empresas/Empresa";
import type { FiltrosReporteCamaras, ReporteCamarasApi } from "../../interfaces/reportes/ReporteCamaras";
import ReporteCamaraTabla from "../../components/reportes/ReporteCamaraTabla";
import { formatearKg } from "../../../../shared/utils/numeros";

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

const OPCIONES_PRESENTACION: OpcionFiltro[] = [
    { value: "entero", label: "Entero" },
    { value: "colas", label: "Colas" },
    { value: "sin", label: "Sin presentación" },
];

const SIN_FILTROS_PRODUCTO = { presentaciones: [], tallas: [], tipos: [], categorias: [], proveedorIds: [] };

// Espera tras el último cambio de filtro antes de consultar: marcar varias
// casillas seguidas hace una sola petición.
const ESPERA_CONSULTA_MS = 500;

// El backend suma FRIGARSA, NAVECAP, BASAL 4, BASAL 7, MEXIDELI y ARCOSA como una sola cámara.
const RESUMEN_MEXICO = "mexico";

type FiltrosGuardados = Omit<FiltrosReporteCamaras, "fecha">;

/**
 * Los filtros se recuerdan por usuario en este navegador (localStorage: siguen
 * ahí al cerrar la pestaña), menos la fecha, que siempre arranca en hoy para
 * no mostrar existencias viejas sin darse cuenta. Solo se guardan los filtros;
 * los datos se vuelven a pedir.
 */
function llaveFiltros(usuarioId: number | undefined): string {
    return `reporte-camaras:filtros:${usuarioId ?? "anonimo"}`;
}

function filtrosIniciales(usuarioId: number | undefined): FiltrosReporteCamaras {
    const base: FiltrosReporteCamaras = { fecha: hoyISO(), camaraId: "", empresaId: "", ...SIN_FILTROS_PRODUCTO };
    try {
        const guardados = JSON.parse(localStorage.getItem(llaveFiltros(usuarioId)) ?? "null") as Partial<FiltrosGuardados> | null;
        if (!guardados || typeof guardados !== "object") return base;
        const texto = (v: unknown) => (typeof v === "string" ? v : "");
        const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
        return {
            ...base,
            camaraId: texto(guardados.camaraId),
            empresaId: texto(guardados.empresaId),
            presentaciones: lista(guardados.presentaciones),
            tallas: lista(guardados.tallas),
            tipos: lista(guardados.tipos),
            categorias: lista(guardados.categorias),
            proveedorIds: lista(guardados.proveedorIds),
        };
    } catch {
        return base;
    }
}

function guardarFiltros(usuarioId: number | undefined, filtros: FiltrosReporteCamaras) {
    const guardables: FiltrosGuardados = {
        camaraId: filtros.camaraId,
        empresaId: filtros.empresaId,
        presentaciones: filtros.presentaciones,
        tallas: filtros.tallas,
        tipos: filtros.tipos,
        categorias: filtros.categorias,
        proveedorIds: filtros.proveedorIds,
    };
    try {
        localStorage.setItem(llaveFiltros(usuarioId), JSON.stringify(guardables));
    } catch {
        // Sin almacenamiento disponible los filtros solo duran mientras la página está abierta.
    }
}

/** Valores distintos de un campo, en orden natural ("30-40" antes que "100-120"). */
function opcionesDe(valores: string[]): OpcionFiltro[] {
    return [...new Set(valores.filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
        .map((v) => ({ value: v, label: v }));
}

function ReportesInventarioView() {
    const { mostrarToast } = useToastContext();
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const { user } = useAuth();
    const usuarioId = user?.id;
    const [filtros, setFiltros] = useState<FiltrosReporteCamaras>(() => filtrosIniciales(usuarioId));
    const [reporte, setReporte] = useState<ReporteCamarasApi | null>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Subirlo vuelve a consultar con los mismos filtros (botón Actualizar).
    const [recarga, setRecarga] = useState(0);
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);

    useEffect(() => {
        Promise.all([obtenerCamaras(), obtenerEmpresas(), obtenerProductos(), obtenerProveedores()])
            .then(([datosCamaras, datosEmpresas, datosProductos, datosProveedores]) => {
                setCamaras(datosCamaras);
                setEmpresas(datosEmpresas);
                setProductos(datosProductos);
                setProveedores(datosProveedores);
                // Lo guardado que ya no existe en los catálogos se descarta sin avisar.
                const existe = (lista: string[]) => (v: string) => lista.includes(v);
                const tallas = datosProductos.map((p) => p.talla);
                const tipos = datosProductos.map((p) => p.tipo);
                const categorias = datosProductos.map((p) => p.categoria);
                const proveedorIds = datosProveedores.map((p) => String(p.id));
                setFiltros((actual) => {
                    const limpios = {
                        ...actual,
                        camaraId: actual.camaraId === RESUMEN_MEXICO || datosCamaras.some((c) => String(c.id) === actual.camaraId)
                            ? actual.camaraId : "",
                        empresaId: datosEmpresas.some((e) => String(e.id) === actual.empresaId) ? actual.empresaId : "",
                        tallas: actual.tallas.filter(existe(tallas)),
                        tipos: actual.tipos.filter(existe(tipos)),
                        categorias: actual.categorias.filter(existe(categorias)),
                        proveedorIds: actual.proveedorIds.filter(existe(proveedorIds)),
                        presentaciones: actual.presentaciones.filter((v) => OPCIONES_PRESENTACION.some((o) => o.value === v)),
                    };
                    return JSON.stringify(limpios) === JSON.stringify(actual) ? actual : limpios;
                });
            })
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        guardarFiltros(usuarioId, filtros);
    }, [usuarioId, filtros]);

    // Consulta automática: espera a que se dejen de mover los filtros y cancela
    // la petición anterior, para que una respuesta vieja no pise a la nueva.
    // Mientras carga se deja la vista previa anterior, atenuada.
    useEffect(() => {
        if (!filtros.fecha) return;
        const controlador = new AbortController();
        const espera = setTimeout(() => {
            setCargando(true);
            obtenerReporteCamaras(filtros, controlador.signal)
                .then((datos) => {
                    setReporte(datos);
                    setError(null);
                })
                .catch((err) => {
                    if (axios.isCancel(err)) return;
                    setError(obtenerMensajeError(err));
                })
                .finally(() => {
                    if (!controlador.signal.aborted) setCargando(false);
                });
        }, ESPERA_CONSULTA_MS);
        return () => {
            clearTimeout(espera);
            controlador.abort();
        };
    }, [filtros, recarga]);

    function cambiar(cambios: Partial<FiltrosReporteCamaras>) {
        setFiltros((actual) => ({ ...actual, ...cambios }));
    }

    async function descargar(formato: "pdf" | "excel") {
        setDescargando(formato);
        try {
            await (formato === "pdf" ? descargarReporteCamarasPdf : descargarReporteCamarasExcel)(filtros);
        } catch (err) {
            mostrarToast("Error al exportar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }

    const opciones = useMemo(() => ({
        tallas: opcionesDe(productos.map((p) => p.talla)),
        tipos: opcionesDe(productos.map((p) => p.tipo)),
        categorias: opcionesDe(productos.map((p) => p.categoria)),
        proveedores: [...proveedores]
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
            .map((p) => ({ value: String(p.id), label: p.nombre })),
    }), [productos, proveedores]);
    const hayFiltrosProducto = Object.keys(SIN_FILTROS_PRODUCTO)
        .some((clave) => filtros[clave as keyof typeof SIN_FILTROS_PRODUCTO].length > 0);

    const nombreEmpresa = empresas.find((e) => String(e.id) === filtros.empresaId)?.nombre;
    // Igual que el subtítulo del PDF y el Excel: empresa y filtros de producto.
    const etiquetas = (valores: string[], lista: OpcionFiltro[]) =>
        lista.filter((o) => valores.includes(o.value)).map((o) => o.label).join(", ");
    const subtitulo = [
        nombreEmpresa,
        etiquetas(filtros.presentaciones, OPCIONES_PRESENTACION),
        filtros.tallas.length ? `Talla: ${filtros.tallas.join(", ")}` : "",
        filtros.tipos.length ? `Tipo: ${filtros.tipos.join(", ")}` : "",
        filtros.categorias.length ? `Categoría: ${filtros.categorias.join(", ")}` : "",
        filtros.proveedorIds.length ? `Proveedor: ${etiquetas(filtros.proveedorIds, opciones.proveedores)}` : "",
    ].filter(Boolean).join(" · ");
    const totalGeneral = reporte?.camaras.reduce((acc, c) => acc + Number(c.total), 0) ?? 0;

    return (
        <>
            <PageHeader
                title="Existencias por cámara"
                subtitle="Existencias por cámara, con el formato del área, a hoy o a una fecha pasada"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Reportes" },
                    { label: "Existencias por cámara" },
                ]}
            />

            <div className="container-fluid">
                <div className="card card-outline card-primary">
                    <div className="card-header">
                        <h3 className="card-title fs-6 fw-bold m-0">
                            <i className="bi bi-file-earmark-bar-graph me-2 text-body-secondary" aria-hidden="true"></i>
                            Existencias por cámara
                        </h3>
                    </div>
                    <form className="card-body" onSubmit={(e) => e.preventDefault()}>
                        <div className="row g-3 align-items-end">
                            <div className="col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA} htmlFor="reporte-fecha">Existencias al</label>
                                <input
                                    id="reporte-fecha"
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={filtros.fecha}
                                    max={hoyISO()}
                                    onChange={(e) => cambiar({ fecha: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA} htmlFor="reporte-camara">Cámara</label>
                                <select
                                    id="reporte-camara"
                                    className="form-select form-select-sm"
                                    value={filtros.camaraId}
                                    onChange={(e) => cambiar({ camaraId: e.target.value })}
                                >
                                    <option value="">Todas (una por página)</option>
                                    <option value={RESUMEN_MEXICO}>Resumen cámaras de México</option>
                                    {camaras.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                                <label className={CLASE_ETIQUETA} htmlFor="reporte-empresa">Empresa</label>
                                <select
                                    id="reporte-empresa"
                                    className="form-select form-select-sm"
                                    value={filtros.empresaId}
                                    onChange={(e) => cambiar({ empresaId: e.target.value })}
                                >
                                    <option value="">Todas las empresas</option>
                                    {empresas.map((e) => (
                                        <option key={e.id} value={e.id}>{e.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-sm-6 col-lg-3 d-flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setRecarga((n) => n + 1)}
                                    disabled={cargando || !filtros.fecha}
                                    title="Volver a consultar con los mismos filtros (por si se capturó algo mientras tanto)"
                                    aria-label="Actualizar reporte"
                                >
                                    {cargando ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm"
                                    onClick={() => descargar("excel")}
                                    disabled={descargando !== null || !filtros.fecha}
                                >
                                    {descargando === "excel" ? (
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <i className="bi bi-file-earmark-excel me-1" aria-hidden="true"></i>
                                    )}
                                    Excel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => descargar("pdf")}
                                    disabled={descargando !== null || !filtros.fecha}
                                >
                                    {descargando === "pdf" ? (
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>
                                    )}
                                    PDF
                                </button>
                            </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
                            <span className={`${CLASE_ETIQUETA} mb-0 me-1`}>Producto</span>
                            <FiltroChipMultiple etiqueta="Presentación" icono="bi-box2" valores={filtros.presentaciones}
                                opciones={OPCIONES_PRESENTACION} onChange={(v) => cambiar({ presentaciones: v })} />
                            <FiltroChipMultiple etiqueta="Talla" icono="bi-rulers" valores={filtros.tallas}
                                opciones={opciones.tallas} onChange={(v) => cambiar({ tallas: v })} />
                            <FiltroChipMultiple etiqueta="Tipo" icono="bi-box" valores={filtros.tipos}
                                opciones={opciones.tipos} onChange={(v) => cambiar({ tipos: v })} />
                            <FiltroChipMultiple etiqueta="Categoría" icono="bi-tags" valores={filtros.categorias}
                                opciones={opciones.categorias} onChange={(v) => cambiar({ categorias: v })} />
                            <FiltroChipMultiple etiqueta="Proveedor" icono="bi-truck" valores={filtros.proveedorIds}
                                opciones={opciones.proveedores} onChange={(v) => cambiar({ proveedorIds: v })} />
                            {hayFiltrosProducto && (
                                <button type="button" className="btn btn-link btn-sm text-decoration-none"
                                    onClick={() => cambiar(SIN_FILTROS_PRODUCTO)}>
                                    Borrar filtros
                                </button>
                            )}
                        </div>
                        <p className="small text-body-secondary mt-3 mb-0">
                            <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                            Solo aparecen proveedores con existencia. A una fecha pasada se cuentan las entradas hasta ese
                            día menos las salidas hasta ese día. Los filtros aplican igual a la vista previa, al Excel y al
                            PDF; los totales son solo de lo filtrado.
                        </p>
                    </form>
                </div>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
                        <span className="me-auto">{error}</span>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setRecarga((n) => n + 1)}>
                            Reintentar
                        </button>
                    </div>
                )}

                {!reporte && !error && <SkeletonTable columnas={7} filas={8} />}

                {cargando && reporte && (
                    <div className="small text-body-secondary mb-2" role="status">
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Actualizando con los filtros nuevos…
                    </div>
                )}

                {reporte && (
                    <div className={cargando ? "opacity-50" : undefined} aria-busy={cargando} style={{ transition: "opacity .15s" }}>
                        {reporte.camaras.length === 0 ? (
                            <div className="alert alert-light border text-center py-4">
                                <i className="bi bi-box-seam fs-3 d-block mb-2 text-body-secondary" aria-hidden="true"></i>
                                No hay existencias al {reporte.fecha.split("-").reverse().join("/")} con esos filtros.
                            </div>
                        ) : (
                            <>
                                {reporte.camaras.length > 1 && (
                                    <div className="d-flex flex-wrap gap-3 mb-3 small">
                                        <span className="text-body-secondary">{reporte.camaras.length} cámaras</span>
                                        <span className="fw-semibold">Total general: {formatearKg(totalGeneral)} kg</span>
                                    </div>
                                )}
                                {reporte.camaras.map((camara) => (
                                    <div className="card mb-3" key={camara.camara.id}>
                                        <div className="card-body p-2">
                                            <ReporteCamaraTabla camara={camara} fecha={reporte.fecha} empresa={subtitulo} />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

export default ReportesInventarioView;
