import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import MovimientosTable from "../../components/movimientos/MovimientosTable";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { formatearFechaNumerica } from "../../../../shared/utils/fechas";
import type { CorteCaja } from "../../interfaces/movimientos/CorteCaja";
import type { Movimiento } from "../../interfaces/movimientos/Movimiento";
import { mapMovimientosApiToMovimientos } from "../../interfaces/movimientos/Movimiento";
import type { ArqueoCaja } from "../../interfaces/arqueo/Arqueo";
import { obtenerCorte } from "../../services/corteCaja.service";
import { obtenerMovimientos } from "../../services/movimientos.service";
import { descargarArqueoExcel, descargarArqueoPdf, obtenerArqueos } from "../../services/arqueo.service";
import { getFullName } from "../../../../shared/utils/userUtils";

function HistorialCorteDetalleView() {
    const { id } = useParams<{ id: string }>();
    const [corte, setCorte] = useState<CorteCaja | null>(null);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [arqueo, setArqueo] = useState<ArqueoCaja | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [descargando, setDescargando] = useState<"excel" | "pdf" | null>(null);
    const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
    const { mostrarToast } = useToastContext();

    async function cargar(idObjetivo: string, estaVigente: () => boolean) {
        setLoading(true);
        try {
            const corteId = Number(idObjetivo);
            const [corteDatos, movimientosDatos, arqueosDatos] = await Promise.all([
                obtenerCorte(corteId),
                obtenerMovimientos(corteId),
                obtenerArqueos(corteId),
            ]);
            if (!estaVigente()) return;
            setCorte(corteDatos);
            setMovimientos(mapMovimientosApiToMovimientos(movimientosDatos));
            setArqueo(arqueosDatos[0] ?? null);
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

    async function descargarReporte(formato: "excel" | "pdf") {
        if (!arqueo) return;
        setDescargando(formato);
        setErrorDescarga(null);
        try {
            await (formato === "excel" ? descargarArqueoExcel(arqueo.id) : descargarArqueoPdf(arqueo.id));
        } catch (err) {
            setErrorDescarga(obtenerMensajeError(err));
        } finally {
            setDescargando(null);
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
                title="Detalle de corte"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Corte de caja", to: "/tesoreria/caja/corte" },
                    { label: corte ? formatearFechaNumerica(corte.fecha) : "Detalle" },
                ]}
            />
            <div className="container-fluid">
                {loading && (
                    <>
                        <SkeletonCallout />
                        <SkeletonCards cantidad={4} columnas="col-sm-12 col-md-6 col-lg-3 mb-3" />
                        <div className="card">
                            <div className="card-header placeholder-glow">
                                <span className="placeholder col-3 rounded" style={{ height: "1rem" }}></span>
                            </div>
                            <div className="card-body p-0">
                                <SkeletonTable columnas={8} filas={5} />
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

                {!loading && !error && corte && (
                    <>
                        <div className={`card card-outline mb-3 ${corte.cerrado ? "card-secondary" : "card-success"}`}>
                            <div className="card-header">
                                <div className="d-flex flex-wrap align-items-center gap-2" style={{ fontSize: "0.9rem" }}>
                                    <span className={`badge ${corte.cerrado ? "bg-secondary" : "bg-success"} px-2 py-1`}>
                                        {corte.cerrado ? "Cerrado" : "Abierto"}
                                    </span>
                                    <span className="fw-semibold">{formatearFechaNumerica(corte.fecha)}</span>
                                    <span className="text-muted">·</span>
                                    <span className="text-muted">Apertura: {getFullName(corte.responsable_apertura)}</span>
                                    {corte.cerrado && (
                                        <>
                                            <span className="text-muted">·</span>
                                            <span className="text-muted">Cierre: {getFullName(corte.responsable_cierre)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Divisa</th>
                                                <th className="text-end">Saldo inicial</th>
                                                <th className="text-end">Saldo final</th>
                                                <th className="text-end">Físico</th>
                                                <th className="text-end">Diferencia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {corte.saldos.map((saldo) => {
                                                const tieneFisico = saldo.saldo_fisico !== null;
                                                const diferencia = tieneFisico ? Number(saldo.diferencia) : null;
                                                return (
                                                    <tr key={saldo.id}>
                                                        <td>{saldo.divisa.codigo} — {saldo.divisa.nombre}</td>
                                                        <td className="text-end font-tabular-nums">
                                                            {saldo.divisa.simbolo}{Number(saldo.saldo_inicial).toLocaleString("es-US")}
                                                        </td>
                                                        <td className="text-end font-tabular-nums">
                                                            {saldo.divisa.simbolo}{Number(saldo.saldo_final).toLocaleString("es-US")}
                                                        </td>
                                                        <td className="text-end font-tabular-nums">
                                                            {tieneFisico
                                                                ? `${saldo.divisa.simbolo}${Number(saldo.saldo_fisico).toLocaleString("es-US")}`
                                                                : "—"}
                                                        </td>
                                                        <td className={`text-end font-tabular-nums ${diferencia !== null && diferencia !== 0 ? "text-danger fw-bold" : "text-success"}`}>
                                                            {diferencia !== null ? diferencia.toLocaleString("es-US") : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="card-footer bg-body-tertiary d-flex flex-wrap align-items-center gap-3">
                                {!arqueo ? (
                                    <span className="text-muted small">No se ha realizado un arqueo para este corte.</span>
                                ) : (
                                    <>
                                        <span className="small text-muted">
                                            Arqueo #{arqueo.id} — {new Date(arqueo.hora_termino).toLocaleString("es-MX")}
                                        </span>
                                        <span className={`badge ${corte.cerrado ? "bg-success" : "bg-warning text-dark"}`}>
                                            {corte.cerrado ? "Final" : "Preliminar (corte abierto)"}
                                        </span>
                                        <div className="btn-group btn-group-sm ms-auto">
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                disabled={descargando !== null}
                                                onClick={() => descargarReporte("excel")}
                                            >
                                                {descargando === "excel" ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <><i className="bi bi-file-earmark-excel me-1"></i>Excel</>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                disabled={descargando !== null}
                                                onClick={() => descargarReporte("pdf")}
                                            >
                                                {descargando === "pdf" ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <><i className="bi bi-file-earmark-pdf me-1"></i>PDF</>
                                                )}
                                            </button>
                                        </div>
                                        {errorDescarga && <div className="w-100 text-danger small">{errorDescarga}</div>}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="card card-outline card-primary">
                            <div className="card-header">
                                <h3 className="card-title">Movimientos del corte</h3>
                            </div>
                            <div className="card-body p-0">
                                <MovimientosTable movimientos={movimientos} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default HistorialCorteDetalleView;