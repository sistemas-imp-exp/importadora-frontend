import { useEffect, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import SkeletonCallout from "../../../../shared/components/SkeletonCallout";
import SkeletonCards from "../../../../shared/components/SkeletonCards";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import LoadingButton from "../../../../shared/components/LoadingButton";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import type { CorteCaja } from "../../interfaces/movimientos/CorteCaja";
import { obtenerCorteAbierto, abrirCorte } from "../../services/corteCaja.service";
import { formatearFechaNumerica, hoyISO } from "../../../../shared/utils/fechas";
import CierreCorteModal from "../../components/caja/CierreCorteModal";
import CorteEstadoCallout from "../../components/caja/CorteEstadoCallout";
import HistorialCortesTable from "../../components/caja/HistorialCortesTable";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { Link } from "react-router-dom";
import { obtenerCortes } from "../../services/corteCaja.service";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { getFullName } from "./../../../../shared/utils/userUtils";

function CorteCajaView() {
    const [corte, setCorte] = useState<CorteCaja | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { mostrarToast } = useToastContext()

    // form de apertura
    const [fecha, setFecha] = useState(hoyISO());
    const [observaciones, setObservaciones] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [mostrarCierre, setMostrarCierre] = useState(false);
    const [historial, setHistorial] = useState<CorteCaja[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        setLoading(true);
        try {
            const [corteActual, todosLosCortes] = await Promise.all([
                obtenerCorteAbierto(),
                obtenerCortes(),
            ]); // 👈 ahora carga ambos en paralelo
            setCorte(corteActual);
            setHistorial(todosLosCortes);
            setError(null);
        } catch (err) {
            const mensaje = obtenerMensajeError(err);
            setError(mensaje);
            mostrarToast("Error al cargar", mensaje, "danger");
        } finally {
            setLoading(false);
        }
    }

    async function manejarApertura() {
        setGuardando(true);
        try {
            const nuevoCorte = await abrirCorte({
                fecha,
                observaciones: observaciones.trim() || undefined,
            });
            setCorte(nuevoCorte);
            mostrarToast("Caja abierta", `Se abrió la caja del ${formatearFechaNumerica(nuevoCorte.fecha)}.`, "success");
        } catch (err) {
            mostrarToast("No se pudo abrir la caja", obtenerMensajeError(err), "danger");
        } finally {
            setGuardando(false);
        }
    }


    return (
        <>
            <PageHeader
                title="Corte de caja"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Tesorería", to: "/tesoreria" },
                    { label: "Corte de caja" },
                ]}
            />

            <div className="container-fluid">
                {loading && (
                    <>
                        <SkeletonCallout />
                        <SkeletonCards cantidad={4} columnas="col-sm-12 col-md-6 col-lg-3 mb-3" />
                        <div className="card card-outline card-primary mt-3">
                            <div className="card-header placeholder-glow">
                                <span className="placeholder col-3 rounded" style={{ height: "1rem" }}></span>
                            </div>
                            <div className="card-body p-0">
                                <SkeletonTable columnas={5} filas={5} />
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

                {!loading && !error && (
                    <CorteEstadoCallout
                        corte={corte}
                        acciones={
                            corte && (
                                <>
                                    <Link to={"/tesoreria/caja/movimientos"} className="btn btn-primary">
                                        <i className="bi bi-box-arrow-up-right me-1"></i>
                                        Registrar movimientos
                                    </Link>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => setMostrarCierre(true)}
                                    >
                                        <i className="bi bi-lock-fill me-1"></i>
                                        Cerrar caja
                                    </button>
                                </>
                            )
                        }
                    />
                )}

                {!loading && !error && corte && (
                    <div className="row g-2 mb-3">
                        {corte.saldos.map((saldo) => (
                            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6" key={saldo.id}>
                                <div className="info-box shadow-sm">
                                    <span className="info-box-icon text-bg-primary">
                                        {saldo.divisa.codigo}
                                    </span>
                                    <div className="info-box-content">
                                        <span className="info-box-text" title={saldo.divisa.nombre}>Saldo inicial</span>
                                        <span className="info-box-number font-tabular-nums">
                                            {saldo.divisa.simbolo}
                                            {Number(saldo.saldo_inicial).toLocaleString("es-US")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && !corte && (
                    <div className="row g-3 mb-3">
                        <div className={historial.length > 0 ? "col-lg-8" : "col-12"}>
                            <div className="card card-outline card-primary h-100">
                                <div className="card-header">
                                    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                                        <h3 className="card-title">Abrir corte de caja</h3>
                                        <LoadingButton
                                            isLoading={guardando}
                                            text="Abrir caja"
                                            variant="success"
                                            onClick={manejarApertura}
                                            icon="bi bi-unlock2-fill"
                                        />
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3 align-items-center">
                                        <div className="col-auto col-md-4 form-floating">
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={fecha}
                                                onChange={(e) => setFecha(e.target.value)}
                                            />
                                            <label className="form-label">Fecha</label>
                                        </div>
                                        <div className="col-auto col-md-4 form-floating">
                                            <input
                                                type="text"
                                                className="form-control"
                                                disabled={true}
                                                value={user ? getFullName(user) : ''}
                                                placeholder="Nombre de quien abre la caja"
                                            />
                                            <label className="form-label">Responsable de apertura</label>
                                        </div>
                                        <div className="col-auto col-md-4 form-floating">
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                value={observaciones}
                                                onChange={(e) => setObservaciones(e.target.value)}
                                            />
                                            <label>Observaciones (opcional)</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {historial.length > 0 && (
                            <div className="col-lg-4">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h3 className="card-title fs-6 fw-bold m-0">Saldos del último corte</h3>
                                    </div>
                                    <div className="card-body">
                                        <p className="text-muted small mb-3">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Cerró el {formatearFechaNumerica(historial[0].fecha)}, como referencia para esta apertura.
                                        </p>
                                        <div className="d-flex flex-column gap-2">
                                            {historial[0].saldos.map((saldo) => (
                                                <div key={saldo.id} className="d-flex justify-content-between align-items-center">
                                                    <span className="text-secondary small">{saldo.divisa.codigo}</span>
                                                    <span className="fw-semibold font-tabular-nums">
                                                        {saldo.divisa.simbolo}
                                                        {Number(saldo.saldo_final).toLocaleString("es-US")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {!loading && !error && (
                    <div className="card card-outline card-primary mt-3">
                        <div className="card-header">
                            <h3 className="card-title">Historial de cortes de caja</h3>
                        </div>
                        <div className="card-body p-0">
                            <HistorialCortesTable historial={historial} />
                        </div>
                    </div>
                )}
            </div>
            {corte && (
                <CierreCorteModal
                    corte={corte}
                    show={mostrarCierre}
                    user={user}
                    size={"modal-lg modal-fullscreen-sm-down"}
                    onClose={() => setMostrarCierre(false)}
                    onCerrado={(corteActualizado) => {
                        setCorte(corteActualizado);
                        setMostrarCierre(false);
                        cargar();
                        mostrarToast("Corte cerrado", "El corte de caja se cerró correctamente.", "success");
                    }}
                />
            )}
        </>
    );
}

export default CorteCajaView;