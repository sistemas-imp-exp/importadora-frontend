import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import Modal from "../../../../shared/components/Modal";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import { getFullName } from "../../../../shared/utils/userUtils";
import BadgeEstadoDeuda from "../../components/deudas/BadgeEstadoDeuda";
import CancelarDeudaModal from "../../components/deudas/CancelarDeudaModal";
import DeudaForm from "../../components/deudas/DeudaForm";
import HistorialDeuda from "../../components/deudas/HistorialDeuda";
import type { Deuda, DeudaRequest, Deudor } from "../../interfaces/deudas/Deuda";
import type { Divisa } from "../../interfaces/divisas/Divisa";
import { obtenerDivisas } from "../../services/divisa.service";
import {
    actualizarDeuda, descargarEstadoCuenta, obtenerDeuda, obtenerDeudores,
} from "../../services/deudas.service";
import { fechaDeISO, formatearDineroDivisa } from "../../utils/deudas";

const ACENTO = { abierta: "warning", pagada: "success", cancelada: "secondary" } as const;

function DeudaDetalleView() {
    const { id } = useParams<{ id: string }>();
    const { puedeEditar } = useAuth();
    const editable = puedeEditar("TES");
    const { mostrarToast } = useToastContext();
    const [deuda, setDeuda] = useState<Deuda | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [edicion, setEdicion] = useState<{ deudores: Deudor[]; divisas: Divisa[] } | null>(null);
    const [aCancelar, setACancelar] = useState(false);
    const [descargando, setDescargando] = useState<"pdf" | "excel" | null>(null);

    async function cargar(idObjetivo: string, estaVigente: () => boolean = () => true) {
        try {
            const datos = await obtenerDeuda(Number(idObjetivo));
            if (!estaVigente()) return;
            setDeuda(datos);
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

    async function abrirEdicion() {
        try {
            const [deudores, divisas] = await Promise.all([obtenerDeudores(), obtenerDivisas()]);
            setEdicion({ deudores, divisas });
        } catch (err) {
            mostrarToast("Error al cargar", obtenerMensajeError(err), "danger");
        }
    }

    async function guardar(datos: DeudaRequest) {
        if (!deuda) return;
        try {
            await actualizarDeuda(deuda.id, datos);
            mostrarToast("Deuda actualizada", "Los cambios se guardaron correctamente.", "success");
            setEdicion(null);
            await cargar(String(deuda.id));
        } catch (err) {
            mostrarToast("Error al guardar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    async function descargar(formato: "pdf" | "excel") {
        if (!deuda) return;
        setDescargando(formato);
        try {
            await descargarEstadoCuenta(deuda.deudor, formato);
        } catch (err) {
            mostrarToast("Error al descargar", obtenerMensajeError(err), "danger");
        } finally {
            setDescargando(null);
        }
    }

    const conMovimientos = deuda?.movimientos.some((m) => !m.cancelado) ?? false;

    return (
        <>
            <PageHeader
                title="Detalle de deuda"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Deudas", to: "/tesoreria/deudas" },
                    { label: deuda ? deuda.concepto : "Detalle" },
                ]}
            />

            <div className="container-fluid">
                {loading && (
                    <>
                        <SkeletonCallout lineas={3} />
                        <div className="card"><div className="card-body p-0"><SkeletonTable columnas={8} filas={4} /></div></div>
                    </>
                )}

                {error && (
                    <div className="callout callout-warning mb-3">
                        <p><b>Error al cargar:</b></p>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && deuda && (() => {
                    const acento = ACENTO[deuda.estado];
                    const simbolo = deuda.divisa.simbolo;
                    const total = Number(deuda.total);
                    const avance = total > 0 ? Math.min(100, (Number(deuda.abonado) / total) * 100) : 0;
                    return (
                        <>
                            <div className="card shadow-sm mb-3 detalle-movimiento" style={{ borderLeft: `4px solid var(--bs-${acento})` }}>
                                <div className="card-body">
                                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <span className={`detalle-movimiento__icono bg-${acento}-subtle text-${acento}-emphasis`} aria-hidden="true">
                                                <i className="bi bi-person-lines-fill"></i>
                                            </span>
                                            <div>
                                                <div className="detalle-movimiento__etiqueta">
                                                    <Link to={`/tesoreria/deudas?deudor=${deuda.deudor.id}&estado=`} title="Ver todas sus deudas">
                                                        {deuda.deudor.nombre}
                                                    </Link>
                                                </div>
                                                <div className="d-flex flex-wrap align-items-center gap-2">
                                                    <span className={`fs-4 fw-bold lh-1 ${deuda.cancelada ? "text-decoration-line-through text-body-secondary" : ""}`}>
                                                        {deuda.concepto}
                                                    </span>
                                                    <BadgeEstadoDeuda estado={deuda.estado} />
                                                    <span className="badge border bg-light text-body-secondary">{deuda.divisa.codigo}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <div className="detalle-movimiento__etiqueta">Saldo</div>
                                            <div className={`fs-3 fw-bold lh-sm text-${acento}-emphasis`}>
                                                {formatearDineroDivisa(simbolo, deuda.saldo)}
                                                <span className="fs-6 fw-semibold text-body-secondary ms-1">{deuda.divisa.codigo}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <div className="d-flex justify-content-between small text-body-secondary mb-1">
                                            <span>Abonado {formatearDineroDivisa(simbolo, deuda.abonado)} de {formatearDineroDivisa(simbolo, deuda.total)}</span>
                                            <span>{avance.toFixed(0)}%</span>
                                        </div>
                                        <div
                                            className="progress"
                                            style={{ height: 6 }}
                                            role="progressbar"
                                            aria-label="Avance del pago"
                                            aria-valuenow={Math.round(avance)}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        >
                                            <div className="progress-bar bg-success" style={{ width: `${avance}%` }}></div>
                                        </div>
                                    </div>

                                    <dl className="row g-3 mb-0 mt-1 pt-3 border-top detalle-movimiento__datos">
                                        <div className="col-6 col-lg-2">
                                            <dt>Fecha</dt>
                                            <dd>{formatearFechaNumerica(fechaDeISO(deuda.fecha))}</dd>
                                        </div>
                                        <div className="col-6 col-lg-2">
                                            <dt>Monto inicial</dt>
                                            <dd>{formatearDineroDivisa(simbolo, deuda.monto_inicial)}</dd>
                                        </div>
                                        <div className="col-6 col-lg-2">
                                            <dt>Cargos de caja</dt>
                                            <dd>{formatearDineroDivisa(simbolo, deuda.cargado)}</dd>
                                        </div>
                                        <div className="col-6 col-lg-2">
                                            <dt>Total</dt>
                                            <dd className="fw-semibold">{formatearDineroDivisa(simbolo, deuda.total)}</dd>
                                        </div>
                                        <div className="col-6 col-lg-2">
                                            <dt>Capturó</dt>
                                            <dd>
                                                {getFullName(deuda.usuario)}
                                                <div className="small text-body-secondary">
                                                    {formatearFechaNumerica(new Date(deuda.creado), "numerico-hora")}
                                                </div>
                                            </dd>
                                        </div>
                                        {deuda.editado_por && (
                                            <div className="col-6 col-lg-2">
                                                <dt>Última edición</dt>
                                                <dd>
                                                    {getFullName(deuda.editado_por)}
                                                    {deuda.editado_en && (
                                                        <div className="small text-body-secondary">
                                                            {formatearFechaNumerica(new Date(deuda.editado_en), "numerico-hora")}
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                        {deuda.notas && (
                                            <div className="col-12">
                                                <dt>Notas</dt>
                                                <dd className="mb-0" style={{ whiteSpace: "pre-line" }}>{deuda.notas}</dd>
                                            </div>
                                        )}
                                    </dl>

                                    {deuda.cancelada && (
                                        <div className="alert alert-secondary d-flex gap-2 py-2 mb-0 mt-3 small">
                                            <i className="bi bi-x-octagon" aria-hidden="true"></i>
                                            <div>
                                                <strong>Cancelada</strong>
                                                {deuda.fecha_cancelacion && <> el {formatearFechaNumerica(new Date(deuda.fecha_cancelacion), "numerico-hora")}</>}
                                                {deuda.usuario_cancelacion && <> por {getFullName(deuda.usuario_cancelacion)}</>}
                                                <div>{deuda.motivo_cancelacion}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
                                        <Link to="/tesoreria/deudas" className="btn btn-sm btn-outline-secondary me-auto">
                                            <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Volver a deudas
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() => descargar("excel")}
                                            disabled={descargando !== null}
                                            title={`Estado de cuenta de ${deuda.deudor.nombre} (todas sus deudas)`}
                                        >
                                            <i className="bi bi-file-earmark-excel me-1" aria-hidden="true"></i>Estado de cuenta
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => descargar("pdf")}
                                            disabled={descargando !== null}
                                            title={`Estado de cuenta de ${deuda.deudor.nombre} (todas sus deudas)`}
                                        >
                                            <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>PDF
                                        </button>
                                        {editable && !deuda.cancelada && (
                                            <>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={abrirEdicion}>
                                                    <i className="bi bi-pencil me-1" aria-hidden="true"></i>Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => setACancelar(true)}
                                                    disabled={conMovimientos}
                                                    title={conMovimientos ? "Tiene cargos o abonos activos: cancela primero esos movimientos" : undefined}
                                                >
                                                    <i className="bi bi-x-circle me-1" aria-hidden="true"></i>Cancelar deuda
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="card card-outline card-primary">
                                <div className="card-header">
                                    <h3 className="card-title mb-0">Cargos y abonos</h3>
                                </div>
                                <div className="card-body p-0">
                                    <HistorialDeuda deuda={deuda} />
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>

            <Modal title="Editar deuda" show={edicion !== null} size="modal-lg" onClose={() => setEdicion(null)}>
                {edicion && deuda && (
                    <DeudaForm
                        key={deuda.id}
                        deuda={deuda}
                        deudores={edicion.deudores}
                        divisas={edicion.divisas}
                        onGuardar={guardar}
                        onCancelar={() => setEdicion(null)}
                    />
                )}
            </Modal>

            <CancelarDeudaModal
                deuda={aCancelar ? deuda : null}
                onClose={() => setACancelar(false)}
                onCancelada={() => {
                    setACancelar(false);
                    if (deuda) cargar(String(deuda.id));
                    mostrarToast("Deuda cancelada", "La deuda quedó cancelada en el historial.", "success");
                }}
            />
        </>
    );
}

export default DeudaDetalleView;
