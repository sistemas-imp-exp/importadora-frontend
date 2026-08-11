import { useEffect, useRef, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import LoadingButton from "../../../../shared/components/LoadingButton";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import {
    fechaHaceNDiasISO,
    fechaISO,
    formatearFechaNumerica,
    hoyISO,
    primerYUltimoDiaDelMesActualISO,
} from "../../../../shared/utils/fechas";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import type { CorteCaja } from "../../interfaces/movimientos/CorteCaja";
import type {
    EstadoFiltro,
    FiltrosReporteMovimientos,
    ResumenReporteMovimientosApi,
    TipoFiltro,
} from "../../interfaces/reportes/Reporte";
import { obtenerDivisas } from "../../services/divisa.service";
import { obtenerCortes } from "../../services/corteCaja.service";
import {
    descargarReporteMovimientosExcel,
    descargarReporteMovimientosPdf,
    obtenerResumenMovimientos,
} from "../../services/reportes.service";

function filtrosPorDefecto(): FiltrosReporteMovimientos {
    return {
        fechaInicio: fechaHaceNDiasISO(30),
        fechaFin: hoyISO(),
        beneficiario: "",
        corteId: null,
        tipo: "todos",
        estado: "todos",
        divisaIds: [],
    };
}

function formatearMonto(valor: string, simbolo: string): string {
    return `${simbolo}${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ReporteMovimientosView() {
    const { mostrarToast } = useToastContext();

    const [filtros, setFiltros] = useState<FiltrosReporteMovimientos>(filtrosPorDefecto());
    const [divisas, setDivisas] = useState<Divisa[]>([]);
    const [cortes, setCortes] = useState<CorteCaja[]>([]);
    const [resumen, setResumen] = useState<ResumenReporteMovimientosApi | null>(null);
    const [cargandoResumen, setCargandoResumen] = useState(true);
    const [generandoExcel, setGenerandoExcel] = useState(false);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const solicitudIdRef = useRef(0);

    const [colapsadoFiltros, setColapsadoFiltros] = useState(false);
    const [colapsadoResumen, setColapsadoResumen] = useState(false);
    const [colapsadoPreview, setColapsadoPreview] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [datosDivisas, datosCortes] = await Promise.all([obtenerDivisas(), obtenerCortes()]);
                setDivisas(datosDivisas);
                setCortes(datosCortes);

                if (datosCortes.length > 0) {
                    // obtenerCortes() viene ordenado del más reciente al más antiguo.
                    const masReciente = datosCortes[0].fecha;
                    const masAntiguo = datosCortes[datosCortes.length - 1].fecha;
                    setFiltros((actual) => ({
                        ...actual,
                        fechaInicio: fechaISO(masAntiguo),
                        fechaFin: fechaISO(masReciente),
                    }));
                } else {
                    const { primerDia, ultimoDia } = primerYUltimoDiaDelMesActualISO();
                    setFiltros((actual) => ({ ...actual, fechaInicio: primerDia, fechaFin: ultimoDia }));
                }
            } catch (err) {
                mostrarToast("Error al cargar", obtenerMensajeError(err), "danger");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function cargarResumen() {
        const idSolicitud = ++solicitudIdRef.current;
        setCargandoResumen(true);
        try {
            const datos = await obtenerResumenMovimientos(filtros);
            if (solicitudIdRef.current !== idSolicitud) return;
            setResumen(datos);
            setError(null);
        } catch (err) {
            if (solicitudIdRef.current !== idSolicitud) return;
            setResumen(null);
            setError(obtenerMensajeError(err));
        } finally {
            if (solicitudIdRef.current === idSolicitud) setCargandoResumen(false);
        }
    }

    const divisaIdsKey = filtros.divisaIds.join(",");

    useEffect(() => {
        const espera = setTimeout(() => {
            cargarResumen();
        }, 400);
        return () => clearTimeout(espera);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filtros.fechaInicio,
        filtros.fechaFin,
        filtros.beneficiario,
        filtros.corteId,
        filtros.tipo,
        filtros.estado,
        divisaIdsKey,
    ]);

    async function manejarGenerarExcel() {
        setGenerandoExcel(true);
        try {
            await descargarReporteMovimientosExcel(filtros);
            mostrarToast("Reporte generado", "El archivo de Excel se descargó correctamente.", "success");
        } catch (err) {
            mostrarToast("No se pudo generar el reporte", obtenerMensajeError(err), "danger");
        } finally {
            setGenerandoExcel(false);
        }
    }

    async function manejarGenerarPdf() {
        setGenerandoPdf(true);
        try {
            await descargarReporteMovimientosPdf(filtros);
            mostrarToast("Reporte generado", "El archivo de PDF se descargó correctamente.", "success");
        } catch (err) {
            mostrarToast("No se pudo generar el reporte", obtenerMensajeError(err), "danger");
        } finally {
            setGenerandoPdf(false);
        }
    }

    // Guardarraíles de los inputs de fecha: no se puede elegir antes del
    // corte más antiguo, ni después de hoy, ni un rango invertido.
    const fechaMinimaHistorica = cortes.length > 0 ? fechaISO(cortes[cortes.length - 1].fecha) : undefined;
    const fechaMaximaHoy = hoyISO();

    function alternarDivisa(id: number) {
        setFiltros((actual) => ({
            ...actual,
            divisaIds: actual.divisaIds.includes(id)
                ? actual.divisaIds.filter((d) => d !== id)
                : [...actual.divisaIds, id],
        }));
    }

    return (
        <>
            <PageHeader
                title="Reportes"
                subtitle="Movimientos de caja por rango de fechas, divisa y beneficiario"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Reportes" },
                ]}
            />

            <div className="container-fluid">
                {/* --- Filtros --- */}
                <div className="card card-outline card-primary mb-3">
                    <div className="card-header d-flex align-items-center">
                        <h3 className="card-title me-auto">Filtros</h3>
                        <div className="card-tools">
                            <CardCollapseButton collapsed={colapsadoFiltros} onToggle={() => setColapsadoFiltros((c) => !c)} />
                        </div>
                    </div>
                    {!colapsadoFiltros && (
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label small text-muted mb-1 fw-bold">Desde</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filtros.fechaInicio}
                                    min={fechaMinimaHistorica}
                                    max={filtros.fechaFin || fechaMaximaHoy}
                                    onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label small text-muted mb-1 fw-bold">Hasta</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filtros.fechaFin}
                                    min={filtros.fechaInicio || fechaMinimaHistorica}
                                    max={fechaMaximaHoy}
                                    onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label small text-muted mb-1 fw-bold">Beneficiario</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej. Mariscos del Golfo"
                                    value={filtros.beneficiario}
                                    onChange={(e) => setFiltros({ ...filtros, beneficiario: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label small text-muted mb-1 fw-bold">Corte</label>
                                <select
                                    className="form-select"
                                    value={filtros.corteId ?? ""}
                                    onChange={(e) => setFiltros({ ...filtros, corteId: e.target.value ? Number(e.target.value) : null })}
                                >
                                    <option value="">Todos los cortes en el rango</option>
                                    {cortes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            #{c.id} — {formatearFechaNumerica(c.fecha)} {c.cerrado ? "" : "(abierto)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3 col-sm-6">
                                <label className="form-label small text-muted mb-1 fw-bold">Tipo</label>
                                <select
                                    className="form-select"
                                    value={filtros.tipo}
                                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value as TipoFiltro })}
                                >
                                    <option value="todos">Ingresos y egresos</option>
                                    <option value="I">Solo ingresos</option>
                                    <option value="E">Solo egresos</option>
                                </select>
                            </div>
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label small text-muted mb-1 fw-bold">Estado</label>
                                <select
                                    className="form-select"
                                    value={filtros.estado}
                                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as EstadoFiltro })}
                                >
                                    <option value="todos">Activos y cancelados</option>
                                    <option value="activos">Solo activos</option>
                                    <option value="cancelados">Solo cancelados</option>
                                </select>
                            </div>

                            <div className="col-12">
                                <label className="form-label small text-muted mb-1 fw-bold">
                                    Divisas <span className="fw-normal">(ninguna seleccionada = todas)</span>
                                </label>
                                <div className="d-flex flex-wrap gap-2">
                                    {divisas.map((d) => {
                                        const seleccionada = filtros.divisaIds.includes(d.id);
                                        return (
                                            <button
                                                key={d.id}
                                                type="button"
                                                className={`btn btn-sm ${seleccionada ? "btn-primary" : "btn-outline-secondary"}`}
                                                onClick={() => alternarDivisa(d.id)}
                                            >
                                                {d.codigo} — {d.nombre}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    <div className="card-footer">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <small className="text-muted">
                                {cargandoResumen ? (
                                    "Buscando..."
                                ) : error ? (
                                    <span className="text-danger">{error}</span>
                                ) : (
                                    <>Coinciden <strong>{resumen?.total ?? 0}</strong> movimientos con estos filtros</>
                                )}
                            </small>
                            <div className="d-flex gap-2">
                                <LoadingButton
                                    icon="bi bi-file-earmark-excel"
                                    isLoading={generandoExcel}
                                    text="Generar Excel"
                                    variant="success"
                                    onClick={manejarGenerarExcel}
                                />
                                <LoadingButton
                                    icon="bi bi-file-earmark-pdf"
                                    isLoading={generandoPdf}
                                    text="Generar PDF"
                                    variant="danger"
                                    onClick={manejarGenerarPdf}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Resumen por divisa --- */}
                {resumen && resumen.resumen.length > 0 && (
                    <div className="card card-outline card-primary mb-3">
                        <div className="card-header d-flex align-items-center">
                            <h3 className="card-title me-auto">Resumen por divisa</h3>
                            <div className="card-tools">
                                <CardCollapseButton collapsed={colapsadoResumen} onToggle={() => setColapsadoResumen((c) => !c)} />
                            </div>
                        </div>
                        {!colapsadoResumen && (
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-striped align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Divisa</th>
                                            <th className="text-end">Ingresos</th>
                                            <th className="text-end">Egresos</th>
                                            <th className="text-end">Neto</th>
                                            <th className="text-end">Activos</th>
                                            <th className="text-end">Cancelados</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumen.resumen.map((fila) => (
                                            <tr key={fila.divisa.id}>
                                                <td className="fw-semibold">{fila.divisa.codigo} — {fila.divisa.nombre}</td>
                                                <td className="text-end text-success">{formatearMonto(fila.ingresos, fila.divisa.simbolo)}</td>
                                                <td className="text-end text-danger">{formatearMonto(fila.egresos, fila.divisa.simbolo)}</td>
                                                <td className="text-end fw-bold">{formatearMonto(fila.neto, fila.divisa.simbolo)}</td>
                                                <td className="text-end">{fila.movimientos_activos}</td>
                                                <td className="text-end text-muted">{fila.movimientos_cancelados}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </div>
                )}

                {/* --- Vista previa --- */}
                <div className="card card-outline card-primary">
                    <div className="card-header d-flex align-items-center">
                        <h3 className="card-title me-auto">Vista previa</h3>
                        <div className="card-tools">
                            <CardCollapseButton collapsed={colapsadoPreview} onToggle={() => setColapsadoPreview((c) => !c)} />
                        </div>
                    </div>
                    {!colapsadoPreview && (
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-striped align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Fecha</th>
                                        <th>Corte</th>
                                        <th>Tipo</th>
                                        <th>Autorizó</th>
                                        <th>Beneficiario</th>
                                        <th>Concepto</th>
                                        <th>Divisa</th>
                                        <th className="text-end">Cantidad</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargandoResumen && !resumen ? (
                                        Array.from({ length: 6 }).map((_, fila) => (
                                            <tr key={fila} className="placeholder-glow">
                                                {Array.from({ length: 10 }).map((_, col) => (
                                                    <td key={col}>
                                                        <span className="placeholder col-8 rounded" style={{ height: "0.8rem" }}></span>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : !resumen || resumen.muestra.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="text-center text-muted py-4">
                                                {cargandoResumen ? "Buscando movimientos..." : "Ningún movimiento coincide con estos filtros."}
                                            </td>
                                        </tr>
                                    ) : (
                                        resumen.muestra.map((linea) => (
                                            <tr
                                                key={linea.id}
                                                className={linea.cancelado ? "table-secondary text-decoration-line-through opacity-75" : ""}
                                            >
                                                <td>
                                                    {linea.folio}
                                                    {linea.editado && !linea.cancelado && (
                                                        <span className="badge bg-warning text-dark ms-2 text-decoration-none">Editado</span>
                                                    )}
                                                </td>
                                                <td>{new Date(linea.fecha).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}</td>
                                                <td>{linea.corte ? `#${linea.corte}` : "-"}</td>
                                                <td>
                                                    <span className={`badge ${linea.tipo === "I" ? "bg-success" : "bg-danger"}`}>
                                                        {linea.tipo === "I" ? "Ingreso" : "Egreso"}
                                                    </span>
                                                </td>
                                                <td>{linea.autorizo}</td>
                                                <td>{linea.beneficiario}</td>
                                                <td>{linea.concepto}</td>
                                                <td>{linea.divisa.codigo}</td>
                                                <td className="text-end text-decoration-none">
                                                    {linea.divisa.simbolo}{Number(linea.cantidad).toLocaleString("es-MX")}
                                                </td>
                                                <td className="text-decoration-none">
                                                    {linea.cancelado ? (
                                                        <span className="badge bg-secondary">Cancelado</span>
                                                    ) : (
                                                        "Activo"
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    )}
                    {resumen && resumen.muestra_limitada && (
                        <div className="card-footer">
                            <small className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                Muestra {resumen.muestra.length} de {resumen.total} filas. El Excel y el PDF generados incluyen todas las que coincidan con los filtros.
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ReporteMovimientosView;
