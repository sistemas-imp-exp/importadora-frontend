import { useEffect, useState } from "react";
import PageHeader from "../../../../layouts/components/PageHeader";
import CardCollapseButton from "../../../../shared/components/CardCollapseButton";
import SkeletonTable from "../../../../shared/components/SkeletonTable";
import { useToastContext } from "../../../../shared/context/ToastProvider";
import { obtenerMensajeError } from "../../../../shared/utils/apiError";
import { obtenerCamaras } from "../../services/camara.service";
import { obtenerAlertasCaducidad } from "../../services/alertaCaducidad.service";
import type { Camara } from "../../interfaces/camaras/Camara";
import type { AlertasCaducidadResponse, FiltrosAlertasCaducidad } from "../../interfaces/alertas/AlertaCaducidad";
import type { NivelCaducidad } from "../../utils/caducidad";
import { CLASE_BADGE_NIVEL, ETIQUETA_NIVEL } from "../../utils/caducidad";
import AlertasCaducidadTable from "../../components/alertas/AlertasCaducidadTable";

const NIVELES: NivelCaducidad[] = ["vencido", "critico", "urgente", "por_vencer"];

function filtrosPorDefecto(): FiltrosAlertasCaducidad {
    return { camaraId: "", nivel: "" };
}

function AlertasCaducidadView() {
    const { mostrarToast } = useToastContext();

    const [camaras, setCamaras] = useState<Camara[]>([]);
    const [filtros, setFiltros] = useState<FiltrosAlertasCaducidad>(filtrosPorDefecto());
    const [datos, setDatos] = useState<AlertasCaducidadResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [colapsado, setColapsado] = useState(false);

    useEffect(() => {
        obtenerCamaras().then(setCamaras).catch((err) => mostrarToast("Error al cargar", obtenerMensajeError(err), "danger"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros.camaraId, filtros.nivel]);

    async function cargar() {
        setLoading(true);
        try {
            const respuesta = await obtenerAlertasCaducidad(filtros);
            setDatos(respuesta);
            setError(null);
        } catch (err) {
            setError(obtenerMensajeError(err));
            mostrarToast("Error al cargar", obtenerMensajeError(err), "danger");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Alertas de caducidad"
                subtitle="Lotes próximos a vencer u ya vencidos, por cámara y nivel de urgencia"
                breadcrumbs={[
                    { label: "Inicio", to: "/" },
                    { label: "Inventario", to: "/inventario" },
                    { label: "Alertas de caducidad" },
                ]}
            />

            <div className="container-fluid">
                {datos && (
                    <div className="row g-3 mb-3">
                        {NIVELES.map((nivel) => (
                            <div className="col-6 col-md-3" key={nivel}>
                                <button
                                    type="button"
                                    className="btn w-100 text-start p-3 border-0"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setFiltros((f) => ({ ...f, nivel: f.nivel === nivel ? "" : nivel }))}
                                >
                                    <div className={`card card-outline ${filtros.nivel === nivel ? "border-primary" : ""}`}>
                                        <div className="card-body py-2">
                                            <span className={`badge ${CLASE_BADGE_NIVEL[nivel]} mb-1`}>{ETIQUETA_NIVEL[nivel]}</span>
                                            <div className="fs-4 fw-bold">{datos.conteo_por_nivel[nivel]}</div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="card card-outline card-primary">
                    <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                        <h3 className="card-title mb-0 me-auto">
                            Alertas de caducidad {datos && <span className="text-muted">({datos.total})</span>}
                        </h3>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: "auto" }}
                            value={filtros.camaraId}
                            onChange={(e) => setFiltros({ ...filtros, camaraId: e.target.value === "" ? "" : Number(e.target.value) })}
                        >
                            <option value="">Todas las cámaras</option>
                            {camaras.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        {filtros.nivel !== "" && (
                            <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setFiltros({ ...filtros, nivel: "" })}>
                                Quitar filtro de nivel
                            </button>
                        )}
                        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={cargar} title="Actualizar">
                            <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                        </button>
                        <CardCollapseButton collapsed={colapsado} onToggle={() => setColapsado((c) => !c)} />
                    </div>

                    {!colapsado && (
                        <div className="card-body p-0">
                            {error ? (
                                <div className="alert alert-danger m-3" role="alert">{error}</div>
                            ) : loading ? (
                                <SkeletonTable columnas={10} filas={6} />
                            ) : (
                                <AlertasCaducidadTable alertas={datos?.alertas ?? []} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default AlertasCaducidadView;
