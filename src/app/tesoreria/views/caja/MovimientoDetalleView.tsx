import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import AdjuntosMovimiento from "../../components/movimientos/AdjuntosMovimiento";
import HistorialMovimiento from "../../components/movimientos/HistorialMovimiento";
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

                {!loading && !error && movimiento && (() => {
                    const ingreso = movimiento.tipo === "I";
                    const acento = movimiento.cancelado ? "secondary" : ingreso ? "success" : "danger";
                    const fechaISO = dayjs(movimiento.fecha).format("YYYY-MM-DD");
                    return (
                        <>
                            <div className="card shadow-sm mb-3 detalle-movimiento" style={{ borderLeft: `4px solid var(--bs-${acento})` }}>
                                <div className="card-body">
                                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <span className={`detalle-movimiento__icono bg-${acento}-subtle text-${acento}-emphasis`} aria-hidden="true">
                                                <i className={`bi ${ingreso ? "bi-arrow-up-right" : "bi-arrow-down-left"}`}></i>
                                            </span>
                                            <div>
                                                <div className="detalle-movimiento__etiqueta">{ingreso ? "Ingreso" : "Egreso"} · Folio</div>
                                                <div className="d-flex flex-wrap align-items-center gap-2">
                                                    <span className={`fs-4 fw-bold lh-1 ${movimiento.cancelado ? "text-decoration-line-through text-body-secondary" : ""}`}>
                                                        {movimiento.folio}
                                                    </span>
                                                    {movimiento.cancelado && (
                                                        <span className="badge border bg-secondary-subtle text-secondary-emphasis border-secondary-subtle">Cancelado</span>
                                                    )}
                                                    {movimiento.editado && (
                                                        <span className="badge border bg-warning-subtle text-warning-emphasis border-warning-subtle">Editado</span>
                                                    )}
                                                    {movimiento.deudas.length > 0 && (
                                                        <span className="badge border bg-info-subtle text-info-emphasis border-info-subtle">
                                                            {ingreso ? "Abono a deuda" : "Cargo a deuda"}
                                                            {movimiento.deudas.length > 1 && ` (${movimiento.deudas.length})`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div className="detalle-movimiento__etiqueta">Importe</div>
                                            {movimiento.divisas.map((d) => (
                                                <div key={d.id} className={`fs-4 fw-bold lh-sm text-${movimiento.cancelado ? "body-secondary text-decoration-line-through" : `${acento}-emphasis`}`}>
                                                    {ingreso ? "+" : "−"}{d.divisa.simbolo}
                                                    {d.cantidad.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    <span className="fs-6 fw-semibold text-body-secondary ms-1">{d.divisa.codigo}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <dl className="row g-3 mb-0 mt-1 pt-3 border-top detalle-movimiento__datos">
                                        <div className="col-6 col-lg-3">
                                            <dt>Fecha de la hoja</dt>
                                            <dd>
                                                <Link to={`/tesoreria/caja/diaria?fecha=${fechaISO}`} title="Ver la caja de ese día">
                                                    {formatearFechaNumerica(movimiento.fecha)}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <dt>Beneficiario</dt>
                                            <dd>{movimiento.beneficiario}</dd>
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <dt>Autorizó</dt>
                                            <dd>{movimiento.autorizo}</dd>
                                        </div>
                                        <div className="col-6 col-lg-3">
                                            <dt>Capturó</dt>
                                            <dd>
                                                {getFullName(movimiento.usuario)}
                                                <div className="small text-body-secondary">
                                                    {formatearFechaNumerica(movimiento.creado, "numerico-hora")}
                                                </div>
                                            </dd>
                                        </div>
                                        <div className={movimiento.deudas.length ? "col-lg-6" : "col-12"}>
                                            <dt>Concepto</dt>
                                            <dd>{movimiento.concepto}</dd>
                                        </div>
                                        {movimiento.deudas.length > 0 && (
                                            <div className="col-lg-6">
                                                <dt>
                                                    {ingreso
                                                        ? movimiento.deudas.length > 1 ? "Abono repartido entre deudas" : "Abono a deuda"
                                                        : "Cargo a deuda"}
                                                </dt>
                                                <dd>
                                                    {movimiento.deudas.map((d) => (
                                                        <div key={d.id} className="d-flex justify-content-between gap-3">
                                                            <span>
                                                                <span>{d.deudor.nombre}</span>
                                                                <span className="text-body-secondary"> — </span>
                                                                <Link to={`/tesoreria/deudas/detalle/${d.id}`} title="Ver el detalle de la deuda">{d.concepto}</Link>
                                                            </span>
                                                            {movimiento.deudas.length > 1 && (
                                                                <span className="fw-semibold font-tabular-nums text-nowrap">
                                                                    {movimiento.divisas[0]?.divisa.simbolo ?? "$"}
                                                                    {Number(d.monto).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>

                                    {movimiento.cancelado && (
                                        <div className="alert alert-secondary d-flex gap-2 py-2 mb-0 mt-3 small">
                                            <i className="bi bi-x-octagon" aria-hidden="true"></i>
                                            <div>
                                                <strong>Cancelado</strong> el {formatearFechaNumerica(movimiento.fecha_cancelacion, "numerico-hora")}
                                                {movimiento.usuario_cancelacion && <> por {getFullName(movimiento.usuario_cancelacion)}</>}
                                                {movimiento.motivo_cancelacion && <>: “{movimiento.motivo_cancelacion}”</>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="row g-3">
                                <div className="col-lg-7">
                                    <div className="card shadow-sm h-100">
                                        <div className="card-header bg-body-tertiary py-2">
                                            <h3 className="card-title fs-6 fw-semibold mb-0">
                                                <i className="bi bi-paperclip me-2 text-body-secondary" aria-hidden="true"></i>Archivos adjuntos
                                            </h3>
                                        </div>
                                        <div className="card-body">
                                            <AdjuntosMovimiento movimientoId={movimiento.id} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-5">
                                    <div className="card shadow-sm h-100">
                                        <div className="card-header bg-body-tertiary py-2">
                                            <h3 className="card-title fs-6 fw-semibold mb-0">
                                                <i className="bi bi-clock-history me-2 text-body-secondary" aria-hidden="true"></i>Historial
                                            </h3>
                                        </div>
                                        <div className="card-body" style={{ maxHeight: "32rem", overflowY: "auto" }}>
                                            <HistorialMovimiento key={`${movimiento.id}-${movimiento.modificado.getTime()}`} movimientoId={movimiento.id} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>
        </>
    );
}

export default MovimientoDetalleView;
