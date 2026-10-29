import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../layouts/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import Paginacion from "../../../shared/components/Paginacion";
import SkeletonTable from "../../../shared/components/SkeletonTable";
import dayjs from "../../../shared/config/dayjsConfig";
import { useNotificaciones } from "../../../shared/hooks/useNotificaciones";
import { useToastContext } from "../../../shared/context/ToastProvider";
import { useAuth } from "../../../shared/hooks/useAuth";
import { obtenerMensajeError } from "../../../shared/utils/apiError";
import ConversacionHilo from "../components/ConversacionHilo";
import NuevoMensajeForm from "../components/NuevoMensajeForm";
import type { AreaBreve, CanalDisponible, DetalleHilo, HiloNotificacion, NuevoMensajeRequest } from "../interfaces/Notificacion";
import {
    enviarMensaje,
    marcarHiloLeido,
    marcarTodasLeidas,
    obtenerAreasNotificaciones,
    obtenerCanales,
    obtenerHilo,
    obtenerHilos,
    responderHilo,
} from "../services/notificaciones.service";
import { iconoNotificacion } from "../utils";

const POR_PAGINA = 20;

export default function NotificacionesView() {
    const { id } = useParams();
    const hiloId = id ? Number(id) : null;
    const navigate = useNavigate();
    const { user } = useAuth();
    const { mostrarToast } = useToastContext();
    const { resumen, recargar } = useNotificaciones();

    const [hilos, setHilos] = useState<HiloNotificacion[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [soloNoLeidas, setSoloNoLeidas] = useState(false);
    const [tipo, setTipo] = useState("");
    const [area, setArea] = useState("");
    const [areas, setAreas] = useState<AreaBreve[]>([]);
    const [canales, setCanales] = useState<CanalDisponible[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detalle, setDetalle] = useState<DetalleHilo | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [nuevo, setNuevo] = useState(false);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const t = setTimeout(async () => {
            try {
                const [c, a] = await Promise.all([obtenerCanales(), obtenerAreasNotificaciones()]);
                setCanales(c);
                setAreas(a);
            } catch {
                // sin canales: no se ofrece "Nuevo mensaje"
            }
        }, 0);
        return () => clearTimeout(t);
    }, []);

    // Listado: se recarga al filtrar y cuando llega algo nuevo a la campana.
    useEffect(() => {
        let vigente = true;
        const t = setTimeout(async () => {
            setCargando(true);
            try {
                const datos = await obtenerHilos({ pagina, porPagina: POR_PAGINA, soloNoLeidas, tipo, area });
                if (!vigente) return;
                setHilos(datos.results);
                setTotal(datos.count);
                setError(null);
            } catch (err) {
                if (vigente) setError(obtenerMensajeError(err));
            } finally {
                if (vigente) setCargando(false);
            }
        }, 0);
        return () => {
            vigente = false;
            clearTimeout(t);
        };
    }, [pagina, soloNoLeidas, tipo, area, version, resumen.no_leidas]);

    const abrirDetalle = useCallback(async (idHilo: number, vigente: () => boolean) => {
        setCargandoDetalle(true);
        try {
            const datos = await obtenerHilo(idHilo);
            if (!vigente()) return;
            setDetalle(datos);
            if (datos.mensajes.some((m) => !m.leida)) {
                await marcarHiloLeido(idHilo);
                recargar();
            }
        } catch (err) {
            if (vigente()) {
                setDetalle(null);
                mostrarToast("No se pudo abrir", obtenerMensajeError(err), "danger");
            }
        } finally {
            if (vigente()) setCargandoDetalle(false);
        }
    }, [recargar, mostrarToast]);

    useEffect(() => {
        if (hiloId === null) return;
        let vigente = true;
        const t = setTimeout(() => abrirDetalle(hiloId, () => vigente), 0);
        return () => {
            vigente = false;
            clearTimeout(t);
        };
    }, [hiloId, abrirDetalle]);

    async function enviar(datos: NuevoMensajeRequest) {
        try {
            const creado = await enviarMensaje(datos);
            mostrarToast("Mensaje enviado", `Se envió a ${creado.area_destino.nombre}.`, "success");
            setNuevo(false);
            setVersion((v) => v + 1);
            navigate(`/notificaciones/${creado.hilo}`);
        } catch (err) {
            mostrarToast("No se pudo enviar", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    async function responder(mensaje: string, areaOrigen?: string) {
        if (hiloId === null) return;
        try {
            await responderHilo(hiloId, mensaje, areaOrigen);
            setDetalle(await obtenerHilo(hiloId));
            setVersion((v) => v + 1);
            recargar();
        } catch (err) {
            mostrarToast("No se pudo responder", obtenerMensajeError(err), "danger");
            throw err;
        }
    }

    async function leerTodas() {
        await marcarTodasLeidas();
        recargar();
        setVersion((v) => v + 1);
    }

    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    return (
        <>
            <PageHeader
                title="Notificaciones"
                subtitle={user?.is_superuser
                    ? "Avisos y mensajes entre todas las áreas"
                    : "Avisos y mensajes entre tus áreas"}
                breadcrumbs={[{ label: "Inicio", to: "/" }, { label: "Notificaciones" }]}
            />

            <div className="container-fluid">
                <div className="row g-3">
                    <div className="col-lg-5">
                        <div className="card card-outline card-primary h-100">
                            <div className="card-header d-flex flex-wrap gap-2 align-items-center">
                                <div className="btn-group btn-group-sm" role="group" aria-label="Estado">
                                    <button type="button" className={`btn ${!soloNoLeidas ? "btn-primary" : "btn-outline-primary"}`}
                                        onClick={() => { setSoloNoLeidas(false); setPagina(1); }}>Todas</button>
                                    <button type="button" className={`btn ${soloNoLeidas ? "btn-primary" : "btn-outline-primary"}`}
                                        onClick={() => { setSoloNoLeidas(true); setPagina(1); }}>
                                        No leídas {resumen.no_leidas > 0 && <span className="badge text-bg-danger ms-1">{resumen.no_leidas}</span>}
                                    </button>
                                </div>
                                <select className="form-select form-select-sm" style={{ width: "auto" }} value={tipo}
                                    onChange={(e) => { setTipo(e.target.value); setPagina(1); }} aria-label="Tipo">
                                    <option value="">Avisos y mensajes</option>
                                    <option value="aviso">Solo avisos</option>
                                    <option value="mensaje">Solo mensajes</option>
                                </select>
                                {areas.length > 1 && (
                                    <select className="form-select form-select-sm" style={{ width: "auto" }} value={area}
                                        onChange={(e) => { setArea(e.target.value); setPagina(1); }} aria-label="Área">
                                        <option value="">Todas las áreas</option>
                                        {areas.map((a) => <option key={a.codigo} value={a.codigo}>{a.nombre}</option>)}
                                    </select>
                                )}
                                <div className="ms-auto d-flex gap-2">
                                    {resumen.no_leidas > 0 && (
                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={leerTodas}
                                            title="Marcar todo como leído">
                                            <i className="bi bi-check2-all" aria-hidden="true"></i>
                                        </button>
                                    )}
                                    {canales.length > 0 && (
                                        <button type="button" className="btn btn-sm btn-success" onClick={() => setNuevo(true)}>
                                            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nuevo mensaje
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="card-body p-0">
                                {error ? (
                                    <div className="alert alert-danger m-3">{error}</div>
                                ) : cargando && hilos.length === 0 ? (
                                    <SkeletonTable columnas={1} filas={6} />
                                ) : hilos.length === 0 ? (
                                    <div className="text-center text-body-secondary py-5">
                                        <i className="bi bi-bell-slash fs-3 d-block mb-2" aria-hidden="true"></i>
                                        {soloNoLeidas ? "No tienes notificaciones sin leer." : "Aún no hay notificaciones."}
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {hilos.map((h) => (
                                            <button
                                                key={h.id}
                                                type="button"
                                                className={`list-group-item list-group-item-action d-flex gap-2 ${h.id === hiloId ? "active" : ""}`}
                                                aria-current={h.id === hiloId}
                                                onClick={() => navigate(`/notificaciones/${h.id}`)}
                                            >
                                                <i className={`bi ${iconoNotificacion(h)} mt-1`} aria-hidden="true"></i>
                                                <span className="flex-grow-1 text-start" style={{ minWidth: 0 }}>
                                                    <span className={`d-block text-truncate ${h.no_leidas ? "fw-bold" : ""}`}>{h.titulo}</span>
                                                    <span className="d-block small opacity-75">
                                                        {h.area_origen.nombre} → {h.area_destino.nombre}
                                                        {h.respuestas > 0 && ` · ${h.respuestas} respuesta(s)`}
                                                    </span>
                                                </span>
                                                <span className="text-end small text-nowrap">
                                                    <span className="d-block opacity-75">{dayjs(h.ultima_actividad).fromNow()}</span>
                                                    {h.no_leidas > 0 && <span className="badge text-bg-danger">{h.no_leidas} nueva(s)</span>}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {totalPaginas > 1 && (
                                <div className="card-footer d-flex justify-content-end">
                                    <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-lg-7">
                        {hiloId === null ? (
                            <div className="card h-100">
                                <div className="card-body d-flex flex-column justify-content-center align-items-center text-body-secondary py-5">
                                    <i className="bi bi-chat-square-text fs-1 mb-2" aria-hidden="true"></i>
                                    Elige una conversación para verla.
                                </div>
                            </div>
                        ) : cargandoDetalle && !detalle ? (
                            <div className="card h-100"><SkeletonTable columnas={1} filas={4} /></div>
                        ) : detalle && detalle.id === hiloId ? (
                            <ConversacionHilo key={detalle.id} hilo={detalle} onResponder={responder} />
                        ) : null}
                    </div>
                </div>
            </div>

            <Modal title="Nuevo mensaje" show={nuevo} onClose={() => setNuevo(false)}>
                {nuevo && <NuevoMensajeForm canales={canales} onEnviar={enviar} onCancelar={() => setNuevo(false)} />}
            </Modal>
        </>
    );
}
