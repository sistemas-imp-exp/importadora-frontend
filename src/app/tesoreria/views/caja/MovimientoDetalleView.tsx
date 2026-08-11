import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import AdjuntosMovimiento from "../../components/movimientos/AdjuntosMovimiento";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import type { Movimiento } from "../../interfaces/movimientos/Movimiento";
import { mapMovimientoApiToMovimiento } from "../../interfaces/movimientos/Movimiento";
import { obtenerMovimiento } from "../../services/movimientos.service";

function MovimientoDetalleView() {
    const { id } = useParams<{ id: string }>();
    const { mostrarToast } = useToastContext();
    const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function cargar(idObjetivo: string, estaVigente: () => boolean) {
        setLoading(true);
        try {
            const datos = await obtenerMovimiento(Number(idObjetivo));
            if (!estaVigente()) return;
            setMovimiento(mapMovimientoApiToMovimiento(datos));
            setError(null);
        } catch (err) {
            if (!estaVigente()) return;
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            if (estaVigente()) setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) return;
        let vigente = true;
        const temporizador = setTimeout(() => cargar(id, () => vigente), 0);
        return () => {
            vigente = false;
            clearTimeout(temporizador);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return (
        <>
            <PageHeader
                title="Detalle de movimiento"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Movimientos", to: "/tesoreria/caja/movimientos" },
                    { label: movimiento ? movimiento.folio : "Detalle" },
                ]}
            />

            <div className="container-fluid">
                {loading && (
                    <>
                        <SkeletonCallout lineas={2} />
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <div className="card card-outline card-primary h-100">
                                    <div className="card-header placeholder-glow">
                                        <span className="placeholder col-4 rounded" style={{ height: "1rem" }}></span>
                                    </div>
                                    <div className="card-body p-0">
                                        <SkeletonTable columnas={2} filas={3} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card card-outline card-primary h-100">
                                    <div className="card-header placeholder-glow">
                                        <span className="placeholder col-4 rounded" style={{ height: "1rem" }}></span>
                                    </div>
                                    <div className="card-body p-0">
                                        <SkeletonTable columnas={2} filas={3} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header placeholder-glow">
                                <span className="placeholder col-3 rounded" style={{ height: "1rem" }}></span>
                            </div>
                            <div className="card-body">
                                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-2 placeholder-glow">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div className="col" key={i}>
                                            <span className="placeholder d-block rounded" style={{ height: 90 }}></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <div className="callout callout-warning mb-3">
                        <p><b>Error al cargar:</b></p>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && movimiento && (
                    <>
                        <div
                            className={`callout mb-3 shadow-sm ${movimiento.cancelado
                                ? "callout-secondary"
                                : movimiento.tipo === "I"
                                    ? "callout-success"
                                    : "callout-danger"
                                }`}
                        >
                            <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                                <h5 className="mb-0 fw-bold">
                                    Folio {movimiento.folio}
                                    {movimiento.editado && !movimiento.cancelado && (
                                        <span className="badge bg-warning text-dark ms-2">Editado</span>
                                    )}
                                </h5>
                                <div className="d-flex gap-2">
                                    <span className={`badge ${movimiento.tipo === "I" ? "bg-success" : "bg-danger"}`}>
                                        <i className={`bi ${movimiento.tipo === "I" ? "bi-arrow-up-circle" : "bi-arrow-down-circle"} me-1`}></i>
                                        {movimiento.tipo === "I" ? "Ingreso" : "Egreso"}
                                    </span>
                                    {movimiento.cancelado && <span className="badge bg-secondary">Cancelado</span>}
                                </div>
                            </div>
                            <div className="row text-muted gy-1" style={{ fontSize: "0.9rem" }}>
                                <div className="col-md-3">
                                    <span className="fw-semibold">Fecha:</span> {formatearFechaNumerica(movimiento.fecha, "numerico-hora")}
                                </div>
                                <div className="col-md-3">
                                    <span className="fw-semibold">Corte:</span>{" "}
                                    <Link to={`/tesoreria/caja/corte/${movimiento.corte.id}`}>#{movimiento.corte.id}</Link>
                                </div>
                                <div className="col-md-3">
                                    <span className="fw-semibold">Autorizó:</span> {movimiento.autorizo}
                                </div>
                                <div className="col-md-3">
                                    <span className="fw-semibold">Beneficiario:</span> {movimiento.beneficiario}
                                </div>
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: "0.9rem" }}>
                                <span className="fw-semibold">Concepto:</span> {movimiento.concepto}
                            </div>
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <div className="card card-outline card-primary h-100">
                                    <div className="card-header">
                                        <h3 className="card-title">Divisas</h3>
                                    </div>
                                    <div className="card-body p-0">
                                        <table className="table table-sm table-striped align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Divisa</th>
                                                    <th className="text-end">Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movimiento.divisas.map((d) => (
                                                    <tr key={d.id}>
                                                        <td>{d.divisa.codigo} — {d.divisa.nombre}</td>
                                                        <td className="text-end">
                                                            {d.divisa.simbolo}{d.cantidad.toLocaleString("es-MX")}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="card card-outline card-primary h-100">
                                    <div className="card-header">
                                        <h3 className="card-title">Historial</h3>
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-unstyled mb-0" style={{ fontSize: "0.88rem" }}>
                                            <li className="mb-2">
                                                <i className="bi bi-plus-circle text-muted me-2"></i>
                                                Registrado el {formatearFechaNumerica(movimiento.creado, "numerico-hora")}
                                            </li>
                                            {movimiento.editado && (
                                                <li className="mb-2">
                                                    <i className="bi bi-pencil-square text-warning me-2"></i>
                                                    Última modificación: {formatearFechaNumerica(movimiento.modificado, "numerico-hora")}
                                                </li>
                                            )}
                                            {movimiento.cancelado && (
                                                <li className="mb-2">
                                                    <i className="bi bi-x-circle text-danger me-2"></i>
                                                    Cancelado el {formatearFechaNumerica(movimiento.fecha_cancelacion, "numerico-hora")}
                                                    {movimiento.usuario_cancelacion && <> por {getFullName(movimiento.usuario_cancelacion)}</>}
                                                    {movimiento.motivo_cancelacion && (
                                                        <div className="text-muted ms-4 mt-1">"{movimiento.motivo_cancelacion}"</div>
                                                    )}
                                                </li>
                                            )}
                                            {!movimiento.editado && !movimiento.cancelado && (
                                                <li className="text-muted">Sin cambios desde su registro.</li>
                                            )}
                                        </ul>
                                        <p className="text-muted small mb-0 mt-2">
                                            <i className="bi bi-info-circle me-1"></i>
                                            No se guarda un detalle campo por campo de qué cambió en cada edición, solo
                                            la fecha de la última modificación.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title">Archivos adjuntos</h3>
                            </div>
                            <div className="card-body">
                                <AdjuntosMovimiento movimientoId={movimiento.id} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default MovimientoDetalleView;
