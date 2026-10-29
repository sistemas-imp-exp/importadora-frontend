import { Link, useNavigate } from "react-router-dom";
import dayjs from "../../shared/config/dayjsConfig";
import { useNotificaciones } from "../../shared/hooks/useNotificaciones";
import { marcarHiloLeido, marcarTodasLeidas } from "../../app/notificaciones/services/notificaciones.service";
import type { Notificacion } from "../../app/notificaciones/interfaces/Notificacion";
import { iconoNotificacion } from "../../app/notificaciones/utils";

/** Campana de la barra superior: no leídas de mis áreas y acceso a cada conversación. */
export default function CampanaNotificaciones() {
    const { resumen, recargar } = useNotificaciones();
    const navigate = useNavigate();
    const total = resumen.no_leidas;

    async function abrir(n: Notificacion) {
        try {
            await marcarHiloLeido(n.hilo);
        } finally {
            recargar();
        }
        navigate(`/notificaciones/${n.hilo}`);
    }

    async function leerTodas() {
        await marcarTodasLeidas();
        recargar();
    }

    return (
        <li className="nav-item dropdown">
            <a
                className="nav-link position-relative"
                href="#"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label={total ? `Notificaciones: ${total} sin leer` : "Notificaciones"}
                title="Notificaciones"
            >
                <i className={`bi ${total ? "bi-bell-fill" : "bi-bell"}`}></i>
                {total > 0 && (
                    <span className="navbar-badge badge text-bg-danger rounded-pill">{total > 99 ? "99+" : total}</span>
                )}
            </a>
            <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end p-0 campana-menu">
                <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                    <span className="fw-semibold">
                        {total ? `${total} sin leer` : "Sin notificaciones nuevas"}
                    </span>
                    {total > 0 && (
                        <button type="button" className="btn btn-link btn-sm p-0" onClick={leerTodas}>
                            Marcar todo leído
                        </button>
                    )}
                </div>
                {resumen.recientes.length === 0 ? (
                    <div className="text-center text-body-secondary small py-4">
                        <i className="bi bi-check2-circle fs-4 d-block mb-1" aria-hidden="true"></i>
                        Estás al día.
                    </div>
                ) : (
                    <div className="campana-lista">
                        {resumen.recientes.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                className="dropdown-item d-flex gap-2 py-2 text-wrap border-bottom"
                                onClick={() => abrir(n)}
                            >
                                <i className={`bi ${iconoNotificacion(n)} text-primary mt-1`} aria-hidden="true"></i>
                                <span className="flex-grow-1 min-w-0">
                                    <span className="d-block fw-semibold text-truncate">{n.titulo}</span>
                                    {n.mensaje && <span className="d-block small text-body-secondary campana-texto">{n.mensaje}</span>}
                                    <span className="d-block small text-body-secondary">
                                        {n.area_origen.nombre} → {n.area_destino.nombre} · {dayjs(n.creado).fromNow()}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                <Link to="/notificaciones" className="dropdown-item text-center small py-2">
                    Ver todas las notificaciones
                </Link>
            </div>
        </li>
    );
}
