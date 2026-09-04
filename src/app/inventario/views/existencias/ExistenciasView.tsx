import PageHeader from "../../../../layouts/components/PageHeader";
import { useEffect, useState } from "react";
import { obtenerExistencias } from "../../services/existencia.service";
import { descargarExistenciasPdf } from "../../services/reportes.service";
import type { ExistenciaApi } from "../../interfaces/existencias/Existencia";
import ExistenciasTable from "../../components/existencias/ExistenciasTable";
import ExistenciasFiltros from "../../components/existencias/ExistenciasFiltros";
import { useExistenciasFiltros } from "../../hooks/useExistenciasFiltros";
import { formatearDinero } from "../../utils/existencias";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import Paginacion from "../../../../shared/components/Paginacion";
import PorPaginaSelect from "../../../../shared/components/PorPaginaSelect";
import { usePaginacion } from "../../../../shared/hooks/usePaginacion";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";

const POR_PAGINA_INICIAL = 50;

function ExistenciasView() {
    const [existencias, setExistencias] = useState<ExistenciaApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [colapsado, setColapsado] = useState(false);
    const [porPagina, setPorPagina] = useState(POR_PAGINA_INICIAL);
    const [descargando, setDescargando] = useState(false);

    const { mostrarToast } = useToastContext();
    const { busqueda, setBusqueda, filtros, setFiltro, limpiarFiltros, hayFiltros, opciones, filtradas, totales } =
        useExistenciasFiltros(existencias);

    const { pagina, setPagina, totalPaginas, inicio, fin } = usePaginacion(
        filtradas.length,
        porPagina,
        `${busqueda}|${JSON.stringify(filtros)}|${porPagina}`
    );
    const paginadas = filtradas.slice(inicio, fin);

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            // Un solo endpoint que ya devuelve la foto aplanada: antes esta
            // pantalla bajaba todas las entradas con sus lotes anidados.
            setExistencias(await obtenerExistencias());
            setError(null);
        } catch (error) {
            const mensaje = obtenerMensajeError(error);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function descargarPdf() {
        try {
            setDescargando(true);
            // Se mandan los filtros, no las filas: el PDF lo arma el backend
            // volviendo a consultar, así que debe filtrar con el mismo criterio.
            await descargarExistenciasPdf(filtros, busqueda);
        } catch (error) {
            mostrarToast("Error al exportar", obtenerMensajeError(error), "danger");
        } finally {
            setDescargando(false);
        }
    }

    const listo = !loading && !error;

    return (
        <>
            <PageHeader
                title="Existencias"
                subtitle="Cajas disponibles por cámara, proveedor y talla/tipo"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Existencias" }
                ]}
            />

            <div className="container-fluid">
                {listo && (
                    <>
                        <div className="row g-3 mb-3">
                            <div className="col-sm-12 col-md-6">
                                <div className="card card-outline card-info mb-0 h-100">
                                    <div className="card-body py-2">
                                        <div className="text-muted small">Total kilos disponibles</div>
                                        <div className="fs-4 fw-bold">{formatearDinero(totales.totalKilosDisponibles)} kg</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-6">
                                <div className="card card-outline card-success mb-0 h-100">
                                    <div className="card-body py-2">
                                        <div className="text-muted small">Total en pesos (existencia)</div>
                                        <div className="fs-4 fw-bold d-flex align-items-center gap-2">
                                            ${formatearDinero(totales.totalPesos)}
                                            {totales.lotesSinCosto > 0 && (
                                                <i
                                                    className="bi bi-exclamation-triangle-fill text-warning fs-6"
                                                    title={`${totales.lotesSinCosto} lote(s) sin costo capturado, no incluido(s) en este total`}
                                                ></i>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ExistenciasFiltros
                            busqueda={busqueda}
                            onBusquedaChange={setBusqueda}
                            filtros={filtros}
                            onFiltroChange={setFiltro}
                            onLimpiar={limpiarFiltros}
                            hayFiltros={hayFiltros}
                            opciones={opciones}
                        />
                    </>
                )}

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">Existencias</h3>
                        {listo && filtradas.length > 0 && (
                            <PorPaginaSelect valor={porPagina} onChange={setPorPagina} />
                        )}
                        {listo && filtradas.length > 0 && (
                            <button
                                className="btn btn-outline-danger btn-sm"
                                type="button"
                                onClick={descargarPdf}
                                disabled={descargando}
                                title={
                                    hayFiltros
                                        ? "Descargar en PDF las existencias con los filtros aplicados"
                                        : "Descargar todas las existencias en PDF"
                                }
                            >
                                {descargando ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                    <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                                )}
                                <span className="ms-1">PDF</span>
                            </button>
                        )}
                        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={cargar} title="Actualizar">
                            <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                        </button>
                        <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
                    </div>

                    {!colapsado && (
                        <>
                            {listo && filtradas.length > 0 && (
                                <div className="card-footer border-top-0 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <small className="text-muted">
                                        Mostrando {inicio + 1}-{Math.min(fin, filtradas.length)} de {filtradas.length}
                                    </small>
                                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                                </div>
                            )}

                            <div className="card-body p-0">
                                {error ? (
                                    <div className="alert alert-danger m-3" role="alert">{error}</div>
                                ) : loading ? (
                                    <SkeletonTable columnas={16} filas={6} />
                                ) : (
                                    <ExistenciasTable filas={paginadas} totales={totales} hayFiltros={hayFiltros} />
                                )}
                            </div>

                            {listo && filtradas.length > 0 && (
                                <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <small className="text-muted">
                                        Mostrando {inicio + 1}-{Math.min(fin, filtradas.length)} de {filtradas.length}
                                    </small>
                                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default ExistenciasView;
