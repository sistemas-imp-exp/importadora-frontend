import { useEffect, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { hoyISO } from "../../../../shared/utils/fechas";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerEmpresas } from "../../services/empresa.service";
import {
    descargarReporteCamarasExcel,
    descargarReporteCamarasPdf,
    obtenerReporteCamaras,
} from "../../services/reporteCamaras.service";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { Empresa } from "../../interfaces/empresas/Empresa";
import type { FiltrosReporteCamaras, ReporteCamarasApi } from "../../interfaces/reportes/ReporteCamaras";
import ReporteCamaraTabla from "../../components/reportes/ReporteCamaraTabla";
import { formatearDinero } from "../../utils/existencias";

const CLASE_ETIQUETA = "form-label small text-uppercase fw-semibold text-body-secondary mb-1";

function ReportesInventarioView() {
    const { mostrarToast } = useToastContext();
    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [filtros, setFiltros] = useState<FiltrosReporteCamaras>({ fecha: hoyISO(), camaraId: "", empresaId: "" });
    const [reporte, setReporte] = useState<ReporteCamarasApi | null>(null);
    const [cargando, setCargando] = useState(false);
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);

    useEffect(() => {
        Promise.all([obtenerCamaras(), obtenerEmpresas()])
            .then(([datosCamaras, datosEmpresas]) => {
                setCamaras(datosCamaras);
                setEmpresas(datosEmpresas);
            })
            .catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function cambiar(cambios: Partial<FiltrosReporteCamaras>) {
        setFiltros((actual) => ({ ...actual, ...cambios }));
        // La vista previa dejaría de corresponder a los filtros: se descarta.
        setReporte(null);
    }

    async function generar(e?: React.FormEvent) {
        e?.preventDefault();
        setCargando(true);
        try {
            setReporte(await obtenerReporteCamaras(filtros));
        } catch (err) {
            mostrarToast("Error al generar el reporte", obtenerMensajeError(err), "danger");
        } finally {
            setCargando(false);
        }
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

    const nombreEmpresa = empresas.find((e) => String(e.id) === filtros.empresaId)?.nombre;
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
                    <form className="card-body" onSubmit={generar}>
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
                                <button type="submit" className="btn btn-primary btn-sm" disabled={cargando}>
                                    {cargando ? (
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <i className="bi bi-eye me-1" aria-hidden="true"></i>
                                    )}
                                    Ver reporte
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
                        <p className="small text-body-secondary mt-3 mb-0">
                            <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
                            Solo aparecen proveedores con existencia. A una fecha pasada se cuentan las entradas hasta ese
                            día menos las salidas hasta ese día.
                        </p>
                    </form>
                </div>

                {cargando && <SkeletonTable columnas={7} filas={8} />}

                {!cargando && reporte && (
                    reporte.camaras.length === 0 ? (
                        <div className="alert alert-light border text-center py-4">
                            <i className="bi bi-box-seam fs-3 d-block mb-2 text-body-secondary" aria-hidden="true"></i>
                            No hay existencias al {reporte.fecha.split("-").reverse().join("/")} con esos filtros.
                        </div>
                    ) : (
                        <>
                            {reporte.camaras.length > 1 && (
                                <div className="d-flex flex-wrap gap-3 mb-3 small">
                                    <span className="text-body-secondary">{reporte.camaras.length} cámaras</span>
                                    <span className="fw-semibold">Total general: {formatearDinero(totalGeneral)} kg</span>
                                </div>
                            )}
                            {reporte.camaras.map((camara) => (
                                <div className="card mb-3" key={camara.camara.id}>
                                    <div className="card-body p-2">
                                        <ReporteCamaraTabla camara={camara} fecha={reporte.fecha} empresa={nombreEmpresa} />
                                    </div>
                                </div>
                            ))}
                        </>
                    )
                )}
            </div>
        </>
    );
}

export default ReportesInventarioView;
