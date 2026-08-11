import { useEffect, useRef, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import LoadingButton from "../../../../shared/components/LoadingButton";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { fechaHaceNDiasISO, hoyISO } from "../../../../shared/utils/fechas";
import type { Rancho } from "../../interfaces/nomina/Rancho";
import type { Banco } from "../../interfaces/nomina/Banco";
import type { FiltrosReporteNomina, ResumenReporteNominaApi } from "../../interfaces/nomina/ReporteNomina";
import { obtenerRanchos } from "../../services/nomina/rancho.service";
import { obtenerBancos } from "../../services/nomina/banco.service";
import {
    descargarReporteNominaExcel,
    descargarReporteNominaPdf,
    obtenerResumenNomina,
} from "../../services/nomina/reportesNomina.service";

function filtrosPorDefecto(): FiltrosReporteNomina {
    return {
        fechaInicio: fechaHaceNDiasISO(30),
        fechaFin: hoyISO(),
        ranchoIds: [],
        bancoIds: [],
    };
}

function formatearMonto(valor: string): string {
    return `$${Number(valor).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatearFecha(fechaISO: string): string {
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

function ReporteNominaView() {
    const { mostrarToast } = useToastContext();

    const [filtros, setFiltros] = useState<FiltrosReporteNomina>(filtrosPorDefecto());
    const [ranchos, setRanchos] = useState<Rancho[]>([]);
    const [bancos, setBancos] = useState<Banco[]>([]);
    const [resumen, setResumen] = useState<ResumenReporteNominaApi | null>(null);
    const [cargandoResumen, setCargandoResumen] = useState(true);
    const [generandoExcel, setGenerandoExcel] = useState(false);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const solicitudIdRef = useRef(0);

    const [colapsadoFiltros, setColapsadoFiltros] = useState(false);
    const [colapsadoRancho, setColapsadoRancho] = useState(false);
    const [colapsadoBanco, setColapsadoBanco] = useState(false);
    const [colapsadoPreview, setColapsadoPreview] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [datosRanchos, datosBancos] = await Promise.all([obtenerRanchos(), obtenerBancos()]);
                setRanchos(datosRanchos);
                setBancos(datosBancos);
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
            const datos = await obtenerResumenNomina(filtros);
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

    const ranchoIdsKey = filtros.ranchoIds.join(",");
    const bancoIdsKey = filtros.bancoIds.join(",");

    useEffect(() => {
        const espera = setTimeout(() => {
            cargarResumen();
        }, 400);
        return () => clearTimeout(espera);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros.fechaInicio, filtros.fechaFin, ranchoIdsKey, bancoIdsKey]);

    async function manejarGenerarExcel() {
        setGenerandoExcel(true);
        try {
            await descargarReporteNominaExcel(filtros);
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
            await descargarReporteNominaPdf(filtros);
            mostrarToast("Reporte generado", "El archivo de PDF se descargó correctamente.", "success");
        } catch (err) {
            mostrarToast("No se pudo generar el reporte", obtenerMensajeError(err), "danger");
        } finally {
            setGenerandoPdf(false);
        }
    }

    function alternarRancho(id: number) {
        setFiltros((actual) => ({
            ...actual,
            ranchoIds: actual.ranchoIds.includes(id)
                ? actual.ranchoIds.filter((r) => r !== id)
                : [...actual.ranchoIds, id],
        }));
    }

    function alternarBanco(id: number) {
        setFiltros((actual) => ({
            ...actual,
            bancoIds: actual.bancoIds.includes(id)
                ? actual.bancoIds.filter((b) => b !== id)
                : [...actual.bancoIds, id],
        }));
    }

    return (
        <>
            <PageHeader
                title="Reportes de nómina"
                subtitle="Nómina semanal por rango de fechas y rancho"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Reportes de nómina" },
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
                                    max={filtros.fechaFin || hoyISO()}
                                    onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3 col-sm-6">
                                <label className="form-label small text-muted mb-1 fw-bold">Hasta</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filtros.fechaFin}
                                    min={filtros.fechaInicio}
                                    max={hoyISO()}
                                    onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                                />
                            </div>

                            <div className="col-12">
                                <label className="form-label small text-muted mb-1 fw-bold">
                                    Ranchos <span className="fw-normal">(ninguno seleccionado = todos)</span>
                                </label>
                                <div className="d-flex flex-wrap gap-2">
                                    {ranchos.map((r) => {
                                        const seleccionado = filtros.ranchoIds.includes(r.id);
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                className={`btn btn-sm ${seleccionado ? "btn-primary" : "btn-outline-secondary"}`}
                                                onClick={() => alternarRancho(r.id)}
                                            >
                                                {r.nombre}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="col-12">
                                <label className="form-label small text-muted mb-1 fw-bold">
                                    Bancos <span className="fw-normal">(ninguno seleccionado = todos)</span>
                                </label>
                                <div className="d-flex flex-wrap gap-2">
                                    {bancos.map((b) => {
                                        const seleccionado = filtros.bancoIds.includes(b.id);
                                        return (
                                            <button
                                                key={b.id}
                                                type="button"
                                                className={`btn btn-sm ${seleccionado ? "btn-primary" : "btn-outline-secondary"}`}
                                                onClick={() => alternarBanco(b.id)}
                                            >
                                                {b.nombre}
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
                                    <>Coinciden <strong>{resumen?.total ?? 0}</strong> registros con estos filtros</>
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

                {/* --- Resumen por rancho --- */}
                {resumen && resumen.resumen.length > 0 && (
                    <div className="card card-outline card-primary mb-3">
                        <div className="card-header d-flex align-items-center">
                            <h3 className="card-title me-auto">Resumen por rancho</h3>
                            <div className="card-tools">
                                <CardCollapseButton collapsed={colapsadoRancho} onToggle={() => setColapsadoRancho((c) => !c)} />
                            </div>
                        </div>
                        {!colapsadoRancho && (
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-striped align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Rancho</th>
                                            <th className="text-end">Empleados</th>
                                            <th className="text-end">Total bruto</th>
                                            <th className="text-end">Descuento</th>
                                            <th className="text-end">Total neto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumen.resumen.map((fila) => (
                                            <tr key={fila.rancho.id}>
                                                <td className="fw-semibold">{fila.rancho.nombre}</td>
                                                <td className="text-end">{fila.empleados}</td>
                                                <td className="text-end">{formatearMonto(fila.total_bruto)}</td>
                                                <td className="text-end text-danger">{formatearMonto(fila.total_descuento)}</td>
                                                <td className="text-end fw-bold">{formatearMonto(fila.total_neto)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </div>
                )}

                {/* --- Resumen por banco --- */}
                {resumen && resumen.resumen_banco.length > 0 && (
                    <div className="card card-outline card-primary mb-3">
                        <div className="card-header d-flex align-items-center">
                            <h3 className="card-title me-auto">Resumen por banco</h3>
                            <div className="card-tools">
                                <CardCollapseButton collapsed={colapsadoBanco} onToggle={() => setColapsadoBanco((c) => !c)} />
                            </div>
                        </div>
                        {!colapsadoBanco && (
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-striped align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Banco</th>
                                            <th className="text-end">Empleados</th>
                                            <th className="text-end">Total bruto</th>
                                            <th className="text-end">Descuento</th>
                                            <th className="text-end">Total neto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumen.resumen_banco.map((fila) => (
                                            <tr key={fila.banco?.id ?? "sin-banco"}>
                                                <td className="fw-semibold">{fila.banco?.nombre ?? "Sin banco"}</td>
                                                <td className="text-end">{fila.empleados}</td>
                                                <td className="text-end">{formatearMonto(fila.total_bruto)}</td>
                                                <td className="text-end text-danger">{formatearMonto(fila.total_descuento)}</td>
                                                <td className="text-end fw-bold">{formatearMonto(fila.total_neto)}</td>
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
                                        <th>Semana</th>
                                        <th>Rancho</th>
                                        <th>Empleado</th>
                                        <th>Puesto</th>
                                        <th className="text-end">Días</th>
                                        <th className="text-end">Salario diario</th>
                                        <th className="text-end">Descuento</th>
                                        <th className="text-end">Total bruto</th>
                                        <th className="text-end">Total neto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargandoResumen && !resumen ? (
                                        Array.from({ length: 6 }).map((_, fila) => (
                                            <tr key={fila} className="placeholder-glow">
                                                {Array.from({ length: 9 }).map((_, col) => (
                                                    <td key={col}>
                                                        <span className="placeholder col-8 rounded" style={{ height: "0.8rem" }}></span>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : !resumen || resumen.muestra.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center text-muted py-4">
                                                {cargandoResumen ? "Buscando nóminas..." : "Ningún registro coincide con estos filtros."}
                                            </td>
                                        </tr>
                                    ) : (
                                        resumen.muestra.map((linea) => (
                                            <tr key={linea.id}>
                                                <td>
                                                    {formatearFecha(linea.semana.fecha_inicio)} - {formatearFecha(linea.semana.fecha_fin)}
                                                </td>
                                                <td>{linea.rancho.nombre}</td>
                                                <td>{linea.empleado.nombre}</td>
                                                <td>{linea.empleado.puesto}</td>
                                                <td className="text-end">{Number(linea.dias_trabajados).toLocaleString("es-MX")}</td>
                                                <td className="text-end">{formatearMonto(linea.salario_diario)}</td>
                                                <td className="text-end">{formatearMonto(linea.descuento)}</td>
                                                <td className="text-end">{formatearMonto(linea.total_bruto)}</td>
                                                <td className="text-end fw-semibold">{formatearMonto(linea.total_neto)}</td>
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

export default ReporteNominaView;
